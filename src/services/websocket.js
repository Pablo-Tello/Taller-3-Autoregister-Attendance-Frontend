/**
 * WebSocket service for real-time communication
 */

// Base WebSocket URL - adjust based on environment
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
  (import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || window.location.host);

/**
 * Creates a WebSocket connection for QR code verification notifications
 * @param {number} sessionId - The session ID to subscribe to
 * @param {function} onQrVerified - Callback when a QR code is verified
 * @param {function} onConnect - Callback when connection is established
 * @param {function} onError - Callback when an error occurs
 * @returns {WebSocket} The WebSocket connection
 */
export const createQrWebSocket = (sessionId, onQrVerified, onConnect, onError) => {
  if (!sessionId) {
    console.error('Session ID is required to create WebSocket connection');
    return null;
  }

  // Create WebSocket connection
  const socket = new WebSocket(`${WS_BASE_URL}/ws/qr/session/${sessionId}/`);
  
  // Connection opened
  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection established');
    if (onConnect) onConnect(event);
  });
  
  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'qr_verified':
          if (onQrVerified) onQrVerified(data);
          break;
        case 'connection_established':
          console.log(`Connected to session ${data.session_id}`);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Handle errors
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
    if (onError) onError(event);
  });
  
  // Connection closed
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event);
  });
  
  // Set up ping interval to keep connection alive
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000); // Send ping every 30 seconds
  
  // Add cleanup method to socket
  socket.cleanup = () => {
    clearInterval(pingInterval);
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
  
  return socket;
};

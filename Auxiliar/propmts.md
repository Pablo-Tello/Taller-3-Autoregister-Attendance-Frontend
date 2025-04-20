Hola,
1. Quiero crear un project de react con tailwind css.  
2. El proyecto se va a conectar a un api (que ya lo creé en django rest framework) 
3. El proyecto es un sitio web donde va haber un login para docentes y alumnos. (el API te devolverá un token que se le pasará en el header de esta forma, por ejemplo: Authorization: Token 8706f80c7c9bf4441678eb6977028ac1fdd30196) 
4. Cuando entren se les mostrará su respectivo menú principal.
a. En el menu del docente una de las opciones será generar codigo QR dinamicos (tienen un tiempo limitado de validez o cuando un alumno ya lo usa para registrar su asistencia se vuelve invalido) a traves de la llamada a un endpoint.
b. En el menu del alumno una de las opciones será ver asistencias y otra registrar asistencia. En registrar asistencia tiene la opcion de subir una imagen (un screenshot del QR que el docente está compartiendo) usando el drag and drop para imagenes, o la otra opcion sería usar la cámara del dispositivo para escanear el codigo QR.

Notas:
En la Base de datos tengo las siguientes tablas:
alumno, alumno_seccion, asistencia, calendario, ciclo_academico, codigo_qr, curso, docente, docente_seccion, horario, seccion, sesion_clase, syllabus,
auth_group, auth_group_permissions, authtoken_token, django_admin_log, django_content_type, django_migrations, django_session, django_site, auth_permission, usuarios_user, usuarios_user_groups, usuarios_user_user_permissions.
- Y en el archivo logica-database.md explico las relaciones entre las tablas.
- En el archivo api_endpoints.md detallo los endpoints que se pueden llamar.
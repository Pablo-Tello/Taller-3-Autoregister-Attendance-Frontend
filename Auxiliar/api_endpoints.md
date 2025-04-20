# API Endpoints Documentation

This document provides a comprehensive list of all API endpoints available in the system, including user permissions, request details, and response formats.

La API está devolviendo los datos dentro de un objeto paginado con un atributo results que contiene el array de datos.
Para los response de endpoints de GET devuelve dentro del atributo results:
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
        {
            "int_idSeccion": 1,
            "str_numero": "V",
            "int_capacidad_maxima": 20,
            "bool_activo": true,
            "str_idCurso": "SI806",
            "str_idCicloAcademico": "2025-1"
        }
    ]
}

## Table of Contents

- [Authentication](#authentication)
- [Users Module](#users-module)
- [Academic Module](#academic-module)
- [Enrollments Module](#enrollments-module)
- [Attendance Module](#attendance-module)

## Authentication

### Login

- **URL**: `/api/usuarios/login/`
- **Method**: `POST`
- **Permission**: Public (no authentication required)
- **Request**:
  - **Body**:
    ```json
    {
      "str_email": "user@example.com",
      "password": "your_password"
    }
    ```
- **Response**:
  ```json
  {
    "token": "your_authentication_token",
    "user_id": 1,
    "email": "user@example.com",
    "is_docente": true,
    "is_alumno": false,
    "docente_id": "D001",  // Solo si is_docente es true
    "alumno_id": "A001"    // Solo si is_alumno es true
  }
  ```

### Logout

- **URL**: `/api/usuarios/logout/`
- **Method**: `POST`
- **Permission**: Authenticated users (requires token)
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  {
    "detail": "Sesión cerrada exitosamente"
  }
  ```

## Users Module

### List Users

- **URL**: `/api/usuarios/users/`
- **Method**: `GET`
- **Permission**: Admin only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "int_idUser": 1,
      "str_email": "user@example.com",
      "first_name": "First",
      "last_name": "Last",
      "is_active": true,
      "bool_activo": true
    }
  ]
  ```

### Create User

- **URL**: `/api/usuarios/users/`
- **Method**: `POST`
- **Permission**: Admin only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_email": "new_user@example.com",
      "password": "secure_password",
      "first_name": "First",
      "last_name": "Last",
      "bool_activo": true
    }
    ```
- **Response**:
  ```json
  {
    "int_idUser": 2,
    "str_email": "new_user@example.com",
    "first_name": "First",
    "last_name": "Last",
    "is_active": true,
    "bool_activo": true
  }
  ```

### List Teachers

- **URL**: `/api/usuarios/docentes/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `activo=true` - Filter by active status
- **Response**:
  ```json
  [
    {
      "str_idDocente": "D001",
      "str_nombres": "Nombre",
      "str_apellidos": "Apellido",
      "str_especialidad": "Especialidad",
      "bool_activo": true,
      "str_email": "docente@example.com"
    }
  ]
  ```

### Create Teacher

- **URL**: `/api/usuarios/docentes/`
- **Method**: `POST`
- **Permission**: Admin only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_nombres": "Nombre",
      "str_apellidos": "Apellido",
      "str_especialidad": "Especialidad",
      "bool_activo": true,
      "str_email": "nuevo_docente@example.com",
      "password": "secure_password"
    }
    ```
- **Response**:
  ```json
  {
    "str_idDocente": "D002",
    "str_nombres": "Nombre",
    "str_apellidos": "Apellido",
    "str_especialidad": "Especialidad",
    "bool_activo": true,
    "str_email": "nuevo_docente@example.com"
  }
  ```

### List Students

- **URL**: `/api/usuarios/alumnos/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `activo=true` - Filter by active status
- **Response**:
  ```json
  [
    {
      "str_idAlumno": "A001",
      "str_nombres": "Nombre",
      "str_apellidos": "Apellido",
      "dt_fecha_nacimiento": "2000-01-01",
      "bool_activo": true,
      "str_email": "alumno@example.com"
    }
  ]
  ```

### Create Student

- **URL**: `/api/usuarios/alumnos/`
- **Method**: `POST`
- **Permission**: Admin only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_nombres": "Nombre",
      "str_apellidos": "Apellido",
      "dt_fecha_nacimiento": "2000-01-01",
      "bool_activo": true,
      "str_email": "nuevo_alumno@example.com",
      "password": "secure_password"
    }
    ```
- **Response**:
  ```json
  {
    "str_idAlumno": "A002",
    "str_nombres": "Nombre",
    "str_apellidos": "Apellido",
    "dt_fecha_nacimiento": "2000-01-01",
    "bool_activo": true,
    "str_email": "nuevo_alumno@example.com"
  }
  ```

## Academic Module

### List Academic Cycles

- **URL**: `/api/academico/ciclos/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "str_idCicloAcademico": "2025-1",
      "str_nombre": "Ciclo 2025-1",
      "dt_fecha_inicio": "2025-03-15",
      "dt_fecha_fin": "2025-07-15",
      "bool_activo": true
    }
  ]
  ```

### List Calendar Dates

- **URL**: `/api/academico/calendarios/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "int_idCalendario": 1,
      "str_idCicloAcademico": "2025-1",
      "dt_fecha": "2025-03-15",
      "bool_laborable": true
    }
  ]
  ```

### List Courses

- **URL**: `/api/academico/cursos/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "str_idCurso": "CS101",
      "str_nombre": "Introducción a la Programación",
      "int_creditos": 4,
      "bool_activo": true
    }
  ]
  ```

### List Syllabus

- **URL**: `/api/academico/syllabus/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "int_idSyllabus": 1,
      "str_idCurso": "CS101",
      "str_idCicloAcademico": "2025-1",
      "str_contenido": "Contenido del syllabus",
      "bool_activo": true
    }
  ]
  ```

### List Sections

- **URL**: `/api/academico/secciones/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `curso_id=CS101` - Filter by course ID
- **Response**:
  ```json
  [
    {
      "int_idSeccion": 1,
      "str_idCurso": "CS101",
      "str_idCicloAcademico": "2025-1",
      "str_codigo": "A",
      "int_capacidad": 30,
      "bool_activo": true
    }
  ]
  ```

### List Class Sessions

- **URL**: `/api/academico/sesiones/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `horario_id=1` - Filter by schedule ID
- **Response**:
  ```json
  [
    {
      "int_idSesionClase": 1,
      "int_idHorario": 1,
      "int_idCalendario": 1,
      "str_tema": "Introducción a variables",
      "bool_activo": true
    }
  ]
  ```

### List Schedules

- **URL**: `/api/academico/horarios/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
- **Response**:
  ```json
  [
    {
      "int_idHorario": 1,
      "int_idSeccion": 1,
      "str_dia": "Lunes",
      "dt_hora_inicio": "08:00:00",
      "dt_hora_fin": "10:00:00",
      "bool_activo": true
    }
  ]
  ```

## Enrollments Module

### List Student Enrollments

- **URL**: `/api/inscripciones/alumnos-secciones/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `alumno_id=A001` - Filter by student ID
- **Response**:
  ```json
  [
    {
      "int_idAlumnoSeccion": 1,
      "str_idAlumno": "A001",
      "int_idSeccion": 1,
      "bool_activo": true
    }
  ]
  ```

### Create Student Enrollment

- **URL**: `/api/inscripciones/alumnos-secciones/`
- **Method**: `POST`
- **Permission**: Admin or Docente
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_idAlumno": "A001",
      "int_idSeccion": 1,
      "bool_activo": true
    }
    ```
- **Response**:
  ```json
  {
    "int_idAlumnoSeccion": 1,
    "str_idAlumno": "A001",
    "int_idSeccion": 1,
    "bool_activo": true
  }
  ```

### List Teacher Assignments

- **URL**: `/api/inscripciones/docentes-secciones/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `docente_id=D001` - Filter by teacher ID
- **Response**:
  ```json
  [
    {
      "int_idDocenteSeccion": 1,
      "str_idDocente": "D001",
      "int_idSeccion": 1,
      "bool_activo": true
    }
  ]
  ```

### Create Teacher Assignment

- **URL**: `/api/inscripciones/docentes-secciones/`
- **Method**: `POST`
- **Permission**: Admin
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_idDocente": "D001",
      "int_idSeccion": 1,
      "bool_activo": true
    }
    ```
- **Response**:
  ```json
  {
    "int_idDocenteSeccion": 1,
    "str_idDocente": "D001",
    "int_idSeccion": 1,
    "bool_activo": true
  }
  ```

## Attendance Module

### List Attendance Records

- **URL**: `/api/asistencia/asistencias/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `sesion_clase_id=1` - Filter by class session ID
- **Response**:
  ```json
  [
    {
      "int_idAsistencia": 1,
      "int_idAlumnoSeccion": 1,
      "int_idSesionClase": 1,
      "bool_asistio": true,
      "dt_fecha_registro": "2025-03-15T08:30:00Z"
    }
  ]
  ```

### List QR Codes

- **URL**: `/api/asistencia/codigos-qr/`
- **Method**: `GET`
- **Permission**: Docente or Alumno
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    ```
  - **Query Parameters** (optional):
    - `sesion_clase_id=1` - Filter by class session ID
    - `docente_id=D001` - Filter by teacher ID
    - `activo=true` - Filter by active status
- **Response**:
  ```json
  [
    {
      "int_idCodigoQR": 1,
      "int_idSesionClase": 1,
      "str_idDocente": "D001",
      "str_codigo": "uuid-code",
      "dt_fecha_creacion": "2025-03-15T08:00:00Z",
      "dt_fecha_expiracion": "2025-03-15T08:00:30Z",
      "bool_activo": true
    }
  ]
  ```

### Generate QR Code

- **URL**: `/api/asistencia/codigos-qr/generar/`
- **Method**: `POST`
- **Permission**: Docente only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "int_idSesionClase": 1,
      "str_idDocente": "D001",
      "formato": "base64"
    }
    ```
- **Response**:
  ```json
  {
    "codigo": "uuid-code",
    "qr_code": "data:image/png;base64,base64_encoded_image",
    "expiracion": "2025-03-15T08:00:30Z"
  }
  ```

### Verify QR Code

- **URL**: `/api/asistencia/codigos-qr/verificar/`
- **Method**: `POST`
- **Permission**: Alumno only
- **Request**:
  - **Headers**:
    ```
    Authorization: Token your_token
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "str_codigo": "uuid-code",
      "str_idAlumno": "A001"
    }
    ```
- **Response**:
  ```json
  {
    "int_idAsistencia": 1,
    "int_idAlumnoSeccion": 1,
    "int_idSesionClase": 1,
    "bool_asistio": true,
    "dt_fecha_registro": "2025-03-15T08:30:00Z"
  }
  ```

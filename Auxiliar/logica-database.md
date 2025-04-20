# Vamos a explicar la logica de la base de datos:

## 1. Estas son las tablas que existen:

- docente
- alumno
- ciclo_academico (Aqui se almacenan los ciclos academicos, indica la fecha de inicio y fin de cada ciclo academico)
- calendario (Aqui se almacenan todas las fechas del año, agregando una columna que describa si es un dia feriado o un dia laboral)
- curso (cada fila es un curso en un ciclo academico, por ejemplo: CS1100, MA2001, SI101, GE907)
- syllabus (cada fila es un syllabus de un curso en un ciclo academico, pero por mientras en una columna se agrega los temas del syllabus)
- seccion (el nombre de la seccion puede ser A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z)
- horario (puedes haber tipos como teoría, practica, laboratorio)
- docente_seccion
- alumno_seccion
- sesion_clase (es la tabla donde se va a programar todas las sesiones de clase del ciclo academico presente, hay una columna que dice si ya se realizó dicha sesion de clase o esta pendiente, hay una columna que menciona el tema de la sesion de clase que es registrado por el docente)
- asistencia (es la tabla donde se va a registrar la asistencia de los alumnos y el docente en cada sesion de clase)

## 2. Estas son las relaciones que existen:

### Relaciones de la tabla Curso:

#### a. Un curso puede tener muchas secciones, y una seccion pertenece a un curso.
    - Curso -> Seccion: 1 -> N
    - Seccion -> Curso: N -> 1
#### b. Un curso puede tener muchos syllabus, y un syllabus pertenece a un curso. Porque los syllabus se pueden actualizar cada año.
    - Curso -> Syllabus: 1 -> N
    - Syllabus -> Curso: N -> 1

### Relaciones de la tabla ciclo_academico:

#### a. Un ciclo academico puede tener muchos alumno_seccion, y un alumno_seccion pertenece a un ciclo academico.
    - CicloAcademico -> AlumnoSeccion: 1 -> N
    - AlumnoSeccion -> CicloAcademico: N -> 1
#### b. Un ciclo academico puede tener muchos docente_seccion, y un docente_seccion pertenece a un ciclo academico.
    - CicloAcademico -> DocenteSeccion: 1 -> N
    - DocenteSeccion -> CicloAcademico: N -> 1
#### c. Un ciclo academico puede tener muchas sesion_clase, y una sesion_clase pertenece a un ciclo academico.
    - CicloAcademico -> SesionClase: 1 -> N
    - SesionClase -> CicloAcademico: N -> 1

### Relaciones de la tabla docente_seccion:

#### a. Un docente puede tener muchas asignaciones de docente_seccion, y una asignacion de docente_seccion pertenece a un docente.
    - Docente -> DocenteSeccion: 1 -> N
    - DocenteSeccion -> Docente: N -> 1
#### b. Una seccion puede tener muchos docente_seccion, y un docente_seccion pertenece a una seccion.
    - Seccion -> DocenteSeccion: 1 -> N
    - DocenteSeccion -> Seccion: N -> 1
#### c. Un ciclo academico puede tener muchos docente_seccion, y un docente_seccion pertenece a un ciclo academico.
    - CicloAcademico -> DocenteSeccion: 1 -> N
    - DocenteSeccion -> CicloAcademico: N -> 1
#### d. Un docente_seccion puede tener muchos horario, y un horario pertenece a un docente_seccion. (Horario Semanal)
    - DocenteSeccion -> Horario: 1 -> N
    - Horario -> DocenteSeccion: N -> 1


### Relaciones de la tabla alumno_seccion:

#### a. Un alumno puede tener muchas inscripciones de alumno_seccion, y una inscripcion de alumno_seccion pertenece a un alumno.
    - Alumno -> AlumnoSeccion: 1 -> N
    - AlumnoSeccion -> Alumno: N -> 1
#### b. Una seccion puede tener muchos alumno_seccion, y un alumno_seccion pertenece a una seccion.
    - Seccion -> AlumnoSeccion: 1 -> N
    - AlumnoSeccion -> Seccion: N -> 1
#### c. Un ciclo academico puede tener muchos alumno_seccion, y un alumno_seccion pertenece a un ciclo academico. 
    - CicloAcademico -> AlumnoSeccion: 1 -> N
    - AlumnoSeccion -> CicloAcademico: N -> 1

### Relaciones de la tabla sesion_clase:

#### a. Una seccion puede tener muchas sesion_clase, y una sesion_clase pertenece a una seccion.
    - Seccion -> SesionClase: 1 -> N
    - SesionClase -> Seccion: N -> 1
#### b. Un ciclo academico puede tener muchas sesion_clase, y una sesion_clase pertenece a un ciclo academico.
    - CicloAcademico -> SesionClase: 1 -> N
    - SesionClase -> CicloAcademico: N -> 1
#### c. Un horario puede tener muchas sesion_clase, y una sesion_clase pertenece a un horario.
    - Horario -> SesionClase: 1 -> N
    - SesionClase -> Horario: N -> 1
#### d. Una fecha de calendario puede tener muchas sesion_clase, y una sesion_clase pertenece a una fecha de calendario.
    - Calendario -> SesionClase: 1 -> N
    - SesionClase -> Calendario: N -> 1
#### e. Una sesion_clase puede tener muchas asistencias, y una asistencia pertenece a una sesion_clase.
    - SesionClase -> Asistencia: 1 -> N
    - Asistencia -> SesionClase: N -> 1

### Relaciones de la tabla asistencia:

#### a. Una sesion_clase puede tener muchas asistencias, y una asistencia pertenece a una sesion_clase.
    - SesionClase -> Asistencia: 1 -> N
    - Asistencia -> SesionClase: N -> 1
#### b. Un alumno puede tener muchas asistencias, y una asistencia pertenece a un alumno.
    - Alumno -> Asistencia: 1 -> N
    - Asistencia -> Alumno: N -> 1
#### c. Un docente puede tener muchas asistencias, y una asistencia pertenece a un docente.
    - Docente -> Asistencia: 1 -> N
    - Asistencia -> Docente: N -> 1




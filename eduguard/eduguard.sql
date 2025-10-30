-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-10-2025 a las 02:22:57
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `eduguard`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividades`
--

CREATE TABLE `actividades` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `duracion` varchar(50) DEFAULT NULL,
  `resultado` varchar(50) DEFAULT NULL,
  `icono` varchar(10) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `actividades`
--

INSERT INTO `actividades` (`id`, `usuario_id`, `tipo`, `titulo`, `materia`, `duracion`, `resultado`, `icono`, `fecha`) VALUES
(1, 1, 'video', 'Derivadas e Integrales', 'Matemáticas', '45 min', NULL, '🎬', '2025-10-21 19:01:35'),
(2, 1, 'practica', 'Quiz - Ecuaciones Cuadráticas', 'Matemáticas', NULL, '18/20', '✅', '2025-10-21 17:01:35'),
(3, 1, 'lectura', 'Capítulo 5 - La Revolución Francesa', 'Historia', '30 min', NULL, '📖', '2025-10-20 21:01:35'),
(4, 1, 'colaboracion', 'Sesión grupal - Grupo Física', 'Física', '60 min', NULL, '👥', '2025-10-20 21:01:35'),
(5, 1, 'examen', 'Simulacro - Química Orgánica', 'Química', NULL, '16/20', '📝', '2025-10-18 21:01:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calendario_eventos`
--

CREATE TABLE `calendario_eventos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `profesor` varchar(100) DEFAULT NULL,
  `aula` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calendario_eventos`
--

INSERT INTO `calendario_eventos` (`id`, `titulo`, `fecha`, `hora`, `tipo`, `materia`, `profesor`, `aula`, `descripcion`) VALUES
(1, 'Examen de Matemáticas', '2025-10-22', '08:00:00', 'examen', 'Matemáticas', 'Prof. González', '302', NULL),
(2, 'Presentación Grupo 3 - Historia', '2025-10-23', '10:00:00', 'presentacion', 'Historia', 'Prof. García', '205', NULL),
(3, 'Día del Deporte', '2025-10-25', '09:00:00', 'evento', 'Educación Física', 'Prof. Ramírez', 'Patio Principal', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chat_mensajes`
--

CREATE TABLE `chat_mensajes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `sender` varchar(10) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante_materias`
--

CREATE TABLE `estudiante_materias` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiante_materias`
--

INSERT INTO `estudiante_materias` (`id`, `estudiante_id`, `materia_id`, `fecha_inscripcion`) VALUES
(1, 1, 1, '2025-10-23 22:04:10'),
(2, 1, 2, '2025-10-23 22:04:10'),
(3, 1, 3, '2025-10-23 22:04:10'),
(4, 1, 4, '2025-10-23 22:04:10'),
(5, 2, 1, '2025-10-23 22:04:10'),
(6, 2, 3, '2025-10-23 22:04:10'),
(7, 2, 4, '2025-10-23 22:04:10'),
(8, 3, 2, '2025-10-23 22:04:10'),
(9, 3, 3, '2025-10-23 22:04:10'),
(10, 3, 4, '2025-10-23 22:04:10'),
(11, 7, 1, '2025-10-23 22:04:10'),
(12, 7, 2, '2025-10-23 22:04:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupos`
--

CREATE TABLE `grupos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupos`
--

INSERT INTO `grupos` (`id`, `nombre`, `admin_id`, `descripcion`, `fecha_creacion`) VALUES
(1, 'Matemáticas 5to A', 2, 'Grupo de estudio de matemáticas', '2025-10-21 21:01:35'),
(2, 'Física - Proyecto Final', 1, 'Preparación para proyecto final', '2025-10-21 21:01:35'),
(3, 'Historia Universal', 3, 'Repaso de historia', '2025-10-21 21:01:35'),
(4, 'elige', 7, 'este grupo es pa estudiar', '2025-10-21 23:26:21'),
(5, 'admin', 8, 'el pepe', '2025-10-23 19:48:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_invitaciones`
--

CREATE TABLE `grupo_invitaciones` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `invitado_por` int(11) NOT NULL,
  `invitado_email` varchar(100) NOT NULL,
  `estado` enum('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
  `fecha_invitacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_mensajes`
--

CREATE TABLE `grupo_mensajes` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `imagen` text DEFAULT NULL,
  `tipo_mensaje` enum('texto','imagen','archivo') DEFAULT 'texto',
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupo_mensajes`
--

INSERT INTO `grupo_mensajes` (`id`, `grupo_id`, `usuario_id`, `mensaje`, `imagen`, `tipo_mensaje`, `fecha`) VALUES
(1, 1, 2, '¿Alguien entendió la integral?', NULL, 'texto', '2025-10-21 21:01:35'),
(2, 2, 1, 'Nos vemos mañana 4pm', NULL, 'texto', '2025-10-21 21:01:35'),
(3, 3, 3, 'Compartí resumen en Drive', NULL, 'texto', '2025-10-21 21:01:35'),
(4, 4, 7, 'hollaaaa', NULL, 'texto', '2025-10-21 23:26:29'),
(5, 4, 7, 'como estan', NULL, 'texto', '2025-10-21 23:40:21'),
(6, 4, 7, '📷 Imagen', '../uploads/grupos/68f819ee5fb06_1761090030.jpg', 'imagen', '2025-10-21 23:40:30'),
(7, 4, 7, 'holaa', NULL, 'texto', '2025-10-21 23:46:42'),
(8, 4, 7, 'hola', NULL, 'texto', '2025-10-21 23:58:12'),
(9, 5, 8, 'jl', NULL, 'texto', '2025-10-23 19:48:22'),
(10, 5, 9, 'hola', NULL, 'texto', '2025-10-23 19:51:45'),
(11, 5, 8, '😃', NULL, 'texto', '2025-10-23 20:38:02'),
(12, 5, 9, 'holaa:D', NULL, 'texto', '2025-10-23 20:43:18'),
(13, 5, 9, '🤪', NULL, 'texto', '2025-10-23 20:43:31'),
(14, 5, 8, '📷 Imagen', '../uploads/grupos/grupo_5_68fa93af670f8_1761252271.jpg', 'imagen', '2025-10-23 20:44:31'),
(15, 5, 8, 'hola😑', NULL, 'texto', '2025-10-23 21:14:49'),
(16, 5, 8, '👄', NULL, 'texto', '2025-10-23 21:26:04'),
(17, 5, 9, '??', NULL, 'texto', '2025-10-23 21:26:15'),
(18, 5, 8, '📷 Imagen', '../uploads/grupos/grupo_5_68fa9dee65a48_1761254894.jpg', 'imagen', '2025-10-23 21:28:14'),
(19, 1, 8, 'no porfe', NULL, 'texto', '2025-10-23 23:57:53'),
(20, 2, 8, '🤨', NULL, 'texto', '2025-10-24 00:05:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_miembros`
--

CREATE TABLE `grupo_miembros` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_union` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_lectura` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupo_miembros`
--

INSERT INTO `grupo_miembros` (`id`, `grupo_id`, `usuario_id`, `fecha_union`, `ultima_lectura`) VALUES
(1, 1, 1, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(2, 1, 2, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(3, 1, 3, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(4, 2, 1, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(5, 2, 2, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(6, 3, 1, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(7, 3, 2, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(8, 3, 3, '2025-10-21 21:01:35', '2025-10-21 23:10:23'),
(9, 4, 7, '2025-10-21 23:26:21', '2025-10-22 00:13:52'),
(10, 4, 1, '2025-10-21 23:40:02', '2025-10-21 23:40:02'),
(11, 5, 8, '2025-10-23 19:48:05', '2025-10-23 21:28:14'),
(12, 5, 9, '2025-10-23 19:51:35', '2025-10-23 22:58:39'),
(13, 1, 8, '2025-10-23 22:04:10', '2025-10-24 00:05:15'),
(14, 2, 8, '2025-10-23 22:04:10', '2025-10-24 00:05:34'),
(15, 3, 8, '2025-10-23 22:04:10', '2025-10-24 00:05:22'),
(16, 1, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(17, 2, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(18, 3, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materiales_didacticos`
--

CREATE TABLE `materiales_didacticos` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_archivo` varchar(50) DEFAULT NULL,
  `ruta_archivo` text NOT NULL,
  `tamanio` int(11) DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `profesor` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id`, `nombre`, `profesor`, `color`, `descripcion`) VALUES
(1, 'Matemáticas', 'Profesor González', 'blue', NULL),
(2, 'Historia', 'Profesor González', 'purple', NULL),
(3, 'Física', 'Profesor González', 'green', NULL),
(4, 'Química', 'Profesor González', 'orange', NULL),
(5, 'Inglés', 'Prof. Smith', 'red', NULL),
(6, 'Programación', 'Prof. Díaz', 'indigo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas`
--

CREATE TABLE `notas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `nota` decimal(4,2) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notas`
--

INSERT INTO `notas` (`id`, `usuario_id`, `materia_id`, `nota`, `tipo`, `titulo`, `fecha`) VALUES
(1, 1, 1, 16.50, 'examen', 'Examen de Derivadas', '2025-10-15'),
(2, 1, 1, 18.00, 'practica', 'Práctica Calificada 1', '2025-10-10'),
(3, 1, 2, 17.00, 'examen', 'Examen de Historia Moderna', '2025-10-12'),
(4, 1, 3, 15.80, 'tarea', 'Trabajo de Física', '2025-10-08'),
(5, 3, 3, 20.00, 'tarea', 'area', '2025-10-23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `noticias`
--

CREATE TABLE `noticias` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `autor` varchar(100) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `destacado` tinyint(1) DEFAULT 0,
  `fecha` date DEFAULT NULL,
  `fecha_publicacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `noticias`
--

INSERT INTO `noticias` (`id`, `titulo`, `descripcion`, `autor`, `tipo`, `destacado`, `fecha`, `fecha_publicacion`) VALUES
(1, 'Día del Deporte - 25 de Octubre', 'Participación obligatoria de todos los estudiantes. Traer ropa deportiva.', 'Dirección', 'evento', 1, '2025-10-25', '2025-10-21 21:01:35'),
(2, 'Exámenes Finales - Cronograma', 'Se publicó el cronograma de exámenes finales en la plataforma. Revisar fechas.', 'Coordinación Académica', 'academico', 1, '2025-11-01', '2025-10-21 21:01:35'),
(3, 'Taller de Robótica - Inscripciones Abiertas', 'Taller gratuito los sábados. Cupos limitados.', 'Área de Tecnología', 'actividad', 0, '2025-10-30', '2025-10-21 21:01:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `leido` tinyint(1) DEFAULT 0,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `tipo`, `titulo`, `mensaje`, `leido`, `fecha`) VALUES
(1, 1, 'examen', 'Examen de Matemáticas mañana', 'Recuerda estudiar los capítulos 8-10', 0, '2025-10-21 21:01:35'),
(2, 1, 'tarea', 'Entrega de ensayo de Historia', 'Último día para entregar', 0, '2025-10-21 21:01:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesor_materias`
--

CREATE TABLE `profesor_materias` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `profesor_materias`
--

INSERT INTO `profesor_materias` (`id`, `profesor_id`, `materia_id`, `fecha_asignacion`) VALUES
(1, 8, 1, '2025-10-23 22:04:10'),
(2, 8, 2, '2025-10-23 22:04:10'),
(3, 8, 3, '2025-10-23 22:04:10'),
(4, 8, 4, '2025-10-23 22:04:10'),
(5, 14, 1, '2025-10-23 22:07:56'),
(6, 14, 2, '2025-10-23 22:07:56'),
(7, 14, 3, '2025-10-23 22:07:56'),
(8, 14, 4, '2025-10-23 22:07:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recomendaciones`
--

CREATE TABLE `recomendaciones` (
  `id` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `dirigido_a` varchar(100) DEFAULT NULL,
  `autor` varchar(100) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `fecha_publicacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recomendaciones`
--

INSERT INTO `recomendaciones` (`id`, `mensaje`, `dirigido_a`, `autor`, `fecha`, `fecha_publicacion`) VALUES
(1, 'Se recomienda repasar los capítulos 5-7 de Historia para el examen del lunes', '5to Secundaria', 'Prof. García', '2025-10-19', '2025-10-21 21:01:35'),
(2, 'Los estudiantes con bajo rendimiento en Matemáticas deben asistir a tutorías los jueves 4pm', 'Todos', 'Coordinación', '2025-10-18', '2025-10-21 21:01:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones_estudio`
--

CREATE TABLE `sesiones_estudio` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `duracion` int(11) DEFAULT NULL,
  `completada` tinyint(1) DEFAULT 0,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tipo_usuario` enum('alumno','profesor') DEFAULT 'alumno',
  `telefono` varchar(20) DEFAULT NULL,
  `grado` varchar(50) DEFAULT NULL,
  `seccion` varchar(10) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `puntuacion` int(11) DEFAULT 0,
  `nivel` varchar(50) DEFAULT 'Bronce',
  `racha` int(11) DEFAULT 0,
  `horas_estudio` int(11) DEFAULT 0,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `tipo_usuario`, `telefono`, `grado`, `seccion`, `bio`, `foto`, `puntuacion`, `nivel`, `racha`, `horas_estudio`, `fecha_registro`, `ultimo_acceso`) VALUES
(1, 'Juan Pérez', 'juan.perez@colegio.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumno', '+51 987654321', '5to Secundaria', 'A', 'Apasionado por aprender', NULL, 850, 'Oro', 12, 45, '2025-10-21 21:01:35', '2025-10-21 21:01:35'),
(2, 'Ana García', 'ana.garcia@colegio.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumno', '+51 987654322', '5to Secundaria', 'A', 'Me encanta la ciencia', NULL, 720, 'Plata', 8, 38, '2025-10-21 21:01:35', '2025-10-21 21:01:35'),
(3, 'Carlos López', 'carlos.lopez@colegio.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumno', '+51 987654323', '5to Secundaria', 'A', 'Futuro ingeniero', NULL, 650, 'Bronce', 5, 32, '2025-10-21 21:01:35', '2025-10-21 21:01:35'),
(4, 'Pedro García', 'alumno@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-21 22:13:07', '2025-10-21 22:13:07'),
(5, 'Estudiante Prueba', 'test@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-21 22:25:13', '2025-10-21 22:25:13'),
(6, 'Usuario Prueba', 'prueba@eduguard.com', '$2y$10$8K1p/Xk2w5jm5nH5nH5nHeO5C5X5Y5Z5Y5Z5Y5Z5Y5Z5Y5Z5Y5Z5YO', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-21 22:30:26', '2025-10-21 22:30:26'),
(7, 'Test User', 'demo@eduguard.com', '$2y$10$9NF.oVrLt81WI4uZF/7Do.gLo5b80rV2Eb3TLpOjd/Jd.uYg1H3Dm', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-21 22:31:02', '2025-10-21 22:33:57'),
(8, 'Sergio', 'sergiooscateguihuaytan@gmail.com', '$2y$10$kksUM5nz/5cO27HdmxBwQeJ2Q4sMpOarGOIex0G3TwkB.P6kDGqou', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:16:21', '2025-10-24 00:05:06'),
(9, 'ser', 'ser@gmail.com', '$2y$10$giyxPCHQFEl3n8K3kCp8W.6qA0ksQ5t2BNYH9T.nPWOpV4LeqoAy.', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:51:00', '2025-10-23 20:42:58'),
(10, 'Profesor Demo', 'profesor@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 21:47:06', '2025-10-24 00:02:38'),
(13, 'Profesor González', 'profe@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '+51 999888777', NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:04:10', '2025-10-23 22:07:56'),
(14, 'Prof. Jesús Pérez', 'jesus@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '+51 999888777', NULL, NULL, 'Profesor de Matemáticas y Física', NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:07:56', '2025-10-23 22:07:56');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `actividades`
--
ALTER TABLE `actividades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `calendario_eventos`
--
ALTER TABLE `calendario_eventos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `chat_mensajes`
--
ALTER TABLE `chat_mensajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`materia_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indices de la tabla `grupo_invitaciones`
--
ALTER TABLE `grupo_invitaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grupo_id` (`grupo_id`),
  ADD KEY `invitado_por` (`invitado_por`);

--
-- Indices de la tabla `grupo_mensajes`
--
ALTER TABLE `grupo_mensajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grupo_id` (`grupo_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grupo_id` (`grupo_id`,`usuario_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `materiales_didacticos`
--
ALTER TABLE `materiales_didacticos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `profesor_id` (`profesor_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `noticias`
--
ALTER TABLE `noticias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `profesor_materias`
--
ALTER TABLE `profesor_materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profesor_id` (`profesor_id`,`materia_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `recomendaciones`
--
ALTER TABLE `recomendaciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sesiones_estudio`
--
ALTER TABLE `sesiones_estudio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `actividades`
--
ALTER TABLE `actividades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `calendario_eventos`
--
ALTER TABLE `calendario_eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `chat_mensajes`
--
ALTER TABLE `chat_mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `grupo_invitaciones`
--
ALTER TABLE `grupo_invitaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `grupo_mensajes`
--
ALTER TABLE `grupo_mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `materiales_didacticos`
--
ALTER TABLE `materiales_didacticos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `noticias`
--
ALTER TABLE `noticias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `profesor_materias`
--
ALTER TABLE `profesor_materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `recomendaciones`
--
ALTER TABLE `recomendaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `sesiones_estudio`
--
ALTER TABLE `sesiones_estudio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividades`
--
ALTER TABLE `actividades`
  ADD CONSTRAINT `actividades_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `chat_mensajes`
--
ALTER TABLE `chat_mensajes`
  ADD CONSTRAINT `chat_mensajes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  ADD CONSTRAINT `estudiante_materias_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `estudiante_materias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `grupo_invitaciones`
--
ALTER TABLE `grupo_invitaciones`
  ADD CONSTRAINT `grupo_invitaciones_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grupo_invitaciones_ibfk_2` FOREIGN KEY (`invitado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `grupo_mensajes`
--
ALTER TABLE `grupo_mensajes`
  ADD CONSTRAINT `grupo_mensajes_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grupo_mensajes_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  ADD CONSTRAINT `grupo_miembros_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grupo_miembros_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `materiales_didacticos`
--
ALTER TABLE `materiales_didacticos`
  ADD CONSTRAINT `materiales_didacticos_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materiales_didacticos_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notas_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `profesor_materias`
--
ALTER TABLE `profesor_materias`
  ADD CONSTRAINT `profesor_materias_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profesor_materias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sesiones_estudio`
--
ALTER TABLE `sesiones_estudio`
  ADD CONSTRAINT `sesiones_estudio_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

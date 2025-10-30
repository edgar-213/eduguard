-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 31-10-2025 a las 00:17:13
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

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
-- Estructura de tabla para la tabla `actividad_profesor`
--

CREATE TABLE `actividad_profesor` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `actividad_profesor`
--

INSERT INTO `actividad_profesor` (`id`, `profesor_id`, `tipo`, `titulo`, `descripcion`, `fecha`) VALUES
(1, 1, 'nota', 'Registraste nuevas notas', 'Matemáticas - 5to Grado', '2025-10-30 15:47:51'),
(2, 1, 'anuncio', 'Publicaste un anuncio', 'Examen Final - Ciencias', '2025-10-29 17:47:51'),
(3, 1, 'material', 'Subiste material didáctico', 'Guía de Estudio - Historia', '2025-10-27 17:47:51');

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

--
-- Volcado de datos para la tabla `chat_mensajes`
--

INSERT INTO `chat_mensajes` (`id`, `usuario_id`, `sender`, `mensaje`, `fecha`) VALUES
(1, 8, 'user', 'hola', '2025-10-26 02:03:47'),
(2, 8, 'ia', 'Esta es una respuesta automática. Conecta tu API de Flowise para respuestas inteligentes.', '2025-10-26 02:03:47'),
(3, 8, 'user', 'hola', '2025-10-26 02:08:51'),
(4, 8, 'ia', 'Esta es una respuesta automática. Conecta tu API de Flowise para respuestas inteligentes.', '2025-10-26 02:08:51'),
(5, 8, 'user', 'hola', '2025-10-26 02:10:06'),
(6, 8, 'ia', 'Esta es una respuesta automática. Conecta tu API de Flowise para respuestas inteligentes.', '2025-10-26 02:10:06'),
(7, 8, 'user', 'Hola, quiero hablar sobre mi nota de 5 en Matematicas', '2025-10-26 02:38:11'),
(8, 8, 'ia', 'Esta es una respuesta automática. Conecta tu API de Flowise para respuestas inteligentes.', '2025-10-26 02:38:11'),
(9, 8, 'user', 'hola', '2025-10-26 02:43:57'),
(10, 8, 'ia', '¡Hola! ¿Cómo estás? Estoy aquí para lo que necesites.', '2025-10-26 02:44:00'),
(11, 8, 'user', 'Hola EduGuard, quiero hablar sobre mi nota de 3 en Matematicas. Vi que en Matemáticas tienes un 3, y entiendo que esto puede ser desalentador. Estoy aquí para apoyarte y juntos podemos encontrar la mejor manera de avanzar. 🌱❤️', '2025-10-26 03:21:58'),
(12, 8, 'ia', 'Veo que tu nota en Matemáticas ha bajado un poco, pero quiero que sepas que esto no define tu capacidad. Todos pasamos por altibajos y lo importante es aprender de ellos. Estoy aquí para ayudarte a encontrar las estrategias que te funcionen mejor y que puedas volver a brillar. 🌈❤️', '2025-10-26 03:22:03'),
(13, 8, 'user', 'Hola EduGuard, quiero hablar sobre mi nota de 15 en Comunicacion. Vi que en Comunicación tienes un 15/20, ¡qué gran logro! Estoy muy orgulloso de ti por mantenerte firme y seguir avanzando, sigue así, que vas por el buen camino. 🎉🌟', '2025-10-26 03:42:05'),
(14, 8, 'ia', '¡Qué alegría escuchar sobre tu nota! Mantener ese 15 en Comunicación es un gran logro y refleja tu esfuerzo constante. Sigue así, cada paso cuenta y estoy aquí para apoyarte en el camino. 🌟✨', '2025-10-26 03:42:09'),
(15, 8, 'user', 'hola', '2025-10-30 20:55:40'),
(16, 8, 'ia', '¡Hola! ¿Cómo estás? ¿En qué puedo ayudarte hoy?', '2025-10-30 20:55:41'),
(17, 8, 'user', 'viste mi nota de fisica ?', '2025-10-30 20:55:55'),
(18, 8, 'ia', 'He visto tu nota de física, y se mantiene estable. ¡Eso refleja tu esfuerzo constante! Sigue así, ¡ya verás que todo el trabajo vale la pena! 😊', '2025-10-30 20:56:00'),
(19, 8, 'user', '🎉 ¡Hola EduGuard! Acabo de ver que saqué 20/20 en Fisica. ¡Estoy muy feliz! 😊¿Qué me recomiendas para mantener este nivel?', '2025-10-30 21:47:44'),
(20, 8, 'ia', '¡Eso es increíble! 🎉 Tu esfuerzo está dando frutos, y un 20/20 en Física es un logro impresionante. Para mantener este nivel, sigue estudiando con esa misma dedicación, pero también recuerda darte tiempo para disfrutar y relajarte. ¡Sigue brillando! 😊', '2025-10-30 21:47:48'),
(21, 8, 'user', '🎉 ¡Hola EduGuard! Acabo de ver que saqué 20/20 en Matematicas. ¡Estoy muy feliz! 😊¿Qué me recomiendas para mantener este nivel?', '2025-10-30 22:21:24'),
(22, 8, 'ia', '¡Wow, eso es increíble! 🎉 Tu esfuerzo realmente ha dado frutos y te animo a seguir así. Para mantener este nivel, sigue practicando y no dudes en pedir ayuda si algo no te queda claro. ¡Sigue brillando! 😊', '2025-10-30 22:21:27'),
(23, 8, 'user', '🎉 ¡Hola EduGuard! Acabo de ver que saqué 15/20 en Lenguaje. ¡Estoy muy feliz! 😊¿Qué me recomiendas para mantener este nivel?', '2025-10-30 22:51:48'),
(24, 8, 'ia', '¡Qué gran noticia! 🎉 Sacar 15/20 es un excelente logro, y me alegra mucho que estés feliz con tu esfuerzo. Para mantener ese nivel, sigue practicando regularmente y no dudes en hacer preguntas si algo no te queda claro, ¡sigue así, que vas por muy buen camino! 😊', '2025-10-30 22:51:53'),
(25, 8, 'user', 'si, es genial!!', '2025-10-30 22:52:05'),
(26, 8, 'ia', '¡Me alegra mucho que te sientas así! Estoy aquí para ayudarte en lo que necesites. 😊', '2025-10-30 22:52:07'),
(27, 8, 'user', '😔 Hola EduGuard, necesito tu ayuda. Saqué 10/20 en Lenguaje y me siento un poco desanimado.¿Podrías darme un plan de estudio personalizado y algunos consejos motivacionales?', '2025-10-30 22:53:48'),
(28, 8, 'ia', 'Entiendo cómo te sientes, Sergio. A veces, los resultados no reflejan todo el esfuerzo que pones, y está bien sentirse desanimado. Recuerda que es solo una evaluación y que puedes mejorar; confía en ti mismo y sigue adelante, ¡tienes lo necesario para salir adelante! 🌟', '2025-10-30 22:53:52'),
(29, 8, 'user', '🎉 ¡Hola EduGuard! Acabo de ver que saqué 18/20 en Comunicacion. ¡Estoy muy feliz! 😊¿Qué me recomiendas para mantener este nivel?', '2025-10-30 22:58:12'),
(30, 8, 'ia', '¡Hola! ¡Qué alegría saber de tu 18/20 en Comunicación! 🎉 Eso es un gran logro y demuestra todo tu esfuerzo, ¡sigue así! Para mantener este nivel, te recomendaría seguir practicando, leer más sobre temas que te interesen y no dudar en preguntar si algo no está claro. ¡Confía en ti! 😊', '2025-10-30 22:58:15'),
(31, 8, 'user', 'Gracias', '2025-10-30 22:58:21'),
(32, 8, 'ia', '¡De nada! Estoy aquí para ti. Si necesitas algo más o quieres hablar sobre tus estudios, no dudes en decírmelo. 😊', '2025-10-30 22:58:23'),
(33, 8, 'user', '😔 Hola EduGuard, necesito tu ayuda. Saqué 8/20 en Matematicas y me siento un poco desanimado.¿Podrías darme un plan de estudio personalizado y algunos consejos motivacionales?', '2025-10-30 22:59:35'),
(34, 8, 'ia', 'Sergio, entiendo cómo te sientes y es completamente normal tener altibajos. Lo importante es que has tenido buenos resultados antes, así que confío en que puedes recuperarte. Respira hondo, establece pequeños objetivos y sé amable contigo mismo en este proceso; cada paso cuenta. 🌱✨', '2025-10-30 22:59:39'),
(35, 8, 'user', 'me podrias ayudar a reforzar ese tema?', '2025-10-30 23:00:00'),
(36, 8, 'ia', '¡Claro! Estoy aquí para ayudarte en todo lo que necesites. Cuéntame de qué tema se trata y cómo te gustaría reforzarlo. 😊', '2025-10-30 23:00:02'),
(37, 8, 'user', 'algebra', '2025-10-30 23:00:20'),
(38, 8, 'ia', 'Entiendo que la nota de álgebra ha bajado un poco, pero no te preocupes, eso puede pasarle a cualquiera. Lo importante es que sigas esforzándote y buscando maneras de mejorar. Estoy aquí para apoyarte en lo que necesites. 💪✨', '2025-10-30 23:00:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chat_profesor_alumno`
--

CREATE TABLE `chat_profesor_alumno` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `alumno_id` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `remitente` enum('profesor','alumno') NOT NULL,
  `fecha` datetime NOT NULL,
  `leido` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `chat_profesor_alumno`
--

INSERT INTO `chat_profesor_alumno` (`id`, `profesor_id`, `alumno_id`, `mensaje`, `remitente`, `fecha`, `leido`) VALUES
(1, 13, 9, 'hola', 'profesor', '2025-10-25 17:56:54', 0),
(2, 13, 8, 'hola', 'profesor', '2025-10-25 17:58:16', 1),
(3, 13, 8, 'hola', 'alumno', '2025-10-25 18:47:30', 1),
(4, 13, 8, 'como estas', 'profesor', '2025-10-25 18:47:38', 1),
(5, 13, 8, 'bien tu?', 'alumno', '2025-10-25 18:47:46', 1),
(6, 13, 8, 'df', 'alumno', '2025-10-25 19:00:18', 1),
(7, 13, 8, 'fd', 'alumno', '2025-10-25 19:00:20', 1),
(8, 13, 8, 'h', 'alumno', '2025-10-25 19:00:57', 1),
(9, 13, 8, 'j', 'alumno', '2025-10-25 19:01:19', 1),
(10, 13, 8, 'ddd', 'alumno', '2025-10-25 19:01:34', 1),
(11, 13, 8, 'como estas', 'profesor', '2025-10-25 19:01:43', 1),
(12, 13, 8, 'bien tu?', 'alumno', '2025-10-25 19:01:51', 1),
(13, 13, 8, 'bien tmbine', 'profesor', '2025-10-25 19:02:00', 1),
(14, 13, 8, 'genial', 'alumno', '2025-10-25 19:02:05', 1),
(15, 13, 8, 'profesor, podria  realizar una recuperacion de mi nota?', 'alumno', '2025-10-25 22:22:48', 1),
(16, 13, 4, 'como estas', 'profesor', '2025-10-30 17:44:57', 0);

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
(12, 7, 2, '2025-10-23 22:04:10'),
(13, 9, 7, '2025-10-25 22:09:20'),
(14, 8, 7, '2025-10-25 22:09:40'),
(15, 7, 7, '2025-10-25 22:09:54'),
(16, 4, 8, '2025-10-26 03:38:56'),
(17, 9, 8, '2025-10-26 03:38:56'),
(18, 8, 8, '2025-10-26 03:38:56'),
(19, 8, 9, '2025-10-30 20:54:37'),
(20, 8, 10, '2025-10-30 20:56:28'),
(21, 9, 11, '2025-10-30 22:50:01'),
(22, 8, 11, '2025-10-30 22:50:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos_calendario`
--

CREATE TABLE `eventos_calendario` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `tipo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos_calendario`
--

INSERT INTO `eventos_calendario` (`id`, `profesor_id`, `titulo`, `descripcion`, `fecha`, `hora`, `tipo`) VALUES
(1, 1, 'Reunión de padres', 'Reunión general con padres de familia', '2025-11-04', '10:00:00', 'reunion'),
(2, 1, 'Examen final', 'Examen final de matemáticas', '2025-11-09', '08:00:00', 'examen'),
(3, 1, 'Entrega de notas', 'Fecha límite para entrega de notas', '2025-11-14', '17:00:00', 'evento');

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
(5, 'admin', 8, 'el pepe', '2025-10-23 19:48:05'),
(6, 'rvegvr', 13, 'vrt', '2025-10-24 23:02:50'),
(7, 'rvegvrnn', 13, 'n', '2025-10-25 22:00:02');

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
(20, 2, 8, '🤨', NULL, 'texto', '2025-10-24 00:05:34'),
(21, 4, 15, '🤪', NULL, 'texto', '2025-10-24 21:10:34'),
(22, 4, 15, '🤨', NULL, 'texto', '2025-10-24 21:10:42'),
(23, 4, 7, 'que paso pana', NULL, 'texto', '2025-10-24 21:10:50'),
(24, 6, 13, 'jj', NULL, 'texto', '2025-10-24 23:21:17'),
(25, 7, 13, 'gvu', NULL, 'texto', '2025-10-25 22:00:09');

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
(9, 4, 7, '2025-10-21 23:26:21', '2025-10-24 21:10:50'),
(10, 4, 1, '2025-10-21 23:40:02', '2025-10-21 23:40:02'),
(11, 5, 8, '2025-10-23 19:48:05', '2025-10-30 22:54:04'),
(12, 5, 9, '2025-10-23 19:51:35', '2025-10-23 22:58:39'),
(13, 1, 8, '2025-10-23 22:04:10', '2025-10-30 21:28:27'),
(14, 2, 8, '2025-10-23 22:04:10', '2025-10-24 00:05:34'),
(15, 3, 8, '2025-10-23 22:04:10', '2025-10-24 00:05:22'),
(16, 1, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(17, 2, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(18, 3, 14, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(19, 4, 15, '2025-10-24 21:10:15', '2025-10-24 21:10:42'),
(20, 6, 13, '2025-10-24 23:02:50', '2025-10-24 23:02:50'),
(21, 7, 13, '2025-10-25 22:00:02', '2025-10-25 22:03:13');

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
(6, 'Programación', 'Prof. Díaz', 'indigo', NULL),
(7, 'Matematicas', 'Profesor González', '#ff0000', 'mates '),
(8, 'Comunicacion', 'Profesor González', '#ffbb00', ''),
(9, 'Fisica', 'Profesor González', '#6366f1', ''),
(10, 'Geometria', 'Profesor González', '#6366f1', ''),
(11, 'Lenguaje', 'Profesor González', '#6366f1', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_apoyo`
--

CREATE TABLE `mensajes_apoyo` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `leido` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_ia_historial`
--

CREATE TABLE `mensajes_ia_historial` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('apoyo_emocional','recomendacion','alerta') DEFAULT 'apoyo_emocional',
  `fecha` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_ia_historial`
--

INSERT INTO `mensajes_ia_historial` (`id`, `usuario_id`, `materia`, `mensaje`, `tipo`, `fecha`) VALUES
(1, 8, 'Matematicas', '¡Genial que te hayas mantenido en ese 7! Tu constancia es admirable, sigue así, que el esfuerzo siempre da sus frutos. 🌟😊', 'apoyo_emocional', '2025-10-25 21:11:54'),
(2, 8, 'Matematicas', 'Hey, todos atravesamos momentos complicados 💙 No te preocupes, estoy aquí para ayudarte y juntos lo superaremos.', 'apoyo_emocional', '2025-10-25 21:29:51'),
(3, 8, 'Matematicas', 'Vi que en Matemáticas tienes un 5, y entiendo que eso puede ser frustrante. Estoy aquí para apoyarte y encontrar juntos cómo mejorar las cosas. 🌈💪', 'apoyo_emocional', '2025-10-25 21:37:11'),
(4, 8, 'Matematicas', 'Vi que en Matemáticas tienes un 3, y entiendo que esto puede ser desalentador. Estoy aquí para apoyarte y juntos podemos encontrar la mejor manera de avanzar. 🌱❤️', 'apoyo_emocional', '2025-10-25 22:21:48'),
(5, 8, 'Comunicacion', 'Vi que en Comunicación tienes un 15/20, ¡qué gran logro! Estoy muy orgulloso de ti por mantenerte firme y seguir avanzando, sigue así, que vas por el buen camino. 🎉🌟', 'apoyo_emocional', '2025-10-25 22:41:52'),
(6, 8, 'Comunicacion', 'Vi que en Comunicación tienes un 15, ¡qué gran logro! Estoy muy orgulloso de ti, tu esfuerzo está dando sus frutos. 🎉✨', 'apoyo_emocional', '2025-10-30 15:54:03'),
(7, 8, 'Fisica', 'Vi que en Física tienes un 4, y entiendo que eso puede ser frustrante. Estoy aquí para apoyarte y juntos encontrar una forma de hacerlo más llevadero. 🌈💖', 'apoyo_emocional', '2025-10-30 15:55:17'),
(8, 8, 'Geometria', 'Vi que en Geometría tienes un 20, ¡fantástico! 🎉 Tu esfuerzo realmente brilla y es un placer ver cómo te va tan bien. 🌟', 'apoyo_emocional', '2025-10-30 15:57:53'),
(9, 8, 'Fisica', 'Vi que en Física tienes un increíble 20/20, ¡qué alegría! Tu esfuerzo realmente ha dado frutos, y estoy muy orgulloso de ti. 🎉✨', 'apoyo_emocional', '2025-10-30 16:44:29'),
(10, 8, 'Fisica', 'Vi que en Física tienes un 10 y entiendo que esto puede ser frustrante. Estoy aquí para acompañarte y explorar juntos cómo mejorar en esta materia. 🌼💪', 'apoyo_emocional', '2025-10-30 17:03:40'),
(11, 8, 'Matematicas', 'Vi que en Matemáticas tienes un 20, ¡qué increíble! Tu esfuerzo ha dado frutos y estoy tan orgulloso de ti, sigue así y sigue brillando. 🎉✨', 'apoyo_emocional', '2025-10-30 17:18:40'),
(12, 8, 'Lenguaje', 'Vi que en Lenguaje tienes un 15, ¡genial! Es increíble ver cómo tu esfuerzo te está llevando a grandes logros. 🎉✨', 'apoyo_emocional', '2025-10-30 17:51:24'),
(13, 8, 'Lenguaje', 'Vi que en Lenguaje tienes un 10, y entiendo que esto puede ser desalentador. Estoy aquí para apoyarte y encontrar juntos la manera de mejorar, paso a paso. 🌱❤️', 'apoyo_emocional', '2025-10-30 17:53:20'),
(14, 8, 'Comunicacion', 'Vi que en Comunicación tienes un 18, ¡qué gran logro! Tu esfuerzo realmente está dando frutos, sigue brillando así. 🎉✨', 'apoyo_emocional', '2025-10-30 17:57:53'),
(15, 8, 'Matematicas', 'Vi que en Matemáticas tienes un 8, y entiendo que puede ser frustrante. Estoy aquí para ayudarte a encontrar soluciones y apoyarte en este camino. 🌈🤗', 'apoyo_emocional', '2025-10-30 17:59:13');

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
(7, 9, 1, 20.00, 'practica', 'examu', '2025-10-24'),
(10, 8, 7, 3.00, 'practica', 'Geometria', '2025-10-26'),
(11, 8, 7, 8.00, 'tarea', 'Trigonometria', '2025-10-26'),
(12, 8, 7, 5.00, 'practica', 'Algebra', '2025-10-26'),
(13, 8, 7, 3.00, 'tarea', 'algebra ', '2025-10-26'),
(14, 8, 8, 15.00, 'practica', 'Textos narrativos', '2025-10-26'),
(15, 8, 9, 4.00, 'examen', 'mruv', '2025-10-30'),
(16, 8, 10, 20.00, 'proyecto', 'areas', '2025-10-30'),
(17, 8, 9, 20.00, 'practica', 'triangulos', '2025-10-30'),
(18, 8, 9, 10.00, 'practica', 'MRU', '2025-10-30'),
(19, 8, 7, 20.00, 'practica', 'trigonometria', '2025-10-30'),
(20, 8, 11, 15.00, 'tarea', 'onomatopeyas', '2025-10-30'),
(21, 8, 11, 10.00, 'examen', 'Examen de onomatopeyas', '2025-10-30'),
(22, 8, 11, 10.00, 'examen', 'Examen de onomatopeyas', '2025-10-30'),
(23, 8, 8, 18.00, 'practica', 'Examen Final ', '2025-10-30'),
(24, 8, 7, 8.00, 'examen', 'Examen Algebra', '2025-10-30');

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
(2, 1, 'tarea', 'Entrega de ensayo de Historia', 'Último día para entregar', 0, '2025-10-21 21:01:35'),
(3, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', '¡Genial que te hayas mantenido en ese 7! Tu constancia es admirable, sigue así, que el esfuerzo siempre da sus frutos. 🌟😊', 1, '2025-10-26 02:11:54'),
(4, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', 'Hey, todos atravesamos momentos complicados 💙 No te preocupes, estoy aquí para ayudarte y juntos lo superaremos.', 1, '2025-10-26 02:29:51'),
(5, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', 'Vi que en Matemáticas tienes un 5, y entiendo que eso puede ser frustrante. Estoy aquí para apoyarte y encontrar juntos cómo mejorar las cosas. 🌈💪', 1, '2025-10-26 02:37:11'),
(6, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', 'Vi que en Matemáticas tienes un 3, y entiendo que esto puede ser desalentador. Estoy aquí para apoyarte y juntos podemos encontrar la mejor manera de avanzar. 🌱❤️', 1, '2025-10-26 03:21:48'),
(7, 8, 'mensaje_ia', 'Mensaje de apoyo - Comunicacion', 'Vi que en Comunicación tienes un 15/20, ¡qué gran logro! Estoy muy orgulloso de ti por mantenerte firme y seguir avanzando, sigue así, que vas por el buen camino. 🎉🌟', 1, '2025-10-26 03:41:52'),
(8, 8, 'mensaje_ia', 'Mensaje de apoyo - Comunicacion', 'Vi que en Comunicación tienes un 15, ¡qué gran logro! Estoy muy orgulloso de ti, tu esfuerzo está dando sus frutos. 🎉✨', 1, '2025-10-30 20:54:03'),
(9, 8, 'mensaje_ia', 'Mensaje de apoyo - Fisica', 'Vi que en Física tienes un 4, y entiendo que eso puede ser frustrante. Estoy aquí para apoyarte y juntos encontrar una forma de hacerlo más llevadero. 🌈💖', 1, '2025-10-30 20:55:17'),
(10, 8, 'mensaje_ia', 'Mensaje de apoyo - Geometria', 'Vi que en Geometría tienes un 20, ¡fantástico! 🎉 Tu esfuerzo realmente brilla y es un placer ver cómo te va tan bien. 🌟', 1, '2025-10-30 20:57:53'),
(11, 8, 'mensaje_ia', 'Mensaje de apoyo - Fisica', 'Vi que en Física tienes un increíble 20/20, ¡qué alegría! Tu esfuerzo realmente ha dado frutos, y estoy muy orgulloso de ti. 🎉✨', 1, '2025-10-30 21:44:29'),
(12, 8, 'mensaje_ia', 'Mensaje de apoyo - Fisica', 'Vi que en Física tienes un 10 y entiendo que esto puede ser frustrante. Estoy aquí para acompañarte y explorar juntos cómo mejorar en esta materia. 🌼💪', 1, '2025-10-30 22:03:40'),
(13, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', 'Vi que en Matemáticas tienes un 20, ¡qué increíble! Tu esfuerzo ha dado frutos y estoy tan orgulloso de ti, sigue así y sigue brillando. 🎉✨', 1, '2025-10-30 22:18:40'),
(14, 8, 'mensaje_ia', 'Mensaje de apoyo - Lenguaje', 'Vi que en Lenguaje tienes un 15, ¡genial! Es increíble ver cómo tu esfuerzo te está llevando a grandes logros. 🎉✨', 1, '2025-10-30 22:51:24'),
(15, 8, 'mensaje_ia', 'Mensaje de apoyo - Lenguaje', 'Vi que en Lenguaje tienes un 10, y entiendo que esto puede ser desalentador. Estoy aquí para apoyarte y encontrar juntos la manera de mejorar, paso a paso. 🌱❤️', 1, '2025-10-30 22:53:20'),
(16, 8, 'mensaje_ia', 'Mensaje de apoyo - Comunicacion', 'Vi que en Comunicación tienes un 18, ¡qué gran logro! Tu esfuerzo realmente está dando frutos, sigue brillando así. 🎉✨', 0, '2025-10-30 22:57:53'),
(17, 8, 'mensaje_ia', 'Mensaje de apoyo - Matematicas', 'Vi que en Matemáticas tienes un 8, y entiendo que puede ser frustrante. Estoy aquí para ayudarte a encontrar soluciones y apoyarte en este camino. 🌈🤗', 0, '2025-10-30 22:59:13');

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
(8, 14, 4, '2025-10-23 22:07:56'),
(9, 13, 7, '2025-10-25 22:09:12'),
(10, 13, 8, '2025-10-26 03:38:30'),
(11, 13, 9, '2025-10-30 20:54:29'),
(12, 13, 10, '2025-10-30 20:56:21'),
(13, 13, 11, '2025-10-30 22:49:49');

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
(7, 'Test User', 'demo@eduguard.com', '$2y$10$9NF.oVrLt81WI4uZF/7Do.gLo5b80rV2Eb3TLpOjd/Jd.uYg1H3Dm', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-21 22:31:02', '2025-10-24 20:52:11'),
(8, 'Sergio', 'sergiooscateguihuaytan@gmail.com', '$2y$10$kksUM5nz/5cO27HdmxBwQeJ2Q4sMpOarGOIex0G3TwkB.P6kDGqou', 'alumno', '+51 963548125', '5to  Secundaria ', 'A', NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:16:21', '2025-10-30 22:57:48'),
(9, 'ser', 'ser@gmail.com', '$2y$10$giyxPCHQFEl3n8K3kCp8W.6qA0ksQ5t2BNYH9T.nPWOpV4LeqoAy.', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:51:00', '2025-10-23 20:42:58'),
(10, 'Profesor Demo', 'profesor@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 21:47:06', '2025-10-24 00:02:38'),
(13, 'Profesor González', 'profe@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '965565521', NULL, NULL, '', NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:04:10', '2025-10-30 22:56:34'),
(14, 'Prof. Jesús Pérez', 'jesus@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '+51 999888777', NULL, NULL, 'Profesor de Matemáticas y Física', NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:07:56', '2025-10-23 22:07:56'),
(15, 'pedro', 'pedro@gmail.com', '$2y$10$2UkmrXwK.jyHXsNsnTRNt.04uFC8CFCZhluwoHhFBgliMYMmmEmmq', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-24 21:09:33', '2025-10-24 21:09:51');

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
-- Indices de la tabla `actividad_profesor`
--
ALTER TABLE `actividad_profesor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `profesor_id` (`profesor_id`);

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
-- Indices de la tabla `chat_profesor_alumno`
--
ALTER TABLE `chat_profesor_alumno`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alumno_id` (`alumno_id`),
  ADD KEY `idx_profesor_alumno` (`profesor_id`,`alumno_id`),
  ADD KEY `idx_fecha` (`fecha`);

--
-- Indices de la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`materia_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `profesor_id` (`profesor_id`);

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
-- Indices de la tabla `mensajes_apoyo`
--
ALTER TABLE `mensajes_apoyo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `mensajes_ia_historial`
--
ALTER TABLE `mensajes_ia_historial`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_fecha` (`usuario_id`,`fecha`);

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
-- AUTO_INCREMENT de la tabla `actividad_profesor`
--
ALTER TABLE `actividad_profesor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `calendario_eventos`
--
ALTER TABLE `calendario_eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `chat_mensajes`
--
ALTER TABLE `chat_mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `chat_profesor_alumno`
--
ALTER TABLE `chat_profesor_alumno`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `grupo_invitaciones`
--
ALTER TABLE `grupo_invitaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `grupo_mensajes`
--
ALTER TABLE `grupo_mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `materiales_didacticos`
--
ALTER TABLE `materiales_didacticos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `mensajes_apoyo`
--
ALTER TABLE `mensajes_apoyo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mensajes_ia_historial`
--
ALTER TABLE `mensajes_ia_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `noticias`
--
ALTER TABLE `noticias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `profesor_materias`
--
ALTER TABLE `profesor_materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividades`
--
ALTER TABLE `actividades`
  ADD CONSTRAINT `actividades_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `actividad_profesor`
--
ALTER TABLE `actividad_profesor`
  ADD CONSTRAINT `actividad_profesor_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `chat_mensajes`
--
ALTER TABLE `chat_mensajes`
  ADD CONSTRAINT `chat_mensajes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `chat_profesor_alumno`
--
ALTER TABLE `chat_profesor_alumno`
  ADD CONSTRAINT `chat_profesor_alumno_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_profesor_alumno_ibfk_2` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudiante_materias`
--
ALTER TABLE `estudiante_materias`
  ADD CONSTRAINT `estudiante_materias_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `estudiante_materias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD CONSTRAINT `eventos_calendario_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

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
-- Filtros para la tabla `mensajes_apoyo`
--
ALTER TABLE `mensajes_apoyo`
  ADD CONSTRAINT `mensajes_apoyo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajes_ia_historial`
--
ALTER TABLE `mensajes_ia_historial`
  ADD CONSTRAINT `mensajes_ia_historial_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

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

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-10-2025 a las 01:01:39
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
(8, 'Sergio', 'sergiooscateguihuaytan@gmail.com', '$2y$10$kksUM5nz/5cO27HdmxBwQeJ2Q4sMpOarGOIex0G3TwkB.P6kDGqou', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:16:21', '2025-10-23 19:59:13'),
(9, 'ser', 'ser@gmail.com', '$2y$10$giyxPCHQFEl3n8K3kCp8W.6qA0ksQ5t2BNYH9T.nPWOpV4LeqoAy.', 'alumno', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 19:51:00', '2025-10-23 20:42:58'),
(10, 'Profesor Demo', 'profesor@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 21:47:06', '2025-10-23 22:46:18'),
(13, 'Profesor González', 'profe@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '+51 999888777', NULL, NULL, NULL, NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:04:10', '2025-10-23 22:07:56'),
(14, 'Prof. Jesús Pérez', 'jesus@eduguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', '+51 999888777', NULL, NULL, 'Profesor de Matemáticas y Física', NULL, 0, 'Bronce', 0, 0, '2025-10-23 22:07:56', '2025-10-23 22:07:56');

--
-- Índices para tablas volcadas
--

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
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

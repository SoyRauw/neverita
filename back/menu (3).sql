-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-02-2026 a las 16:59:46
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
-- Base de datos: `menu`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `daily_meals`
--

CREATE TABLE `daily_meals` (
  `daily_meal_id` int(11) NOT NULL,
  `menu_plan_id` int(11) NOT NULL,
  `meal_type` enum('desayuno','almuerzo','cena','') NOT NULL,
  `day_of_week` enum('lunes','martes','miércoles','jueves','viernes','sábado','domingo') NOT NULL,
  `recipe_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `families`
--

CREATE TABLE `families` (
  `family_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `families`
--

INSERT INTO `families` (`family_id`, `name`, `created_by`, `created_at`) VALUES
(1, 'rauw family', 1, '2025-12-29 20:51:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingredients`
--

CREATE TABLE `ingredients` (
  `ingredient_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('vegetal','fruta','proteína','lácteo','grano','condimento','grasa','bebida','otro') NOT NULL DEFAULT 'otro',
  `unit` enum('g','kg','ml','l','cup','cucharada grande','cucharada pequeña','unidad') NOT NULL,
  `image_url` text DEFAULT NULL,
  `average_expiry_days` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ingredients`
--

INSERT INTO `ingredients` (`ingredient_id`, `name`, `category`, `unit`, `image_url`, `average_expiry_days`, `created_at`) VALUES
(1, 'Pechuga de Pollo', 'proteína', 'g', 'https://placehold.co/100x100?text=Pollo', 5, '2026-02-01 22:17:00'),
(2, 'Arroz Blanco', 'grano', 'g', 'https://placehold.co/100x100?text=Arroz', 365, '2026-02-01 22:17:00'),
(3, 'Pasta (Espagueti)', 'grano', 'g', 'https://placehold.co/100x100?text=Pasta', 365, '2026-02-01 22:17:00'),
(4, 'Huevos', 'proteína', 'unidad', 'https://placehold.co/100x100?text=Huevos', 21, '2026-02-01 22:17:00'),
(5, 'Leche Entera', 'lácteo', 'ml', 'https://placehold.co/100x100?text=Leche', 7, '2026-02-01 22:17:00'),
(6, 'Tomate', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Tomate', 7, '2026-02-01 22:17:00'),
(7, 'Cebolla', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Cebolla', 14, '2026-02-01 22:17:00'),
(8, 'Ajo', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Ajo', 30, '2026-02-01 22:17:00'),
(9, 'Aceite de Oliva', 'grasa', 'cucharada grande', 'https://placehold.co/100x100?text=Aceite', 365, '2026-02-01 22:17:00'),
(10, 'Sal', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Sal', 730, '2026-02-01 22:17:00'),
(11, 'Pimienta Negra', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Pimienta', 730, '2026-02-01 22:17:00'),
(12, 'Carne Molida', 'proteína', 'g', 'https://placehold.co/100x100?text=Carne', 4, '2026-02-01 22:17:00'),
(13, 'Zanahoria', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Zanahoria', 14, '2026-02-01 22:17:00'),
(14, 'Papa', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Papa', 21, '2026-02-01 22:17:00'),
(15, 'Queso Parmesano', 'lácteo', 'g', 'https://placehold.co/100x100?text=Queso', 30, '2026-02-01 22:17:00'),
(16, 'Pan de Molde', 'grano', 'unidad', 'https://placehold.co/100x100?text=Pan', 10, '2026-02-01 22:17:00'),
(17, 'Jamón', 'proteína', 'g', 'https://placehold.co/100x100?text=Jamon', 7, '2026-02-01 22:17:00'),
(18, 'Manzana', 'fruta', 'unidad', 'https://placehold.co/100x100?text=Manzana', 10, '2026-02-01 22:17:00'),
(19, 'Avena', 'grano', 'g', 'https://placehold.co/100x100?text=Avena', 180, '2026-02-01 22:17:00'),
(20, 'Plátano', 'fruta', 'unidad', 'https://placehold.co/100x100?text=Platano', 5, '2026-02-01 22:17:00'),
(21, 'Salmón', 'proteína', 'g', 'https://placehold.co/100x100?text=Salmon', 3, '2026-02-01 22:19:15'),
(22, 'Atún en Lata', 'proteína', 'unidad', 'https://placehold.co/100x100?text=Atun', 730, '2026-02-01 22:19:15'),
(23, 'Lentejas', 'grano', 'g', 'https://placehold.co/100x100?text=Lentejas', 365, '2026-02-01 22:19:15'),
(24, 'Garbanzos', 'grano', 'g', 'https://placehold.co/100x100?text=Garbanzos', 365, '2026-02-01 22:19:15'),
(25, 'Espinaca', 'vegetal', 'g', 'https://placehold.co/100x100?text=Espinaca', 5, '2026-02-01 22:19:15'),
(26, 'Brócoli', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Brocoli', 7, '2026-02-01 22:19:15'),
(27, 'Pimiento Rojo', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Pimiento', 10, '2026-02-01 22:19:15'),
(28, 'Limón', 'fruta', 'unidad', 'https://placehold.co/100x100?text=Limon', 20, '2026-02-01 22:19:15'),
(29, 'Aguacate', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Aguacate', 5, '2026-02-01 22:19:15'),
(30, 'Tortillas de Maíz', 'grano', 'unidad', 'https://placehold.co/100x100?text=Tortillas', 10, '2026-02-01 22:19:15'),
(31, 'Harina de Trigo', 'grano', 'g', 'https://placehold.co/100x100?text=Harina', 180, '2026-02-01 22:19:15'),
(32, 'Azúcar', 'condimento', 'g', 'https://placehold.co/100x100?text=Azucar', 730, '2026-02-01 22:19:15'),
(33, 'Mantequilla', 'grasa', 'g', 'https://placehold.co/100x100?text=Mantequilla', 60, '2026-02-01 22:19:15'),
(34, 'Yogur Natural', 'lácteo', 'ml', 'https://placehold.co/100x100?text=Yogur', 15, '2026-02-01 22:19:15'),
(35, 'Pepino', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Pepino', 7, '2026-02-01 22:19:15'),
(36, 'Salsa de Soja', 'condimento', 'ml', 'https://placehold.co/100x100?text=Soja', 365, '2026-02-01 22:19:15'),
(37, 'Chuleta de Cerdo', 'proteína', 'unidad', 'https://placehold.co/100x100?text=Cerdo', 4, '2026-02-01 22:19:15'),
(38, 'Batata (Camote)', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Batata', 30, '2026-02-01 22:19:15'),
(39, 'Lechuga', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Lechuga', 5, '2026-02-01 22:19:15'),
(40, 'Vinagre', 'condimento', 'ml', 'https://placehold.co/100x100?text=Vinagre', 730, '2026-02-01 22:19:15'),
(41, 'Champiñones', 'vegetal', 'g', 'https://placehold.co/100x100?text=Hongos', 5, '2026-02-01 22:19:15'),
(42, 'Calabacín', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Calabacin', 7, '2026-02-01 22:19:15'),
(43, 'Carne para Guisar', 'proteína', 'g', 'https://placehold.co/100x100?text=CarneGuisar', 4, '2026-02-01 22:19:15'),
(44, 'Mayonesa', 'grasa', 'cucharada grande', 'https://placehold.co/100x100?text=Mayonesa', 90, '2026-02-01 22:19:15'),
(45, 'Miel', 'condimento', 'cucharada grande', 'https://placehold.co/100x100?text=Miel', 730, '2026-02-01 22:19:15'),
(46, 'Naranja', 'fruta', 'unidad', 'https://placehold.co/100x100?text=Naranja', 14, '2026-02-01 22:19:15'),
(47, 'Fresas', 'fruta', 'g', 'https://placehold.co/100x100?text=Fresas', 4, '2026-02-01 22:19:15'),
(48, 'Orégano', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Oregano', 365, '2026-02-01 22:19:15'),
(49, 'Frijoles Negros', 'grano', 'g', 'https://placehold.co/100x100?text=Frijoles', 365, '2026-02-01 22:19:15'),
(50, 'Polvo de Hornear', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=PolvoHornear', 365, '2026-02-01 22:19:15'),
(51, 'Camarones', 'proteína', 'g', 'https://placehold.co/100x100?text=Camarones', 3, '2026-02-01 22:22:03'),
(52, 'Tocino', 'proteína', 'g', 'https://placehold.co/100x100?text=Tocino', 14, '2026-02-01 22:22:03'),
(53, 'Crema de Leche', 'lácteo', 'ml', 'https://placehold.co/100x100?text=Crema', 10, '2026-02-01 22:22:03'),
(54, 'Chorizo', 'proteína', 'unidad', 'https://placehold.co/100x100?text=Chorizo', 30, '2026-02-01 22:22:03'),
(55, 'Salsa de Tomate (Passata)', 'condimento', 'ml', 'https://placehold.co/100x100?text=SalsaTomate', 180, '2026-02-01 22:22:03'),
(56, 'Albahaca Fresca', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Albahaca', 5, '2026-02-01 22:22:03'),
(57, 'Comino', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Comino', 730, '2026-02-01 22:22:03'),
(58, 'Pimentón (Paprika)', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Paprika', 730, '2026-02-01 22:22:03'),
(59, 'Vainilla', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Vainilla', 730, '2026-02-01 22:22:03'),
(60, 'Chocolate Oscuro', 'otro', 'g', 'https://placehold.co/100x100?text=Chocolate', 365, '2026-02-01 22:22:03'),
(61, 'Almendras', 'grano', 'g', 'https://placehold.co/100x100?text=Almendras', 180, '2026-02-01 22:22:03'),
(62, 'Uvas', 'fruta', 'g', 'https://placehold.co/100x100?text=Uvas', 7, '2026-02-01 22:22:03'),
(63, 'Piña', 'fruta', 'unidad', 'https://placehold.co/100x100?text=Piña', 7, '2026-02-01 22:22:03'),
(64, 'Coco Rallado', 'otro', 'g', 'https://placehold.co/100x100?text=Coco', 180, '2026-02-01 22:22:03'),
(65, 'Levadura', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Levadura', 180, '2026-02-01 22:22:03'),
(66, 'Queso Mozzarella', 'lácteo', 'g', 'https://placehold.co/100x100?text=Mozzarella', 15, '2026-02-01 22:22:03'),
(67, 'Queso Cheddar', 'lácteo', 'g', 'https://placehold.co/100x100?text=Cheddar', 30, '2026-02-01 22:22:03'),
(68, 'Perejil', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Perejil', 7, '2026-02-01 22:22:03'),
(69, 'Mostaza', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Mostaza', 365, '2026-02-01 22:22:03'),
(70, 'Jengibre', 'vegetal', 'g', 'https://placehold.co/100x100?text=Jengibre', 30, '2026-02-01 22:22:03'),
(71, 'Cúrcuma', 'condimento', 'cucharada pequeña', 'https://placehold.co/100x100?text=Curcuma', 730, '2026-02-01 22:22:03'),
(72, 'Carne para Bistec', 'proteína', 'unidad', 'https://placehold.co/100x100?text=Bistec', 4, '2026-02-01 22:22:03'),
(73, 'Repollo', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Repollo', 14, '2026-02-01 22:22:03'),
(74, 'Maíz Dulce (Lata)', 'vegetal', 'unidad', 'https://placehold.co/100x100?text=Maiz', 730, '2026-02-01 22:22:03'),
(75, 'Vino Blanco', 'bebida', 'ml', 'https://placehold.co/100x100?text=Vino', 365, '2026-02-01 22:22:03'),
(76, 'Caldo de Pollo', 'condimento', 'ml', 'https://placehold.co/100x100?text=Caldo', 180, '2026-02-01 22:22:03'),
(77, 'Salsa BBQ', 'condimento', 'cucharada grande', 'https://placehold.co/100x100?text=BBQ', 180, '2026-02-01 22:22:03'),
(78, 'Costillas de Cerdo', 'proteína', 'g', 'https://placehold.co/100x100?text=Costillas', 4, '2026-02-01 22:22:03'),
(79, 'Galletas María', 'grano', 'unidad', 'https://placehold.co/100x100?text=Galletas', 180, '2026-02-01 22:22:03'),
(80, 'Leche Condensada', 'lácteo', 'ml', 'https://placehold.co/100x100?text=Condensada', 365, '2026-02-01 22:22:03'),
(81, 'Fettuccine', '', 'g', 'https://placehold.co/100x100?text=Fet', 365, '2026-02-01 23:21:04'),
(82, 'Crema', 'lácteo', 'ml', 'https://placehold.co/100x100?text=Cre', 7, '2026-02-01 23:21:04'),
(83, 'Parmesano', '', 'g', 'https://placehold.co/100x100?text=Par', 180, '2026-02-01 23:25:36'),
(84, 'Salsa de tomate', '', 'ml', 'https://placehold.co/100x100?text=Sal', 30, '2026-02-01 23:29:02'),
(85, 'Pollo', '', '', 'https://placehold.co/100x100?text=Pol', 3, '2026-02-01 23:29:02'),
(86, 'Albahaca', '', '', 'https://placehold.co/100x100?text=Alb', 7, '2026-02-01 23:29:02'),
(87, 'Tomates cherry', '', 'g', 'https://placehold.co/100x100?text=Tom', 5, '2026-02-01 23:29:02'),
(88, 'Queso ricotta', '', 'g', 'https://placehold.co/100x100?text=Que', 7, '2026-02-01 23:32:10'),
(89, 'Trufa negra', '', 'g', 'https://placehold.co/100x100?text=Tru', 7, '2026-02-01 23:32:10'),
(90, 'Vino blanco seco', '', 'ml', 'https://placehold.co/100x100?text=Vin', 365, '2026-02-01 23:32:10'),
(91, 'Filete de ternera', '', 'g', 'https://placehold.co/100x100?text=Fil', 3, '2026-02-01 23:35:58'),
(92, 'Trufa fresca', '', 'g', 'https://placehold.co/100x100?text=Tru', 7, '2026-02-01 23:35:58'),
(93, 'Foie gras', '', 'g', 'https://placehold.co/100x100?text=Foi', 10, '2026-02-01 23:35:58'),
(94, 'Setas silvestres', '', 'g', 'https://placehold.co/100x100?text=Set', 3, '2026-02-01 23:35:58'),
(95, 'Puré de patatas', '', 'g', 'https://placehold.co/100x100?text=Pur', 2, '2026-02-01 23:35:58'),
(96, 'Aceite de trufa', '', 'ml', 'https://placehold.co/100x100?text=Ace', 365, '2026-02-01 23:35:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `family_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `expiration_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `family_id`, `ingredient_id`, `quantity`, `expiration_date`, `created_at`) VALUES
(0, 1, 9, 2, '2031-03-06', '2026-02-03 22:44:32'),
(0, 1, 2, 2000, '2031-03-06', '2026-02-03 22:45:41'),
(0, 1, 85, 2, '2026-02-07', '2026-02-03 22:48:08');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu_plans`
--

CREATE TABLE `menu_plans` (
  `menu_plan_id` int(11) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recipes`
--

CREATE TABLE `recipes` (
  `recipe_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `instructions` text NOT NULL,
  `difficulty` enum('easy','regular','hard','') NOT NULL,
  `preparation_time` int(11) NOT NULL,
  `servings` int(11) NOT NULL DEFAULT 1,
  `image_url` text NOT NULL,
  `calories_per_serving` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `family_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recipes`
--

INSERT INTO `recipes` (`recipe_id`, `title`, `description`, `instructions`, `difficulty`, `preparation_time`, `servings`, `image_url`, `calories_per_serving`, `created_by`, `family_id`, `created_at`) VALUES
(1, 'Arroz con Pollo Casero', 'Un clásico almuerzo familiar nutritivo y fácil de hacer.', '1. Cortar el pollo en trozos. 2. Sofreír cebolla y ajo en aceite. 3. Agregar el pollo y dorar. 4. Añadir el arroz y agua. 5. Cocinar hasta que el arroz esté listo.', 'regular', 45, 4, 'https://placehold.co/600x400?text=Arroz+con+Pollo', 550, 1, 1, '2026-02-01 22:17:00'),
(2, 'Espagueti a la Boloñesa', 'Pasta italiana con salsa de carne y tomate.', '1. Cocer la pasta. 2. En una sartén, sofreír cebolla, ajo y zanahoria picada. 3. Agregar carne molida. 4. Añadir tomates triturados y cocinar a fuego lento. 5. Servir sobre la pasta con queso.', 'regular', 30, 4, 'https://placehold.co/600x400?text=Boloñesa', 600, 1, 1, '2026-02-01 22:17:00'),
(3, 'Huevos Revueltos con Tostadas', 'Desayuno rápido y lleno de energía.', '1. Batir los huevos con un poco de leche y sal. 2. Cocinar en sartén con un poco de aceite. 3. Servir acompañado de pan tostado.', 'easy', 10, 2, 'https://placehold.co/600x400?text=Huevos', 300, 1, 1, '2026-02-01 22:17:00'),
(4, 'Sándwich Mixto', 'Cena ligera o merienda rápida.', '1. Tomar dos rebanadas de pan. 2. Colocar jamón y queso. 3. Calentar en sartén o tostadora hasta que el queso derrita.', 'easy', 5, 1, 'https://placehold.co/600x400?text=Sandwich', 250, 1, 1, '2026-02-01 22:17:00'),
(5, 'Avena con Frutas', 'Desayuno saludable y rico en fibra.', '1. Cocinar la avena con leche. 2. Servir en un tazón. 3. Picar manzana y plátano y colocar encima.', 'easy', 10, 1, 'https://placehold.co/600x400?text=Avena', 200, 1, 1, '2026-02-01 22:17:00'),
(6, 'Ensalada de Atún Fresca', 'Cena rápida y ligera, ideal para verano.', '1. Escurrir el atún. 2. Picar lechuga, tomate, cebolla y pepino. 3. Mezclar todo en un bol con mayonesa, sal y limón.', 'easy', 15, 2, 'https://placehold.co/600x400?text=Ensalada+Atun', 320, 1, 1, '2026-02-01 22:19:22'),
(7, 'Chuletas con Puré Rústico', 'Un plato fuerte y reconfortante.', '1. Cocer las papas y hacerlas puré con mantequilla y leche. 2. Salpimentar las chuletas y freírlas hasta dorar. 3. Servir caliente.', 'regular', 40, 2, 'https://placehold.co/600x400?text=Chuletas', 650, 1, 1, '2026-02-01 22:19:22'),
(8, 'Guiso de Lentejas Casero', 'Alto en hierro y proteína vegetal.', '1. Sofreír cebolla, ajo y zanahoria. 2. Agregar las lentejas y agua/caldo. 3. Cocinar por 40 min. 4. Sazonar con sal y comino.', 'regular', 50, 4, 'https://placehold.co/600x400?text=Lentejas', 400, 1, 1, '2026-02-01 22:19:22'),
(9, 'Tacos de Pollo y Aguacate', 'Comida divertida para compartir.', '1. Cortar pollo en tiras y saltear. 2. Calentar tortillas. 3. Armar tacos con pollo, aguacate picado y un toque de limón.', 'easy', 20, 3, 'https://placehold.co/600x400?text=Tacos', 450, 1, 1, '2026-02-01 22:19:22'),
(10, 'Salmón al Horno con Limón', 'Plato saludable y elegante.', '1. Colocar el salmón en bandeja. 2. Rociar con aceite, limón, ajo y sal. 3. Hornear 15-20 min a 180°C.', 'regular', 25, 2, 'https://placehold.co/600x400?text=Salmon', 380, 1, 1, '2026-02-01 22:19:22'),
(11, 'Tortilla de Espinaca', 'Desayuno o cena vegetariana.', '1. Saltear espinaca con cebolla. 2. Batir huevos y mezclar con la espinaca. 3. Cuajar en sartén por ambos lados.', 'easy', 15, 2, 'https://placehold.co/600x400?text=Tortilla', 280, 1, 1, '2026-02-01 22:19:22'),
(12, 'Panqueques Esponjosos', 'El desayuno favorito del domingo.', '1. Mezclar harina, leche, huevo, azúcar y polvo de hornear. 2. Cocinar porciones en sartén con mantequilla. 3. Servir con miel o frutas.', 'regular', 20, 4, 'https://placehold.co/600x400?text=Panqueques', 350, 1, 1, '2026-02-01 22:19:22'),
(13, 'Pollo Salteado con Verduras', 'Estilo asiático, rápido y sano.', '1. Cortar pollo y verduras (pimiento, brócoli, cebolla). 2. Saltear a fuego alto en wok. 3. Agregar salsa de soja al final.', 'regular', 20, 3, 'https://placehold.co/600x400?text=StirFry', 300, 1, 1, '2026-02-01 22:19:22'),
(14, 'Crema de Calabacín', 'Entrante suave o cena ligera.', '1. Sofreír cebolla y calabacín troceado. 2. Cubrir con agua y cocer. 3. Licuar con un poco de leche o queso.', 'easy', 30, 4, 'https://placehold.co/600x400?text=Crema', 180, 1, 1, '2026-02-01 22:19:22'),
(15, 'Batido Energético', 'Snack o desayuno express.', '1. Licuar leche, plátano, fresas y un poco de avena. 2. Servir frío.', 'easy', 5, 1, 'https://placehold.co/600x400?text=Batido', 220, 1, 1, '2026-02-01 22:19:22'),
(16, 'Pasta Carbonara', 'Clásica receta italiana con huevo y tocino.', '1. Cocer pasta. 2. Dorar tocino. 3. Mezclar huevo y queso aparte. 4. Unir todo fuera del fuego para crear la crema.', 'regular', 20, 4, 'https://placehold.co/600x400?text=Carbonara', 550, 1, 1, '2026-02-01 22:23:49'),
(17, 'Pizza Casera', 'Diversión para toda la familia.', '1. Hacer masa con harina y levadura. 2. Estirar y poner salsa de tomate, mozzarella y orégano. 3. Hornear 15 min.', 'regular', 60, 4, 'https://placehold.co/600x400?text=Pizza', 600, 1, 1, '2026-02-01 22:23:49'),
(18, 'Arroz Frito con Camarones', 'Almuerzo estilo oriental.', '1. Saltear camarones y reservar. 2. Freír arroz cocido con verduras, jengibre y soja. 3. Mezclar todo.', 'regular', 30, 3, 'https://placehold.co/600x400?text=Arroz+Chino', 450, 1, 1, '2026-02-01 22:23:49'),
(19, 'Bistec Encebollado', 'Carne jugosa con mucha sazón.', '1. Adobar bistec con ajo y sal. 2. Sofreír cebolla en juliana. 3. Cocinar carne y mezclar con cebolla.', 'easy', 20, 2, 'https://placehold.co/600x400?text=Bistec', 400, 1, 1, '2026-02-01 22:23:49'),
(20, 'Costillas BBQ al Horno', 'Cena de fin de semana.', '1. Marinar costillas con salsa BBQ. 2. Hornear cubiertas con aluminio por 1 hora. 3. Destapar y dorar.', 'hard', 90, 4, 'https://placehold.co/600x400?text=Costillas', 700, 1, 1, '2026-02-01 22:23:49'),
(21, 'Ensalada Coleslaw', 'Acompañante crujiente y fresco.', '1. Rallar repollo y zanahoria. 2. Mezclar mayonesa, vinagre y un poco de azúcar. 3. Unir todo.', 'easy', 15, 4, 'https://placehold.co/600x400?text=Coleslaw', 150, 1, 1, '2026-02-01 22:23:49'),
(22, 'Pollo al Curry', 'Sabores intensos y cremosos.', '1. Sofreír pollo con cebolla. 2. Agregar cúrcuma, comino y jengibre. 3. Añadir crema de leche y cocinar.', 'regular', 30, 4, 'https://placehold.co/600x400?text=Curry', 500, 1, 1, '2026-02-01 22:23:49'),
(23, 'Sopa de Pollo para el Alma', 'Ideal para días fríos.', '1. Hervir agua con pollo, papas, zanahorias y fideos. 2. Sazonar con caldo y perejil.', 'easy', 45, 4, 'https://placehold.co/600x400?text=Sopa', 250, 1, 1, '2026-02-01 22:23:49'),
(24, 'Tostadas Francesas', 'Desayuno dulce especial.', '1. Batir huevo, leche, vainilla y azúcar. 2. Remojar pan y dorar en mantequilla. 3. Servir con miel.', 'easy', 15, 2, 'https://placehold.co/600x400?text=FrenchToast', 350, 1, 1, '2026-02-01 22:23:49'),
(25, 'Brochetas de Frutas', 'Snack saludable para niños.', '1. Cortar piña, uvas, fresas y plátano. 2. Insertar en palillos. 3. Bañar con un poco de chocolate (opcional).', 'easy', 10, 4, 'https://placehold.co/600x400?text=Brochetas', 100, 1, 1, '2026-02-01 22:23:49'),
(26, 'Macarrones con Queso', 'Favorito de los niños.', '1. Cocer pasta. 2. Hacer salsa con mantequilla, leche y cheddar. 3. Mezclar hasta espesar.', 'easy', 20, 3, 'https://placehold.co/600x400?text=MacAndCheese', 480, 1, 1, '2026-02-01 22:23:49'),
(27, 'Ceviche de Camarón', 'Fresco y cítrico.', '1. Cocer camarones. 2. Mezclar con mucho limón, cebolla picada, tomate y cilantro. 3. Servir frío con galletas.', 'regular', 30, 3, 'https://placehold.co/600x400?text=Ceviche', 200, 1, 1, '2026-02-01 22:23:49'),
(28, 'Brownies Caseros', 'Postre irresistible.', '1. Derretir mantequilla y chocolate. 2. Mezclar con azúcar, huevos y harina. 3. Hornear 25 min.', 'regular', 40, 8, 'https://placehold.co/600x400?text=Brownies', 350, 1, 1, '2026-02-01 22:23:49'),
(29, 'Omelet de Vegetales', 'Desayuno completo.', '1. Batir huevos. 2. Picar espinaca, tomate y champiñones. 3. Cocinar en sartén y doblar.', 'easy', 10, 1, 'https://placehold.co/600x400?text=Omelet', 220, 1, 1, '2026-02-01 22:23:49'),
(30, 'Lasaña de Carne', 'El plato estrella familiar.', '1. Hacer salsa de carne (boloñesa) y salsa blanca (bechamel). 2. Armar capas con pasta. 3. Cubrir con queso y hornear.', 'hard', 90, 6, 'https://placehold.co/600x400?text=Lasaña', 650, 1, 1, '2026-02-01 22:23:49'),
(31, 'Smoothie Tropical', 'Bebida refrescante.', '1. Licuar piña, coco, leche y hielo. 2. Servir inmediatamente.', 'easy', 5, 2, 'https://placehold.co/600x400?text=Smoothie', 180, 1, 1, '2026-02-01 22:23:49'),
(32, 'Hamburguesas Caseras', 'Mejor que comida rápida.', '1. Sazonar carne molida y formar discos. 2. Asar en plancha. 3. Armar con pan, queso, lechuga y tomate.', 'regular', 30, 4, 'https://placehold.co/600x400?text=Hamburguesa', 550, 1, 1, '2026-02-01 22:23:49'),
(33, 'Arroz con Leche', 'Postre tradicional.', '1. Cocer arroz con agua y canela. 2. Agregar leche y azúcar. 3. Cocinar lento hasta espesar.', 'regular', 40, 4, 'https://placehold.co/600x400?text=ArrozLeche', 300, 1, 1, '2026-02-01 22:23:49'),
(34, 'Burritos de Frijoles', 'Cena rápida mexicana.', '1. Calentar frijoles y queso. 2. Rellenar tortillas. 3. Enrollar y dorar un poco.', 'easy', 15, 2, 'https://placehold.co/600x400?text=Burritos', 400, 1, 1, '2026-02-01 22:23:49'),
(35, 'Papas al Horno Rellenas', 'Guarnición o plato fuerte.', '1. Hornear papas enteras. 2. Abrir y rellenar con mantequilla, tocino y queso. 3. Gratinar.', 'regular', 60, 4, 'https://placehold.co/600x400?text=PapasRellenas', 450, 1, 1, '2026-02-01 22:23:49'),
(36, 'Pollo a la Plancha con Ensalada', 'La opción fit.', '1. Sazonar pechuga y asar. 2. Acompañar de lechuga, tomate y aguacate.', 'easy', 20, 1, 'https://placehold.co/600x400?text=PolloFit', 300, 1, 1, '2026-02-01 22:23:49'),
(37, 'Quesadillas de Jamón', 'Merienda instantánea.', '1. Poner queso y jamón en tortilla. 2. Doblar y calentar hasta fundir.', 'easy', 5, 1, 'https://placehold.co/600x400?text=Quesadilla', 250, 1, 1, '2026-02-01 22:23:49'),
(38, 'Pastel de Chocolate (Mug Cake)', 'Postre individual en microondas.', '1. Mezclar harina, cacao, azúcar, leche y aceite en una taza. 2. Microondas 2 min.', 'easy', 5, 1, 'https://placehold.co/600x400?text=MugCake', 300, 1, 1, '2026-02-01 22:23:49'),
(39, 'Chili con Carne', 'Plato picante y sabroso.', '1. Sofreír carne, cebolla y pimiento. 2. Agregar frijoles, tomate y chile en polvo. 3. Cocinar lento.', 'regular', 45, 4, 'https://placehold.co/600x400?text=Chili', 450, 1, 1, '2026-02-01 22:23:49'),
(40, 'Pie de Limón Frío', 'Postre sin horno.', '1. Base de galletas trituradas con mantequilla. 2. Relleno de leche condensada y jugo de limón. 3. Refrigerar.', 'regular', 30, 6, 'https://placehold.co/600x400?text=PieLimon', 400, 1, 1, '2026-02-01 22:23:49'),
(41, 'Fettuccine con Salsa de Champiñones y Queso Parmesano', 'Un plato clásico italiano para una cena romántica inolvidable', 'Paso 1: Cocinar los fettuccine según las instrucciones del paquete. Paso 2: Saltear los champiñones en mantequilla hasta que estén dorados. Paso 3: Mezclar la crema y el queso parmesano con los champiñones. Paso 4: Combinar la salsa con los fettuccine cocidos y servir', '', 40, 2, 'https://placehold.co/600x400?text=Receta+Groq', 650, 1, 1, '2026-02-01 23:21:04'),
(42, 'Fettuccine con salsa de champiñones y parmesano', 'Un plato clásico italiano para una cena romántica', 'Paso 1: Cocinar los fettuccine según las instrucciones del paquete. Paso 2: En una sartén, saltear los champiñones con ajo y perejil. Paso 3: Agregar la crema y el parmesano, revolviendo hasta que esté suave y cremoso. Paso 4: Combinar la salsa con los fettuccine cocidos y servir inmediatamente.', '', 40, 2, 'https://placehold.co/600x400?text=Receta+Groq', 650, 1, 1, '2026-02-01 23:25:36'),
(43, 'Cena Romántica Italiana', 'Una cena romántica italiana con platos clásicos y sabores auténticos', 'Precalienta el horno a 180°C. Prepara la salsa de tomate con ajo y albahaca. Cocina los fettuccine al dente y mezcla con la salsa. Prepara el pollo a la parmesana con queso mozzarella y salsa de tomate. Sirve con una ensalada caprese y un vino tinto', '', 45, 2, 'https://placehold.co/600x400?text=Receta+IA', 700, 1, 1, '2026-02-01 23:29:01'),
(44, 'Tortellini de Queso con Salsa de Trufa y Vino Blanco', 'Un plato de pasta delicado y elegante, relleno de queso fresco y envuelto en una salsa de trufa y vino blanco que evoca la esencia de la cocina italiana.', 'Paso 1: Preparar la masa para los tortellini. Paso 2: Rellenar los tortellini con queso fresco. Paso 3: Cocinar los tortellini en agua hirviendo. Paso 4: Preparar la salsa de trufa con vino blanco y mantequilla. Paso 5: Servir los tortellini con la salsa de trufa.', '', 60, 2, 'https://placehold.co/600x400?text=Receta+Chef', 550, 1, 1, '2026-02-01 23:32:10'),
(45, 'Tournedos Rossini con Trufa', 'Un filete de ternera tierno y jugoso, cubierto con una rica salsa de trufa y foie gras, acompañado de setas silvestres y servido con puré de patatas trufado.', 'Paso 1: Precalienta el horno a 200°C. Paso 2: Sazona los filetes de ternera con sal y pimienta. Paso 3: Dora los filetes en una sartén con aceite de oliva y luego hornea durante 10 minutos. Paso 4: Prepara la salsa de trufa calentando mantequilla y aceite de trufa en una sartén, luego agrega las setas silvestres y cocina hasta que estén suaves. Paso 5: Sirve los filetes con la salsa de trufa, foie gras y puré de patatas trufado.', '', 60, 2, 'https://placehold.co/600x400?text=Receta+Chef', 800, 1, 1, '2026-02-01 23:35:58'),
(46, 'Papas Rellenas de Pollo y Cebolla', 'Un plato delicioso y nutritivo que combina la suavidad de las papas con el sabor intenso del pollo y la cebolla.', '1. Cocinar las papas hasta que estén suaves. 2. Mientras tanto, cocinar el pollo con la cebolla picada hasta que estén dorados. 3. Vaciar las papas y rellenarlas con la mezcla de pollo y cebolla. 4. Hornear hasta que estén doradas.', '', 30, 2, 'placeholder', 500, 1, 1, '2026-02-01 23:47:31'),
(47, 'Ensalada de Pollo', 'Una ensalada fresca y saludable con pollo a la parrilla', 'Cocinar el pollo a la parrilla, mezclar con lechuga, tomate, pepino y zanahoria. Aderezar con aceite de oliva y vinagre', '', 30, 2, 'placeholder', 350, 1, 1, '2026-02-03 22:34:13'),
(48, 'Arroz a la Cubana', 'Un plato sencillo y sabroso que combina arroz con huevo y verduras', 'Paso 1: Cocinar el arroz según las instrucciones del paquete. Paso 2: Picar la cebolla y el tomate, y sofreírlos en aceite hasta que estén tiernos. Paso 3: Batir los huevos y agregarlos al sofrito, revolviendo constantemente hasta que estén cocidos. Paso 4: Mezclar el arroz cocido con el sofrito de huevo y verduras, y sazonar con sal y especias al gusto.', '', 30, 2, 'placeholder', 400, 1, 1, '2026-02-03 22:50:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recipe_ingredients`
--

CREATE TABLE `recipe_ingredients` (
  `recipe_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` int(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recipe_ingredients`
--

INSERT INTO `recipe_ingredients` (`recipe_id`, `ingredient_id`, `quantity`) VALUES
(1, 1, 500),
(1, 2, 400),
(1, 7, 1),
(1, 8, 2),
(1, 9, 2),
(1, 10, 1),
(2, 3, 500),
(2, 6, 4),
(2, 7, 1),
(2, 12, 400),
(2, 13, 1),
(2, 15, 50),
(3, 4, 4),
(3, 5, 50),
(3, 9, 1),
(3, 16, 4),
(4, 15, 20),
(4, 16, 2),
(4, 17, 50),
(5, 5, 200),
(5, 18, 1),
(5, 19, 60),
(5, 20, 1),
(6, 6, 2),
(6, 7, 1),
(6, 22, 2),
(6, 28, 1),
(6, 39, 1),
(6, 44, 2),
(7, 5, 100),
(7, 10, 1),
(7, 14, 4),
(7, 33, 30),
(7, 37, 2),
(8, 6, 2),
(8, 7, 1),
(8, 8, 2),
(8, 9, 2),
(8, 13, 2),
(8, 23, 400),
(9, 1, 400),
(9, 10, 1),
(9, 28, 1),
(9, 29, 2),
(9, 30, 6),
(10, 8, 2),
(10, 9, 2),
(10, 21, 400),
(10, 28, 1),
(10, 48, 1),
(11, 4, 4),
(11, 7, 1),
(11, 9, 1),
(11, 10, 1),
(11, 25, 200),
(12, 4, 2),
(12, 5, 300),
(12, 31, 250),
(12, 32, 50),
(12, 33, 20),
(12, 50, 1),
(13, 1, 500),
(13, 7, 1),
(13, 26, 1),
(13, 27, 1),
(13, 36, 50),
(14, 5, 100),
(14, 7, 1),
(14, 9, 2),
(14, 10, 1),
(14, 42, 3),
(15, 5, 250),
(15, 19, 20),
(15, 20, 1),
(15, 47, 100),
(16, 3, 400),
(16, 4, 3),
(16, 11, 1),
(16, 15, 100),
(16, 52, 150),
(17, 31, 300),
(17, 48, 1),
(17, 55, 150),
(17, 65, 1),
(17, 66, 200),
(18, 2, 300),
(18, 9, 2),
(18, 36, 30),
(18, 51, 200),
(18, 70, 10),
(19, 7, 2),
(19, 8, 2),
(19, 9, 2),
(19, 10, 1),
(19, 72, 2),
(20, 10, 1),
(20, 77, 5),
(20, 78, 1000),
(21, 13, 2),
(21, 32, 5),
(21, 40, 10),
(21, 44, 3),
(21, 73, 1),
(22, 1, 500),
(22, 7, 1),
(22, 53, 200),
(22, 57, 1),
(22, 71, 1),
(23, 1, 300),
(23, 3, 50),
(23, 13, 2),
(23, 14, 2),
(23, 76, 500),
(24, 4, 2),
(24, 5, 50),
(24, 16, 4),
(24, 45, 2),
(24, 59, 1),
(25, 20, 2),
(25, 47, 100),
(25, 62, 100),
(25, 63, 1),
(26, 3, 300),
(26, 5, 100),
(26, 33, 30),
(26, 67, 200),
(27, 6, 2),
(27, 7, 1),
(27, 28, 5),
(27, 51, 400),
(27, 79, 10),
(28, 4, 2),
(28, 31, 80),
(28, 32, 150),
(28, 33, 100),
(28, 60, 150),
(29, 4, 2),
(29, 9, 1),
(29, 25, 50),
(29, 41, 30),
(30, 3, 12),
(30, 5, 300),
(30, 12, 500),
(30, 55, 400),
(30, 66, 200),
(31, 5, 200),
(31, 63, 1),
(31, 64, 20),
(32, 6, 1),
(32, 12, 500),
(32, 16, 4),
(32, 39, 1),
(32, 67, 4),
(33, 2, 100),
(33, 5, 500),
(33, 32, 100),
(33, 80, 50),
(34, 30, 2),
(34, 49, 100),
(34, 67, 50),
(35, 14, 4),
(35, 33, 20),
(35, 52, 50),
(35, 67, 50),
(36, 1, 200),
(36, 6, 1),
(36, 29, 1),
(36, 39, 1),
(37, 17, 30),
(37, 30, 2),
(37, 66, 30),
(38, 5, 20),
(38, 31, 30),
(38, 32, 10),
(38, 60, 10),
(39, 12, 400),
(39, 49, 200),
(39, 55, 200),
(39, 58, 2),
(40, 28, 3),
(40, 33, 50),
(40, 79, 20),
(40, 80, 200),
(41, 15, 100),
(41, 33, 50),
(41, 41, 200),
(41, 81, 250),
(41, 82, 150),
(42, 8, 2),
(42, 41, 200),
(42, 68, 1),
(42, 81, 250),
(42, 82, 150),
(42, 83, 100),
(43, 9, 50),
(43, 15, 100),
(43, 66, 200),
(43, 81, 250),
(43, 84, 500),
(43, 85, 2),
(43, 86, 1),
(43, 87, 200),
(44, 4, 2),
(44, 31, 500),
(44, 33, 50),
(44, 88, 250),
(44, 89, 10),
(44, 90, 100),
(45, 9, 20),
(45, 33, 50),
(45, 91, 200),
(45, 92, 20),
(45, 93, 100),
(45, 94, 150),
(45, 95, 200),
(45, 96, 10),
(46, 7, 1),
(46, 9, 2),
(46, 10, 1),
(46, 85, 1),
(47, 1, 2),
(47, 6, 2),
(47, 9, 2),
(47, 13, 2),
(47, 35, 1),
(47, 39, 1),
(47, 40, 1),
(48, 4, 2),
(48, 6, 1),
(48, 7, 1),
(48, 10, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shopping_list`
--

CREATE TABLE `shopping_list` (
  `shopping_list_id` int(11) NOT NULL,
  `family_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pendiente','comprado') NOT NULL DEFAULT 'pendiente',
  `added_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`user_id`, `username`, `name`, `password`, `email`, `created_at`) VALUES
(1, 'soyrauw', 'rauw', '1234', 'xxtuningokxd@gmail.com', '2025-12-29 20:50:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_family`
--

CREATE TABLE `user_family` (
  `user_id` int(11) NOT NULL,
  `family_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `daily_meals`
--
ALTER TABLE `daily_meals`
  ADD PRIMARY KEY (`daily_meal_id`),
  ADD KEY `menu_plan_id` (`menu_plan_id`),
  ADD KEY `recipe_id` (`recipe_id`);

--
-- Indices de la tabla `families`
--
ALTER TABLE `families`
  ADD PRIMARY KEY (`family_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`ingredient_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `inventory`
--
ALTER TABLE `inventory`
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `family_id` (`family_id`);

--
-- Indices de la tabla `menu_plans`
--
ALTER TABLE `menu_plans`
  ADD PRIMARY KEY (`menu_plan_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`recipe_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `family_id` (`family_id`);

--
-- Indices de la tabla `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD PRIMARY KEY (`recipe_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indices de la tabla `shopping_list`
--
ALTER TABLE `shopping_list`
  ADD PRIMARY KEY (`shopping_list_id`),
  ADD KEY `family_id` (`family_id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `added_by` (`added_by`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `user_family`
--
ALTER TABLE `user_family`
  ADD PRIMARY KEY (`user_id`,`family_id`),
  ADD KEY `family_id` (`family_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `daily_meals`
--
ALTER TABLE `daily_meals`
  MODIFY `daily_meal_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `families`
--
ALTER TABLE `families`
  MODIFY `family_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `ingredient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT de la tabla `menu_plans`
--
ALTER TABLE `menu_plans`
  MODIFY `menu_plan_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recipes`
--
ALTER TABLE `recipes`
  MODIFY `recipe_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `shopping_list`
--
ALTER TABLE `shopping_list`
  MODIFY `shopping_list_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `daily_meals`
--
ALTER TABLE `daily_meals`
  ADD CONSTRAINT `daily_meals_ibfk_1` FOREIGN KEY (`menu_plan_id`) REFERENCES `menu_plans` (`menu_plan_id`),
  ADD CONSTRAINT `daily_meals_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`);

--
-- Filtros para la tabla `families`
--
ALTER TABLE `families`
  ADD CONSTRAINT `families_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Filtros para la tabla `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`);

--
-- Filtros para la tabla `menu_plans`
--
ALTER TABLE `menu_plans`
  ADD CONSTRAINT `menu_plans_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Filtros para la tabla `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`);

--
-- Filtros para la tabla `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD CONSTRAINT `recipe_ingredients_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recipe_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `shopping_list`
--
ALTER TABLE `shopping_list`
  ADD CONSTRAINT `shopping_list_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shopping_list_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shopping_list_ibfk_3` FOREIGN KEY (`added_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_family`
--
ALTER TABLE `user_family`
  ADD CONSTRAINT `user_family_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `user_family_ibfk_2` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

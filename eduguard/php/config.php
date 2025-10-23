<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'eduguard');
define('DB_USER', 'root');
define('DB_PASS', '');

// Función para obtener conexión PDO
function getConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch(PDOException $e) {
        die(json_encode([
            'success' => false,
            'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
        ]));
    }
}

// Headers para API
function setHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
?>
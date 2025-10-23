<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../vista/inicio.html');
    exit();
}

// Devolver datos del usuario
header('Content-Type: application/json');
echo json_encode([
    'authenticated' => true,
    'user' => [
        'id' => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'tipo' => $_SESSION['user_type']
    ]
]);
?>
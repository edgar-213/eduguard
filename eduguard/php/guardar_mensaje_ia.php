<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

require_once 'config.php';

try {
    $pdo = getConnection();
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $mensaje = trim($data['mensaje'] ?? '');
    $materia = trim($data['materia'] ?? '');
    $usuario_id = $_SESSION['user_id'];
    
    if (empty($mensaje)) {
        echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
        exit;
    }
    
    // Crear tabla si no existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mensajes_ia_historial (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            materia VARCHAR(100),
            mensaje TEXT NOT NULL,
            tipo VARCHAR(50) DEFAULT 'apoyo_emocional',
            fecha DATETIME NOT NULL,
            INDEX idx_usuario (usuario_id)
        )
    ");
    
    // Guardar historial
    $stmt = $pdo->prepare("
        INSERT INTO mensajes_ia_historial (usuario_id, materia, mensaje, tipo, fecha)
        VALUES (?, ?, ?, 'apoyo_emocional', NOW())
    ");
    $stmt->execute([$usuario_id, $materia, $mensaje]);
    
    // Crear notificación
    $titulo = "Mensaje de apoyo - " . $materia;
    $stmt = $pdo->prepare("
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leido, fecha)
        VALUES (?, 'mensaje_ia', ?, ?, 0, NOW())
    ");
    $stmt->execute([$usuario_id, $titulo, $mensaje]);
    
    echo json_encode(['success' => true, 'message' => 'Guardado']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
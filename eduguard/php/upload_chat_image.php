<?php
session_start();
require_once 'config.php';
setHeaders();

try {
    $profesor_id = $_SESSION['user_id'] ?? null;
    
    if (!$profesor_id) {
        throw new Exception('No hay sesión activa');
    }
    
    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No se subió ninguna imagen');
    }
    
    $grupo_id = $_POST['grupo_id'] ?? null;
    
    if (!$grupo_id) {
        throw new Exception('ID de grupo no especificado');
    }
    
    $pdo = getConnection();
    
    // Verificar que es miembro
    $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
    $stmt->execute([$grupo_id, $profesor_id]);
    
    if (!$stmt->fetch()) {
        throw new Exception('No eres miembro de este grupo');
    }
    
    $file = $_FILES['imagen'];
    
    // Validar tipo
    $allowed = ['jpg', 'jpeg', 'png', 'gif'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($ext, $allowed)) {
        throw new Exception('Solo se permiten imágenes JPG, PNG o GIF');
    }
    
    // Validar tamaño (máx 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('La imagen es demasiado grande (máx 5MB)');
    }
    
    // Crear carpeta si no existe
    $upload_dir = '../uploads/chat/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Generar nombre único
    $filename = uniqid() . '_' . time() . '.' . $ext;
    $filepath = $upload_dir . $filename;
    
    // Mover archivo
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Error al subir la imagen');
    }
    
    // Guardar mensaje con imagen
    $stmt = $pdo->prepare("
        INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje, imagen, tipo_mensaje)
        VALUES (?, ?, '📷 Imagen', ?, 'imagen')
    ");
    $stmt->execute([$grupo_id, $profesor_id, $filepath]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Imagen enviada',
        'ruta' => $filepath
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
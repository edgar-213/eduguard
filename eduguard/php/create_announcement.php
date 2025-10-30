<?php
require_once 'config.php';
setHeaders();

try {
    $pdo = getConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO noticias (titulo, descripcion, tipo, fecha, destacado, autor)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['titulo'],
        $data['descripcion'],
        $data['tipo'],
        $data['fecha'],
        $data['destacado'],
        $data['autor']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Anuncio publicado correctamente'
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
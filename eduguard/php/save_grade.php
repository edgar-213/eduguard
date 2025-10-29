<?php
require_once 'config.php';
setHeaders();

try {
    $pdo = getConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO notas (usuario_id, materia_id, nota, tipo, titulo, fecha)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['usuario_id'],
        $data['materia_id'],
        $data['nota'],
        $data['tipo'],
        $data['titulo'],
        $data['fecha']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Nota guardada correctamente'
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
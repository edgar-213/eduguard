<?php
require_once 'config.php';
setHeaders();

try {
    $pdo = getConnection();
    $stmt = $pdo->query("
        SELECT u.id, u.nombre, u.email, u.grado, u.seccion,
               AVG(n.nota) as promedio
        FROM usuarios u
        LEFT JOIN notas n ON u.id = n.usuario_id
        WHERE u.tipo_usuario = 'alumno'
        GROUP BY u.id
    ");
    $estudiantes = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'estudiantes' => $estudiantes
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
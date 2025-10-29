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
    $usuario_id = $_SESSION['user_id'];
    
    // ✅ SIN created_at, solo usando id y NOW() como timestamp
    $stmt = $pdo->prepare("
        SELECT 
            n.id, 
            n.nota, 
            m.nombre as materia, 
            n.materia_id,
            UNIX_TIMESTAMP(NOW()) as timestamp_nota
        FROM notas n
        INNER JOIN materias m ON n.materia_id = m.id
        WHERE n.usuario_id = ?
        ORDER BY n.id DESC
        LIMIT 1
    ");
    $stmt->execute([$usuario_id]);
    $ultima = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$ultima) {
        echo json_encode(['success' => false, 'message' => 'No hay notas registradas']);
        exit;
    }
    
    $nota_reciente = floatval($ultima['nota']);
    $materia = $ultima['materia'];
    $materia_id = $ultima['materia_id'];
    $timestamp = $ultima['timestamp_nota'];
    
    // Calcular promedio (excluyendo última nota)
    $stmt2 = $pdo->prepare("
        SELECT AVG(nota) as promedio
        FROM notas
        WHERE usuario_id = ? AND materia_id = ? AND id != ?
    ");
    $stmt2->execute([$usuario_id, $materia_id, $ultima['id']]);
    $resultado = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    $promedio_historico = $resultado['promedio'] ? floatval($resultado['promedio']) : $nota_reciente;
    
    // Lógica de tendencia mejorada
    $diferencia = $nota_reciente - $promedio_historico;
    
    if ($nota_reciente >= 14 && $diferencia >= -0.3) {
        $tendencia = 'subio';
    } elseif ($nota_reciente < 11) {
        $tendencia = 'bajo';
    } elseif ($diferencia < -0.5) {
        $tendencia = 'bajo';
    } elseif ($diferencia > 0.5) {
        $tendencia = 'subio';
    } else {
        $tendencia = 'estable';
    }
    
    // ✅ Hash único: combina id, materia y nota
    $hash = md5($ultima['id'] . '-' . $materia . '-' . $nota_reciente);
    
    echo json_encode([
        'success' => true,
        'materia' => $materia,
        'nota_reciente' => round($nota_reciente, 2),
        'promedio_historico' => round($promedio_historico, 2),
        'tendencia' => $tendencia,
        'nota_id' => $ultima['id'],
        'timestamp' => $timestamp,
        'hash' => $hash
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
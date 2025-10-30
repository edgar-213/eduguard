<?php
// Test de conexión a la base de datos
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'eduguard';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Probar consulta
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'OK',
        'message' => 'Conexión exitosa',
        'total_usuarios' => $result['total']
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'ERROR',
        'message' => $e->getMessage()
    ]);
}
?>
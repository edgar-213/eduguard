<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';
setHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log para debug
error_log("=== LOGIN REQUEST ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);

try {
    $pdo = getConnection();
    
    // Obtener datos JSON
    $json = file_get_contents('php://input');
    error_log("JSON recibido: " . $json);
    
    $data = json_decode($json, true);
    error_log("Data decodificado: " . print_r($data, true));
    
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $userType = $data['userType'] ?? 'alumno';
    
    error_log("Email: $email");
    error_log("UserType: $userType");
    error_log("Password length: " . strlen($password));
    
    if (empty($email) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Email y contraseña son obligatorios'
        ]);
        exit();
    }
    
    // Buscar usuario
    $stmt = $pdo->prepare("
        SELECT id, nombre, email, password, tipo_usuario, grado, seccion 
        FROM usuarios 
        WHERE email = ? AND tipo_usuario = ?
    ");
    $stmt->execute([$email, $userType]);
    $user = $stmt->fetch();
    
    error_log("Usuario encontrado: " . ($user ? "SI" : "NO"));
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario no encontrado con ese tipo de cuenta',
            'debug' => [
                'email_buscado' => $email,
                'tipo_buscado' => $userType
            ]
        ]);
        exit();
    }
    
    error_log("Hash en BD: " . substr($user['password'], 0, 20) . "...");
    
    // Verificar contraseña
    $passwordMatch = password_verify($password, $user['password']);
    error_log("Password verify result: " . ($passwordMatch ? "TRUE" : "FALSE"));
    
    if (!$passwordMatch) {
        echo json_encode([
            'success' => false,
            'message' => 'Contraseña incorrecta',
            'debug' => [
                'password_length' => strlen($password),
                'hash_prefix' => substr($user['password'], 0, 10)
            ]
        ]);
        exit();
    }
    
    // Crear sesión
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['nombre'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_type'] = $user['tipo_usuario'];
    $_SESSION['login_time'] = time();
    
    error_log("Sesión creada para user_id: " . $user['id']);
    
    // Actualizar último acceso
    $stmt = $pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    echo json_encode([
    'success' => true,
    'message' => '¡Bienvenido a EduGuard!',
    'redirect' => $user['tipo_usuario'] === 'profesor' 
        ? '../vista/profesor.html' 
        : '../vista/principal.html',  // ← AHORA REDIRIGE SEGÚN TIPO
    'user' => [
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'tipo' => $user['tipo_usuario']
    ]
]);
    
} catch(Exception $e) {
    error_log("ERROR en login: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
?>
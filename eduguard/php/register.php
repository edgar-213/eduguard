<?php
require_once 'config.php';
setHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = getConnection();
    
    // Obtener datos JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $userType = $data['userType'] ?? 'alumno';
    $code = trim($data['registrationCode'] ?? '');
    
    // Validaciones
    if (empty($name) || empty($email) || empty($password) || empty($code)) {
        echo json_encode([
            'success' => false,
            'message' => 'Todos los campos son obligatorios'
        ]);
        exit();
    }
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'El correo electrónico no es válido'
        ]);
        exit();
    }
    
    // Validar contraseña
    if (strlen($password) < 8) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 8 caracteres'
        ]);
        exit();
    }
    
    // Validar código (códigos de ejemplo)
    $validCodes = ['EDUGUARD2024', 'SANJOSE2024', 'ALUMNO123', 'PROFESOR123'];
    if (!in_array(strtoupper($code), $validCodes)) {
        echo json_encode([
            'success' => false,
            'message' => 'Código de registro inválido. Usa: EDUGUARD2024, SANJOSE2024 o ALUMNO123'
        ]);
        exit();
    }
    
    // Verificar si el email ya existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Este correo ya está registrado'
        ]);
        exit();
    }
    
    // Hash de contraseña
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Insertar usuario
    $stmt = $pdo->prepare("
        INSERT INTO usuarios (nombre, email, password, tipo_usuario, fecha_registro) 
        VALUES (?, ?, ?, ?, NOW())
    ");
    
    if ($stmt->execute([$name, $email, $hashedPassword, $userType])) {
        echo json_encode([
            'success' => true,
            'message' => '¡Cuenta creada exitosamente! Ya puedes iniciar sesión'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear la cuenta'
        ]);
    }
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
?>
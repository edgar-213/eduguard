<?php
require_once 'config.php';

// DATOS DEL USUARIO QUE QUIERES CREAR
$nombre = 'Test User';
$email = 'demo@eduguard.com';
$password_plain = 'demo123456';
$tipo = 'alumno';

try {
    $pdo = getConnection();
    
    // Generar hash de la contraseña
    $password_hash = password_hash($password_plain, PASSWORD_BCRYPT);
    
    echo "<h2>Creando usuario...</h2>";
    echo "<p><strong>Email:</strong> $email</p>";
    echo "<p><strong>Contraseña:</strong> $password_plain</p>";
    echo "<p><strong>Hash generado:</strong> " . substr($password_hash, 0, 50) . "...</p>";
    
    // Verificar si existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo "<p style='color: orange;'>⚠️ El usuario ya existe. Actualizando...</p>";
        $stmt = $pdo->prepare("UPDATE usuarios SET password = ?, nombre = ? WHERE email = ?");
        $stmt->execute([$password_hash, $nombre, $email]);
    } else {
        echo "<p style='color: blue;'>➕ Creando nuevo usuario...</p>";
        $stmt = $pdo->prepare("
            INSERT INTO usuarios (nombre, email, password, tipo_usuario, fecha_registro) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$nombre, $email, $password_hash, $tipo]);
    }
    
    echo "<h3 style='color: green;'>✅ Usuario creado/actualizado exitosamente!</h3>";
    echo "<hr>";
    echo "<h4>Ahora puedes iniciar sesión con:</h4>";
    echo "<ul>";
    echo "<li><strong>Email:</strong> $email</li>";
    echo "<li><strong>Contraseña:</strong> $password_plain</li>";
    echo "</ul>";
    
    // Verificar que funciona
    echo "<hr>";
    echo "<h4>Verificando contraseña...</h4>";
    
    $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (password_verify($password_plain, $user['password'])) {
        echo "<p style='color: green;'>✅ La contraseña se verificó correctamente!</p>";
    } else {
        echo "<p style='color: red;'>❌ Error: La contraseña NO coincide</p>";
    }
    
} catch(Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
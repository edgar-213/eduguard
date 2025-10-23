<?php
session_start();
require_once 'config.php';
setHeaders();

// Obtener acción solicitada
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Verificar sesión para acciones que lo requieren
$requireAuth = ['user', 'activities', 'subjects', 'calendar', 'groups', 'news', 'notifications', 'chat', 'stats', 'send_chat'];
if (in_array($action, $requireAuth) && !isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

try {
    $pdo = getConnection();
    
    switch($action) {
        
        // ========== USUARIO ==========
        case 'user':
            $stmt = $pdo->prepare("
                SELECT id, nombre, email, tipo_usuario, grado, seccion, telefono, bio, 
                       foto, puntuacion, nivel, racha, horas_estudio
                FROM usuarios WHERE id = ?
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
            break;
            
        // ========== ACTIVIDADES ==========
        case 'activities':
            $stmt = $pdo->prepare("
                SELECT id, tipo, titulo, materia, duracion, resultado, icono, 
                       CASE 
                           WHEN DATE(fecha) = CURDATE() THEN CONCAT('Hoy ', TIME_FORMAT(fecha, '%H:%i'))
                           WHEN DATE(fecha) = CURDATE() - INTERVAL 1 DAY THEN CONCAT('Ayer ', TIME_FORMAT(fecha, '%H:%i'))
                           ELSE DATE_FORMAT(fecha, '%d/%m %H:%i')
                       END as fecha
                FROM actividades 
                WHERE usuario_id = ?
                ORDER BY fecha DESC
                LIMIT 20
            ");
            $stmt->execute([$_SESSION['user_id']]);
            
            echo json_encode([
                'success' => true,
                'actividades' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== MATERIAS ==========
        case 'subjects':
            $stmt = $pdo->prepare("
                SELECT 
                    m.id, m.nombre, m.profesor, m.color,
                    COUNT(n.id) as notas,
                    COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
                FROM materias m
                LEFT JOIN notas n ON m.id = n.materia_id AND n.usuario_id = ?
                GROUP BY m.id
                ORDER BY m.nombre
            ");
            $stmt->execute([$_SESSION['user_id']]);
            
            echo json_encode([
                'success' => true,
                'materias' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== CALENDARIO ==========
        case 'calendar':
            $stmt = $pdo->prepare("
                SELECT id, titulo, fecha, hora, tipo, materia, profesor, aula, descripcion
                FROM calendario_eventos
                WHERE fecha >= CURDATE()
                ORDER BY fecha ASC, hora ASC
                LIMIT 10
            ");
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'eventos' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== GRUPOS ==========
        case 'groups':
            $stmt = $pdo->prepare("
                SELECT 
                    g.id,
                    g.nombre,
                    g.descripcion,
                    u.nombre as admin,
                    COUNT(DISTINCT gm.usuario_id) as miembros,
                    COUNT(DISTINCT gme.id) as mensajes,
                    (SELECT mensaje 
                     FROM grupo_mensajes 
                     WHERE grupo_id = g.id 
                     ORDER BY fecha DESC 
                     LIMIT 1) as ultimo_mensaje,
                    (SELECT DATE_FORMAT(fecha, '%H:%i')
                     FROM grupo_mensajes 
                     WHERE grupo_id = g.id 
                     ORDER BY fecha DESC 
                     LIMIT 1) as tiempo
                FROM grupos g
                INNER JOIN usuarios u ON g.admin_id = u.id
                INNER JOIN grupo_miembros gm ON g.id = gm.grupo_id
                LEFT JOIN grupo_mensajes gme ON g.id = gme.grupo_id
                WHERE gm.usuario_id = ?
                GROUP BY g.id
                ORDER BY g.fecha_creacion DESC
            ");
            $stmt->execute([$_SESSION['user_id']]);
            
            echo json_encode([
                'success' => true,
                'grupos' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== NOTICIAS ==========
        case 'news':
            $stmt = $pdo->prepare("
                SELECT id, titulo, descripcion, autor, tipo, destacado, 
                       DATE_FORMAT(fecha, '%Y-%m-%d') as fecha
                FROM noticias
                ORDER BY fecha_publicacion DESC
                LIMIT 10
            ");
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'noticias' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== RECOMENDACIONES ==========
        case 'recommendations':
            $stmt = $pdo->prepare("
                SELECT id, mensaje, dirigido_a, autor, 
                       DATE_FORMAT(fecha, '%Y-%m-%d') as fecha
                FROM recomendaciones
                ORDER BY fecha_publicacion DESC
                LIMIT 5
            ");
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'recomendaciones' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== NOTIFICACIONES ==========
        case 'notifications':
            $stmt = $pdo->prepare("
                SELECT id, tipo, titulo, mensaje, leido, 
                       DATE_FORMAT(fecha, '%Y-%m-%d %H:%i') as fecha
                FROM notificaciones
                WHERE usuario_id = ?
                ORDER BY fecha DESC
                LIMIT 20
            ");
            $stmt->execute([$_SESSION['user_id']]);
            
            $notificaciones = $stmt->fetchAll();
            
            // Contar no leídas
            $stmtCount = $pdo->prepare("
                SELECT COUNT(*) as total 
                FROM notificaciones 
                WHERE usuario_id = ? AND leido = 0
            ");
            $stmtCount->execute([$_SESSION['user_id']]);
            $count = $stmtCount->fetch();
            
            echo json_encode([
                'success' => true,
                'notificaciones' => $notificaciones,
                'no_leidas' => (int)$count['total']
            ]);
            break;
            
        // ========== CHAT - OBTENER MENSAJES ==========
        case 'chat':
            $stmt = $pdo->prepare("
                SELECT id, sender, mensaje, 
                       DATE_FORMAT(fecha, '%H:%i') as time
                FROM chat_mensajes
                WHERE usuario_id = ?
                ORDER BY fecha ASC
            ");
            $stmt->execute([$_SESSION['user_id']]);
            
            echo json_encode([
                'success' => true,
                'mensajes' => $stmt->fetchAll()
            ]);
            break;
            
        // ========== CHAT - ENVIAR MENSAJE ==========
        case 'send_chat':
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $mensaje = $data['mensaje'] ?? '';
            
            if (empty($mensaje)) {
                echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
                exit();
            }
            
            // Guardar mensaje del usuario
            $stmt = $pdo->prepare("
                INSERT INTO chat_mensajes (usuario_id, sender, mensaje) 
                VALUES (?, 'user', ?)
            ");
            $stmt->execute([$_SESSION['user_id'], $mensaje]);
            
            // Simular respuesta IA (aquí conectarías tu API de Flowise)
            $respuestaIA = "Esta es una respuesta automática. Conecta tu API de Flowise para respuestas inteligentes.";
            
            $stmt = $pdo->prepare("
                INSERT INTO chat_mensajes (usuario_id, sender, mensaje) 
                VALUES (?, 'ia', ?)
            ");
            $stmt->execute([$_SESSION['user_id'], $respuestaIA]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Mensaje enviado'
            ]);
            break;
            
        // ========== ESTADÍSTICAS ==========
        case 'stats':
            // Estadísticas del mes actual
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(duracion), 0) as horas,
                    COUNT(*) as sesiones
                FROM sesiones_estudio
                WHERE usuario_id = ? 
                AND MONTH(fecha) = MONTH(CURDATE())
                AND YEAR(fecha) = YEAR(CURDATE())
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $current = $stmt->fetch();
            
            // Estadísticas del mes anterior
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(duracion), 0) as horas,
                    COUNT(*) as sesiones
                FROM sesiones_estudio
                WHERE usuario_id = ? 
                AND MONTH(fecha) = MONTH(CURDATE() - INTERVAL 1 MONTH)
                AND YEAR(fecha) = YEAR(CURDATE() - INTERVAL 1 MONTH)
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $previous = $stmt->fetch();
            
            // Contar temas únicos
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT materia) as topics
                FROM sesiones_estudio
                WHERE usuario_id = ?
                AND MONTH(fecha) = MONTH(CURDATE())
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $topics = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'stats' => [
                    'current' => [
                        'hours' => (int)$current['horas'],
                        'sessions' => (int)$current['sesiones'],
                        'topics' => (int)$topics['topics']
                    ],
                    'previous' => [
                        'hours' => (int)$previous['horas'],
                        'sessions' => (int)$previous['sesiones']
                    ]
                ]
            ]);
            break;
            
        // ========== CERRAR SESIÓN ==========
        case 'logout':
            session_destroy();
            echo json_encode([
                'success' => true,
                'message' => 'Sesión cerrada'
            ]);
            break;
            
            // ========== CREAR GRUPO ==========
        case 'create_group':
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $nombre = trim($data['nombre'] ?? '');
            $descripcion = trim($data['descripcion'] ?? '');
            
            if (empty($nombre)) {
                echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
                exit();
            }
            
            $stmt = $pdo->prepare("INSERT INTO grupos (nombre, admin_id, descripcion) VALUES (?, ?, ?)");
            $stmt->execute([$nombre, $_SESSION['user_id'], $descripcion]);
            $grupo_id = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("INSERT INTO grupo_miembros (grupo_id, usuario_id) VALUES (?, ?)");
            $stmt->execute([$grupo_id, $_SESSION['user_id']]);
            
            echo json_encode(['success' => true, 'message' => 'Grupo creado', 'grupo_id' => $grupo_id]);
            break;

        // ========== BUSCAR USUARIOS ==========
        case 'search_users':
            $search = $_GET['q'] ?? '';
            $stmt = $pdo->prepare("
                SELECT id, nombre, email, grado, seccion 
                FROM usuarios 
                WHERE (nombre LIKE ? OR email LIKE ?) 
                AND id != ? 
                AND tipo_usuario = 'alumno'
                LIMIT 10
            ");
            $stmt->execute(["%$search%", "%$search%", $_SESSION['user_id']]);
            echo json_encode(['success' => true, 'usuarios' => $stmt->fetchAll()]);
            break;

        // ========== AGREGAR MIEMBRO ==========
        case 'add_member':
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $grupo_id = $data['grupo_id'] ?? 0;
            $usuario_id = $data['usuario_id'] ?? 0;
            
            // Verificar que el usuario actual es admin
            $stmt = $pdo->prepare("SELECT admin_id FROM grupos WHERE id = ?");
            $stmt->execute([$grupo_id]);
            $grupo = $stmt->fetch();
            
            if ($grupo['admin_id'] != $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'No eres admin del grupo']);
                exit();
            }
            
            // Verificar si ya es miembro
            $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
            $stmt->execute([$grupo_id, $usuario_id]);
            
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Ya es miembro']);
                exit();
            }
            
            $stmt = $pdo->prepare("INSERT INTO grupo_miembros (grupo_id, usuario_id) VALUES (?, ?)");
            $stmt->execute([$grupo_id, $usuario_id]);
            
            echo json_encode(['success' => true, 'message' => 'Miembro agregado']);
            break;

        // ========== MENSAJES DEL GRUPO ==========
        // ========== MENSAJES DEL GRUPO (ACTUALIZADO) ==========
case 'group_messages':
    $grupo_id = $_GET['grupo_id'] ?? 0;
    $after_id = $_GET['after_id'] ?? 0; // NUEVO PARÁMETRO
    
    // Verificar que es miembro
    $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
    $stmt->execute([$grupo_id, $_SESSION['user_id']]);
    
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'No eres miembro']);
        exit();
    }
    
    // Si hay after_id, traer solo mensajes nuevos
    if ($after_id > 0) {
        $stmt = $pdo->prepare("
            SELECT 
                gm.id,
                gm.mensaje,
                gm.imagen,
                gm.tipo_mensaje,
                u.nombre as usuario,
                DATE_FORMAT(gm.fecha, '%H:%i') as hora,
                gm.usuario_id,
                gm.fecha
            FROM grupo_mensajes gm
            INNER JOIN usuarios u ON gm.usuario_id = u.id
            WHERE gm.grupo_id = ? AND gm.id > ?
            ORDER BY gm.fecha ASC
        ");
        $stmt->execute([$grupo_id, $after_id]);
    } else {
        // Traer los últimos 100 mensajes
        $stmt = $pdo->prepare("
            SELECT 
                gm.id,
                gm.mensaje,
                gm.imagen,
                gm.tipo_mensaje,
                u.nombre as usuario,
                DATE_FORMAT(gm.fecha, '%H:%i') as hora,
                gm.usuario_id,
                gm.fecha
            FROM grupo_mensajes gm
            INNER JOIN usuarios u ON gm.usuario_id = u.id
            WHERE gm.grupo_id = ?
            ORDER BY gm.fecha ASC
            LIMIT 100
        ");
        $stmt->execute([$grupo_id]);
    }
    
    // Actualizar última lectura (solo si no es polling)
    if ($after_id == 0) {
        $stmt2 = $pdo->prepare("UPDATE grupo_miembros SET ultima_lectura = NOW() WHERE grupo_id = ? AND usuario_id = ?");
        $stmt2->execute([$grupo_id, $_SESSION['user_id']]);
    }
    
    echo json_encode(['success' => true, 'mensajes' => $stmt->fetchAll()]);
    break;

        // ========== ENVIAR MENSAJE ==========
        case 'send_group_message':
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $grupo_id = $data['grupo_id'] ?? 0;
            $mensaje = trim($data['mensaje'] ?? '');
            $imagen = $data['imagen'] ?? null;
            $tipo = $imagen ? 'imagen' : 'texto';
            
            if (empty($mensaje) && empty($imagen)) {
                echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
                exit();
            }
            
            // Verificar que es miembro
            $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
            $stmt->execute([$grupo_id, $_SESSION['user_id']]);
            
            if (!$stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'No eres miembro']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje, imagen, tipo_mensaje) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$grupo_id, $_SESSION['user_id'], $mensaje, $imagen, $tipo]);
            
            echo json_encode(['success' => true, 'message' => 'Enviado']);
            break;

        // ========== DETALLES DEL GRUPO ==========
        case 'group_details':
            $grupo_id = $_GET['grupo_id'] ?? 0;
            
            $stmt = $pdo->prepare("
                SELECT g.*, u.nombre as admin_nombre
                FROM grupos g
                INNER JOIN usuarios u ON g.admin_id = u.id
                WHERE g.id = ?
            ");
            $stmt->execute([$grupo_id]);
            $grupo = $stmt->fetch();
            
            $stmt = $pdo->prepare("
                SELECT u.id, u.nombre, u.email
                FROM grupo_miembros gm
                INNER JOIN usuarios u ON gm.usuario_id = u.id
                WHERE gm.grupo_id = ?
            ");
            $stmt->execute([$grupo_id]);
            $miembros = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true, 
                'grupo' => $grupo,
                'miembros' => $miembros
            ]);
            break;

        // ========== SUBIR IMAGEN ==========
        // ========== SUBIR IMAGEN PARA GRUPOS ==========
case 'upload_group_image':
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit();
    }
    
    if (!isset($_FILES['imagen']) || !isset($_POST['grupo_id'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }
    
    $grupo_id = intval($_POST['grupo_id']);
    $usuario_id = $_SESSION['user_id'];
    $file = $_FILES['imagen'];
    
    // Verificar que el usuario pertenece al grupo
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
    $stmt->execute([$grupo_id, $usuario_id]);
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        echo json_encode(['success' => false, 'message' => 'No perteneces a este grupo']);
        exit();
    }
    
    // Validar archivo
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $max_size = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowed_types)) {
        echo json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido. Solo JPEG, PNG, GIF o WebP']);
        exit();
    }
    
    if ($file['size'] > $max_size) {
        echo json_encode(['success' => false, 'message' => 'Archivo muy grande (máx 5MB)']);
        exit();
    }
    
    // Crear carpeta si no existe
    $upload_dir = '../uploads/grupos/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Generar nombre único
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'grupo_' . $grupo_id . '_' . uniqid() . '_' . time() . '.' . $extension;
    $filepath = $upload_dir . $filename;
    
    // Mover archivo
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Guardar en base de datos
        $url_imagen = '../uploads/grupos/' . $filename;
        $mensaje_texto = '📷 Imagen';
        
        $stmt = $pdo->prepare("
            INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje, tipo_mensaje, imagen) 
            VALUES (?, ?, ?, 'imagen', ?)
        ");
        $stmt->execute([$grupo_id, $usuario_id, $mensaje_texto, $url_imagen]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Imagen subida correctamente',
            'url' => $url_imagen,
            'mensaje_id' => $pdo->lastInsertId()
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al mover el archivo al servidor']);
    }
    break;
            // ========== CREAR NOTICIA (Solo profesores) ==========
case 'create_news':
    // Verificar que sea profesor
    $stmtCheck = $pdo->prepare("SELECT tipo_usuario FROM usuarios WHERE id = ?");
    $stmtCheck->execute([$_SESSION['user_id']]);
    $user = $stmtCheck->fetch();
    
    if ($user['tipo_usuario'] !== 'profesor') {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit();
    }
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $titulo = trim($data['titulo'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $tipo = $data['tipo'] ?? 'noticia';
    
    if (empty($titulo)) {
        echo json_encode(['success' => false, 'message' => 'El título es obligatorio']);
        exit();
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO noticias (titulo, descripcion, tipo, autor, fecha, usuario_id) 
        VALUES (?, ?, ?, (SELECT nombre FROM usuarios WHERE id = ?), CURDATE(), ?)
    ");
    $stmt->execute([$titulo, $descripcion, $tipo, $_SESSION['user_id'], $_SESSION['user_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Noticia creada']);
    break;

    // ========== ACTUALIZAR GRUPO (Solo admin) ==========
case 'update_group':
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $grupo_id = $data['grupo_id'] ?? 0;
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    
    // Verificar que es admin
    $stmt = $pdo->prepare("SELECT admin_id FROM grupos WHERE id = ?");
    $stmt->execute([$grupo_id]);
    $grupo = $stmt->fetch();
    
    if (!$grupo || $grupo['admin_id'] != $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'No eres admin del grupo']);
        exit();
    }
    
    // Actualizar solo los campos que se envían
    if (!empty($nombre)) {
        $stmt = $pdo->prepare("UPDATE grupos SET nombre = ? WHERE id = ?");
        $stmt->execute([$nombre, $grupo_id]);
    }
    
    if (isset($data['descripcion'])) {
        $stmt = $pdo->prepare("UPDATE grupos SET descripcion = ? WHERE id = ?");
        $stmt->execute([$descripcion, $grupo_id]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Grupo actualizado']);
    break;

// ========== ELIMINAR MIEMBRO (Solo admin) ==========
case 'remove_member':
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $grupo_id = $data['grupo_id'] ?? 0;
    $usuario_id = $data['usuario_id'] ?? 0;
    
    // Verificar que es admin
    $stmt = $pdo->prepare("SELECT admin_id FROM grupos WHERE id = ?");
    $stmt->execute([$grupo_id]);
    $grupo = $stmt->fetch();
    
    if (!$grupo || $grupo['admin_id'] != $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'No eres admin del grupo']);
        exit();
    }
    
    // No permitir eliminar al admin
    if ($usuario_id == $grupo['admin_id']) {
        echo json_encode(['success' => false, 'message' => 'No puedes eliminar al admin']);
        exit();
    }
    
    $stmt = $pdo->prepare("DELETE FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
    $stmt->execute([$grupo_id, $usuario_id]);
    
    echo json_encode(['success' => true, 'message' => 'Miembro eliminado']);
    break;

// ========== ELIMINAR GRUPO (Solo admin) ==========
case 'delete_group':
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $grupo_id = $data['grupo_id'] ?? 0;
    
    // Verificar que es admin
    $stmt = $pdo->prepare("SELECT admin_id FROM grupos WHERE id = ?");
    $stmt->execute([$grupo_id]);
    $grupo = $stmt->fetch();
    
    if (!$grupo || $grupo['admin_id'] != $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'No eres admin del grupo']);
        exit();
    }
    
    // Eliminar mensajes
    $stmt = $pdo->prepare("DELETE FROM grupo_mensajes WHERE grupo_id = ?");
    $stmt->execute([$grupo_id]);
    
    // Eliminar miembros
    $stmt = $pdo->prepare("DELETE FROM grupo_miembros WHERE grupo_id = ?");
    $stmt->execute([$grupo_id]);
    
    // Eliminar grupo
    $stmt = $pdo->prepare("DELETE FROM grupos WHERE id = ?");
    $stmt->execute([$grupo_id]);
    
    echo json_encode(['success' => true, 'message' => 'Grupo eliminado']);
    break;

// ========== SALIR DEL GRUPO ==========
case 'leave_group':
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $grupo_id = $data['grupo_id'] ?? 0;
    
    // Verificar que NO es admin
    $stmt = $pdo->prepare("SELECT admin_id FROM grupos WHERE id = ?");
    $stmt->execute([$grupo_id]);
    $grupo = $stmt->fetch();
    
    if ($grupo && $grupo['admin_id'] == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'El admin no puede salir. Primero elimina el grupo o transfiere la administración.']);
        exit();
    }
    
    $stmt = $pdo->prepare("DELETE FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
    $stmt->execute([$grupo_id, $_SESSION['user_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Has salido del grupo']);
    break;
// ========== ELIMINAR NOTICIA (Solo profesores) ==========
case 'delete_news':
    $stmtCheck = $pdo->prepare("SELECT tipo_usuario FROM usuarios WHERE id = ?");
    $stmtCheck->execute([$_SESSION['user_id']]);
    $user = $stmtCheck->fetch();
    
    if ($user['tipo_usuario'] !== 'profesor') {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit();
    }
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $noticia_id = $data['id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM noticias WHERE id = ?");
    $stmt->execute([$noticia_id]);
    
    echo json_encode(['success' => true, 'message' => 'Noticia eliminada']);
    break;

    // ========== CREAR RECOMENDACIÓN (Solo profesores) ==========
    case 'create_recommendation':
        $stmtCheck = $pdo->prepare("SELECT tipo_usuario FROM usuarios WHERE id = ?");
        $stmtCheck->execute([$_SESSION['user_id']]);
        $user = $stmtCheck->fetch();
        
        if ($user['tipo_usuario'] !== 'profesor') {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            exit();
        }
        
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        $mensaje = trim($data['mensaje'] ?? '');
        $dirigido_a = trim($data['dirigido_a'] ?? 'Todos');
        
        if (empty($mensaje)) {
            echo json_encode(['success' => false, 'message' => 'El mensaje es obligatorio']);
            exit();
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO recomendaciones (mensaje, dirigido_a, autor, fecha, usuario_id) 
            VALUES (?, ?, (SELECT nombre FROM usuarios WHERE id = ?), CURDATE(), ?)
        ");
        $stmt->execute([$mensaje, $dirigido_a, $_SESSION['user_id'], $_SESSION['user_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Recomendación creada']);
        break;
                
            $file = $_FILES['imagen'];
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            
            if (!in_array($file['type'], $allowed)) {
                echo json_encode(['success' => false, 'message' => 'Tipo no permitido']);
                exit();
            }
            
            if ($file['size'] > 5000000) { // 5MB
                echo json_encode(['success' => false, 'message' => 'Imagen muy grande (máx 5MB)']);
                exit();
            }
            
            $upload_dir = '../uploads/grupos/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $filepath = $upload_dir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                echo json_encode([
                    'success' => true, 
                    'url' => '../uploads/grupos/' . $filename
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al subir']);
            }
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no válida'
            ]);
    }
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
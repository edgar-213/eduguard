<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';
setHeaders();

// ============================================
// VERIFICAR SESIÓN
// ============================================
$profesor_id = $_SESSION['user_id'] ?? null;
$user_type = $_SESSION['user_type'] ?? null;

if (!$profesor_id || $user_type !== 'profesor') {
    echo json_encode([
        'success' => false,
        'message' => 'Acceso no autorizado'
    ]);
    exit();
}

// ============================================
// OBTENER ACCIÓN
// ============================================
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    echo json_encode([
        'success' => false,
        'message' => 'Acción no especificada'
    ]);
    exit();
}

try {
    $pdo = getConnection();
    
    // ============================================
    // SECCIÓN 1: ESTADÍSTICAS
    // ============================================
    if ($action === 'get_stats') {
        // Total estudiantes en sus materias
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT em.estudiante_id) as total
            FROM estudiante_materias em
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $totalEstudiantes = $stmt->fetch()['total'];
        
        // Total cursos
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM profesor_materias 
            WHERE profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $totalCursos = $stmt->fetch()['total'];
        
        // Mensajes nuevos en grupos
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM grupo_mensajes gm
            INNER JOIN grupo_miembros gmi ON gm.grupo_id = gmi.grupo_id
            WHERE gmi.usuario_id = ? 
            AND gm.fecha > gmi.ultima_lectura
            AND gm.usuario_id != ?
        ");
        $stmt->execute([$profesor_id, $profesor_id]);
        $mensajesNuevos = $stmt->fetch()['total'];
        
        // Promedio general
        $stmt = $pdo->prepare("
            SELECT AVG(n.nota) as promedio
            FROM notas n
            INNER JOIN profesor_materias pm ON n.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $promedio = $stmt->fetch()['promedio'] ?? 0;
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'totalEstudiantes' => (int)$totalEstudiantes,
                'totalCursos' => (int)$totalCursos,
                'mensajesNuevos' => (int)$mensajesNuevos,
                'promedioGeneral' => round($promedio, 1)
            ]
        ]);
    }
    
    // ============================================
    // SECCIÓN 2: MATERIAS/CURSOS
    // ============================================
    elseif ($action === 'get_materias') {
        $stmt = $pdo->prepare("
            SELECT m.*, 
                   COUNT(DISTINCT em.estudiante_id) as num_estudiantes,
                   AVG(n.nota) as promedio
            FROM materias m
            INNER JOIN profesor_materias pm ON m.id = pm.materia_id
            LEFT JOIN estudiante_materias em ON m.id = em.materia_id
            LEFT JOIN notas n ON m.id = n.materia_id
            WHERE pm.profesor_id = ?
            GROUP BY m.id
            ORDER BY m.nombre
        ");
        $stmt->execute([$profesor_id]);
        $materias = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'materias' => $materias
        ]);
    }
    
    // ============================================
    // SECCIÓN 3: ESTUDIANTES
    // ============================================
    elseif ($action === 'get_estudiantes') {
        $materia_id = $_GET['materia_id'] ?? null;
        
        $sql = "
            SELECT DISTINCT 
                u.id, u.nombre, u.email, u.grado, u.seccion,
                GROUP_CONCAT(DISTINCT m.nombre SEPARATOR ', ') as materias,
                ROUND(AVG(n.nota), 2) as promedio
            FROM usuarios u
            INNER JOIN estudiante_materias em ON u.id = em.estudiante_id
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            INNER JOIN materias m ON em.materia_id = m.id
            LEFT JOIN notas n ON u.id = n.usuario_id AND n.materia_id = em.materia_id
            WHERE pm.profesor_id = ? AND u.tipo_usuario = 'alumno'
        ";
        
        $params = [$profesor_id];
        
        if ($materia_id) {
            $sql .= " AND em.materia_id = ?";
            $params[] = $materia_id;
        }
        
        $sql .= " GROUP BY u.id ORDER BY u.nombre";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $estudiantes = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'estudiantes' => $estudiantes
        ]);
    }
    
    // ============================================
    // SECCIÓN 4: NOTAS
    // ============================================
    elseif ($action === 'get_notas_recientes') {
        $stmt = $pdo->prepare("
            SELECT 
                u.nombre as estudiante,
                m.nombre as materia,
                n.titulo as evaluacion,
                n.nota,
                n.fecha,
                n.tipo
            FROM notas n
            INNER JOIN usuarios u ON n.usuario_id = u.id
            INNER JOIN materias m ON n.materia_id = m.id
            INNER JOIN profesor_materias pm ON n.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
            ORDER BY n.fecha DESC
            LIMIT 10
        ");
        $stmt->execute([$profesor_id]);
        $notas = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'notas' => $notas
        ]);
    }
    
    elseif ($action === 'save_nota') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar que el profesor dicta esa materia
        $stmt = $pdo->prepare("
            SELECT id FROM profesor_materias 
            WHERE profesor_id = ? AND materia_id = ?
        ");
        $stmt->execute([$profesor_id, $data['materia_id']]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No tienes permiso para esta materia');
        }
        
        // Insertar nota
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
    }
    
    // ============================================
    // SECCIÓN 5: GRUPOS Y CHAT
    // ============================================
    elseif ($action === 'get_grupos') {
        $stmt = $pdo->prepare("
            SELECT 
                g.id, g.nombre, g.descripcion,
                COUNT(DISTINCT gm2.usuario_id) as num_miembros,
                (SELECT COUNT(*) 
                 FROM grupo_mensajes gme 
                 WHERE gme.grupo_id = g.id 
                 AND gme.fecha > gmi.ultima_lectura 
                 AND gme.usuario_id != ?) as mensajes_nuevos
            FROM grupos g
            INNER JOIN grupo_miembros gmi ON g.id = gmi.grupo_id
            LEFT JOIN grupo_miembros gm2 ON g.id = gm2.grupo_id
            WHERE gmi.usuario_id = ?
            GROUP BY g.id
            ORDER BY g.fecha_creacion DESC
        ");
        $stmt->execute([$profesor_id, $profesor_id]);
        $grupos = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'grupos' => $grupos
        ]);
    }
    
    elseif ($action === 'get_mensajes') {
        $grupo_id = $_GET['grupo_id'] ?? null;
        
        if (!$grupo_id) {
            throw new Exception('ID de grupo no especificado');
        }
        
        // Verificar que es miembro
        $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$grupo_id, $profesor_id]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No eres miembro de este grupo');
        }
        
        // Obtener mensajes
        $stmt = $pdo->prepare("
            SELECT 
                gm.id, gm.mensaje, gm.imagen, gm.tipo_mensaje, 
                DATE_FORMAT(gm.fecha, '%H:%i') as hora,
                u.nombre as usuario_nombre,
                u.id as usuario_id
            FROM grupo_mensajes gm
            INNER JOIN usuarios u ON gm.usuario_id = u.id
            WHERE gm.grupo_id = ?
            ORDER BY gm.fecha ASC
        ");
        $stmt->execute([$grupo_id]);
        $mensajes = $stmt->fetchAll();
        
        // Actualizar última lectura
        $stmt = $pdo->prepare("
            UPDATE grupo_miembros 
            SET ultima_lectura = NOW() 
            WHERE grupo_id = ? AND usuario_id = ?
        ");
        $stmt->execute([$grupo_id, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes
        ]);
    }
    
    elseif ($action === 'send_mensaje') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verificar que es miembro
        $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$data['grupo_id'], $profesor_id]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No eres miembro de este grupo');
        }
        
        // Insertar mensaje
        $stmt = $pdo->prepare("
            INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje, tipo_mensaje)
            VALUES (?, ?, ?, 'texto')
        ");
        $stmt->execute([$data['grupo_id'], $profesor_id, $data['mensaje']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado'
        ]);
    }
    
    elseif ($action === 'create_grupo') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Crear grupo
        $stmt = $pdo->prepare("
            INSERT INTO grupos (nombre, admin_id, descripcion)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$data['nombre'], $profesor_id, $data['descripcion'] ?? '']);
        $grupo_id = $pdo->lastInsertId();
        
        // Agregar al profesor como miembro
        $stmt = $pdo->prepare("
            INSERT INTO grupo_miembros (grupo_id, usuario_id)
            VALUES (?, ?)
        ");
        $stmt->execute([$grupo_id, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Grupo creado correctamente',
            'grupo_id' => $grupo_id
        ]);
    }
    
    // ============================================
    // SECCIÓN 6: ANUNCIOS
    // ============================================
    elseif ($action === 'get_anuncios') {
        $stmt = $pdo->query("
            SELECT * FROM noticias 
            ORDER BY fecha_publicacion DESC 
            LIMIT 20
        ");
        $anuncios = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'anuncios' => $anuncios
        ]);
    }
    
    elseif ($action === 'create_anuncio') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            INSERT INTO noticias (titulo, descripcion, tipo, fecha, destacado, autor)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['titulo'],
            $data['descripcion'],
            $data['tipo'],
            $data['fecha'] ?? null,
            $data['destacado'] ?? 0,
            $_SESSION['user_name']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Anuncio publicado correctamente'
        ]);
    }
    
    elseif ($action === 'delete_anuncio') {
        $anuncio_id = $_GET['id'] ?? null;
        
        if (!$anuncio_id) {
            throw new Exception('ID de anuncio no especificado');
        }
        
        $stmt = $pdo->prepare("DELETE FROM noticias WHERE id = ?");
        $stmt->execute([$anuncio_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Anuncio eliminado'
        ]);
    }
    
    // ============================================
    // SECCIÓN 7: MATERIALES DIDÁCTICOS
    // ============================================
    elseif ($action === 'get_materiales') {
        $materia_id = $_GET['materia_id'] ?? null;
        
        $sql = "
            SELECT md.*, m.nombre as materia_nombre
            FROM materiales_didacticos md
            INNER JOIN materias m ON md.materia_id = m.id
            WHERE md.profesor_id = ?
        ";
        
        $params = [$profesor_id];
        
        if ($materia_id) {
            $sql .= " AND md.materia_id = ?";
            $params[] = $materia_id;
        }
        
        $sql .= " ORDER BY md.fecha_subida DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $materiales = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'materiales' => $materiales
        ]);
    }
    
    elseif ($action === 'upload_material') {
        // Verificar que se subió un archivo
        if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No se subió ningún archivo');
        }
        
        $file = $_FILES['archivo'];
        $nombre = $_POST['nombre'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $materia_id = $_POST['materia_id'] ?? null;
        
        if (!$nombre || !$materia_id) {
            throw new Exception('Datos incompletos');
        }
        
        // Validar que el profesor dicta esa materia
        $stmt = $pdo->prepare("SELECT id FROM profesor_materias WHERE profesor_id = ? AND materia_id = ?");
        $stmt->execute([$profesor_id, $materia_id]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No tienes permiso para esta materia');
        }
        
        // Validar tipo de archivo
        $allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'mp4', 'zip'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowed)) {
            throw new Exception('Tipo de archivo no permitido');
        }
        
        // Validar tamaño (máx 50MB)
        if ($file['size'] > 50 * 1024 * 1024) {
            throw new Exception('El archivo es demasiado grande (máx 50MB)');
        }
        
        // Crear carpeta si no existe
        $upload_dir = '../uploads/materiales/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Generar nombre único
        $filename = uniqid() . '_' . time() . '.' . $ext;
        $filepath = $upload_dir . $filename;
        
        // Mover archivo
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('Error al subir el archivo');
        }
        
        // Guardar en BD
        $stmt = $pdo->prepare("
            INSERT INTO materiales_didacticos 
            (profesor_id, materia_id, nombre, descripcion, tipo_archivo, ruta_archivo, tamanio)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $profesor_id,
            $materia_id,
            $nombre,
            $descripcion,
            $ext,
            $filepath,
            $file['size']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Material subido correctamente'
        ]);
    }
    
    elseif ($action === 'delete_material') {
        $material_id = $_GET['id'] ?? null;
        
        if (!$material_id) {
            throw new Exception('ID de material no especificado');
        }
        
        // Obtener ruta del archivo
        $stmt = $pdo->prepare("SELECT ruta_archivo FROM materiales_didacticos WHERE id = ? AND profesor_id = ?");
        $stmt->execute([$material_id, $profesor_id]);
        $material = $stmt->fetch();
        
        if (!$material) {
            throw new Exception('Material no encontrado');
        }
        
        // Eliminar archivo físico
        if (file_exists($material['ruta_archivo'])) {
            unlink($material['ruta_archivo']);
        }
        
        // Eliminar de BD
        $stmt = $pdo->prepare("DELETE FROM materiales_didacticos WHERE id = ?");
        $stmt->execute([$material_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Material eliminado'
        ]);
    }
    
    // ============================================
    // SECCIÓN 8: PERFIL Y CONFIGURACIÓN
    // ============================================
    elseif ($action === 'update_profile') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            UPDATE usuarios 
            SET nombre = ?, email = ?, telefono = ?, bio = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['nombre'],
            $data['email'],
            $data['telefono'] ?? null,
            $data['bio'] ?? null,
            $profesor_id
        ]);
        
        // Actualizar sesión
        $_SESSION['user_name'] = $data['nombre'];
        $_SESSION['user_email'] = $data['email'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado correctamente'
        ]);
    }
    
    elseif ($action === 'change_password') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verificar contraseña actual
        $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE id = ?");
        $stmt->execute([$profesor_id]);
        $user = $stmt->fetch();
        
        if (!password_verify($data['password_actual'], $user['password'])) {
            throw new Exception('Contraseña actual incorrecta');
        }
        
        // Actualizar contraseña
        $new_hash = password_hash($data['password_nueva'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
        $stmt->execute([$new_hash, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Contraseña cambiada correctamente'
        ]);
    }
    
    // ============================================
    // SECCIÓN 9: GRÁFICOS Y REPORTES
    // ============================================
    elseif ($action === 'get_chart_data') {
        $stmt = $pdo->prepare("
            SELECT 
                m.nombre,
                ROUND(AVG(n.nota), 1) as promedio
            FROM materias m
            INNER JOIN profesor_materias pm ON m.id = pm.materia_id
            LEFT JOIN notas n ON m.id = n.materia_id
            WHERE pm.profesor_id = ?
            GROUP BY m.id
            ORDER BY m.nombre
        ");
        $stmt->execute([$profesor_id]);
        $data = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }
    
    // ============================================
    // ACCIÓN NO VÁLIDA
    // ============================================
    else {
        throw new Exception('Acción no válida');
    }
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
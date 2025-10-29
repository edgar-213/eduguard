<?php
// Activar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Registrar información de depuración
file_put_contents('debug.log', date('[Y-m-d H:i:s] ') . "API Request: " . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);
file_put_contents('debug.log', date('[Y-m-d H:i:s] ') . "Action: " . ($action ?? 'none') . "\n", FILE_APPEND);

session_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar sesión de profesor
 $profesor_id = $_SESSION['user_id'] ?? null;
 $user_type = $_SESSION['user_type'] ?? null;

if (!$profesor_id || $user_type !== 'profesor') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Acceso no autorizado. Debe iniciar sesión como profesor.'
    ]);
    exit();
}

 $action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit();
}

try {
    $pdo = getConnection();
    
    // ============================================
    // VERIFICAR SESIÓN
    // ============================================
    if ($action === 'verificar_sesion') {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $profesor_id,
                'nombre' => $_SESSION['user_name'] ?? 'Profesor',
                'email' => $_SESSION['user_email'] ?? '',
                'tipo' => $_SESSION['user_type'],
                'telefono' => $_SESSION['user_telefono'] ?? '',
                'bio' => $_SESSION['user_bio'] ?? ''
            ]
        ]);
    }
    
    // ============================================
    // ESTADÍSTICAS
    // ============================================
    elseif ($action === 'get_stats') {
        // Total estudiantes únicos
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT em.estudiante_id) as total
            FROM estudiante_materias em
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $totalEstudiantes = (int)($stmt->fetch()['total'] ?? 0);
        
        // Total cursos
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM profesor_materias 
            WHERE profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $totalCursos = (int)($stmt->fetch()['total'] ?? 0);
        
        // Mensajes nuevos
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM grupo_mensajes gm
            INNER JOIN grupo_miembros gmi ON gm.grupo_id = gmi.grupo_id
            WHERE gmi.usuario_id = ? 
            AND gm.fecha > COALESCE(gmi.ultima_lectura, '2000-01-01')
            AND gm.usuario_id != ?
        ");
        $stmt->execute([$profesor_id, $profesor_id]);
        $mensajesNuevos = (int)($stmt->fetch()['total'] ?? 0);
        
        // Promedio general
        $stmt = $pdo->prepare("
            SELECT COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
            FROM notas n
            INNER JOIN profesor_materias pm ON n.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
        ");
        $stmt->execute([$profesor_id]);
        $promedio = (float)($stmt->fetch()['promedio'] ?? 0);
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'totalEstudiantes' => $totalEstudiantes,
                'totalCursos' => $totalCursos,
                'mensajesNuevos' => $mensajesNuevos,
                'promedioGeneral' => $promedio
            ]
        ]);
    }
    
    // ============================================
    // MATERIAS
    // ============================================
    elseif ($action === 'get_materias') {
        $stmt = $pdo->prepare("
            SELECT 
                m.id, 
                m.nombre, 
                m.profesor, 
                m.color,
                COUNT(DISTINCT em.estudiante_id) as num_estudiantes,
                COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
            FROM materias m
            INNER JOIN profesor_materias pm ON m.id = pm.materia_id
            LEFT JOIN estudiante_materias em ON m.id = em.materia_id
            LEFT JOIN notas n ON m.id = n.materia_id
            WHERE pm.profesor_id = ?
            GROUP BY m.id
            ORDER BY m.nombre
        ");
        $stmt->execute([$profesor_id]);
        $materias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($materias as &$materia) {
            $materia['num_estudiantes'] = (int)$materia['num_estudiantes'];
            $materia['promedio'] = (float)$materia['promedio'];
        }
        
        echo json_encode([
            'success' => true,
            'materias' => $materias
        ]);
    }
    
    // ============================================
    // ESTUDIANTES
    // ============================================
    elseif ($action === 'get_estudiantes') {
        $materia_id = $_GET['materia_id'] ?? null;
        
        if ($materia_id) {
            // Verificar que el profesor dicta esa materia
            $stmt = $pdo->prepare("SELECT id FROM profesor_materias WHERE profesor_id = ? AND materia_id = ?");
            $stmt->execute([$profesor_id, $materia_id]);
            if (!$stmt->fetch()) {
                throw new Exception('No tienes permiso para ver estudiantes de esta materia');
            }
            
            $stmt = $pdo->prepare("
                SELECT DISTINCT 
                    u.id, 
                    u.nombre, 
                    u.email, 
                    u.grado, 
                    u.seccion,
                    COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
                FROM usuarios u
                INNER JOIN estudiante_materias em ON u.id = em.estudiante_id
                LEFT JOIN notas n ON u.id = n.usuario_id AND n.materia_id = ?
                WHERE em.materia_id = ? AND u.tipo_usuario = 'alumno'
                GROUP BY u.id
                ORDER BY u.nombre
            ");
            $stmt->execute([$materia_id, $materia_id]);
        } else {
            $stmt = $pdo->prepare("
                SELECT DISTINCT 
                    u.id, 
                    u.nombre, 
                    u.email, 
                    u.grado, 
                    u.seccion,
                    COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
                FROM usuarios u
                INNER JOIN estudiante_materias em ON u.id = em.estudiante_id
                INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
                LEFT JOIN notas n ON u.id = n.usuario_id
                WHERE pm.profesor_id = ? AND u.tipo_usuario = 'alumno'
                GROUP BY u.id
                ORDER BY u.nombre
            ");
            $stmt->execute([$profesor_id]);
        }
        
        $estudiantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($estudiantes as &$est) {
            $est['promedio'] = (float)$est['promedio'];
        }
        
        echo json_encode([
            'success' => true,
            'estudiantes' => $estudiantes
        ]);
    }
    
    // ============================================
    // NOTAS - OBTENER RECIENTES
    // ============================================
    elseif ($action === 'get_notas_recientes') {
        $stmt = $pdo->prepare("
            SELECT 
                u.nombre as estudiante,
                m.nombre as materia,
                n.titulo as evaluacion,
                ROUND(n.nota, 1) as nota,
                DATE_FORMAT(n.fecha, '%Y-%m-%d') as fecha,
                n.tipo
            FROM notas n
            INNER JOIN usuarios u ON n.usuario_id = u.id
            INNER JOIN materias m ON n.materia_id = m.id
            INNER JOIN profesor_materias pm ON n.materia_id = pm.materia_id
            WHERE pm.profesor_id = ?
            ORDER BY n.fecha DESC, n.id DESC
            LIMIT 10
        ");
        $stmt->execute([$profesor_id]);
        $notas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($notas as &$nota) {
            $nota['nota'] = (float)$nota['nota'];
        }
        
        echo json_encode([
            'success' => true,
            'notas' => $notas
        ]);
    }
    
    // ============================================
    // NOTAS - GUARDAR NUEVA
    // ============================================
    elseif ($action === 'save_nota') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos
        if (!isset($data['materia_id']) || !isset($data['usuario_id']) || !isset($data['nota'])) {
            throw new Exception('Datos incompletos');
        }
        
        // Validar que el profesor dicta esa materia
        $stmt = $pdo->prepare("
            SELECT id FROM profesor_materias 
            WHERE profesor_id = ? AND materia_id = ?
        ");
        $stmt->execute([$profesor_id, $data['materia_id']]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No tienes permiso para calificar en esta materia');
        }
        
        // Validar que el estudiante esté inscrito en esa materia
        $stmt = $pdo->prepare("
            SELECT id FROM estudiante_materias 
            WHERE estudiante_id = ? AND materia_id = ?
        ");
        $stmt->execute([$data['usuario_id'], $data['materia_id']]);
        
        if (!$stmt->fetch()) {
            throw new Exception('El estudiante no está inscrito en esta materia');
        }
        
        // Validar nota (0-20)
        $nota = (float)$data['nota'];
        if ($nota < 0 || $nota > 20) {
            throw new Exception('La nota debe estar entre 0 y 20');
        }
        
        // Insertar nota
        $stmt = $pdo->prepare("
            INSERT INTO notas (usuario_id, materia_id, nota, tipo, titulo, fecha)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['usuario_id'],
            $data['materia_id'],
            $nota,
            $data['tipo'] ?? 'examen',
            $data['titulo'] ?? 'Sin título',
            $data['fecha'] ?? date('Y-m-d')
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Nota guardada correctamente',
            'id' => $pdo->lastInsertId()
        ]);
    }
    
    // ============================================
    // ANUNCIOS - OBTENER
    // ============================================
    elseif ($action === 'get_anuncios') {
        $stmt = $pdo->prepare("
            SELECT 
                id, 
                titulo, 
                descripcion, 
                tipo, 
                fecha, 
                destacado,
                DATE_FORMAT(fecha_publicacion, '%Y-%m-%d %H:%i') as fecha_publicacion
            FROM noticias 
            WHERE autor = ?
            ORDER BY fecha_publicacion DESC 
            LIMIT 50
        ");
        $stmt->execute([$_SESSION['user_name']]);
        $anuncios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($anuncios as &$anuncio) {
            $anuncio['destacado'] = (int)$anuncio['destacado'];
        }
        
        echo json_encode([
            'success' => true,
            'anuncios' => $anuncios
        ]);
    }
    
    // ============================================
    // ANUNCIOS - CREAR
    // ============================================
    elseif ($action === 'create_anuncio') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['titulo']) || empty(trim($data['titulo']))) {
            throw new Exception('El título es obligatorio');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO noticias (titulo, descripcion, tipo, fecha, destacado, autor, fecha_publicacion)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            trim($data['titulo']),
            trim($data['descripcion'] ?? ''),
            $data['tipo'] ?? 'academico',
            $data['fecha'] ?? null,
            (int)($data['destacado'] ?? 0),
            $_SESSION['user_name']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Anuncio publicado correctamente',
            'id' => $pdo->lastInsertId()
        ]);
    }
    
    // ============================================
    // ANUNCIOS - ELIMINAR
    // ============================================
    elseif ($action === 'delete_anuncio') {
        $anuncio_id = $_GET['id'] ?? null;
        
        if (!$anuncio_id) {
            throw new Exception('ID de anuncio no especificado');
        }
        
        $stmt = $pdo->prepare("DELETE FROM noticias WHERE id = ? AND autor = ?");
        $affected = $stmt->execute([$anuncio_id, $_SESSION['user_name']]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Anuncio no encontrado o no tienes permiso para eliminarlo');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Anuncio eliminado correctamente'
        ]);
    }
    
    // ============================================
    // GRUPOS - OBTENER
    // ============================================
    elseif ($action === 'get_grupos') {
        $stmt = $pdo->prepare("
            SELECT 
                g.id,
                g.nombre,
                g.descripcion,
                COUNT(DISTINCT gm.usuario_id) as miembros,
                (SELECT COUNT(*) FROM grupo_mensajes WHERE grupo_id = g.id) as total_mensajes
            FROM grupos g
            INNER JOIN grupo_miembros gm ON g.id = gm.grupo_id
            WHERE gm.usuario_id = ?
            GROUP BY g.id
            ORDER BY g.fecha_creacion DESC
        ");
        $stmt->execute([$profesor_id]);
        $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($grupos as &$grupo) {
            $grupo['miembros'] = (int)$grupo['miembros'];
            $grupo['total_mensajes'] = (int)$grupo['total_mensajes'];
        }
        
        echo json_encode([
            'success' => true,
            'grupos' => $grupos
        ]);
    }
    
    // ============================================
    // GRUPOS - CREAR
    // ============================================
    elseif ($action === 'create_grupo') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $nombre = trim($data['nombre'] ?? '');
        if (empty($nombre)) {
            throw new Exception('El nombre del grupo es obligatorio');
        }
        
        $descripcion = trim($data['descripcion'] ?? '');
        
        // Crear grupo
        $stmt = $pdo->prepare("
            INSERT INTO grupos (nombre, admin_id, descripcion, fecha_creacion)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$nombre, $profesor_id, $descripcion]);
        $grupo_id = $pdo->lastInsertId();
        
        // Agregar al profesor como miembro
        $stmt = $pdo->prepare("
            INSERT INTO grupo_miembros (grupo_id, usuario_id, fecha_union)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$grupo_id, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Grupo creado correctamente',
            'grupo_id' => (int)$grupo_id
        ]);
    }
    
    // ============================================
    // GRUPOS - MENSAJES
    // ============================================
    elseif ($action === 'get_mensajes_grupo') {
        $grupo_id = $_GET['grupo_id'] ?? null;
        
        if (!$grupo_id) {
            throw new Exception('ID de grupo no especificado');
        }
        
        // Verificar que el profesor sea miembro del grupo
        $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$grupo_id, $profesor_id]);
        if (!$stmt->fetch()) {
            throw new Exception('No eres miembro de este grupo');
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                gm.id,
                gm.mensaje,
                gm.imagen,
                gm.tipo_mensaje,
                u.nombre as usuario,
                u.id as usuario_id,
                DATE_FORMAT(gm.fecha, '%H:%i') as hora,
                DATE_FORMAT(gm.fecha, '%Y-%m-%d %H:%i:%s') as fecha_completa
            FROM grupo_mensajes gm
            INNER JOIN usuarios u ON gm.usuario_id = u.id
            WHERE gm.grupo_id = ?
            ORDER BY gm.fecha ASC
            LIMIT 100
        ");
        $stmt->execute([$grupo_id]);
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
    
    // ============================================
    // GRUPOS - ENVIAR MENSAJE
    // ============================================
    elseif ($action === 'send_mensaje_grupo') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $grupo_id = $data['grupo_id'] ?? null;
        $mensaje = trim($data['mensaje'] ?? '');
        
        if (!$grupo_id) {
            throw new Exception('ID de grupo no especificado');
        }
        
        if (empty($mensaje)) {
            throw new Exception('El mensaje no puede estar vacío');
        }
        
        // Verificar que el profesor sea miembro del grupo
        $stmt = $pdo->prepare("SELECT id FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$grupo_id, $profesor_id]);
        if (!$stmt->fetch()) {
            throw new Exception('No eres miembro de este grupo');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje, fecha, tipo_mensaje)
            VALUES (?, ?, ?, NOW(), 'texto')
        ");
        $stmt->execute([$grupo_id, $profesor_id, $mensaje]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado correctamente',
            'id' => $pdo->lastInsertId()
        ]);
    }
    
    // ============================================
    // PERFIL - ACTUALIZAR
    // ============================================
    elseif ($action === 'update_profile') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $nombre = trim($data['nombre'] ?? '');
        $email = trim($data['email'] ?? '');
        
        if (empty($nombre) || empty($email)) {
            throw new Exception('Nombre y email son obligatorios');
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Email inválido');
        }
        
        // Verificar que el email no esté en uso por otro usuario
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
        $stmt->execute([$email, $profesor_id]);
        if ($stmt->fetch()) {
            throw new Exception('El email ya está en uso por otro usuario');
        }
        
        $stmt = $pdo->prepare("
            UPDATE usuarios 
            SET nombre = ?, email = ?, telefono = ?, bio = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $nombre,
            $email,
            $data['telefono'] ?? null,
            $data['bio'] ?? null,
            $profesor_id
        ]);
        
        // Actualizar sesión
        $_SESSION['user_name'] = $nombre;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_telefono'] = $data['telefono'] ?? '';
        $_SESSION['user_bio'] = $data['bio'] ?? '';
        
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado correctamente'
        ]);
    }
    
    // ============================================
    // CAMBIAR CONTRASEÑA
    // ============================================
    elseif ($action === 'change_password') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $password_actual = $data['password_actual'] ?? '';
        $password_nueva = $data['password_nueva'] ?? '';
        
        if (empty($password_actual) || empty($password_nueva)) {
            throw new Exception('Todos los campos son obligatorios');
        }
        
        if (strlen($password_nueva) < 8) {
            throw new Exception('La nueva contraseña debe tener al menos 8 caracteres');
        }
        
        // Verificar contraseña actual
        $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE id = ?");
        $stmt->execute([$profesor_id]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password_actual, $user['password'])) {
            throw new Exception('La contraseña actual es incorrecta');
        }
        
        // Actualizar contraseña
        $new_hash = password_hash($password_nueva, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
        $stmt->execute([$new_hash, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Contraseña cambiada correctamente'
        ]);
    }
    
    // ============================================
    // MATERIALES - OBTENER
    // ============================================
    elseif ($action === 'get_materiales') {
        $stmt = $pdo->prepare("
            SELECT 
                md.id,
                md.nombre,
                md.descripcion,
                md.tipo_archivo,
                md.tamanio,
                md.ruta_archivo,
                m.nombre as materia,
                DATE_FORMAT(md.fecha_subida, '%Y-%m-%d') as fecha
            FROM materiales_didacticos md
            INNER JOIN materias m ON md.materia_id = m.id
            WHERE md.profesor_id = ?
            ORDER BY md.fecha_subida DESC
            LIMIT 50
        ");
        $stmt->execute([$profesor_id]);
        $materiales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos y formatear tamaño
        foreach ($materiales as &$material) {
            $material['tamanio'] = (int)$material['tamanio'];
            $material['tamanio_formateado'] = formatBytes($material['tamanio']);
        }
        
        echo json_encode([
            'success' => true,
            'materiales' => $materiales
        ]);
    }
    
    // ============================================
    // DATOS PARA GRÁFICO
    // ============================================
    elseif ($action === 'get_chart_data') {
        $stmt = $pdo->prepare("
            SELECT 
                m.nombre,
                COALESCE(ROUND(AVG(n.nota), 1), 0) as promedio
            FROM materias m
            INNER JOIN profesor_materias pm ON m.id = pm.materia_id
            LEFT JOIN notas n ON m.id = n.materia_id
            WHERE pm.profesor_id = ?
            GROUP BY m.id
            ORDER BY m.nombre
        ");
        $stmt->execute([$profesor_id]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($data as &$item) {
            $item['promedio'] = (float)$item['promedio'];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }
    
    // ============================================
    // OBTENER TODOS LOS ESTUDIANTES
    // ============================================
    elseif ($action === 'get_all_estudiantes') {
        $stmt = $pdo->prepare("
            SELECT 
                id, 
                nombre, 
                email, 
                grado, 
                seccion
            FROM usuarios 
            WHERE tipo_usuario = 'alumno'
            ORDER BY nombre
        ");
        $stmt->execute();
        $estudiantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'estudiantes' => $estudiantes
        ]);
    }
    
    // ============================================
    // CREAR NUEVA MATERIA
    // ============================================
    elseif ($action === 'create_materia') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $nombre = trim($data['nombre'] ?? '');
        if (empty($nombre)) {
            throw new Exception('El nombre de la materia es obligatorio');
        }
        
        // Verificar si ya existe una materia con ese nombre para este profesor
        $stmt = $pdo->prepare("
            SELECT m.id FROM materias m
            INNER JOIN profesor_materias pm ON m.id = pm.materia_id
            WHERE m.nombre = ? AND pm.profesor_id = ?
        ");
        $stmt->execute([$nombre, $profesor_id]);
        
        if ($stmt->fetch()) {
            throw new Exception('Ya tienes una materia con ese nombre');
        }
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        try {
            // Crear la materia
            $stmt = $pdo->prepare("
                INSERT INTO materias (nombre, descripcion, color, profesor)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $nombre,
                $data['descripcion'] ?? '',
                $data['color'] ?? '#6366f1',
                $_SESSION['user_name']
            ]);
            
            $materia_id = $pdo->lastInsertId();
            
            // Asignar la materia al profesor
            $stmt = $pdo->prepare("
                INSERT INTO profesor_materias (profesor_id, materia_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$profesor_id, $materia_id]);
            
            // Confirmar transacción
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Materia creada correctamente',
                'id' => (int)$materia_id
            ]);
        } catch (Exception $e) {
            // Revertir transacción
            $pdo->rollback();
            throw $e;
        }
    }
    
    // ============================================
    // AGREGAR ESTUDIANTES A MATERIA
    // ============================================
    elseif ($action === 'add_estudiantes_to_materia') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $materia_id = $data['materia_id'] ?? null;
        $estudiantes_ids = $data['estudiantes_ids'] ?? [];
        
        if (!$materia_id || empty($estudiantes_ids)) {
            throw new Exception('Datos incompletos');
        }
        
        // Verificar que el profesor dicta esa materia
        $stmt = $pdo->prepare("SELECT id FROM profesor_materias WHERE profesor_id = ? AND materia_id = ?");
        $stmt->execute([$profesor_id, $materia_id]);
        
        if (!$stmt->fetch()) {
            throw new Exception('No tienes permiso para modificar esta materia');
        }
        
        // Contar cuántos estudiantes se agregaron correctamente
        $agregados = 0;
        $ya_existen = 0;
        
        foreach ($estudiantes_ids as $estudiante_id) {
            // Verificar si el estudiante ya está inscrito en la materia
            $stmt = $pdo->prepare("
                SELECT id FROM estudiante_materias 
                WHERE estudiante_id = ? AND materia_id = ?
            ");
            $stmt->execute([$estudiante_id, $materia_id]);
            
            if ($stmt->fetch()) {
                $ya_existen++;
                continue;
            }
            
            // Agregar estudiante a la materia
            $stmt = $pdo->prepare("
                INSERT INTO estudiante_materias (estudiante_id, materia_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$estudiante_id, $materia_id]);
            $agregados++;
        }
        
        $mensaje = "Se agregaron {$agregados} estudiantes correctamente";
        if ($ya_existen > 0) {
            $mensaje .= ". {$ya_existen} estudiantes ya estaban inscritos en esta materia";
        }
        
        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'agregados' => $agregados,
            'ya_existen' => $ya_existen
        ]);
    }
    
    // ============================================
    // CHAT IA - ENVIAR MENSAJE
    // ============================================
    elseif ($action === 'send_chat_message') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $message = trim($data['message'] ?? '');
        
        if (empty($message)) {
            throw new Exception('El mensaje no puede estar vacío');
        }
        
        // Verificar si la tabla existe antes de intentar usarla
        $tableExists = $pdo->query("SHOW TABLES LIKE 'chat_mensajes'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_mensajes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    mensaje TEXT NOT NULL,
                    tipo ENUM('usuario', 'bot') NOT NULL,
                    fecha DATETIME NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            ");
        }
        
        // Guardar mensaje del usuario
        $stmt = $pdo->prepare("
            INSERT INTO chat_mensajes (usuario_id, mensaje, tipo, fecha)
            VALUES (?, ?, 'usuario', NOW())
        ");
        $stmt->execute([$profesor_id, $message]);
        
        // Generar respuesta del bot
        $botResponse = generateBotResponse($message);
        
        // Guardar respuesta del bot
        $stmt = $pdo->prepare("
            INSERT INTO chat_mensajes (usuario_id, mensaje, tipo, fecha)
            VALUES (?, ?, 'bot', NOW())
        ");
        $stmt->execute([$profesor_id, $botResponse]);
        
        echo json_encode([
            'success' => true,
            'response' => $botResponse
        ]);
    }
    
    // ============================================
    // CHAT IA - OBTENER HISTORIAL
    // ============================================
    elseif ($action === 'get_chat_history') {
        // Verificar si la tabla existe antes de intentar usarla
        $tableExists = $pdo->query("SHOW TABLES LIKE 'chat_mensajes'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_mensajes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    mensaje TEXT NOT NULL,
                    tipo ENUM('usuario', 'bot') NOT NULL,
                    fecha DATETIME NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            ");
            
            // Devolver un array vacío si la tabla estaba vacía
            echo json_encode([
                'success' => true,
                'messages' => []
            ]);
            exit;
        }
        
        $stmt = $pdo->prepare("
            SELECT mensaje, tipo, DATE_FORMAT(fecha, '%H:%i') as hora
            FROM chat_mensajes
            WHERE usuario_id = ?
            ORDER BY fecha DESC
            LIMIT 50
        ");
        $stmt->execute([$profesor_id]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'messages' => array_reverse($messages) // Mostrar en orden cronológico
        ]);
    }
    
    // ============================================
    // CHAT PROFESOR-ALUMNO - OBTENER CONVERSACIONES
    // ============================================
    elseif ($action === 'get_conversaciones_alumnos') {
        // Verificar si la tabla existe antes de intentar usarla
        $tableExists = $pdo->query("SHOW TABLES LIKE 'chat_profesor_alumno'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_profesor_alumno (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesor_id INT NOT NULL,
                    alumno_id INT NOT NULL,
                    mensaje TEXT NOT NULL,
                    remitente ENUM('profesor', 'alumno') NOT NULL,
                    fecha DATETIME NOT NULL,
                    leido BOOLEAN DEFAULT 0,
                    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    INDEX idx_profesor_alumno (profesor_id, alumno_id),
                    INDEX idx_fecha (fecha)
                )
            ");
            
            // Devolver un array vacío si la tabla estaba vacía
            echo json_encode([
                'success' => true,
                'conversaciones' => []
            ]);
            exit;
        }
        
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                u.id,
                u.nombre,
                u.email,
                u.grado,
                u.seccion,
                (SELECT COUNT(*) FROM chat_profesor_alumno WHERE 
                 ((profesor_id = ? AND alumno_id = u.id) OR 
                  (profesor_id = ? AND alumno_id = u.id)) AND 
                 leido = 0 AND 
                 ((profesor_id = ? AND remitente = 'alumno') OR 
                  (profesor_id = ? AND remitente = 'alumno'))) as no_leidos,
                (SELECT mensaje FROM chat_profesor_alumno WHERE 
                 ((profesor_id = ? AND alumno_id = u.id) OR 
                  (profesor_id = ? AND alumno_id = u.id)) 
                 ORDER BY fecha DESC LIMIT 1) as ultimo_mensaje,
                (SELECT DATE_FORMAT(fecha, '%d/%m %H:%i') FROM chat_profesor_alumno WHERE 
                 ((profesor_id = ? AND alumno_id = u.id) OR 
                  (profesor_id = ? AND alumno_id = u.id)) 
                 ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_mensaje
            FROM usuarios u
            INNER JOIN estudiante_materias em ON u.id = em.estudiante_id
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE pm.profesor_id = ? AND u.tipo_usuario = 'alumno'
            ORDER BY fecha_ultimo_mensaje DESC
        ");
        
        $stmt->execute([$profesor_id, $profesor_id, $profesor_id, $profesor_id, 
                        $profesor_id, $profesor_id, $profesor_id, $profesor_id, $profesor_id]);
        
        $conversaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir tipos
        foreach ($conversaciones as &$conv) {
            $conv['no_leidos'] = (int)$conv['no_leidos'];
            $conv['ultimo_mensaje'] = $conv['ultimo_mensaje'] ?? 'No hay mensajes aún';
            $conv['fecha_ultimo_mensaje'] = $conv['fecha_ultimo_mensaje'] ?? '';
        }
        
        echo json_encode([
            'success' => true,
            'conversaciones' => $conversaciones
        ]);
    }
    
    // ============================================
    // CHAT PROFESOR-ALUMNO - OBTENER MENSAJES
    // ============================================
    elseif ($action === 'get_mensajes_alumno') {
        $alumno_id = $_GET['alumno_id'] ?? null;
        
        if (!$alumno_id) {
            throw new Exception('ID de alumno no especificado');
        }
        
        // Verificar si la tabla existe antes de intentar usarla
        $tableExists = $pdo->query("SHOW TABLES LIKE 'chat_profesor_alumno'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_profesor_alumno (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesor_id INT NOT NULL,
                    alumno_id INT NOT NULL,
                    mensaje TEXT NOT NULL,
                    remitente ENUM('profesor', 'alumno') NOT NULL,
                    fecha DATETIME NOT NULL,
                    leido BOOLEAN DEFAULT 0,
                    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    INDEX idx_profesor_alumno (profesor_id, alumno_id),
                    INDEX idx_fecha (fecha)
                )
            ");
            
            // Devolver un array vacío si la tabla estaba vacía
            echo json_encode([
                'success' => true,
                'mensajes' => []
            ]);
            exit;
        }
        
        // Verificar que el profesor tenga relación con este alumno
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM estudiante_materias em
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE em.estudiante_id = ? AND pm.profesor_id = ?
        ");
        $stmt->execute([$alumno_id, $profesor_id]);
        
        if ((int)$stmt->fetch()['count'] === 0) {
            throw new Exception('No tienes permiso para chatear con este alumno');
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                mensaje,
                remitente,
                DATE_FORMAT(fecha, '%H:%i') as hora,
                DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha_completa,
                leido
            FROM chat_profesor_alumno
            WHERE (profesor_id = ? AND alumno_id = ?) OR (profesor_id = ? AND alumno_id = ?)
            ORDER BY fecha ASC
            LIMIT 100
        ");
        $stmt->execute([$profesor_id, $alumno_id, $alumno_id, $profesor_id]);
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Marcar mensajes como leídos
        $stmt = $pdo->prepare("
            UPDATE chat_profesor_alumno 
            SET leido = 1 
            WHERE ((profesor_id = ? AND alumno_id = ?) OR (profesor_id = ? AND alumno_id = ?)) 
            AND remitente = 'alumno' AND leido = 0
        ");
        $stmt->execute([$profesor_id, $alumno_id, $alumno_id, $profesor_id]);
        
        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes
        ]);
    }
    
    // ============================================
    // CHAT PROFESOR-ALUMNO - ENVIAR MENSAJE
    // ============================================
    elseif ($action === 'send_mensaje_alumno') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $alumno_id = $data['alumno_id'] ?? null;
        $mensaje = trim($data['mensaje'] ?? '');
        
        if (!$alumno_id) {
            throw new Exception('ID de alumno no especificado');
        }
        
        if (empty($mensaje)) {
            throw new Exception('El mensaje no puede estar vacío');
        }
        
        // Verificar si la tabla existe antes de intentar usarla
        $tableExists = $pdo->query("SHOW TABLES LIKE 'chat_profesor_alumno'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_profesor_alumno (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesor_id INT NOT NULL,
                    alumno_id INT NOT NULL,
                    mensaje TEXT NOT NULL,
                    remitente ENUM('profesor', 'alumno') NOT NULL,
                    fecha DATETIME NOT NULL,
                    leido BOOLEAN DEFAULT 0,
                    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    INDEX idx_profesor_alumno (profesor_id, alumno_id),
                    INDEX idx_fecha (fecha)
                )
            ");
        }
        
        // Verificar que el profesor tenga relación con este alumno
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM estudiante_materias em
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE em.estudiante_id = ? AND pm.profesor_id = ?
        ");
        $stmt->execute([$alumno_id, $profesor_id]);
        
        if ((int)$stmt->fetch()['count'] === 0) {
            throw new Exception('No tienes permiso para chatear con este alumno');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO chat_profesor_alumno (profesor_id, alumno_id, mensaje, remitente, fecha, leido)
            VALUES (?, ?, ?, 'profesor', NOW(), 0)
        ");
        $stmt->execute([$profesor_id, $alumno_id, $mensaje]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado correctamente',
            'id' => $pdo->lastInsertId()
        ]);
    }
    
    // ============================================
    // CHAT PROFESOR-ALUMNO - BUSCAR ALUMNOS
    // ============================================
    elseif ($action === 'buscar_alumnos_chat') {
        $termino = $_GET['termino'] ?? '';
        
        if (empty($termino)) {
            throw new Exception('Debe especificar un término de búsqueda');
        }
        
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                u.id,
                u.nombre,
                u.email,
                u.grado,
                u.seccion
            FROM usuarios u
            INNER JOIN estudiante_materias em ON u.id = em.estudiante_id
            INNER JOIN profesor_materias pm ON em.materia_id = pm.materia_id
            WHERE pm.profesor_id = ? 
            AND u.tipo_usuario = 'alumno'
            AND (u.nombre LIKE ? OR u.email LIKE ?)
            ORDER BY u.nombre
            LIMIT 20
        ");
        
        $busqueda = "%{$termino}%";
        $stmt->execute([$profesor_id, $busqueda, $busqueda]);
        $alumnos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'alumnos' => $alumnos
        ]);
    }
    
    // ============================================
    // ACCIÓN NO VÁLIDA
    // ============================================
    else {
        http_response_code(400);
        throw new Exception('Acción no válida: ' . htmlspecialchars($action));
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    error_log("Error de base de datos: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos. Por favor, inténtalo de nuevo.'
    ]);
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Función auxiliar para formatear bytes
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

// Función para generar respuesta del bot
function generateBotResponse($message) {
    // Esta es una implementación simple
    // En un caso real, podrías integrar con GPT, Claude, etc.
    
    $responses = [
        "Entiendo tu pregunta. Déjame ayudarte con eso.",
        "Esa es una excelente pregunta. Según mi conocimiento...",
        "Gracias por tu consulta. Creo que la mejor aproximación sería...",
        "Interesante punto. Considera también que...",
        "Basado en los principios educativos, te sugiero...",
        "Como asistente educativo, te recomiendo...",
        "Según la pedagogía moderna, lo más efectivo sería...",
        "Para mejorar el aprendizaje, considera...",
        "Los estudios demuestran que...",
        "Mi sugerencia sería enfocarse en..."
    ];
    
    return $responses[array_rand($responses)];
}
?>
<?php
require_once 'config.php';
setHeaders();

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// 1. Proteger la ruta: solo usuarios con sesión activa
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    $pdo = getConnection();
    $data = [];
    
    // ============================================
    // A. Obtener datos del Usuario
    // ============================================
    $stmt = $pdo->prepare("
        SELECT id, nombre, email, tipo_usuario 
        FROM usuarios 
        WHERE id = ?
    ");
    $stmt->execute([$user_id]);
    $data['currentUser'] = $stmt->fetch();
    if (!$data['currentUser']) {
        throw new Exception("Usuario no encontrado.");
    }
    
    // Ejemplo de datos adicionales que podrías tener en otras tablas
    // En la práctica, necesitarías JOINS o más consultas para el grado, sección, puntuación, etc.
    $data['currentUser']['grado'] = '5to Secundaria'; // Simulado
    $data['currentUser']['seccion'] = 'A'; // Simulado
    $data['currentUser']['puntuacion'] = 850; // Simulado o de otra tabla
    $data['currentUser']['racha'] = 12; // Simulado o de otra tabla
    $data['currentUser']['horasEstudio'] = 45; // Simulado o de sesiones_estudio
    $data['currentUser']['nivel'] = 'Oro'; // Simulado o de logros
    
    
    // ============================================
    // B. Obtener Actividades (ejemplo: de la tabla 'actividades')
    // ============================================
    $stmt = $pdo->prepare("
        SELECT titulo, materia, fecha, duracion, resultado, icono 
        FROM actividades 
        WHERE user_id = ? 
        ORDER BY fecha DESC LIMIT 5
    ");
    $stmt->execute([$user_id]);
    $data['activitiesLog'] = $stmt->fetchAll();
    
    // Nota: La tabla 'actividades' debe tener las columnas 'user_id', 'titulo', 'materia', etc.
    // Si tu tabla actividades no tiene 'user_id', necesitas un JOIN con otras tablas.

    // ============================================
    // C. Obtener Materias (ejemplo: de la tabla 'materias' con promedio de 'notas')
    // ============================================
    // Esto es complejo; se simulará una consulta simple y un promedio.
    // Consulta real requeriría JOIN: SELECT m.*, AVG(n.nota) FROM materias m JOIN notas n ON m.id = n.materia_id WHERE n.user_id = ? GROUP BY m.id
    $stmt = $pdo->prepare("
        SELECT id, nombre, profesor, color 
        FROM materias 
        LIMIT 6
    ");
    $stmt->execute();
    $subjects = $stmt->fetchAll();
    
    // Simulación de promedio y cantidad de notas por materia
    foreach ($subjects as &$subject) {
        // En la vida real, consulta la tabla 'notas' con el ID del usuario y de la materia
        // $stmt_notas = $pdo->prepare("SELECT AVG(nota) as promedio, COUNT(id) as notas FROM notas WHERE user_id = ? AND materia_id = ?");
        // $stmt_notas->execute([$user_id, $subject['id']]);
        // $result = $stmt_notas->fetch();
        
        $subject['promedio'] = mt_rand(140, 190) / 10; // Promedio aleatorio entre 14.0 y 19.0
        $subject['notas'] = mt_rand(5, 20); // Notas aleatorias
    }
    unset($subject); // Romper referencia
    $data['subjects'] = $subjects;
    
    // ============================================
    // D. Obtener Noticias (de la tabla 'noticias')
    // ============================================
    $stmt = $pdo->prepare("
        SELECT titulo, descripcion, fecha, autor 
        FROM noticias 
        ORDER BY fecha DESC LIMIT 3
    ");
    $stmt->execute();
    $data['schoolNews'] = $stmt->fetchAll();
    
    // ... y así sucesivamente para todas las tablas que necesites ...
    // - calendario_eventos -> $data['calendarEvents']
    // - grupos (con un JOIN a grupo_miembros) -> $data['groups']
    // - recomendaciones -> $data['adminRecommendations']

    // ============================================
    // E. Retornar todos los datos
    // ============================================
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos del dashboard: ' . $e->getMessage()
    ]);
}
?>
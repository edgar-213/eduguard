<?php
// profesor.php
// Single-file professor panel + lightweight API for EduGuard
// USAGE: configure DB credentials below, place in public web root, create folders: /uploads/materials, /uploads/chat
// SECURITY: this is a starting point. Harden (HTTPS, session hardening, rate limits) before production.

session_start();
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ------------------ CONFIG ------------------
$dbHost = '127.0.0.1';
$dbName = 'entregable';
$dbUser = 'root';
$dbPass = '';
$uploadDirMaterials = __DIR__ . '/uploads/materials';
$uploadDirChat = __DIR__ . '/uploads/chat';
// Ensure upload dirs exist
if(!is_dir($uploadDirMaterials)) @mkdir($uploadDirMaterials,0755,true);
if(!is_dir($uploadDirChat)) @mkdir($uploadDirChat,0755,true);

// Simple PDO connection
try{
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}catch(PDOException $e){
    if(strpos($_SERVER['REQUEST_URI'],'?')!==false){}
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'DB connection failed: '.$e->getMessage()]);
    exit;
}

// ------------------ AUTH (placeholder) ------------------
// You should replace this with your real auth (login.php that sets $_SESSION['user_id'] and $_SESSION['role']='teacher')
if(!isset($_SESSION['user_id'])){
    // for local testing you can uncomment the following lines to simulate a teacher
    // $_SESSION['user_id'] = 1; $_SESSION['role']='teacher';
}

// Minimal role check
function require_teacher(){
    if(!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'teacher'){
        http_response_code(401);
        echo json_encode(['success'=>false,'message'=>'Unauthorized']);
        exit;
    }
}

// ------------------ ROUTING (API actions) ------------------
$action = $_GET['action'] ?? ($_POST['action'] ?? null);
if($action){
    switch($action){
        case 'get_profile':
            require_teacher();
            $stmt = $pdo->prepare('SELECT id, name, email FROM teachers WHERE id = ? LIMIT 1');
            $stmt->execute([$_SESSION['user_id']]);
            $prof = $stmt->fetch();
            if(!$prof) $prof = ['id'=>$_SESSION['user_id'],'name'=>'Profesor','email'=>'-'];
            echo json_encode($prof);
            break;

        case 'list_courses':
            require_teacher();
            $stmt = $pdo->prepare('SELECT id, name FROM courses WHERE teacher_id = ? ORDER BY name');
            $stmt->execute([$_SESSION['user_id']]);
            $rows = $stmt->fetchAll();
            echo json_encode($rows);
            break;

        case 'get_students':
            require_teacher();
            $course_id = $_GET['course_id'] ?? '';
            if(!$course_id){ echo json_encode([]); break; }
            $stmt = $pdo->prepare('SELECT s.id, s.name, s.email, s.status FROM students s JOIN course_students cs ON cs.student_id = s.id WHERE cs.course_id = ?');
            $stmt->execute([$course_id]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'get_grades':
            require_teacher();
            $course_id = $_GET['course_id'] ?? '';
            if(!$course_id){ echo json_encode([]); break; }
            $stmt = $pdo->prepare('SELECT g.student_id, st.name as student_name, g.activity, g.grade, g.comment FROM grades g JOIN students st ON st.id = g.student_id WHERE g.course_id = ?');
            $stmt->execute([$course_id]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'save_grade':
            require_teacher();
            $payload = json_decode(file_get_contents('php://input'), true);
            if(!$payload || !isset($payload['course_id']) || !isset($payload['grades'])){
                echo json_encode(['success'=>false,'message'=>'Invalid payload']); break;
            }
            $course_id = $payload['course_id'];
            $grades = $payload['grades'];
            // Use transaction
            $pdo->beginTransaction();
            try{
                $up = $pdo->prepare('REPLACE INTO grades (course_id, student_id, activity, grade, comment, updated_at) VALUES (?, ?, ?, ?, ?, NOW())');
                foreach($grades as $g){
                    $up->execute([$course_id, $g['student_id'], $g['activity'], $g['grade'] === '' ? null : $g['grade'], $g['comment']]);
                }
                $pdo->commit();
                echo json_encode(['success'=>true]);
            }catch(Exception $e){
                $pdo->rollBack();
                echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
            }
            break;

        case 'send_announcement':
            require_teacher();
            $payload = json_decode(file_get_contents('php://input'), true);
            if(!$payload || !isset($payload['course_id']) || !isset($payload['title']) || !isset($payload['body'])){
                echo json_encode(['success'=>false,'message'=>'Invalid payload']); break;
            }
            $ins = $pdo->prepare('INSERT INTO announcements (course_id, teacher_id, title, body, created_at) VALUES (?, ?, ?, ?, NOW())');
            $ins->execute([$payload['course_id'], $_SESSION['user_id'], $payload['title'], $payload['body']]);
            echo json_encode(['success'=>true]);
            break;

        case 'upload_material':
            require_teacher();
            // expects multipart form with course_id, title, file
            $course_id = $_POST['course_id'] ?? '';
            $title = $_POST['title'] ?? '';
            if(!$course_id || !$title || !isset($_FILES['file'])){ echo json_encode(['success'=>false,'message'=>'Missing data']); break; }
            $f = $_FILES['file'];
            if($f['error'] !== UPLOAD_ERR_OK){ echo json_encode(['success'=>false,'message'=>'Upload error']); break; }
            $ext = pathinfo($f['name'], PATHINFO_EXTENSION);
            $safe = bin2hex(random_bytes(8)) . '.' . $ext;
            $dest = $uploadDirMaterials . '/' . $safe;
            if(move_uploaded_file($f['tmp_name'], $dest)){
                $url = '/uploads/materials/' . $safe; // adjust if site in subfolder
                $stmt = $pdo->prepare('INSERT INTO materials (course_id, teacher_id, title, filename, url, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())');
                $stmt->execute([$course_id, $_SESSION['user_id'], $title, $f['name'], $url]);
                echo json_encode(['success'=>true,'url'=>$url]);
            }else{
                echo json_encode(['success'=>false,'message'=>'Move failed']);
            }
            break;

        case 'list_materials':
            require_teacher();
            $course_id = $_GET['course_id'] ?? '';
            if(!$course_id){ echo json_encode([]); break; }
            $stmt = $pdo->prepare('SELECT id, title, url, uploaded_at FROM materials WHERE course_id = ? ORDER BY uploaded_at DESC');
            $stmt->execute([$course_id]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'chat_send':
            require_teacher();
            $payload = json_decode(file_get_contents('php://input'), true);
            if(!$payload || !isset($payload['course_id'])){ echo json_encode(['success'=>false,'message'=>'Invalid payload']); break; }
            $course_id = $payload['course_id'];
            $text = $payload['text'] ?? null;
            $image_base64 = $payload['image_base64'] ?? null;
            $image_url = null;
            if($image_base64){
                $data = base64_decode($image_base64);
                $name = bin2hex(random_bytes(8)) . '.jpg';
                $path = $uploadDirChat . '/' . $name;
                file_put_contents($path, $data);
                $image_url = '/uploads/chat/' . $name;
            }
            $sender = 'Profesor #' . ($_SESSION['user_id'] ?? '0');
            $ins = $pdo->prepare('INSERT INTO chat_messages (course_id, sender, text, image_url, created_at) VALUES (?, ?, ?, ?, NOW())');
            $ins->execute([$course_id, $sender, $text, $image_url]);
            echo json_encode(['success'=>true]);
            break;

        case 'chat_fetch':
            require_teacher();
            $course_id = $_GET['course_id'] ?? '';
            if(!$course_id){ echo json_encode([]); break; }
            $stmt = $pdo->prepare('SELECT id, sender, text, image_url, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at FROM chat_messages WHERE course_id = ? ORDER BY created_at ASC LIMIT 200');
            $stmt->execute([$course_id]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'ai_suggestion':
            require_teacher();
            // This is a stub. Integrate Flowise/Groq here server-side.
            $payload = json_decode(file_get_contents('php://input'), true);
            $course_id = $payload['course_id'] ?? null;
            // Example: gather recent grades and return a simple message
            $stmt = $pdo->prepare('SELECT AVG(grade) as avg_grade FROM grades WHERE course_id = ?');
            $stmt->execute([$course_id]);
            $avg = $stmt->fetchColumn();
            $avg = $avg === null ? 'sin datos' : round($avg,2);
            $result = "(Demo) Promedio del grupo: $avg. Considera enviar mensajes de ánimo a quienes estén por debajo del promedio.";
            echo json_encode(['success'=>true,'result'=>$result]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['success'=>false,'message'=>'Action not found']);
    }
    exit;
}

// ------------------ RENDER HTML (cuando no hay action) ------------------
// Basic page: it will call the JS front-end (you can copy the earlier profesor.html JS and adapt API paths to profesor.php?action=...)
?><!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>EduGuard — Panel Profesor (PHP)</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;margin:20px;background:#f4f6fb} .card{background:#fff;padding:12px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.05);}</style>
</head>
<body>
<div class="card">
  <h2>EduGuard — Panel Profesor (archivo único)</h2>
  <p>Este archivo sirve como página y API. Asegúrate de configurar la base de datos y las tablas necesarias.</p>
  <p>API endpoints (usando query param <code>?action=...</code>):</p>
  <ul>
    <li><code>?action=get_profile</code> (GET)</li>
    <li><code>?action=list_courses</code> (GET)</li>
    <li><code>?action=get_students&course_id=ID</code> (GET)</li>
    <li><code>?action=get_grades&course_id=ID</code> (GET)</li>
    <li><code>?action=save_grade</code> (POST JSON)</li>
    <li><code>?action=send_announcement</code> (POST JSON)</li>
    <li><code>?action=upload_material</code> (POST multipart)</li>
    <li><code>?action=list_materials&course_id=ID</code> (GET)</li>
    <li><code>?action=chat_send</code> (POST JSON)</li>
    <li><code>?action=chat_fetch&course_id=ID</code> (GET)</li>
    <li><code>?action=ai_suggestion</code> (POST JSON) — stub</li>
  </ul>

  <h3>Recomendaciones:</h3>
  <ol>
    <li>Crear tablas: teachers, courses, students, course_students, grades, announcements, materials, chat_messages.</li>
    <li>Dar permisos de escritura a /uploads/* y proteger su acceso si es necesario.</li>
    <li>Implementar login real que establezca $_SESSION['user_id'] y $_SESSION['role']='teacher'.</li>
    <li>Integrar Flowise/Groq en 'ai_suggestion' para respuestas reales.</li>
  </ol>

  <p>¿Quieres que también genere el SQL para crear las tablas mencionadas y un ejemplo de <code>save_grade.php</code> separado usando PDO?</p>
</div>
</body>
</html>

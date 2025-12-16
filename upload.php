<?php
/**
 * Upload de Assinaturas METARH
 * 
 * Endpoint: https://metarh.com.br/wp-content/uploads/assinaturas/upload.php
 * 
 * Salvar este arquivo em: wp-content/uploads/assinaturas/upload.php
 */

// Configuração de CORS
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Responder a preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Apenas aceitar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Use POST.']);
    exit();
}

// Verificar token de autorização
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if ($authHeader !== 'Bearer METARH2026#4886') {
    http_response_code(401);
    echo json_encode(['error' => 'Token de autorização inválido.']);
    exit();
}

// Verificar se o arquivo foi enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhum arquivo foi enviado ou houve erro no upload.']);
    exit();
}

$file = $_FILES['file'];

// Validar tipo de arquivo (apenas PNG)
$allowedTypes = ['image/png'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de arquivo não permitido. Apenas PNG.']);
    exit();
}

// Validar extensão do arquivo
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($fileExtension !== 'png') {
    http_response_code(400);
    echo json_encode(['error' => 'Extensão de arquivo inválida. Apenas .png permitido.']);
    exit();
}

// Sanitizar nome do arquivo
$fileName = basename($file['name']);
$fileName = preg_replace('/[^a-z0-9\-\_\.]/i', '', $fileName);

// Diretório de destino (mesmo diretório deste script)
$uploadDir = __DIR__ . '/';
$uploadPath = $uploadDir . $fileName;

// Verificar se o diretório existe e tem permissões de escrita
if (!is_dir($uploadDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Diretório de upload não existe.']);
    exit();
}

if (!is_writable($uploadDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Diretório de upload não tem permissão de escrita.']);
    exit();
}

// Mover arquivo para o destino
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar o arquivo no servidor.']);
    exit();
}

// Gerar URL pública do arquivo
$baseUrl = 'https://metarh.com.br/wp-content/uploads/assinaturas/';
$fileUrl = $baseUrl . $fileName;

// Retornar sucesso com a URL
http_response_code(200);
echo json_encode([
    'success' => true,
    'url' => $fileUrl,
    'filename' => $fileName,
    'message' => 'Upload realizado com sucesso!'
]);
exit();

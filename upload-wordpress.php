<?php
/**
 * Upload de Assinaturas METARH
 * Versão com CORS Reforçado
 */

// CORS Headers - DEVE VIR ANTES DE QUALQUER OUTPUT
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // Cache preflight por 24h

// Se for OPTIONS (preflight), responder imediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Agora sim, definir content-type JSON
header('Content-Type: application/json; charset=utf-8');

// Token de autorização
$TOKEN = 'METARH2026#4886';

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Use POST.']);
    exit();
}

// Pegar header de autorização (compatível com diferentes servidores)
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

// Validar token
if ($authHeader !== "Bearer $TOKEN") {
    http_response_code(401);
    echo json_encode([
        'error' => 'Não autorizado',
        'received_auth' => $authHeader ? 'presente mas inválido' : 'ausente'
    ]);
    exit();
}

// Validar arquivo enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Arquivo não enviado ou erro no upload',
        'upload_error' => isset($_FILES['file']) ? $_FILES['file']['error'] : 'file não definido'
    ]);
    exit();
}

// Validar tipo de arquivo
$allowed = ['image/png', 'image/jpeg'];
$fileType = $_FILES['file']['type'];

if (!in_array($fileType, $allowed)) {
    http_response_code(415);
    echo json_encode([
        'error' => 'Tipo de arquivo inválido. Apenas PNG ou JPEG.',
        'received_type' => $fileType
    ]);
    exit();
}

// ============================================
// PROCESSAR NOME DO ARQUIVO
// ============================================

// Pegar o nome original enviado pelo cliente
$fileName = basename($_FILES['file']['name']);

// Sanitizar o nome (remover caracteres perigosos)
$fileName = preg_replace('/[^a-z0-9\-\_\.]/i', '', $fileName);

// PROTEÇÃO: Bloquear sobrescrita do banner
if (strtolower($fileName) === 'banner-assinatura.png') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Nome de arquivo reservado. O banner não pode ser sobrescrito.',
        'received_filename' => $fileName
    ]);
    exit();
}

// Validar que o nome não está vazio
if (empty($fileName) || $fileName === '.png' || $fileName === '.jpg' || $fileName === '.jpeg') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Nome de arquivo inválido ou vazio',
        'received_filename' => $fileName
    ]);
    exit();
}

// ============================================
// SALVAR ARQUIVO
// ============================================

// Caminho completo para salvar o arquivo
$uploadDir = __DIR__ . '/';
$target = $uploadDir . $fileName;

// Verificar se diretório tem permissão de escrita
if (!is_writable($uploadDir)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Diretório sem permissão de escrita',
        'directory' => $uploadDir
    ]);
    exit();
}

// Mover arquivo para o destino COM O NOME CORRETO
if (!move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Falha ao salvar arquivo no servidor',
        'target_path' => $target
    ]);
    exit();
}

// Verificar se arquivo foi realmente salvo
if (!file_exists($target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Arquivo não foi salvo corretamente']);
    exit();
}

// ============================================
// RETORNAR SUCESSO
// ============================================

// Gerar URL pública
$baseUrl = 'https://metarh.com.br/wp-content/uploads/assinaturas/';
$fileUrl = $baseUrl . $fileName;

// Retornar sucesso com a URL
http_response_code(200);
echo json_encode([
    'success' => true,
    'url' => $fileUrl,
    'filename' => $fileName,
    'message' => 'Upload realizado com sucesso!',
    'size' => filesize($target)
]);
exit();

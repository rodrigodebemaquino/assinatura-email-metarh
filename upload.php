<?php
/**
 * Upload de Assinaturas METARH - VERSÃO REFORÇADA
 * 
 * Endpoint: https://metarh.com.br/wp-content/uploads/assinaturas/upload.php
 * 
 * IMPORTANTE: Este arquivo FORÇA o nome correto do arquivo
 */

// Configuração de CORS
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Log de debug
error_log("=== UPLOAD REQUEST RECEBIDO ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);

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

error_log("Auth Header: " . $authHeader);

if ($authHeader !== 'Bearer METARH2026#4886') {
    http_response_code(401);
    echo json_encode(['error' => 'Token de autorização inválido.']);
    exit();
}

// Verificar se o arquivo foi enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    error_log("Erro no upload: " . (isset($_FILES['file']) ? $_FILES['file']['error'] : 'arquivo não enviado'));
    http_response_code(400);
    echo json_encode(['error' => 'Nenhum arquivo foi enviado ou houve erro no upload.']);
    exit();
}

$file = $_FILES['file'];

// LOG: Nome original recebido
error_log("Nome original recebido do cliente: " . $file['name']);

// Validar tipo de arquivo (apenas PNG)
$allowedTypes = ['image/png'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

error_log("MIME Type detectado: " . $mimeType);

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

// ============================================
// SANITIZAÇÃO FORÇADA DO NOME DO ARQUIVO
// ============================================

// Pegar nome original
$originalFileName = $file['name'];

// Sanitizar: manter apenas letras, números, hífens e ponto
$fileName = preg_replace('/[^a-z0-9\-\.]/i', '', basename($originalFileName));

// LOG: Nome após sanitização
error_log("Nome após sanitização: " . $fileName);

// PROTEÇÃO CRÍTICA: Bloquear banner-assinatura.png
if (strtolower($fileName) === 'banner-assinatura.png') {
    error_log("BLOQUEADO: Tentativa de upload com nome reservado!");
    http_response_code(400);
    echo json_encode([
        'error' => 'Nome de arquivo não permitido. O arquivo "banner-assinatura.png" é reservado.',
        'received_filename' => $fileName,
        'original_filename' => $originalFileName
    ]);
    exit();
}

// Validação extra: garantir que tem nome válido
if (empty($fileName) || $fileName === '.png') {
    error_log("BLOQUEADO: Nome de arquivo vazio ou inválido!");
    http_response_code(400);
    echo json_encode([
        'error' => 'Nome de arquivo inválido.',
        'received_filename' => $fileName
    ]);
    exit();
}

// ============================================
// SALVAR ARQUIVO COM NOME CORRETO
// ============================================

// Diretório de destino (mesmo diretório deste script)
$uploadDir = __DIR__ . '/';
$uploadPath = $uploadDir . $fileName;

error_log("Caminho de destino: " . $uploadPath);

// Verificar se o diretório existe e tem permissões de escrita
if (!is_dir($uploadDir)) {
    error_log("ERRO: Diretório não existe: " . $uploadDir);
    http_response_code(500);
    echo json_encode(['error' => 'Diretório de upload não existe.']);
    exit();
}

if (!is_writable($uploadDir)) {
    error_log("ERRO: Diretório sem permissão de escrita: " . $uploadDir);
    http_response_code(500);
    echo json_encode(['error' => 'Diretório de upload não tem permissão de escrita.']);
    exit();
}

// Mover arquivo para o destino COM O NOME CORRETO
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    error_log("ERRO: Falha ao mover arquivo de " . $file['tmp_name'] . " para " . $uploadPath);
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar o arquivo no servidor.']);
    exit();
}

// Verificar se o arquivo foi realmente salvo com o nome correto
if (!file_exists($uploadPath)) {
    error_log("ERRO CRÍTICO: Arquivo não existe após move_uploaded_file!");
    http_response_code(500);
    echo json_encode(['error' => 'Arquivo não foi salvo corretamente.']);
    exit();
}

// LOG DE SUCESSO
error_log("✓ SUCESSO: Arquivo salvo como: " . $fileName);
error_log("✓ Caminho completo: " . $uploadPath);
error_log("✓ Tamanho: " . filesize($uploadPath) . " bytes");

// Gerar URL pública do arquivo
$baseUrl = 'https://metarh.com.br/wp-content/uploads/assinaturas/';
$fileUrl = $baseUrl . $fileName;

error_log("✓ URL gerada: " . $fileUrl);

// Retornar sucesso com a URL
http_response_code(200);
echo json_encode([
    'success' => true,
    'url' => $fileUrl,
    'filename' => $fileName,
    'message' => 'Upload realizado com sucesso!',
    'debug' => [
        'original_name' => $originalFileName,
        'saved_as' => $fileName,
        'size' => filesize($uploadPath)
    ]
]);

error_log("=== UPLOAD CONCLUÍDO COM SUCESSO ===");
exit();

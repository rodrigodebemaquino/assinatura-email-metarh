<?php
/**
 * Upload de Assinaturas METARH
 * Versão Corrigida - Usa o nome correto do arquivo
 */

// Permitir CORS
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Responder a preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Token de autorização
$TOKEN = 'METARH2026#4886';

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

// Validar token
if (!isset($_SERVER['HTTP_AUTHORIZATION']) || $_SERVER['HTTP_AUTHORIZATION'] !== "Bearer $TOKEN") {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit();
}

// Validar arquivo enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não enviado']);
    exit();
}

// Validar tipo de arquivo
$allowed = ['image/png', 'image/jpeg'];
if (!in_array($_FILES['file']['type'], $allowed)) {
    http_response_code(415);
    echo json_encode(['error' => 'Tipo de arquivo inválido. Apenas PNG ou JPEG.']);
    exit();
}

// ============================================
// USAR O NOME CORRETO DO ARQUIVO
// ============================================

// Pegar o nome original enviado pelo cliente
$fileName = basename($_FILES['file']['name']);

// Sanitizar o nome (remover caracteres perigosos)
$fileName = preg_replace('/[^a-z0-9\-\_\.]/i', '', $fileName);

// PROTEÇÃO: Bloquear sobrescrita do banner
if (strtolower($fileName) === 'banner-assinatura.png') {
    http_response_code(400);
    echo json_encode(['error' => 'Nome de arquivo reservado']);
    exit();
}

// Validar que o nome não está vazio
if (empty($fileName) || $fileName === '.png' || $fileName === '.jpg') {
    http_response_code(400);
    echo json_encode(['error' => 'Nome de arquivo inválido']);
    exit();
}

// Caminho completo para salvar o arquivo
$target = __DIR__ . '/' . $fileName;

// Mover arquivo para o destino COM O NOME CORRETO
if (!move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar arquivo']);
    exit();
}

// Gerar URL pública
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

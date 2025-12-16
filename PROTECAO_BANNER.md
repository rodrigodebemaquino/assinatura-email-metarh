# Proteção contra sobrescrita do Banner

## Problema Identificado
O arquivo `banner-assinatura.png` estava sendo sobrescrito pelos uploads de assinaturas.

## Soluções Implementadas

### 1. Validação no Frontend (JavaScript)
**Arquivo**: `App.tsx`

```typescript
// Gera nome: nome-departamento.png
const fileName = `${cleanName}-${cleanRole}.png`;

// PROTEÇÃO 1: Bloqueia se for banner-assinatura.png
if (fileName.toLowerCase() === 'banner-assinatura.png') {
  throw new Error('Nome de arquivo inválido');
}

// PROTEÇÃO 2: Garante que nome e departamento não estão vazios
if (!cleanName || !cleanRole) {
  throw new Error('Preencha nome e departamento');
}
```

### 2. Validação no Backend (PHP)
**Arquivo**: `upload.php`

```php
// Recebe o nome do arquivo enviado
$fileName = basename($file['name']);

// PROTEÇÃO: Bloqueia banner-assinatura.png
if (strtolower($fileName) === 'banner-assinatura.png') {
    http_response_code(400);
    echo json_encode(['error' => 'Nome reservado']);
    exit();
}

// Log para debug
error_log("Upload recebido: " . $fileName);
```

## Como funciona

### Fluxo Normal:
1. Usuário preenche: **Nome**: "João Silva" | **Departamento**: "Marketing"
2. JavaScript gera: `joao-silva-marketing.png`
3. Validações passam ✅
4. PHP recebe e salva: `joao-silva-marketing.png`
5. Retorna URL: `https://metarh.com.br/wp-content/uploads/assinaturas/joao-silva-marketing.png`

### Fluxo Bloqueado (se tentar):
1. Se por algum motivo o nome gerado for `banner-assinatura.png`
2. JavaScript bloqueia ❌ antes de enviar
3. Se passar, PHP bloqueia ❌ antes de salvar
4. Usuário recebe mensagem de erro

## Logs de Debug

### No Console do Navegador (F12):
```
Iniciando geração...
Nome do arquivo gerado: joao-silva-marketing.png
Enviando para https://metarh.com.br/wp-content/uploads/assinaturas/upload.php
Response: 200 {"success":true,"url":"...","filename":"joao-silva-marketing.png"}
```

### No Servidor (error.log do PHP):
```
Upload recebido: joao-silva-marketing.png
```

## Verificação

Para confirmar que está funcionando:

1. **Teste normal**: Preencha nome e departamento → deve gerar `nome-departamento.png`
2. **Verifique o console**: Deve mostrar o nome gerado
3. **Verifique o servidor**: O arquivo salvo deve ter o nome correto
4. **Verifique a URL**: Deve conter o nome correto

## Arquivos Protegidos

- ✅ `banner-assinatura.png` - **NUNCA** será sobrescrito
- ✅ Qualquer arquivo com nome vazio ou inválido será bloqueado

## Atualização no WordPress

Faça upload do novo `upload.php` para:
```
wp-content/uploads/assinaturas/upload.php
```

Substitua o arquivo antigo pelo novo que contém as proteções.

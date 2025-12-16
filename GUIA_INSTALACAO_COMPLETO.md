# Guia de Instalação - Correção CORS

## Problema
Após corrigir o nome do arquivo, o erro CORS voltou.

## Solução Completa

### Passo 1: Atualizar upload.php

1. **Acesse o WordPress** via FTP ou File Manager
2. **Navegue até**: `wp-content/uploads/assinaturas/`
3. **Substitua o arquivo `upload.php`** pelo novo:
   - Use o arquivo: `upload-wordpress.php`
   - Renomeie para: `upload.php`

### Passo 2: Adicionar .htaccess

1. **No mesmo diretório** (`wp-content/uploads/assinaturas/`)
2. **Crie um arquivo** chamado `.htaccess`
3. **Cole o conteúdo** do arquivo `.htaccess-assinaturas`

### Passo 3: Verificar Permissões

Execute via SSH ou File Manager:

```bash
# Permissões do diretório
chmod 755 wp-content/uploads/assinaturas/

# Permissões do PHP
chmod 644 wp-content/uploads/assinaturas/upload.php

# Permissões do .htaccess
chmod 644 wp-content/uploads/assinaturas/.htaccess
```

### Passo 4: Testar

1. Abra o site: https://assinatura-email-metarh.vercel.app
2. Preencha os dados
3. Clique em "Gerar Assinatura"
4. Abra o Console (F12) e verifique:
   - Não deve haver erro CORS
   - Deve mostrar: `Response: 200 {"success":true,...}`

## Estrutura Final

```
wp-content/uploads/assinaturas/
├── .htaccess                    (NOVO - configuração CORS)
├── upload.php                   (ATUALIZADO - nome correto)
├── Banner-assinatura.png        (EXISTENTE - não mexer)
└── [arquivos gerados]           (nome-departamento.png)
```

## Melhorias no Novo upload.php

### 1. CORS Reforçado
```php
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // Cache por 24h
```

### 2. Compatibilidade com Diferentes Servidores
```php
// Tenta pegar Authorization de 3 formas diferentes
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'];
}
```

### 3. Mensagens de Erro Detalhadas
```php
echo json_encode([
    'error' => 'Descrição do erro',
    'debug_info' => 'Informação adicional'
]);
```

## Solução Alternativa (Se CORS Persistir)

### Opção A: Adicionar ao .htaccess principal do WordPress

Adicione no arquivo `wp-content/.htaccess`:

```apache
<IfModule mod_headers.c>
    <FilesMatch "upload\.php$">
        Header set Access-Control-Allow-Origin "https://assinatura-email-metarh.vercel.app"
        Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    </FilesMatch>
</IfModule>
```

### Opção B: Usar Plugin de CORS

1. Instale o plugin: **"WP CORS"** ou **"Enable CORS"**
2. Configure para permitir: `https://assinatura-email-metarh.vercel.app`

### Opção C: Configuração no wp-config.php

Adicione no `wp-config.php` (antes de "That's all, stop editing!"):

```php
// Permitir CORS para uploads
header('Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app');
header('Access-Control-Allow-Credentials: true');
```

## Verificação de CORS

### Teste via cURL:

```bash
curl -X OPTIONS \
  https://metarh.com.br/wp-content/uploads/assinaturas/upload.php \
  -H "Origin: https://assinatura-email-metarh.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type" \
  -v
```

Deve retornar:
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://assinatura-email-metarh.vercel.app
< Access-Control-Allow-Methods: POST, GET, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## Checklist de Instalação

- [ ] Arquivo `upload.php` atualizado
- [ ] Arquivo `.htaccess` criado no diretório assinaturas
- [ ] Permissões configuradas (755 para pasta, 644 para arquivos)
- [ ] Teste de upload realizado
- [ ] Console sem erros CORS
- [ ] Arquivo salvo com nome correto
- [ ] URL retornada está correta

## Suporte

Se o erro CORS persistir, me envie:

1. **Mensagem de erro completa** do Console (F12)
2. **Response do servidor** (aba Network → upload.php → Response)
3. **Versão do PHP** do servidor
4. **Servidor web** (Apache/Nginx)

Com essas informações posso criar uma solução específica para seu servidor.

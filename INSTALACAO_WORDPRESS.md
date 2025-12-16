# Instalação do Upload no WordPress

## Passo 1: Criar o diretório

1. Acesse seu servidor WordPress via FTP ou painel de controle
2. Navegue até: `wp-content/uploads/`
3. Crie uma pasta chamada: `assinaturas`

## Passo 2: Upload do arquivo PHP

1. Faça upload do arquivo `upload.php` para: `wp-content/uploads/assinaturas/upload.php`

## Passo 3: Configurar permissões

Execute via SSH ou painel de controle:

```bash
chmod 755 wp-content/uploads/assinaturas/
chmod 644 wp-content/uploads/assinaturas/upload.php
```

## Passo 4: Testar o endpoint

Acesse no navegador:
```
https://metarh.com.br/wp-content/uploads/assinaturas/upload.php
```

Você deve ver uma mensagem de erro "Método não permitido" - isso é normal e significa que o arquivo está funcionando.

## Estrutura de arquivos esperada:

```
wp-content/
└── uploads/
    └── assinaturas/
        ├── upload.php              (arquivo de upload)
        ├── Banner-assinatura.png   (banner existente)
        └── [arquivos gerados]      (nome-departamento.png)
```

## Segurança

O arquivo `upload.php`:
- ✅ Verifica token Bearer: `METARH2026#4886`
- ✅ Aceita apenas arquivos PNG
- ✅ Sanitiza nomes de arquivo
- ✅ Permite apenas requisições do domínio Vercel
- ✅ Valida tipo MIME do arquivo

## Solução de problemas

### Erro 403 (Forbidden)
- Verifique as permissões do diretório
- Certifique-se que o arquivo tem permissão de execução

### Erro 500 (Internal Server Error)
- Verifique os logs de erro do PHP
- Certifique-se que a função `getallheaders()` está disponível

### Erro CORS
- Verifique se o domínio no header `Access-Control-Allow-Origin` está correto
- Se usar domínio customizado, atualize a linha 11 do `upload.php`

## Formato da resposta de sucesso:

```json
{
  "success": true,
  "url": "https://metarh.com.br/wp-content/uploads/assinaturas/rodrigo-aquino-marketing.png",
  "filename": "rodrigo-aquino-marketing.png",
  "message": "Upload realizado com sucesso!"
}
```

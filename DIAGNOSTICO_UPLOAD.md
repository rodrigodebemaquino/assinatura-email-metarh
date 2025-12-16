# Diagnóstico: Arquivo sendo renomeado para banner-assinatura.png

## Problema Identificado

O arquivo está sendo gerado corretamente no frontend (`nome-departamento.png`), mas ao chegar no WordPress está sendo salvo como `banner-assinatura.png`.

## Possíveis Causas

### 1. Plugin do WordPress
Alguns plugins renomeiam arquivos automaticamente:
- **Media File Renamer**
- **Safe SVG**
- **WP Smush**
- **EWWW Image Optimizer**

**Solução**: Desative temporariamente todos os plugins e teste novamente.

### 2. Tema do WordPress
Alguns temas têm hooks que modificam uploads.

**Solução**: Mude temporariamente para tema padrão (Twenty Twenty-Four).

### 3. Arquivo `.htaccess`
Regras de reescrita podem estar alterando o nome.

**Solução**: Verifique se há regras em `wp-content/uploads/assinaturas/.htaccess`

### 4. Outro script PHP
Pode haver outro arquivo `upload.php` ou `index.php` interceptando.

**Solução**: Verifique se existe `wp-content/uploads/assinaturas/index.php`

## Como Diagnosticar

### Passo 1: Verificar Logs do PHP

Acesse os logs de erro do PHP no servidor. O novo `upload.php` gera logs detalhados:

```
=== UPLOAD REQUEST RECEBIDO ===
Método: POST
Auth Header: Bearer METARH2026#4886
Nome original recebido do cliente: joao-silva-marketing.png
MIME Type detectado: image/png
Nome após sanitização: joao-silva-marketing.png
Caminho de destino: /path/to/wp-content/uploads/assinaturas/joao-silva-marketing.png
✓ SUCESSO: Arquivo salvo como: joao-silva-marketing.png
✓ URL gerada: https://metarh.com.br/wp-content/uploads/assinaturas/joao-silva-marketing.png
=== UPLOAD CONCLUÍDO COM SUCESSO ===
```

**Onde encontrar os logs**:
- cPanel: `Logs → Error Log`
- SSH: `tail -f /var/log/apache2/error.log` ou `tail -f /var/log/php-fpm/error.log`

### Passo 2: Verificar resposta do servidor

No console do navegador (F12), você verá:

```javascript
Response: 200 {
  "success": true,
  "url": "https://metarh.com.br/wp-content/uploads/assinaturas/joao-silva-marketing.png",
  "filename": "joao-silva-marketing.png",
  "debug": {
    "original_name": "joao-silva-marketing.png",
    "saved_as": "joao-silva-marketing.png",
    "size": 12345
  }
}
```

Se `saved_as` for diferente de `original_name`, o problema está no PHP.

### Passo 3: Verificar arquivo no servidor

Via FTP ou SSH, liste os arquivos:

```bash
ls -la wp-content/uploads/assinaturas/
```

Você deve ver:
```
Banner-assinatura.png  (antigo, não deve mudar)
joao-silva-marketing.png  (novo, gerado agora)
```

## Soluções

### Solução 1: Usar o novo upload.php

O novo `upload.php` tem:
- ✅ Logs extensivos em cada etapa
- ✅ Validação do nome antes e depois de salvar
- ✅ Verificação se arquivo foi salvo corretamente
- ✅ Retorna informações de debug

**Faça upload deste arquivo para o WordPress**.

### Solução 2: Desativar plugins

Temporariamente desative todos os plugins e teste.

### Solução 3: Verificar permissões

```bash
# Via SSH
chmod 755 wp-content/uploads/assinaturas/
chmod 644 wp-content/uploads/assinaturas/upload.php
chown www-data:www-data wp-content/uploads/assinaturas/*
```

### Solução 4: Criar diretório separado

Se nada funcionar, crie um diretório fora do WordPress:

```
public_html/
  ├── assinaturas-metarh/
  │   └── upload.php
  └── wp-content/
```

E atualize o endpoint no App.tsx para:
```typescript
const endpoint = 'https://metarh.com.br/assinaturas-metarh/upload.php';
```

## Teste Rápido

Execute este comando no servidor para verificar se há outros scripts:

```bash
find wp-content/uploads/assinaturas/ -name "*.php" -type f
```

Deve retornar apenas:
```
wp-content/uploads/assinaturas/upload.php
```

Se houver outros arquivos PHP, eles podem estar interceptando o upload.

## Próximos Passos

1. **Faça upload do novo `upload.php`**
2. **Teste o upload**
3. **Verifique os logs do PHP**
4. **Me envie os logs** para análise

O novo arquivo tem logs detalhados que vão mostrar exatamente onde o nome está sendo alterado.

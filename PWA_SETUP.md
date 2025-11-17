# Configuração PWA - Revista Habitare

O projeto foi configurado como Progressive Web App (PWA). Aqui estão as informações importantes:

## ✅ O que já está configurado:

1. **manifest.json** - Arquivo de manifesto do PWA com informações do app
2. **Service Worker (sw.js)** - Cache offline e funcionalidades PWA
3. **Registro automático** - O service worker é registrado automaticamente
4. **Meta tags** - Configuradas para iOS e Android

## 📱 Ícones PWA

Para uma experiência completa, você precisa criar os seguintes ícones:

### Ícones necessários:
- `/public/img/icon-192.png` - 192x192 pixels (PNG)
- `/public/img/icon-512.png` - 512x512 pixels (PNG)

### Como gerar os ícones:

1. **Ferramentas online:**
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Builder](https://www.pwabuilder.com/imageGenerator)

2. **Usando o ícone existente:**
   - Você pode usar o `/public/img/h.ico` como base
   - Converta para PNG nos tamanhos 192x192 e 512x512
   - Salve em `/public/img/icon-192.png` e `/public/img/icon-512.png`

3. **Comando rápido (se tiver ImageMagick instalado):**
   ```bash
   # Converter ICO para PNG (ajuste conforme necessário)
   convert public/img/h.ico -resize 192x192 public/img/icon-192.png
   convert public/img/h.ico -resize 512x512 public/img/icon-512.png
   ```

## 🧪 Testando o PWA

### Chrome DevTools:
1. Abra o DevTools (F12)
2. Vá em "Application" > "Service Workers"
3. Verifique se o service worker está registrado
4. Vá em "Application" > "Manifest" para ver o manifest

### Teste de instalação:
1. No Chrome/Edge: aparecerá um botão de instalação na barra de endereços
2. No mobile: aparecerá um prompt "Adicionar à tela inicial"

### Teste offline:
1. No DevTools, vá em "Network"
2. Marque "Offline"
3. Recarregue a página - ela deve funcionar com cache

## 🔧 Funcionalidades PWA

- ✅ **Instalável** - Pode ser instalado como app
- ✅ **Cache offline** - Funciona sem internet (recursos cacheados)
- ✅ **Atualizações automáticas** - Service worker verifica atualizações
- ✅ **Tema personalizado** - Cor do tema: #c45527
- ✅ **Modo standalone** - Abre sem barra do navegador quando instalado

## 📝 Notas importantes

- O service worker cacheia CSS, JS e imagens estáticas
- Uploads e páginas admin não são cacheados (sempre buscam da rede)
- O cache é atualizado automaticamente quando há novas versões
- Para forçar atualização, limpe o cache do navegador

## 🚀 Próximos passos (opcional)

- Adicionar notificações push
- Implementar sincronização em background
- Adicionar mais shortcuts no manifest
- Criar splash screen customizada


// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60000); // A cada 1 minuto

        // Listener para quando uma nova versão estiver disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              if (confirm('Nova versão disponível! Deseja atualizar?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('[PWA] Erro ao registrar Service Worker:', error);
      });

    // Listener para quando o service worker estiver pronto
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Novo Service Worker ativo');
    });
  });
}

// Detectar se está instalado como PWA
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Pronto para instalação');
  // Você pode salvar o evento e mostrar um botão de instalação customizado
  window.deferredPrompt = e;
});

// Detectar se já está instalado
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('[PWA] Executando como PWA instalado');
  document.documentElement.classList.add('pwa-installed');
}


// Desabilitar Service Worker na área admin para evitar problemas de redirecionamento
// Executar IMEDIATAMENTE, sem esperar DOMContentLoaded
(function() {
  if ('serviceWorker' in navigator) {
    // Desregistrar Service Worker quando estiver na área admin
    if (window.location.pathname.startsWith('/admin')) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('[Admin] Service Worker desregistrado para evitar conflitos');
            // Forçar reload se necessário
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      });
    }
  }
})();


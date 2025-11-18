/**
 * Middleware para verificar autenticação de admin
 * Redireciona para login se não estiver autenticado
 */
export const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/admin/login?redirect=' + encodeURIComponent(req.originalUrl));
};


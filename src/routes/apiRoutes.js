import express from 'express';
import { ApiController } from '../controllers/ApiController.js';
import { requireApiKey } from '../middleware/requireApiKey.js';

export const createApiRoutes = (db) => {
  const router = express.Router();
  const apiController = new ApiController(db);

  // Documentação (sem autenticação)
  router.get('/doc', (req, res) => apiController.documentation(req, res));

  // Aplicar autenticação em todas as rotas exceto /doc
  router.use((req, res, next) => {
    if (req.path === '/doc') {
      return next();
    }
    requireApiKey(req, res, next);
  });

  // Rotas da API
  router.get('/articles', (req, res, next) => apiController.listArticles(req, res, next));
  router.get('/articles/:id', (req, res, next) => apiController.getArticleById(req, res, next));
  router.get('/articles/slug/:slug', (req, res, next) => apiController.getArticleBySlug(req, res, next));
  router.get('/articles/:id/pins', (req, res, next) => apiController.getArticlePins(req, res, next));
  router.get('/articles/:id/sections', (req, res, next) => apiController.getArticleSections(req, res, next));
  router.get('/articles/:id/images', (req, res, next) => apiController.getArticleImages(req, res, next));
  router.get('/articles/:id/complete', (req, res, next) => apiController.getArticleComplete(req, res, next));

  return router;
};


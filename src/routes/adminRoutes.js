import express from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { uploadFields } from '../config/multer.js';

export const createAdminRoutes = (db) => {
  const router = express.Router();
  const adminController = new AdminController(db);

  // Rotas públicas de autenticação
  router.get('/login', (req, res) => adminController.showLogin(req, res));
  router.post('/login', (req, res) => adminController.login(req, res));
  router.get('/check-auth', (req, res) => adminController.checkAuth(req, res));
  router.post('/logout', (req, res) => adminController.logout(req, res));

  // Rotas protegidas
  router.get('/', requireAuth, (req, res, next) => adminController.dashboard(req, res, next));
  router.post('/articles', requireAuth, uploadFields, (req, res, next) => adminController.createArticle(req, res, next));
  router.get('/articles/:id/pins', requireAuth, (req, res, next) => adminController.showPins(req, res, next));
  router.post('/articles/:id/pins', requireAuth, (req, res, next) => adminController.savePins(req, res, next));
  router.get('/articles/:id/edit', requireAuth, (req, res, next) => adminController.showEdit(req, res, next));
  router.post('/articles/:id', requireAuth, uploadFields, (req, res, next) => adminController.updateArticle(req, res, next));
  router.delete('/articles/:id', requireAuth, (req, res, next) => adminController.deleteArticle(req, res, next));

  return router;
};


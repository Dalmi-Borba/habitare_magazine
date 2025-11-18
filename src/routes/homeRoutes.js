import express from 'express';
import { HomeController } from '../controllers/HomeController.js';

export const createHomeRoutes = (db) => {
  const router = express.Router();
  const homeController = new HomeController(db);

  router.get('/', (req, res, next) => homeController.index(req, res, next));
  router.get('/artigos/:slug', (req, res, next) => homeController.showArticle(req, res, next));
  router.get('/em-desenvolvimento', (req, res) => homeController.comingSoon(req, res));

  return router;
};


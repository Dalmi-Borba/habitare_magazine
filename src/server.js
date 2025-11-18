import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { sessionConfig } from './config/session.js';
import { uploadDir } from './config/multer.js';
import { createHomeRoutes } from './routes/homeRoutes.js';
import { createAdminRoutes } from './routes/adminRoutes.js';
import { createApiRoutes } from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5444;

// Debug: verificar se variáveis do .env estão sendo lidas
console.log('Variáveis do ambiente:');
console.log('  INSTAGRAM_URL:', process.env.INSTAGRAM_URL || '(não definida, usando padrão)');
console.log('  MARKETPLACE_URL:', process.env.MARKETPLACE_URL || '(não definida, usando padrão)');

const app = express();
const db = await initDatabase();

// Criar diretório de uploads se não existir
fs.mkdirSync(uploadDir, { recursive: true });

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session(sessionConfig));

// Configuração de views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Locals (variáveis globais para views)
app.locals.brand = {
  name: 'Revista Habitare',
  tagline: 'Arquitetura, design e ativações para marcas que pensam como publishers.'
};

app.locals.formatDate = (dateString) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

app.locals.readingLabel = (minutes) => `${minutes} min de leitura`;

// Middleware para adicionar db ao request e garantir que variáveis do .env estejam disponíveis
// IMPORTANTE: Este middleware deve rodar ANTES das rotas para garantir que as variáveis estejam disponíveis
app.use((req, res, next) => {
  req.db = db;
  
  // Variáveis específicas da requisição
  res.locals.currentPath = req.path;
  
  // Garantir que variáveis do .env estejam sempre disponíveis nas views
  // O Express mescla app.locals com res.locals automaticamente, mas garantimos aqui que as do .env estejam corretas
  res.locals.instagramUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com';
  res.locals.marketplaceUrl = process.env.MARKETPLACE_URL || '/em-desenvolvimento';
  
  next();
});

// Rotas
app.use('/', createHomeRoutes(db));
app.use('/admin', createAdminRoutes(db));
app.use('/api', createApiRoutes(db));

// Rota /doc redireciona para /api/doc
app.get('/doc', (req, res) => {
  res.redirect('/api/doc');
});

// Servir manifest.json com tipo MIME correto
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, '..', 'public', 'manifest.json'));
});

// Servir service worker com tipo MIME correto
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, '..', 'public', 'sw.js'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('not-found', {
    pageTitle: '404 — Página não encontrada',
    message: 'Nada por aqui. Que tal voltar para a edição atual?'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/admin') && req.accepts('json')) {
    return res.status(500).json({ error: 'Erro interno ao processar pins.' });
  }
  res.status(500).render('not-found', {
    pageTitle: 'Erro inesperado',
    message: 'Algo saiu do roteiro. Atualize a página ou tente novamente.'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Revista Habitare pronta em http://localhost:${PORT}`);
});

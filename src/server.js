import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { initDatabase, queries } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5444;
const SHOP_BASE_URL = process.env.SHOP_BASE_URL || 'https://loja.habitare.com/produtos';
const TRACKING_SOURCE = process.env.TRACKING_SOURCE || 'revista-habitare';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'habitare2024';

const app = express();
const db = await initDatabase();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    const prefix = file.fieldname === 'hero_image' ? 'hero' : 'img';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });
const uploadFields = multer({ storage }).fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'article_images', maxCount: 20 }
]);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'habitare-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.locals.brand = {
  name: 'Revista Habitare',
  tagline: 'Arquitetura, design e ativações para marcas que pensam como publishers.'
};

app.locals.instagramUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com';
app.locals.marketplaceUrl = process.env.MARKETPLACE_URL || '/em-desenvolvimento';

app.locals.formatDate = (dateString) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

app.locals.readingLabel = (minutes) => `${minutes} min de leitura`;

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

const runStatement = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });

const slugify = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildTrackedLink = (pin) => {
  const base =
    pin.cta_path && pin.cta_path.startsWith('http')
      ? pin.cta_path
      : `${SHOP_BASE_URL.replace(/\/$/, '')}/${(pin.cta_path || pin.slug).replace(/^\//, '')}`;

  const [cleanBase, baseQuery] = base.split('?');
  const params = new URLSearchParams(baseQuery || '');

  if (pin.tracking_code) {
    const trackingPairs = new URLSearchParams(pin.tracking_code);
    trackingPairs.forEach((value, key) => params.set(key, value));
  }

  if (!params.has('utm_source')) {
    params.set('utm_source', TRACKING_SOURCE);
  }

  params.set('utm_content', pin.slug);

  return `${cleanBase}?${params.toString()}`;
};

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/admin/login?redirect=' + encodeURIComponent(req.originalUrl));
};

// Página de login
app.get('/admin/login', (req, res) => {
  // Se já estiver autenticado, redirecionar para a página de destino
  if (req.session.isAuthenticated) {
    const redirect = req.query.redirect || '/admin';
    return res.redirect(redirect);
  }
  
  const redirect = req.query.redirect || '/admin';
  const error = req.query.error;
  res.render('admin/login', {
    pageTitle: 'Login - Admin Habitare',
    metaDescription: 'Acesso administrativo',
    redirect,
    error
  });
});

// Processar login
app.post('/admin/login', (req, res) => {
  const { username, password, redirect } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    res.redirect(redirect || '/admin');
  } else {
    res.redirect(`/admin/login?error=credenciais-invalidas&redirect=${encodeURIComponent(redirect || '/admin')}`);
  }
});

// Verificar autenticação (endpoint para AJAX)
app.get('/admin/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.isAuthenticated });
});

// Logout
app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const articles = await queries.getArticles(db);
    res.render('admin/index', {
      pageTitle: 'Painel editorial Habitare',
      metaDescription: 'Gerencie artigos, uploads e pins interativos.',
      articles,
      flash: req.query.flash,
      today: new Date().toISOString().slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/admin/articles', requireAuth, uploadFields, async (req, res, next) => {
  try {
    const { title, body_text, hero_image_url } = req.body;

    if (!title?.trim() || !body_text?.trim()) {
      return res.status(400).render('not-found', {
        pageTitle: 'Dados inválidos',
        message: 'Preencha título e texto da matéria para publicar.'
      });
    }

    const cleanTitle = title.trim();
    // body_text agora vem do Quill como HTML
    const bodyHtml = body_text.trim();
    // Extrair texto puro para excerpt (remover tags HTML)
    const cleanBody = bodyHtml.replace(/<[^>]*>/g, '').trim();
    const finalSlug = slugify(cleanTitle);
    const heroFile = req.files?.hero_image?.[0];
    const heroImagePath =
      heroFile ? `/uploads/${heroFile.filename}` : hero_image_url?.trim() || 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1600&q=80';
    const publishedDate = new Date().toISOString().slice(0, 10);
    const readingTime = Math.max(3, Math.ceil(cleanBody.split(/\s+/).length / 120));
    const subtitle = cleanBody.split('.').shift()?.trim() || 'Matéria interativa publicada pela Habitare.';
    const highlightQuote = subtitle || cleanTitle;
    const highlightHelper =
      cleanBody.split('.').slice(1, 3).join('. ').trim() || 'Conteúdo curado pelo estúdio Habitare.';

    const result = await runStatement(
      `INSERT INTO articles (
        slug, title, subtitle, category, author, author_role, published_at, reading_time,
        hero_image, hero_caption, excerpt, body_html, highlight_quote, highlight_focus,
        highlight_stat_label, highlight_stat_value, highlight_stat_helper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalSlug,
        cleanTitle,
        subtitle,
        'Edição interativa',
        'Estúdio Habitare',
        'Conteúdo & ativações',
        publishedDate,
        readingTime,
        heroImagePath,
        'Imagem enviada pelo editor Habitare',
        cleanBody.substring(0, 200), // excerpt limitado
        bodyHtml,
        highlightQuote,
        'Pins interativos',
        'Cliques rastreáveis',
        '100%',
        highlightHelper || 'dos hotspots são rastreados em tempo real.'
      ]
    );

    const articleId = result.lastID;

    // Processar múltiplas imagens se houver
    const articleImages = req.files?.article_images || [];
    if (articleImages.length > 0) {
      for (let i = 0; i < articleImages.length; i++) {
        const file = articleImages[i];
        await runStatement(
          `INSERT INTO article_images (article_id, image_url, sort_order) VALUES (?, ?, ?)`,
          [articleId, `/uploads/${file.filename}`, i]
        );
      }
    }

    res.redirect('/admin?flash=artigo-criado');
  } catch (error) {
    if (error?.message?.includes('UNIQUE constraint failed: articles.slug')) {
      return res.status(400).render('not-found', {
        pageTitle: 'Slug duplicado',
        message: 'Já existe um artigo com este título. Tente outro nome.'
      });
    }
    next(error);
  }
});

app.get('/admin/articles/:id/pins', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const article = await queries.getArticleById(db, articleId);

    if (!article) {
      return res.status(404).render('not-found', {
        pageTitle: 'Artigo não encontrado',
        message: 'Não encontramos este artigo para edição de pins.'
      });
    }

    const pins = await queries.getPinsByArticleId(db, article.id);

    res.render('admin/pins', {
      pageTitle: `Pins — ${article.title}`,
      metaDescription: 'Arraste e solte pins interativos sobre a imagem destaque.',
      article,
      pins
    });
  } catch (error) {
    next(error);
  }
});

app.get('/admin/articles/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const article = await queries.getArticleById(db, articleId);

    if (!article) {
      return res.status(404).render('not-found', {
        pageTitle: 'Artigo não encontrado',
        message: 'Não encontramos este artigo para edição.'
      });
    }

    res.render('admin/edit', {
      pageTitle: `Editar — ${article.title}`,
      metaDescription: 'Edite os detalhes do artigo.',
      article
    });
  } catch (error) {
    next(error);
  }
});

app.post('/admin/articles/:id', requireAuth, uploadFields, async (req, res, next) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const article = await queries.getArticleById(db, articleId);

    if (!article) {
      return res.status(404).render('not-found', {
        pageTitle: 'Artigo não encontrado',
        message: 'Não encontramos este artigo para edição.'
      });
    }

    const { title, body_text, hero_image_url, category, author, author_role } = req.body;

    if (!title?.trim() || !body_text?.trim()) {
      return res.status(400).render('not-found', {
        pageTitle: 'Dados inválidos',
        message: 'Preencha título e texto da matéria.'
      });
    }

    const cleanTitle = title.trim();
    // body_text agora vem do Quill como HTML
    const bodyHtml = body_text.trim();
    // Extrair texto puro para excerpt
    const cleanBody = bodyHtml.replace(/<[^>]*>/g, '').trim();
    const finalSlug = slugify(cleanTitle);
    const heroFile = req.files?.hero_image?.[0];
    const heroImagePath = heroFile
      ? `/uploads/${heroFile.filename}`
      : hero_image_url?.trim() || article.hero_image;
    const readingTime = Math.max(3, Math.ceil(cleanBody.split(/\s+/).length / 120));
    const subtitle = cleanBody.split('.').shift()?.trim() || article.subtitle;
    const highlightQuote = subtitle || cleanTitle;
    const highlightHelper =
      cleanBody.split('.').slice(1, 3).join('. ').trim() || 'Conteúdo curado pelo estúdio Habitare.';

    await runStatement(
      `UPDATE articles SET
        slug = ?, title = ?, subtitle = ?, category = ?, author = ?, author_role = ?,
        reading_time = ?, hero_image = ?, excerpt = ?, body_html = ?, highlight_quote = ?,
        highlight_stat_helper = ?
      WHERE id = ?`,
      [
        finalSlug,
        cleanTitle,
        subtitle,
        category?.trim() || article.category || 'Edição interativa',
        author?.trim() || article.author || 'Estúdio Habitare',
        author_role?.trim() || article.author_role || 'Conteúdo & ativações',
        readingTime,
        heroImagePath,
        cleanBody.substring(0, 200), // excerpt limitado
        bodyHtml,
        highlightQuote,
        highlightHelper,
        articleId
      ]
    );

    // Processar múltiplas imagens se houver
    const articleImages = req.files?.article_images || [];
    if (articleImages.length > 0) {
      // Obter o maior sort_order atual
      const existingImages = await queries.getImagesByArticleId(db, articleId);
      let nextSortOrder = existingImages.length > 0 
        ? Math.max(...existingImages.map(img => img.sort_order || 0)) + 1 
        : 0;

      for (let i = 0; i < articleImages.length; i++) {
        const file = articleImages[i];
        await runStatement(
          `INSERT INTO article_images (article_id, image_url, sort_order) VALUES (?, ?, ?)`,
          [articleId, `/uploads/${file.filename}`, nextSortOrder + i]
        );
      }
    }

    res.redirect('/admin?flash=artigo-atualizado');
  } catch (error) {
    if (error?.message?.includes('UNIQUE constraint failed: articles.slug')) {
      return res.status(400).render('not-found', {
        pageTitle: 'Slug duplicado',
        message: 'Já existe um artigo com este título. Tente outro nome.'
      });
    }
    next(error);
  }
});

app.delete('/admin/articles/:id', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const article = await queries.getArticleById(db, articleId);

    if (!article) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }

    await runStatement('DELETE FROM articles WHERE id = ?', [articleId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post('/admin/articles/:id/pins', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const article = await queries.getArticleById(db, articleId);

    if (!article) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }

    const pinsPayload = Array.isArray(req.body.pins) ? req.body.pins : [];

    await runStatement('DELETE FROM product_pins WHERE article_id = ?', [articleId]);

    for (const pin of pinsPayload) {
      const safeSlug = slugify(pin.slug || pin.name || `pin-${Date.now()}`);
      const name = pin.name?.trim() || 'Produto sem nome';
      const description = pin.description?.trim() || '';
      const price = pin.price_label?.trim() || 'Sob consulta';
      const xPercent = Math.min(Math.max(Number(pin.x_percent) || 0, 0), 100);
      const yPercent = Math.min(Math.max(Number(pin.y_percent) || 0, 0), 100);
      const ctaPath = pin.cta_path?.trim() || safeSlug;
      const tracking =
        pin.tracking_code?.trim() || `utm_source=${TRACKING_SOURCE}&utm_medium=magazine&utm_content=${safeSlug}`;
      const badge = pin.badge?.trim() || 'Destaque';

      await runStatement(
        `INSERT INTO product_pins (
          article_id, slug, name, description, price_label, x_percent, y_percent, cta_path, tracking_code, badge
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [articleId, safeSlug, name, description, price, xPercent, yPercent, ctaPath, tracking, badge]
      );
    }

    res.json({ success: true, total: pinsPayload.length });
  } catch (error) {
    next(error);
  }
});


app.get('/', async (req, res, next) => {
  try {
    const articles = await queries.getArticles(db);

    const enrichedArticles = await Promise.all(
      articles.map(async (article) => {
        const pinsRaw = await queries.getPinsByArticleId(db, article.id);
        return {
          ...article,
          pins: pinsRaw.map((pin) => ({
            ...pin,
            trackingUrl: buildTrackedLink(pin)
          })),
          pinCount: pinsRaw.length
        };
      })
    );

    // Ordenar artigos: primeiro os com pins, depois os demais
    const articlesWithPins = enrichedArticles.filter((article) => article.pinCount > 0);
    const articlesWithoutPins = enrichedArticles.filter((article) => article.pinCount === 0);
    const allArticles = [...articlesWithPins, ...articlesWithoutPins];

    // Primeiro artigo para hero section
    const heroArticle = allArticles.length > 0 ? allArticles[0] : null;
    const gridArticles = allArticles.slice(1);

    res.render('home', {
      pageTitle: `${app.locals.brand.name} — Arquitetura com alto engajamento`,
      metaDescription: app.locals.brand.tagline,
      heroArticle: heroArticle,
      articles: gridArticles
    });
  } catch (error) {
    next(error);
  }
});

app.get('/artigos/:slug', async (req, res, next) => {
  try {
    const article = await queries.getArticleBySlug(db, req.params.slug);

    if (!article) {
      return res.status(404).render('not-found', {
        pageTitle: 'Conteúdo não encontrado',
        message: 'O artigo que você procura saiu do ar ou mudou de endereço.'
      });
    }

    const sections = await queries.getSectionsByArticleId(db, article.id);
    const pinsRaw = await queries.getPinsByArticleId(db, article.id);
    const images = await queries.getImagesByArticleId(db, article.id);
    const pins = pinsRaw.map((pin) => ({
      ...pin,
      trackingUrl: buildTrackedLink(pin)
    }));

    res.render('article', {
      pageTitle: `${article.title} — ${app.locals.brand.name}`,
      metaDescription: article.subtitle,
      article,
      sections,
      pins,
      images
    });
  } catch (error) {
    next(error);
  }
});

// Página de "em desenvolvimento"
app.get('/em-desenvolvimento', (req, res) => {
  res.render('coming-soon', {
    pageTitle: 'Em Desenvolvimento — Revista Habitare',
    metaDescription: 'Estamos trabalhando nisso. Em breve você terá acesso a este conteúdo.'
  });
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

app.use((req, res) => {
  res.status(404).render('not-found', {
    pageTitle: '404 — Página não encontrada',
    message: 'Nada por aqui. Que tal voltar para a edição atual?'
  });
});

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

app.listen(PORT, () => {
  console.log(`Revista Habitare pronta em http://localhost:${PORT}`);
});

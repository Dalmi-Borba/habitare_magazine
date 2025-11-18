import { Article } from '../models/Article.js';
import { Pin } from '../models/Pin.js';
import { Image } from '../models/Image.js';
import { slugify } from '../utils/slugify.js';
import { calculateReadingTime, extractSubtitle, extractHelperText, stripHtml } from '../utils/helpers.js';

export class AdminController {
  constructor(db) {
    this.articleModel = new Article(db);
    this.pinModel = new Pin(db);
    this.imageModel = new Image(db);
  }

  /**
   * Transaction script: Exibe página de login
   */
  showLogin(req, res) {
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
  }

  /**
   * Transaction script: Processa login
   */
  async login(req, res) {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'habitare2024';
    const { username, password, redirect } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.redirect(`/admin/login?error=erro-sessao&redirect=${encodeURIComponent(redirect || '/admin')}`);
        }
        res.redirect(redirect || '/admin');
      });
    } else {
      res.redirect(`/admin/login?error=credenciais-invalidas&redirect=${encodeURIComponent(redirect || '/admin')}`);
    }
  }

  /**
   * Transaction script: Verifica autenticação (AJAX)
   */
  checkAuth(req, res) {
    res.json({ authenticated: !!req.session.isAuthenticated });
  }

  /**
   * Transaction script: Logout
   */
  logout(req, res) {
    req.session.destroy();
    res.redirect('/admin/login');
  }

  /**
   * Transaction script: Dashboard admin
   */
  async dashboard(req, res, next) {
    try {
      const articles = await this.articleModel.findAll();
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
  }

  /**
   * Transaction script: Cria novo artigo
   */
  async createArticle(req, res, next) {
    try {
      const { title, body_text, hero_image_url } = req.body;

      if (!title?.trim() || !body_text?.trim()) {
        return res.status(400).render('not-found', {
          pageTitle: 'Dados inválidos',
          message: 'Preencha título e texto da matéria para publicar.'
        });
      }

      const cleanTitle = title.trim();
      const bodyHtml = body_text.trim();
      const cleanBody = stripHtml(bodyHtml);
      const finalSlug = slugify(cleanTitle);
      const heroFile = req.files?.hero_image?.[0];
      const heroImagePath =
        heroFile ? `/uploads/${heroFile.filename}` : hero_image_url?.trim() || 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1600&q=80';
      const publishedDate = new Date().toISOString().slice(0, 10);
      const readingTime = calculateReadingTime(cleanBody);
      const subtitle = extractSubtitle(cleanBody);
      const highlightQuote = subtitle || cleanTitle;
      const highlightHelper = extractHelperText(cleanBody);

      const result = await this.articleModel.create({
        slug: finalSlug,
        title: cleanTitle,
        subtitle,
        category: 'Edição interativa',
        author: 'Estúdio Habitare',
        author_role: 'Conteúdo & ativações',
        published_at: publishedDate,
        reading_time: readingTime,
        hero_image: heroImagePath,
        hero_caption: 'Imagem enviada pelo editor Habitare',
        excerpt: cleanBody.substring(0, 200),
        body_html: bodyHtml,
        highlight_quote: highlightQuote,
        highlight_focus: 'Pins interativos',
        highlight_stat_label: 'Cliques rastreáveis',
        highlight_stat_value: '100%',
        highlight_stat_helper: highlightHelper || 'dos hotspots são rastreados em tempo real.'
      });

      const articleId = result.lastID;

      // Processar múltiplas imagens se houver
      const articleImages = req.files?.article_images || [];
      if (articleImages.length > 0) {
        const images = articleImages.map((file, index) => ({
          image_url: `/uploads/${file.filename}`,
          sort_order: index
        }));
        await this.imageModel.createMany(articleId, images);
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
  }

  /**
   * Transaction script: Exibe página de edição de pins
   */
  async showPins(req, res, next) {
    try {
      const articleId = Number.parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).render('not-found', {
          pageTitle: 'Artigo não encontrado',
          message: 'Não encontramos este artigo para edição de pins.'
        });
      }

      const pins = await this.pinModel.findByArticleId(article.id);

      res.render('admin/pins', {
        pageTitle: `Pins — ${article.title}`,
        metaDescription: 'Arraste e solte pins interativos sobre a imagem destaque.',
        article,
        pins
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Salva pins de um artigo
   */
  async savePins(req, res, next) {
    try {
      const articleId = Number.parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({ error: 'Artigo não encontrado' });
      }

      const pinsPayload = Array.isArray(req.body.pins) ? req.body.pins : [];

      await this.pinModel.deleteByArticleId(articleId);

      const pins = pinsPayload.map((pin) => ({
        slug: slugify(pin.slug || pin.name || `pin-${Date.now()}`),
        name: pin.name?.trim() || 'Produto sem nome',
        description: pin.description?.trim() || '',
        price_label: pin.price_label?.trim() || 'Sob consulta',
        x_percent: Math.min(Math.max(Number(pin.x_percent) || 0, 0), 100),
        y_percent: Math.min(Math.max(Number(pin.y_percent) || 0, 0), 100),
        cta_path: pin.cta_path?.trim() || '',
        tracking_code: '',
        badge: pin.badge?.trim() || 'Destaque'
      }));

      await this.pinModel.createMany(articleId, pins);

      res.json({ success: true, total: pins.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Exibe página de edição de artigo
   */
  async showEdit(req, res, next) {
    try {
      const articleId = Number.parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

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
  }

  /**
   * Transaction script: Atualiza artigo
   */
  async updateArticle(req, res, next) {
    try {
      const articleId = Number.parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

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
      const bodyHtml = body_text.trim();
      const cleanBody = stripHtml(bodyHtml);
      const finalSlug = slugify(cleanTitle);
      const heroFile = req.files?.hero_image?.[0];
      const heroImagePath = heroFile
        ? `/uploads/${heroFile.filename}`
        : hero_image_url?.trim() || article.hero_image;
      const readingTime = calculateReadingTime(cleanBody);
      const subtitle = extractSubtitle(cleanBody, article.subtitle);
      const highlightQuote = subtitle || cleanTitle;
      const highlightHelper = extractHelperText(cleanBody);

      await this.articleModel.update(articleId, {
        slug: finalSlug,
        title: cleanTitle,
        subtitle,
        category: category?.trim() || article.category || 'Edição interativa',
        author: author?.trim() || article.author || 'Estúdio Habitare',
        author_role: author_role?.trim() || article.author_role || 'Conteúdo & ativações',
        reading_time: readingTime,
        hero_image: heroImagePath,
        excerpt: cleanBody.substring(0, 200),
        body_html: bodyHtml,
        highlight_quote: highlightQuote,
        highlight_stat_helper: highlightHelper
      });

      // Processar múltiplas imagens se houver
      const articleImages = req.files?.article_images || [];
      if (articleImages.length > 0) {
        const existingImages = await this.imageModel.findByArticleId(articleId);
        let nextSortOrder = existingImages.length > 0
          ? Math.max(...existingImages.map(img => img.sort_order || 0)) + 1
          : 0;

        const images = articleImages.map((file, index) => ({
          image_url: `/uploads/${file.filename}`,
          sort_order: nextSortOrder + index
        }));
        await this.imageModel.createMany(articleId, images);
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
  }

  /**
   * Transaction script: Deleta artigo
   */
  async deleteArticle(req, res, next) {
    try {
      const articleId = Number.parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({ error: 'Artigo não encontrado' });
      }

      await this.articleModel.delete(articleId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}


import { Article } from '../models/Article.js';
import { Pin } from '../models/Pin.js';

export class HomeController {
  constructor(db) {
    this.articleModel = new Article(db);
    this.pinModel = new Pin(db);
  }

  /**
   * Transaction script: Exibe a página inicial
   */
  async index(req, res, next) {
    try {
      const articles = await this.articleModel.findAll();

      const enrichedArticles = await Promise.all(
        articles.map(async (article) => {
          const pinsRaw = await this.pinModel.findByArticleId(article.id);
          return {
            ...article,
            pins: pinsRaw.map((pin) => ({
              ...pin,
              // Usar cta_path diretamente - o mesmo valor que o usuário preencheu no formulário
              trackingUrl: pin.cta_path && pin.cta_path.trim() ? pin.cta_path.trim() : '#'
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
        pageTitle: `${res.locals.brand?.name || 'Revista Habitare'} — Arquitetura com alto engajamento`,
        metaDescription: res.locals.brand?.tagline || 'Arquitetura, design e ativações para marcas que pensam como publishers.',
        heroArticle: heroArticle,
        articles: gridArticles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Exibe um artigo completo
   */
  async showArticle(req, res, next) {
    try {
      const { slug } = req.params;
      const article = await this.articleModel.findBySlug(slug);

      if (!article) {
        return res.status(404).render('not-found', {
          pageTitle: 'Conteúdo não encontrado',
          message: 'O artigo que você procura saiu do ar ou mudou de endereço.'
        });
      }

      const { Section } = await import('../models/Section.js');
      const { Image } = await import('../models/Image.js');
      const sectionModel = new Section(req.db);
      const imageModel = new Image(req.db);

      const [sections, pinsRaw, images] = await Promise.all([
        sectionModel.findByArticleId(article.id),
        this.pinModel.findByArticleId(article.id),
        imageModel.findByArticleId(article.id)
      ]);

      const pins = pinsRaw.map((pin) => ({
        ...pin,
        // Usar cta_path diretamente - o mesmo valor que o usuário preencheu no formulário
        trackingUrl: pin.cta_path && pin.cta_path.trim() ? pin.cta_path.trim() : '#'
      }));

      res.render('article', {
        pageTitle: `${article.title} — ${res.locals.brand?.name || 'Revista Habitare'}`,
        metaDescription: article.subtitle,
        article,
        sections,
        pins,
        images
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Página "em desenvolvimento"
   */
  comingSoon(req, res) {
    res.render('coming-soon', {
      pageTitle: 'Em Desenvolvimento — Revista Habitare',
      metaDescription: 'Estamos trabalhando nisso. Em breve você terá acesso a este conteúdo.'
    });
  }
}


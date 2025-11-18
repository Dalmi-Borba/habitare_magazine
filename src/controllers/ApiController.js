import { Article } from '../models/Article.js';
import { Pin } from '../models/Pin.js';
import { Section } from '../models/Section.js';
import { Image } from '../models/Image.js';

export class ApiController {
  constructor(db) {
    this.articleModel = new Article(db);
    this.pinModel = new Pin(db);
    this.sectionModel = new Section(db);
    this.imageModel = new Image(db);
  }

  /**
   * Transaction script: Retorna documentação da API
   */
  documentation(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const API_KEY = process.env.API_KEY || 'habitare-api-key-2024';

    res.json({
      title: 'API Revista Habitare',
      version: '1.0.0',
      description: 'API REST para acessar artigos, pins, seções e imagens da Revista Habitare',
      authentication: {
        type: 'API Key',
        methods: [
          'Header: X-API-Key',
          'Query parameter: ?api_key=YOUR_KEY',
          'Body parameter: api_key (para POST/PUT)'
        ],
        note: 'Configure sua API key na variável de ambiente API_KEY ou use a chave padrão'
      },
      baseUrl,
      endpoints: {
        articles: {
          'GET /articles': {
            description: 'Lista todos os artigos',
            authentication: true,
            queryParams: {
              limit: 'Número máximo de resultados (opcional)',
              offset: 'Número de resultados para pular (opcional)'
            },
            example: `${baseUrl}/articles?api_key=YOUR_KEY`,
            response: {
              type: 'array',
              schema: {
                id: 'integer',
                slug: 'string',
                title: 'string',
                subtitle: 'string',
                category: 'string',
                author: 'string',
                author_role: 'string',
                published_at: 'string (YYYY-MM-DD)',
                reading_time: 'integer (minutos)',
                hero_image: 'string (URL)',
                hero_caption: 'string',
                excerpt: 'string',
                body_html: 'string (HTML)',
                highlight_quote: 'string',
                highlight_focus: 'string',
                highlight_stat_label: 'string',
                highlight_stat_value: 'string',
                highlight_stat_helper: 'string'
              }
            }
          },
          'GET /articles/:id': {
            description: 'Busca um artigo específico por ID',
            authentication: true,
            example: `${baseUrl}/articles/1?api_key=YOUR_KEY`,
            response: {
              type: 'object',
              schema: 'Mesmo schema do GET /articles, mas retorna um único objeto'
            }
          },
          'GET /articles/slug/:slug': {
            description: 'Busca um artigo específico por slug',
            authentication: true,
            example: `${baseUrl}/articles/slug/casa-observatorio-mata-atlantica?api_key=YOUR_KEY`,
            response: {
              type: 'object',
              schema: 'Mesmo schema do GET /articles'
            }
          }
        },
        pins: {
          'GET /articles/:id/pins': {
            description: 'Lista todos os pins de um artigo',
            authentication: true,
            example: `${baseUrl}/articles/1/pins?api_key=YOUR_KEY`,
            response: {
              type: 'array',
              schema: {
                id: 'integer',
                article_id: 'integer',
                slug: 'string',
                name: 'string',
                description: 'string',
                price_label: 'string',
                x_percent: 'number (0-100)',
                y_percent: 'number (0-100)',
                cta_path: 'string (URL)',
                tracking_code: 'string',
                badge: 'string'
              }
            }
          }
        },
        sections: {
          'GET /articles/:id/sections': {
            description: 'Lista todas as seções de um artigo',
            authentication: true,
            example: `${baseUrl}/articles/1/sections?api_key=YOUR_KEY`,
            response: {
              type: 'array',
              schema: {
                id: 'integer',
                article_id: 'integer',
                heading: 'string',
                content: 'string',
                media_url: 'string (URL)',
                media_caption: 'string',
                sort_order: 'integer',
                layout_type: 'string'
              }
            }
          }
        },
        images: {
          'GET /articles/:id/images': {
            description: 'Lista todas as imagens de um artigo',
            authentication: true,
            example: `${baseUrl}/articles/1/images?api_key=YOUR_KEY`,
            response: {
              type: 'array',
              schema: {
                id: 'integer',
                article_id: 'integer',
                image_url: 'string (URL)',
                image_caption: 'string',
                sort_order: 'integer'
              }
            }
          }
        },
        complete: {
          'GET /articles/:id/complete': {
            description: 'Retorna um artigo completo com todos os dados relacionados (pins, seções, imagens)',
            authentication: true,
            example: `${baseUrl}/articles/1/complete?api_key=YOUR_KEY`,
            response: {
              type: 'object',
              schema: {
                article: 'Objeto do artigo',
                pins: 'Array de pins',
                sections: 'Array de seções',
                images: 'Array de imagens'
              }
            }
          }
        }
      },
      examples: {
        curl: {
          listArticles: `curl -H "X-API-Key: ${API_KEY}" ${baseUrl}/articles`,
          getArticle: `curl -H "X-API-Key: ${API_KEY}" ${baseUrl}/articles/1`,
          getArticleComplete: `curl -H "X-API-Key: ${API_KEY}" ${baseUrl}/articles/1/complete`
        },
        javascript: {
          listArticles: `fetch('${baseUrl}/articles', {
  headers: {
    'X-API-Key': '${API_KEY}'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
          getArticle: `fetch('${baseUrl}/articles/1', {
  headers: {
    'X-API-Key': '${API_KEY}'
  }
})
.then(res => res.json())
.then(data => console.log(data));`
        }
      },
      errorCodes: {
        401: 'Não autorizado - API key inválida ou ausente',
        404: 'Recurso não encontrado',
        500: 'Erro interno do servidor'
      }
    });
  }

  /**
   * Transaction script: Lista todos os artigos
   */
  async listArticles(req, res, next) {
    try {
      const articles = await this.articleModel.findAll();

      const limit = parseInt(req.query.limit) || articles.length;
      const offset = parseInt(req.query.offset) || 0;
      const paginatedArticles = articles.slice(offset, offset + limit);

      res.json({
        total: articles.length,
        limit,
        offset,
        count: paginatedArticles.length,
        articles: paginatedArticles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Busca artigo por ID
   */
  async getArticleById(req, res, next) {
    try {
      const articleId = parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o ID ${articleId}`
        });
      }

      res.json(article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Busca artigo por slug
   */
  async getArticleBySlug(req, res, next) {
    try {
      const article = await this.articleModel.findBySlug(req.params.slug);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o slug "${req.params.slug}"`
        });
      }

      res.json(article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Lista pins de um artigo
   */
  async getArticlePins(req, res, next) {
    try {
      const articleId = parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o ID ${articleId}`
        });
      }

      const pins = await this.pinModel.findByArticleId(articleId);
      res.json({
        article_id: articleId,
        count: pins.length,
        pins
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Lista seções de um artigo
   */
  async getArticleSections(req, res, next) {
    try {
      const articleId = parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o ID ${articleId}`
        });
      }

      const sections = await this.sectionModel.findByArticleId(articleId);
      res.json({
        article_id: articleId,
        count: sections.length,
        sections
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Lista imagens de um artigo
   */
  async getArticleImages(req, res, next) {
    try {
      const articleId = parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o ID ${articleId}`
        });
      }

      const images = await this.imageModel.findByArticleId(articleId);
      res.json({
        article_id: articleId,
        count: images.length,
        images
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transaction script: Retorna artigo completo com todos os dados relacionados
   */
  async getArticleComplete(req, res, next) {
    try {
      const articleId = parseInt(req.params.id, 10);
      const article = await this.articleModel.findById(articleId);

      if (!article) {
        return res.status(404).json({
          error: 'Artigo não encontrado',
          message: `Nenhum artigo encontrado com o ID ${articleId}`
        });
      }

      const [pins, sections, images] = await Promise.all([
        this.pinModel.findByArticleId(articleId),
        this.sectionModel.findByArticleId(articleId),
        this.imageModel.findByArticleId(articleId)
      ]);

      res.json({
        article,
        pins,
        sections,
        images,
        counts: {
          pins: pins.length,
          sections: sections.length,
          images: images.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}


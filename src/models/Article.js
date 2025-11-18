import { queries } from '../db.js';

export class Article {
  constructor(db) {
    this.db = db;
  }

  /**
   * Lista todos os artigos
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await queries.getArticles(this.db);
  }

  /**
   * Busca artigo por ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await queries.getArticleById(this.db, id);
  }

  /**
   * Busca artigo por slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    return await queries.getArticleBySlug(this.db, slug);
  }

  /**
   * Cria um novo artigo
   * @param {Object} data - Dados do artigo
   * @returns {Promise<Object>} - Resultado com lastID
   */
  async create(data) {
    const runStatement = (sql, params = []) =>
      new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });

    const result = await runStatement(
      `INSERT INTO articles (
        slug, title, subtitle, category, author, author_role, published_at, reading_time,
        hero_image, hero_caption, excerpt, body_html, highlight_quote, highlight_focus,
        highlight_stat_label, highlight_stat_value, highlight_stat_helper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.slug,
        data.title,
        data.subtitle,
        data.category,
        data.author,
        data.author_role,
        data.published_at,
        data.reading_time,
        data.hero_image,
        data.hero_caption,
        data.excerpt,
        data.body_html,
        data.highlight_quote,
        data.highlight_focus,
        data.highlight_stat_label,
        data.highlight_stat_value,
        data.highlight_stat_helper
      ]
    );

    return result;
  }

  /**
   * Atualiza um artigo
   * @param {number} id
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<void>}
   */
  async update(id, data) {
    const runStatement = (sql, params = []) =>
      new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });

    await runStatement(
      `UPDATE articles SET
        slug = ?, title = ?, subtitle = ?, category = ?, author = ?, author_role = ?,
        reading_time = ?, hero_image = ?, excerpt = ?, body_html = ?, highlight_quote = ?,
        highlight_stat_helper = ?
      WHERE id = ?`,
      [
        data.slug,
        data.title,
        data.subtitle,
        data.category,
        data.author,
        data.author_role,
        data.reading_time,
        data.hero_image,
        data.excerpt,
        data.body_html,
        data.highlight_quote,
        data.highlight_stat_helper,
        id
      ]
    );
  }

  /**
   * Deleta um artigo
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const runStatement = (sql, params = []) =>
      new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });

    await runStatement('DELETE FROM articles WHERE id = ?', [id]);
  }
}


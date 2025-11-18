import { queries } from '../db.js';

export class Pin {
  constructor(db) {
    this.db = db;
  }

  /**
   * Busca todos os pins de um artigo
   * @param {number} articleId
   * @returns {Promise<Array>}
   */
  async findByArticleId(articleId) {
    return await queries.getPinsByArticleId(this.db, articleId);
  }

  /**
   * Deleta todos os pins de um artigo
   * @param {number} articleId
   * @returns {Promise<void>}
   */
  async deleteByArticleId(articleId) {
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

    await runStatement('DELETE FROM product_pins WHERE article_id = ?', [articleId]);
  }

  /**
   * Cria múltiplos pins
   * @param {number} articleId
   * @param {Array} pins - Array de objetos pin
   * @returns {Promise<void>}
   */
  async createMany(articleId, pins) {
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

    for (const pin of pins) {
      await runStatement(
        `INSERT INTO product_pins (
          article_id, slug, name, description, price_label, x_percent, y_percent, cta_path, tracking_code, badge
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articleId,
          pin.slug,
          pin.name,
          pin.description,
          pin.price_label,
          pin.x_percent,
          pin.y_percent,
          pin.cta_path,
          pin.tracking_code,
          pin.badge
        ]
      );
    }
  }
}


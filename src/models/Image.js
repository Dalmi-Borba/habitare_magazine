import { queries } from '../db.js';

export class Image {
  constructor(db) {
    this.db = db;
  }

  /**
   * Busca todas as imagens de um artigo
   * @param {number} articleId
   * @returns {Promise<Array>}
   */
  async findByArticleId(articleId) {
    return await queries.getImagesByArticleId(this.db, articleId);
  }

  /**
   * Cria múltiplas imagens
   * @param {number} articleId
   * @param {Array} images - Array de objetos image
   * @returns {Promise<void>}
   */
  async createMany(articleId, images) {
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

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await runStatement(
        `INSERT INTO article_images (article_id, image_url, sort_order) VALUES (?, ?, ?)`,
        [articleId, image.image_url, image.sort_order || i]
      );
    }
  }
}


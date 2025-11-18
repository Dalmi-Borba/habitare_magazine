import { queries } from '../db.js';

export class Section {
  constructor(db) {
    this.db = db;
  }

  /**
   * Busca todas as seções de um artigo
   * @param {number} articleId
   * @returns {Promise<Array>}
   */
  async findByArticleId(articleId) {
    return await queries.getSectionsByArticleId(this.db, articleId);
  }
}


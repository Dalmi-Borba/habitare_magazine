/**
 * Converte uma string em um slug válido para URLs
 * @param {string} value - String a ser convertida
 * @returns {string} - Slug gerado
 */
export const slugify = (value = '') => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
};


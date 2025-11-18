/**
 * Constrói o link rastreado para um pin
 * @param {Object} pin - Objeto pin com cta_path
 * @returns {string} - Link completo ou fallback
 */
export const buildTrackedLink = (pin) => {
  // Retorna o link completo diretamente, sem rastreamento
  if (pin.cta_path && pin.cta_path.trim()) {
    return pin.cta_path.trim();
  }
  // Fallback caso não tenha link
  return '#';
};


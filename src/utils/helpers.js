/**
 * Converte um valor para número com fallback
 * @param {any} value - Valor a ser convertido
 * @param {number} fallback - Valor padrão se a conversão falhar
 * @returns {number}
 */
export const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Calcula o tempo de leitura baseado no número de palavras
 * @param {string} text - Texto para calcular
 * @returns {number} - Tempo de leitura em minutos
 */
export const calculateReadingTime = (text) => {
  const words = text.split(/\s+/).length;
  return Math.max(3, Math.ceil(words / 120));
};

/**
 * Extrai o subtítulo do texto (primeira frase)
 * @param {string} text - Texto completo
 * @returns {string} - Primeira frase ou fallback
 */
export const extractSubtitle = (text, fallback = 'Matéria interativa publicada pela Habitare.') => {
  return text.split('.').shift()?.trim() || fallback;
};

/**
 * Extrai helper text do corpo (segunda e terceira frases)
 * @param {string} text - Texto completo
 * @returns {string} - Texto helper ou fallback
 */
export const extractHelperText = (text, fallback = 'Conteúdo curado pelo estúdio Habitare.') => {
  return text.split('.').slice(1, 3).join('. ').trim() || fallback;
};

/**
 * Remove tags HTML de um texto
 * @param {string} html - Texto HTML
 * @returns {string} - Texto puro
 */
export const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '').trim();
};


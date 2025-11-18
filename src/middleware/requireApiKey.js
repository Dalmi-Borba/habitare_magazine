/**
 * Middleware para verificar API Key
 */
export const requireApiKey = (req, res, next) => {
  const API_KEY = process.env.API_KEY || 'habitare-api-key-2024';
  const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body.api_key;
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'API key inválida ou ausente. Use o header X-API-Key ou o parâmetro api_key.'
    });
  }
  
  next();
};


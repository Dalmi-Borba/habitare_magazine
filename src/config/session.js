import session from 'express-session';

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'habitare-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'habitare-magazine.sid', // Nome único para evitar conflito com o store
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true em produção (HTTPS), false em desenvolvimento
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    // Não definir domain para que o cookie seja específico do subdomínio
    // Isso garante que revista.intranet-app.duckdns.org e market.intranet-app.duckdns.org
    // tenham cookies separados
    domain: undefined
  }
};


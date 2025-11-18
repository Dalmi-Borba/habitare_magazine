import session from 'express-session';

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'habitare-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
};


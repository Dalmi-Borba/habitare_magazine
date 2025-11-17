import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'habitare.db');

const articleSeeds = [
  {
    id: 1,
    slug: 'casa-observatorio-mata-atlantica',
    title: 'Casa Observatório na Mata Atlântica',
    subtitle: 'Arquitetura biofílica com volumes suspensos e luz filtrada pela copa das árvores.',
    category: 'Edição Especial',
    author: 'Letícia Verano',
    author_role: 'Diretora Criativa da Habitare',
    published_at: '2024-08-12',
    reading_time: 8,
    hero_image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80',
    hero_caption: 'Deck principal com vista para o vale úmido da serra.',
    excerpt:
      'Um manifesto tropical que combina engenharia leve, materiais regenerativos e narrativas imersivas para marcas que querem habitar a floresta.',
    highlight_quote: 'Projetar na mata é desenhar com o tempo e com a neblina.',
    highlight_focus: 'Biofilia operacional',
    highlight_stat_label: 'Materiais orgânicos',
    highlight_stat_value: '82%',
    highlight_stat_helper: 'dos acabamentos utilizam madeira certificada, pedra vulcânica e fibras brasileiras.'
  },
  {
    id: 2,
    slug: 'galeria-luz-brasilia',
    title: 'Galeria Luz em Brasília',
    subtitle: 'Concreto esculpido, iluminação difusa e peças colecionáveis para um circuito cultural aberto.',
    category: 'Cultural',
    author: 'Miguel Andrade',
    author_role: 'Editor de Design',
    published_at: '2024-07-22',
    reading_time: 6,
    hero_image: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1600&q=80',
    hero_caption: 'Galeria com sheds de concreto pigmentado e claraboias parametrizadas.',
    excerpt:
      'O Eixão ganha respiro com um pavilhão que mistura arte-luz, gastronomia lenta e residências artísticas conectadas com a paisagem modernista.',
    highlight_quote: 'Luz é matéria tátil quando conversa com superfícies honestas.',
    highlight_focus: 'Curadoria imersiva',
    highlight_stat_label: 'Peças autorais',
    highlight_stat_value: '47',
    highlight_stat_helper: 'designers independentes reúnem coleções cápsula dentro do circuito.'
  },
  {
    id: 3,
    slug: 'residencia-orla-brava',
    title: 'Residência Orla Brava',
    subtitle: 'Brises cerâmicos, piscina infinita e paisagismo nativo para uma casa que respira maresia.',
    category: 'Residencial',
    author: 'Cecília Paes',
    author_role: 'Curadora de Conteúdo',
    published_at: '2024-06-30',
    reading_time: 5,
    hero_image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
    hero_caption: 'Volumes escalonados com vista permanente para a enseada.',
    excerpt:
      'A casa suspensa em concreto pigmentado abraça o vento e coloca a cozinha assinada no centro da experiência afetiva dos moradores.',
    highlight_quote: 'Projetar para a orla é aprender a desenhar com sal, vento e memórias.',
    highlight_focus: 'Vida ao ar livre',
    highlight_stat_label: 'Espelhos d’água',
    highlight_stat_value: '05',
    highlight_stat_helper: 'espelhos conectam o paisagismo e criam microclimas na casa.'
  },
  {
    article_id: 2,
    slug: 'sofa-modulo-brasilia',
    name: 'Sofa Modulo Brasilia',
    description: 'Modulos em couro natural e base em latao envelhecido criam lounges flexiveis na galeria.',
    price_label: 'R$ 8.450',
    x_percent: 38,
    y_percent: 62,
    cta_path: 'sofa-modulo-brasilia',
    tracking_code: 'utm_campaign=pin-galeria&utm_medium=magazine',
    badge: 'Colecao capsula'
  },
  {
    article_id: 2,
    slug: 'pendente-orbita-luz',
    name: 'Pendente Orbita Luz',
    description: 'Discos em vidro leitoso flutuam sobre cabos finos para banhar as pecas com luz difusa.',
    price_label: 'R$ 4.320',
    x_percent: 64,
    y_percent: 28,
    cta_path: 'pendente-orbita',
    tracking_code: 'utm_campaign=pin-iluminacao&utm_medium=magazine',
    badge: 'Curadoria light-art'
  },
  {
    article_id: 3,
    slug: 'cadeira-brisa-marinha',
    name: 'Cadeira Brisa Marinha',
    description: 'Tramas em corda nautica e madeira teca resistente a maresia para varandas abertas.',
    price_label: 'R$ 2.980',
    x_percent: 26,
    y_percent: 66,
    cta_path: 'cadeira-brisa-marinha',
    tracking_code: 'utm_campaign=pin-residencial&utm_medium=magazine',
    badge: 'Outdoor premium'
  },
  {
    article_id: 3,
    slug: 'mesa-pedra-mar',
    name: 'Mesa Pedra do Mar',
    description: 'Tampo em pedra vulcanica e base em aco conico sustentam o living com textura natural.',
    price_label: 'R$ 7.250',
    x_percent: 58,
    y_percent: 54,
    cta_path: 'mesa-pedra-mar',
    tracking_code: 'utm_campaign=pin-decor&utm_medium=magazine',
    badge: 'Peca assinatura'
  }
];

const sectionSeeds = [
  {
    article_id: 1,
    sort_order: 1,
    heading: 'Estrutura leve em balanço',
    content:
      'A casa pousa sobre apoios metálicos que liberam o solo para a vegetação nativa. O pavimento social se abre em 32 metros lineares de esquadrias piso-teto com vidro eletrocrômico que regula a incidência solar automaticamente.',
    media_url: 'https://images.unsplash.com/photo-1470246973918-0296173bcda8?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Pórtico metálico aparente e guarda-corpo em cabo de aço inox.'
  },
  {
    article_id: 1,
    sort_order: 2,
    heading: 'Materiais regenerativos',
    content:
      'Painéis de taubilha tratada e terra estabilizada compõem o envelope sensorial, enquanto pisos drenantes aceleram o retorno da água da chuva para o solo. A iluminação linear embutida destaca a textura natural dos materiais.',
    media_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Forro ripado em freijó e luminárias lineares magnéticas.'
  },
  {
    article_id: 1,
    sort_order: 3,
    heading: 'Cenografia de marca integrada',
    content:
      'A residência funciona como palco vivo para ativações de marca. Displays magnéticos e pontos de energia discretos permitem que coleções cápsula de mobiliário e objetos sejam atualizadas semanalmente, mantendo o storytelling fresco.',
    media_url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Sala multiuso preparada para shootings e ativações gastronômicas.'
  },
  {
    article_id: 2,
    sort_order: 1,
    heading: 'Museografia flexível',
    content:
      'Tracklights com protocolo DMX e trilhos embutidos no piso permitem cenografias em camadas, com projeções suaves que não disputam com a arquitetura.',
    media_url: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Galeria principal com vedação em vidro baixo ferro.'
  },
  {
    article_id: 3,
    sort_order: 1,
    heading: 'Brises cerâmicos inteligentes',
    content:
      'As peças autorais filtram o sol da tarde e criam padrões gráficos que mudam ao longo do dia, ampliando a sensação de frescor dentro da casa.',
    media_url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Sequência de brises desenhada em parceria com artesãos locais.'
  }
];

const productPinSeeds = [
  {
    article_id: 1,
    slug: 'poltrona-aurora',
    name: 'Poltrona Aurora',
    description: 'Base em freijó maciço, estofado em linho cru e costura aparente para lounges autorais.',
    price_label: 'R$ 4.890',
    x_percent: 28,
    y_percent: 62,
    cta_path: 'poltrona-aurora',
    tracking_code: 'utm_campaign=pin-biofilia&utm_medium=magazine',
    badge: 'Edição limitada'
  },
  {
    article_id: 1,
    slug: 'pendente-cascata-bronze',
    name: 'Pendente Cascata Bronze',
    description: 'Camadas de vidro soprado e banho de bronze envelhecido criam um cone de luz quente para jantar intimista.',
    price_label: 'R$ 3.270',
    x_percent: 64,
    y_percent: 28,
    cta_path: 'pendente-cascata',
    tracking_code: 'utm_campaign=pin-iluminacao&utm_medium=magazine',
    badge: 'Best seller'
  },
  {
    article_id: 1,
    slug: 'tapete-rio-negro',
    name: 'Tapete Rio Negro',
    description: 'Feito em tear manual com fibras recicladas e pigmento natural, traduz o curso do rio com relevo 3D.',
    price_label: 'R$ 6.120',
    x_percent: 58,
    y_percent: 78,
    cta_path: 'tapete-rio-negro',
    tracking_code: 'utm_campaign=pin-textil&utm_medium=magazine',
    badge: 'Feito à mão'
  }
];

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });

const all = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

const get = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

async function seedDatabase(db) {
  for (const article of articleSeeds) {
    await run(
      db,
      `INSERT INTO articles (
        id, slug, title, subtitle, category, author, author_role,
        published_at, reading_time, hero_image, hero_caption, excerpt,
        highlight_quote, highlight_focus, highlight_stat_label, highlight_stat_value, highlight_stat_helper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.id,
        article.slug,
        article.title,
        article.subtitle,
        article.category,
        article.author,
        article.author_role,
        article.published_at,
        article.reading_time,
        article.hero_image,
        article.hero_caption,
        article.excerpt,
        article.highlight_quote,
        article.highlight_focus,
        article.highlight_stat_label,
        article.highlight_stat_value,
        article.highlight_stat_helper
      ]
    );
  }

  for (const section of sectionSeeds) {
    await run(
      db,
      `INSERT INTO article_sections (
        article_id, heading, content, media_url, media_caption, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [section.article_id, section.heading, section.content, section.media_url, section.media_caption, section.sort_order]
    );
  }

  for (const product of productPinSeeds) {
    await run(
      db,
      `INSERT INTO product_pins (
        article_id, slug, name, description, price_label, x_percent, y_percent,
        cta_path, tracking_code, badge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.article_id,
        product.slug,
        product.name,
        product.description,
        product.price_label,
        product.x_percent,
        product.y_percent,
        product.cta_path,
        product.tracking_code,
        product.badge
      ]
    );
  }
}

export async function initDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new sqlite3.Database(DB_PATH);

  await run(db, 'PRAGMA foreign_keys = ON;');

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      category TEXT,
      author TEXT,
      author_role TEXT,
      published_at TEXT,
      reading_time INTEGER,
      hero_image TEXT,
      hero_caption TEXT,
      excerpt TEXT,
      body_html TEXT,
      highlight_quote TEXT,
      highlight_focus TEXT,
      highlight_stat_label TEXT,
      highlight_stat_value TEXT,
      highlight_stat_helper TEXT
    )`
  );

  // Adicionar coluna body_html se não existir (migração)
  try {
    await run(db, 'ALTER TABLE articles ADD COLUMN body_html TEXT');
  } catch (err) {
    // Coluna já existe, ignorar erro
  }

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS article_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      heading TEXT,
      content TEXT,
      media_url TEXT,
      media_caption TEXT,
      sort_order INTEGER DEFAULT 0,
      layout_type TEXT DEFAULT 'text',
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )`
  );

  // Adicionar coluna layout_type se não existir (migração)
  try {
    await run(db, 'ALTER TABLE article_sections ADD COLUMN layout_type TEXT DEFAULT "text"');
  } catch (err) {
    // Coluna já existe, ignorar erro
  }

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS product_pins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_label TEXT,
      x_percent REAL,
      y_percent REAL,
      cta_path TEXT,
      tracking_code TEXT,
      badge TEXT,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )`
  );

  // Tabela para múltiplas imagens do artigo (carrossel)
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS article_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_caption TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )`
  );

  // Banco inicia vazio - todos os posts devem ser criados pelo admin
  // const articleCount = await get(db, 'SELECT COUNT(*) AS total FROM articles');
  // if (!articleCount?.total) {
  //   await seedDatabase(db);
  // }

  return db;
}

export const queries = {
  getArticles: (db) => all(db, 'SELECT * FROM articles ORDER BY datetime(published_at) DESC'),
  getArticleBySlug: (db, slug) => get(db, 'SELECT * FROM articles WHERE slug = ?', [slug]),
  getArticleById: (db, id) => get(db, 'SELECT * FROM articles WHERE id = ?', [id]),
  getSectionsByArticleId: (db, articleId) =>
    all(db, 'SELECT * FROM article_sections WHERE article_id = ? ORDER BY sort_order ASC', [articleId]),
  getPinsByArticleId: (db, articleId) =>
    all(db, 'SELECT * FROM product_pins WHERE article_id = ? ORDER BY id ASC', [articleId]),
  getImagesByArticleId: (db, articleId) =>
    all(db, 'SELECT * FROM article_images WHERE article_id = ? ORDER BY sort_order ASC', [articleId])
};

export const databasePath = DB_PATH;

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    const prefix = file.fieldname === 'hero_image' ? 'hero' : 'img';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({ storage });

export const uploadFields = multer({ storage }).fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'article_images', maxCount: 20 }
]);

export { uploadDir };


import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const imageUrls = [];

    // Local upload directory
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `file-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      await fs.promises.writeFile(filePath, file.buffer);
      
      const host = req.get('host');
      const protocol = req.protocol;
      imageUrls.push(`${protocol}://${host}/uploads/${filename}`);
    }

    res.json({ message: 'Images uploaded', imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/files', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }
    const files = await fs.promises.readdir(uploadDir);
    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `${protocol}://${host}/uploads/${file}`);
    res.json({ files: imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import multer, { diskStorage } from 'multer';
import { extname } from 'path';
import { fileURLToPath } from 'node:url';

const uploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(extname(file.originalname).toLowerCase());

  if (ext) cb(null, true);
  else cb(new Error('Only image files (jpg, jpeg, png, webp) allowed'));
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
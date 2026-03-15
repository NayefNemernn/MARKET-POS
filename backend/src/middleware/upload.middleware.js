import multer from "multer";

/* MEMORY STORAGE (needed for Supabase upload) */

const storage = multer.memoryStorage();

/* FILE FILTER (allow only images) */

const fileFilter = (req, file, cb) => {

  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }

};

const upload = multer({
  storage,
  fileFilter
});

export default upload;
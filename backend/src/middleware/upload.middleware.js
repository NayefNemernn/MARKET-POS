import multer from "multer";
<<<<<<< HEAD
import path from "path";

/* STORAGE CONFIG */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads");
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));

  }

});

/* FILE FILTER (IMAGES ONLY) */
=======

/* MEMORY STORAGE (needed for Supabase upload) */

const storage = multer.memoryStorage();

/* FILE FILTER (allow only images) */
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

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
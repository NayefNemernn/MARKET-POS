import multer from "multer";
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
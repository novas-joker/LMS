import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.VERCEL ? "/tmp" : "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Multer destination hit");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log("Multer filename hit");
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;
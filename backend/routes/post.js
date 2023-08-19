import express from "express";
import multer from "multer";
import authenticateToken from "../middlewares/authenticate.js";
import {getPosts, uploadPost, deletePost} from "../controllers/postController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./userUploadedFiles");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null, file.fieldname + "-" + Date.now() + "." + ext);
  },
});

const upload = multer({ storage: storage });

router.get("/" , authenticateToken, getPosts);

router.post("/upload",  authenticateToken, upload.single("imageFile"), uploadPost);

router.post("/delete/:postId",  authenticateToken, deletePost);

export default router;
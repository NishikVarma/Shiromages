const express = require("express");
const { 
    uploadImage, 
    searchImages, 
    deleteImage 
} = require("../controllers/ImageController.jsx");
const { protect } = require('../middleware/authMiddleware.jsx');
const router = express.Router();

router.post("/upload", protect, uploadImage);
router.get("/search", protect, searchImages);
router.delete("/delete/:key", protect, deleteImage);

module.exports = router;
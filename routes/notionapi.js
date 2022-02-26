const express = require('express');
const { getBlogs, getBlog } = require("./../controllers/notion-controller")

// Router
const router = express.Router();

router.get('/blogs', getBlogs);
router.get('/blog/', getBlog);
// GET, POST, PATCH, DELETE // Products

module.exports = router;
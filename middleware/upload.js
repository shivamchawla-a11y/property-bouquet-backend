const multer = require("multer");

// 🔥 Use memory storage (BEST for cloud upload)
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
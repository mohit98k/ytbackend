const multer = require("multer");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // where files will be stored temporarily
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // save file with original name
  },
});

// Export upload middleware
const upload = multer({ storage });
module.exports = upload;


//multer.diskStorage → tells Multer to store files on disk (locally).
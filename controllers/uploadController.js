const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "property-bouquet",

            transformation: [
              { fetch_format: "webp", quality: "auto:eco" },
              {
                overlay: {
                  font_family: "Arial",
                  font_size: 40,
                  text: "Property Bouquet",
                },
                gravity: "south_east",
                x: 20,
                y: 20,
                color: "white",
                opacity: 60,
              },
            ],
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload();

    res.json({
      success: true,
      url: result.secure_url,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
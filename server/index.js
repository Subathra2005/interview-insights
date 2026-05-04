const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function extensionForMimeType(mimeType) {
  const normalized = String(mimeType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (normalized === "video/mp4") return ".mp4";
  return ".webm";
}

function publicUploadUrl(filename) {
  const configuredBaseUrl = process.env.PUBLIC_UPLOAD_BASE_URL;
  const uploadPath = `/uploads/${filename}`;
  if (!configuredBaseUrl) return uploadPath;
  return `${configuredBaseUrl.replace(/\/$/, "")}${uploadPath}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const extension = extensionForMimeType(file.mimetype);
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });
const app = express();
app.use(cors());

// Serve uploaded videos with proper headers for cross-origin playback
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, path) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Range");
      res.set("Accept-Ranges", "bytes");
      if (path.endsWith(".webm")) {
        res.set("Content-Type", "video/webm");
      } else if (path.endsWith(".mp4")) {
        res.set("Content-Type", "video/mp4");
      }
    },
  }),
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uploadDir: UPLOAD_DIR });
});

app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err && err.message ? err.message : err);
      return res
        .status(500)
        .json({ error: err && err.message ? String(err.message) : "upload error" });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = publicUploadUrl(req.file.filename);
    res.json({ url });
  });
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Upload server running on http://localhost:${port}`);
});

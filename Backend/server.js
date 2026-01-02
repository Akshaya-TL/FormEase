const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Submission = require("./models/submission");

const app = express();
const PORT = 3001;


// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads folder");
}

// CORS configuration (adjust origin if needed)
app.use(
  cors({
    origin: "http://localhost:3000", // or "*" for all origins during dev
    methods: ["GET", "POST"],
  })
);

// Middleware
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// Database Connection
mongoose
  .connect("mongodb://localhost:27017/formDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF, JPG, PNG allowed."));
  },
});

// Handle form submission
app.post("/api/form", upload.single("attachment"), async (req, res) => {
  console.log("📨 Received POST /api/form");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: "Missing required fields." });

    const newSubmission = new Submission({
      name,
      email,
      message,
      attachmentPath: req.file ? req.file.path : null,
    });

    await newSubmission.save();
    console.log("Saved submission:", newSubmission._id);
    return res.json({ success: true, data: newSubmission });
  } catch (err) {
    console.error("Error during form save:", err);
    return res
      .status(500)
      .json({ error: "Server error while saving submission." });
  }
});

// Health check
app.get("/", (req, res) => res.send("Server running "));

// Start server
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const credentials = require("../src/credentials");

const CDN_PORT = 5000;
const STORAGE_PATH = path.join(app.getPath("userData"), "cdn-storage");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// Express CDN Server
const cdnApp = express();
cdnApp.use(cors());
cdnApp.use(express.json());

// Serve static files from storage
cdnApp.use("/files", express.static(STORAGE_PATH));

// Helper function to validate API key and get size limit
const validateAPIKey = (apiKey) => {
  const apiKeys = credentials.apiKeys;

  if (apiKey === apiKeys.small.key) {
    return {
      valid: true,
      maxSize: apiKeys.small.maxSize,
      label: apiKeys.small.label,
    };
  }
  if (apiKey === apiKeys.medium.key) {
    return {
      valid: true,
      maxSize: apiKeys.medium.maxSize,
      label: apiKeys.medium.label,
    };
  }
  if (apiKey === apiKeys.large.key) {
    return {
      valid: true,
      maxSize: apiKeys.large.maxSize,
      label: apiKeys.large.label,
    };
  }

  return { valid: false };
};

// Middleware to check API key
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "Unauthorized: API key is missing",
      message: "Please provide an API key in the x-api-key header",
    });
  }

  const validation = validateAPIKey(apiKey);

  if (!validation.valid) {
    return res.status(401).json({
      error: "Unauthorized: Invalid API key",
      message:
        "The provided API key is not recognized. Please check your credentials.",
    });
  }

  req.apiKeyInfo = validation;
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || "";
    const uploadPath = path.join(STORAGE_PATH, folder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      req.body.keepOriginalName === "true"
        ? file.originalname
        : `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB max for multer itself
});

// API Routes

// Get storage info
cdnApp.get("/api/info", authenticateAPIKey, (req, res) => {
  const getDirectorySize = (dirPath) => {
    let size = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });

    return size;
  };

  const totalSize = getDirectorySize(STORAGE_PATH);

  res.json({
    storagePath: STORAGE_PATH,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    apiKeyInfo: req.apiKeyInfo.label,
  });
});

// List files and folders
cdnApp.get("/api/list", authenticateAPIKey, (req, res) => {
  const folder = req.query.folder || "";
  const targetPath = path.join(STORAGE_PATH, folder);

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({
      error: "Folder not found",
      message: `The folder "${folder}" does not exist in the CDN storage.`,
      path: folder,
    });
  }

  const items = fs.readdirSync(targetPath).map((item) => {
    const itemPath = path.join(targetPath, item);
    const stats = fs.statSync(itemPath);

    return {
      name: item,
      type: stats.isDirectory() ? "folder" : "file",
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: stats.isFile()
        ? `http://localhost:${CDN_PORT}/files/${path
            .join(folder, item)
            .replace(/\\/g, "/")}`
        : null,
    };
  });

  res.json({ items, currentPath: folder });
});

// Create folder
cdnApp.post("/api/folder/create", authenticateAPIKey, (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({
      error: "Bad Request: Folder path is required",
      message: 'Please provide a "folderPath" in the request body.',
    });
  }

  const targetPath = path.join(STORAGE_PATH, folderPath);

  try {
    if (fs.existsSync(targetPath)) {
      return res.status(409).json({
        error: "Conflict: Folder already exists",
        message: `A folder with the path "${folderPath}" already exists.`,
        path: folderPath,
      });
    }

    fs.mkdirSync(targetPath, { recursive: true });
    res.json({
      success: true,
      message: "Folder created successfully",
      path: folderPath,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to create folder: ${error.message}`,
      path: folderPath,
    });
  }
});

// Delete folder
cdnApp.delete("/api/folder/delete", authenticateAPIKey, (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({
      error: "Bad Request: Folder path is required",
      message: 'Please provide a "folderPath" in the request body.',
    });
  }

  const targetPath = path.join(STORAGE_PATH, folderPath);

  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        error: "Not Found: Folder does not exist",
        message: `The folder "${folderPath}" was not found.`,
        path: folderPath,
      });
    }

    fs.rmSync(targetPath, { recursive: true, force: true });
    res.json({
      success: true,
      message: "Folder deleted successfully",
      path: folderPath,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to delete folder: ${error.message}`,
      path: folderPath,
    });
  }
});

// Upload file
cdnApp.post(
  "/api/file/upload",
  authenticateAPIKey,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Bad Request: No file uploaded",
        message:
          'Please provide a file in the "file" field of the multipart form data.',
      });
    }

    const fileSize = req.file.size;
    const maxSize = req.apiKeyInfo.maxSize;
    const apiKeyLabel = req.apiKeyInfo.label;

    // Check file size against API key limit
    if (fileSize > maxSize) {
      // Delete the uploaded file since it exceeds the limit
      fs.unlinkSync(req.file.path);

      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      const maxSizeMB =
        maxSize === Infinity
          ? "unlimited"
          : (maxSize / (1024 * 1024)).toFixed(0);

      return res.status(413).json({
        error: "Payload Too Large: File size exceeds API key limit",
        message: `Your file size is ${fileSizeMB} MB, but your API key (${apiKeyLabel}) only allows files up to ${maxSizeMB} MB.`,
        fileSize: fileSize,
        fileSizeMB: fileSizeMB,
        maxSize: maxSize,
        maxSizeMB: maxSizeMB,
        apiKeyType: apiKeyLabel,
        suggestion:
          maxSizeMB === "5"
            ? "Please use the Medium Files API key (max 50MB) or Large Files API key (unlimited)."
            : maxSizeMB === "50"
            ? "Please use the Large Files API key (unlimited)."
            : "This should not happen with the Large Files API key.",
      });
    }

    const folder = req.body.folder || "";
    const fileUrl = `http://localhost:${CDN_PORT}/files/${path
      .join(folder, req.file.filename)
      .replace(/\\/g, "/")}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        sizeMB: (req.file.size / (1024 * 1024)).toFixed(2),
        path: path.join(folder, req.file.filename),
        url: fileUrl,
      },
      apiKeyUsed: apiKeyLabel,
    });
  }
);

// Delete file
cdnApp.delete("/api/file/delete", authenticateAPIKey, (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({
      error: "Bad Request: File path is required",
      message: 'Please provide a "filePath" in the request body.',
    });
  }

  const targetPath = path.join(STORAGE_PATH, filePath);

  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        error: "Not Found: File does not exist",
        message: `The file "${filePath}" was not found.`,
        path: filePath,
      });
    }

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        error: "Bad Request: Path is a directory",
        message: `"${filePath}" is a directory, not a file. Use the folder delete endpoint instead.`,
        path: filePath,
      });
    }

    fs.unlinkSync(targetPath);
    res.json({
      success: true,
      message: "File deleted successfully",
      path: filePath,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to delete file: ${error.message}`,
      path: filePath,
    });
  }
});

// Admin login
cdnApp.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Bad Request: Missing credentials",
      message: "Please provide both username and password.",
    });
  }

  if (
    username === credentials.admin.username &&
    password === credentials.admin.password
  ) {
    res.json({
      success: true,
      message: "Login successful",
      apiKeys: {
        small: credentials.apiKeys.small.label,
        medium: credentials.apiKeys.medium.label,
        large: credentials.apiKeys.large.label,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid credentials",
      message: "The username or password you entered is incorrect.",
    });
  }
});

// Start CDN server
cdnApp.listen(CDN_PORT, () => {
  console.log(`OpenCDN server running on http://localhost:${CDN_PORT}`);
});

// Electron Window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "OpenCDN",
  });

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, "../build/index.html")}`
    : "http://localhost:3000";

  mainWindow.loadURL(startURL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

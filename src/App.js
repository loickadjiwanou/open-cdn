import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";
const credentials = require("../src/credentials");
const DEFAULT_API_KEY = credentials.apiKeys.medium.key;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("opencdn_authenticated") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [currentView, setCurrentView] = useState("files"); // 'files', 'stats', or 'manage'
  const [items, setItems] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Management state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, size-desc, size-asc, name-asc, name-desc

  // Preview and details modal
  const [previewModal, setPreviewModal] = useState({
    show: false,
    type: null,
    item: null,
  });
  const [showDocs, setShowDocs] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    recentUploads: [],
    largestFiles: [],
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadStorageInfo();
      loadStats();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem("opencdn_authenticated", "true");
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setLoginError("Connection error: Unable to reach the server");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("opencdn_authenticated");
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/list?folder=`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });
      const data = await response.json();
      if (data.items) {
        setItems(data.items.filter((item) => item.type === "file"));
      }
    } catch (error) {
      console.error("Error loading items:", error);
    }
    setLoading(false);
  };

  const loadStorageInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/info`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });
      const data = await response.json();
      setStorageInfo(data);
    } catch (error) {
      console.error("Error loading storage info:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/list?folder=`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });
      const data = await response.json();

      if (data.items) {
        const files = data.items.filter((item) => item.type === "file");

        // File types count
        const fileTypes = {};
        files.forEach((file) => {
          const ext = getFileExtension(file.name).toUpperCase();
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });

        // Recent uploads (last 10)
        const recentUploads = [...files]
          .sort((a, b) => new Date(b.created) - new Date(a.created))
          .slice(0, 10);

        // Largest files
        const largestFiles = [...files]
          .sort((a, b) => b.size - a.size)
          .slice(0, 10);

        setStats({
          totalFiles: files.length,
          totalSize: files.reduce((sum, file) => sum + file.size, 0),
          fileTypes,
          recentUploads,
          largestFiles,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadError("");
      handleFileUploadDirect(file);
    }
  };

  const handleFileUploadDirect = async (file) => {
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/file/upload`, {
        method: "POST",
        headers: {
          "x-api-key": DEFAULT_API_KEY,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadFile(null);
        setUploadError("");
        loadItems();
        loadStorageInfo();
        loadStats();

        const notification = document.createElement("div");
        notification.className = "copy-notification";
        notification.textContent = "✓ File uploaded successfully!";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      } else {
        setUploadError(data.message || "Upload failed");
        alert(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Network error: Unable to upload file");
      alert("Network error: Unable to upload file");
    }
    setUploading(false);
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(`Delete ${item.name}?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/file/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": DEFAULT_API_KEY,
        },
        body: JSON.stringify({ filePath: item.name }),
      });

      if (response.ok) {
        loadItems();
        loadStorageInfo();
        loadStats();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    const notification = document.createElement("div");
    notification.className = "copy-notification";
    notification.textContent = "✓ URL copied!";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileExtension = (filename) => {
    const lastDot = filename.lastIndexOf(".");
    return lastDot !== -1 ? filename.substring(lastDot) : "";
  };

  const isImage = (filename) => {
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    const ext = getFileExtension(filename).substring(1).toLowerCase();
    return imageExts.includes(ext);
  };

  const isVideo = (filename) => {
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
    const ext = getFileExtension(filename).substring(1).toLowerCase();
    return videoExts.includes(ext);
  };

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename).substring(1).toLowerCase();
    if (isImage(filename)) return "🖼️";
    if (isVideo(filename)) return "🎬";
    if (["pdf"].includes(ext)) return "📕";
    if (["doc", "docx"].includes(ext)) return "📘";
    if (["xls", "xlsx"].includes(ext)) return "📗";
    if (["zip", "rar", "7z"].includes(ext)) return "📦";
    if (["mp3", "wav", "ogg"].includes(ext)) return "🎵";
    return "📄";
  };

  const openPreview = (item) => {
    if (isImage(item.name)) {
      setPreviewModal({ show: true, type: "image", item });
    } else if (isVideo(item.name)) {
      setPreviewModal({ show: true, type: "video", item });
    }
  };

  const openDetails = (item) => {
    setPreviewModal({ show: true, type: "details", item });
  };

  const closePreview = () => {
    setPreviewModal({ show: false, type: null, item: null });
  };

  const downloadApiDoc = () => {
    // Create API.md content
    const apiContent = `# OpenCDN API Documentation

## Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

## Authentication
All API endpoints (except \`/admin/login\` and \`/files/*\`) require an API key.

### Headers Required
\`\`\`
x-api-key: your-api-key-here
\`\`\`

## API Key System
- **Small**: Up to 5 MB
- **Medium**: Up to 50 MB  
- **Large**: Unlimited

## Endpoints

### GET /api/info
Get storage information

### GET /api/list
List all files

### POST /api/file/upload
Upload a file with original name
- Form field: \`file\` (required)

### DELETE /api/file/delete
Delete a file
- Body: \`{ "filePath": "filename.jpg" }\`

### GET /files/{filename}
Direct file access (public, no authentication)

For complete documentation, visit the GitHub repository or check API.md in the project root.
`;

    // Create blob and download
    const blob = new Blob([apiContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "OpenCDN-API-Documentation.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show notification
    const notification = document.createElement("div");
    notification.className = "copy-notification";
    notification.textContent = "✓ API documentation downloaded!";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch(`${API_URL}/backup`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `opencdn-backup-${
          new Date().toISOString().split("T")[0]
        }.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const notification = document.createElement("div");
        notification.className = "copy-notification";
        notification.textContent = "✓ Backup downloaded successfully!";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      } else {
        alert("Backup failed");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("Error creating backup");
    }
    setBackupLoading(false);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;

    const confirmRestore = window.confirm(
      "This will restore files from the backup. Existing files with the same names will be overwritten. Continue?"
    );

    if (!confirmRestore) return;

    setRestoreLoading(true);
    const formData = new FormData();
    formData.append("backup", restoreFile);

    try {
      const response = await fetch(`${API_URL}/restore`, {
        method: "POST",
        headers: { "x-api-key": DEFAULT_API_KEY },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Restore successful! ${data.filesRestored} files restored.`);
        setRestoreFile(null);
        loadItems();
        loadStorageInfo();
        loadStats();
      } else {
        alert(data.message || "Restore failed");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Error restoring backup");
    }
    setRestoreLoading(false);
  };

  const handleClearCDN = async () => {
    const confirmClear = window.confirm(
      '⚠️ WARNING: This will DELETE ALL FILES in your CDN. This action cannot be undone!\n\nType "DELETE ALL" to confirm.'
    );

    if (!confirmClear) return;

    const secondConfirm = prompt('Type "DELETE ALL" to confirm:');

    if (secondConfirm !== "DELETE ALL") {
      alert("Confirmation failed. No files were deleted.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": DEFAULT_API_KEY,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(`CDN cleared! ${data.filesDeleted} files deleted.`);
        loadItems();
        loadStorageInfo();
        loadStats();
      } else {
        alert(data.message || "Clear failed");
      }
    } catch (error) {
      console.error("Error clearing CDN:", error);
      alert("Error clearing CDN");
    }
  };

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.created) - new Date(b.created));
        break;
      case "size-desc":
        filtered.sort((a, b) => b.size - a.size);
        break;
      case "size-asc":
        filtered.sort((a, b) => a.size - b.size);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredItems = getFilteredAndSortedItems();

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="logo">
            <div className="logo-icon">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <defs>
                  <linearGradient
                    id="logoGradient"
                    x1="0"
                    y1="0"
                    x2="60"
                    y2="60"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <rect
                  width="60"
                  height="60"
                  rx="16"
                  fill="url(#logoGradient)"
                />
                <path
                  d="M20 25L30 15L40 25M30 17V40"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 35H45V45H15V35Z"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1>OpenCDN</h1>
          </div>
          <p className="subtitle">Professional Content Delivery Network</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>
            {loginError && <div className="error">{loginError}</div>}
            <button type="submit" className="btn btn-primary btn-large">
              <span>Sign In</span>
              <span className="btn-arrow">→</span>
            </button>
          </form>

          <div className="login-footer">
            <p>
              Credentials can be changed in <code>credentials.js</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
              <defs>
                <linearGradient
                  id="sidebarGradient"
                  x1="0"
                  y1="0"
                  x2="60"
                  y2="60"
                >
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <rect
                width="60"
                height="60"
                rx="16"
                fill="url(#sidebarGradient)"
              />
              <path
                d="M20 25L30 15L40 25M30 17V40"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 35H45V45H15V35Z"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>OpenCDN</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === "files" ? "active" : ""}`}
            onClick={() => setCurrentView("files")}
          >
            <span className="nav-icon">📁</span>
            <span>Files</span>
          </button>
          <button
            className={`nav-item ${currentView === "stats" ? "active" : ""}`}
            onClick={() => setCurrentView("stats")}
          >
            <span className="nav-icon">📊</span>
            <span>Statistics</span>
          </button>
          <button
            className={`nav-item ${currentView === "manage" ? "active" : ""}`}
            onClick={() => setCurrentView("manage")}
          >
            <span className="nav-icon">⚙️</span>
            <span>Management</span>
          </button>
          <button className="nav-item" onClick={() => setShowDocs(true)}>
            <span className="nav-icon">📚</span>
            <span>API Docs</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {storageInfo && (
            <div className="storage-widget">
              <div className="storage-label">Storage Used</div>
              <div className="storage-value">{storageInfo.totalSizeMB} MB</div>
              <div className="storage-bar">
                <div
                  className="storage-bar-fill"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-block"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {currentView === "files" && (
          <>
            <header className="content-header">
              <div>
                <h1>File Manager</h1>
                <p className="header-subtitle">
                  {filteredItems.length} files in your CDN
                </p>
              </div>
              <label className="btn btn-primary">
                <span className="btn-icon">⬆️</span>
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
            </header>

            <div className="toolbar-modern">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date-desc">📅 Newest First</option>
                <option value="date-asc">📅 Oldest First</option>
                <option value="size-desc">📊 Largest First</option>
                <option value="size-asc">📊 Smallest First</option>
                <option value="name-asc">🔤 Name (A-Z)</option>
                <option value="name-desc">🔤 Name (Z-A)</option>
              </select>
            </div>

            <div className="files-grid">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-large"></div>
                  <p>Loading files...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-state-modern">
                  <div className="empty-icon">📦</div>
                  <h3>No files found</h3>
                  <p>Upload your first file to get started</p>
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <div key={index} className="file-card-modern">
                    <div className="file-card-header">
                      <div className="file-icon-large">
                        {getFileIcon(item.name)}
                      </div>
                      <button
                        onClick={() => handleDelete(item)}
                        className="file-delete-btn"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="file-card-body">
                      <h3 className="file-name">{item.name}</h3>
                      <p className="file-meta">
                        {formatBytes(item.size)} •{" "}
                        {new Date(item.created).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="file-card-actions">
                      {(isImage(item.name) || isVideo(item.name)) && (
                        <button
                          onClick={() => openPreview(item)}
                          className="action-btn"
                        >
                          <span>👁️</span>
                          <span>Preview</span>
                        </button>
                      )}
                      <button
                        onClick={() => openDetails(item)}
                        className="action-btn"
                      >
                        <span>ℹ️</span>
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => copyUrl(item.url)}
                        className="action-btn action-btn-primary"
                      >
                        <span>📋</span>
                        <span>Copy URL</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {currentView === "stats" && (
          <>
            <header className="content-header">
              <div>
                <h1>Statistics</h1>
                <p className="header-subtitle">Overview of your CDN usage</p>
              </div>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalFiles}</div>
                  <div className="stat-label">Total Files</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💾</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {formatBytes(stats.totalSize)}
                  </div>
                  <div className="stat-label">Total Size</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {Object.keys(stats.fileTypes).length}
                  </div>
                  <div className="stat-label">File Types</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {stats.totalFiles > 0
                      ? formatBytes(stats.totalSize / stats.totalFiles)
                      : "0 B"}
                  </div>
                  <div className="stat-label">Avg File Size</div>
                </div>
              </div>
            </div>

            <div className="stats-details">
              <div className="stats-section">
                <h2>File Types Distribution</h2>
                <div className="file-types-list">
                  {Object.entries(stats.fileTypes)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="file-type-item">
                        <span className="file-type-name">.{type}</span>
                        <div className="file-type-bar-container">
                          <div
                            className="file-type-bar"
                            style={{
                              width: `${(count / stats.totalFiles) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="file-type-count">{count} files</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="stats-section">
                <h2>Recent Uploads</h2>
                <div className="recent-uploads-list">
                  {stats.recentUploads.map((file, index) => (
                    <div key={index} className="recent-upload-item">
                      <span className="upload-icon">
                        {getFileIcon(file.name)}
                      </span>
                      <div className="upload-info">
                        <div className="upload-name">{file.name}</div>
                        <div className="upload-meta">
                          {formatBytes(file.size)} •{" "}
                          {new Date(file.created).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-section">
                <h2>Largest Files</h2>
                <div className="largest-files-list">
                  {stats.largestFiles.map((file, index) => (
                    <div key={index} className="largest-file-item">
                      <span className="file-rank">#{index + 1}</span>
                      <span className="file-icon-small">
                        {getFileIcon(file.name)}
                      </span>
                      <div className="file-info-compact">
                        <div className="file-name-compact">{file.name}</div>
                        <div className="file-size-compact">
                          {formatBytes(file.size)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === "manage" && (
          <>
            <header className="content-header">
              <div>
                <h1>CDN Management</h1>
                <p className="header-subtitle">
                  Backup, restore, and manage your CDN
                </p>
              </div>
            </header>

            <div className="management-grid">
              {/* Backup Section */}
              <div className="management-card">
                <div className="management-card-header">
                  <div className="management-icon">💾</div>
                  <div>
                    <h3>Backup CDN</h3>
                    <p>Download all your files as a ZIP archive</p>
                  </div>
                </div>
                <div className="management-card-body">
                  <p className="management-description">
                    Creates a complete backup of all files in your CDN. The
                    backup will be downloaded as a ZIP file with today's date.
                  </p>
                  <ul className="management-list">
                    <li>✓ All files included</li>
                    <li>✓ Original names preserved</li>
                    <li>✓ Safe and secure</li>
                  </ul>
                </div>
                <div className="management-card-footer">
                  <button
                    onClick={handleBackup}
                    className="btn btn-primary btn-block"
                    disabled={backupLoading}
                  >
                    {backupLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        <span>Creating Backup...</span>
                      </>
                    ) : (
                      <>
                        <span>⬇️</span>
                        <span>Download Backup</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Restore Section */}
              <div className="management-card">
                <div className="management-card-header">
                  <div className="management-icon">📂</div>
                  <div>
                    <h3>Restore from Backup</h3>
                    <p>Upload a ZIP file to restore your files</p>
                  </div>
                </div>
                <div className="management-card-body">
                  <p className="management-description">
                    Restore files from a previous backup. The system will
                    automatically extract files from the ZIP, even if they're in
                    a subfolder.
                  </p>
                  <ul className="management-list">
                    <li>✓ Auto-detects file location in ZIP</li>
                    <li>✓ Overwrites existing files</li>
                    <li>✓ Preserves file names</li>
                  </ul>
                  {restoreFile && (
                    <div className="selected-file">
                      <span>📦</span>
                      <span>{restoreFile.name}</span>
                      <button
                        onClick={() => setRestoreFile(null)}
                        className="remove-file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div className="management-card-footer">
                  {!restoreFile ? (
                    <label className="btn btn-primary btn-block">
                      <span>📤</span>
                      <span>Select Backup ZIP</span>
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => setRestoreFile(e.target.files[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                  ) : (
                    <button
                      onClick={handleRestore}
                      className="btn btn-primary btn-block"
                      disabled={restoreLoading}
                    >
                      {restoreLoading ? (
                        <>
                          <span className="spinner-small"></span>
                          <span>Restoring...</span>
                        </>
                      ) : (
                        <>
                          <span>⬆️</span>
                          <span>Restore Files</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="management-card danger-card">
                <div className="management-card-header">
                  <div className="management-icon danger-icon">⚠️</div>
                  <div>
                    <h3>Danger Zone</h3>
                    <p>Irreversible actions - use with caution</p>
                  </div>
                </div>
                <div className="management-card-body">
                  <p className="management-description danger-text">
                    <strong>Warning:</strong> This action will permanently
                    delete ALL files in your CDN. This cannot be undone!
                  </p>
                  <ul className="management-list danger-list">
                    <li>⚠️ All files will be deleted</li>
                    <li>⚠️ Action is permanent</li>
                    <li>⚠️ No recovery possible</li>
                  </ul>
                  <div className="danger-recommendation">
                    💡 <strong>Recommendation:</strong> Create a backup before
                    clearing your CDN
                  </div>
                </div>
                <div className="management-card-footer">
                  <button
                    onClick={handleClearCDN}
                    className="btn btn-danger btn-block"
                  >
                    <span>🗑️</span>
                    <span>Clear All Files</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Preview/Details Modal */}
      {previewModal.show && (
        <div className="modal-overlay-modern" onClick={closePreview}>
          <div
            className="modal-modern modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>{previewModal.item.name}</h2>
              <button className="modal-close-modern" onClick={closePreview}>
                ✕
              </button>
            </div>
            <div className="modal-body-modern">
              {previewModal.type === "image" && (
                <div className="preview-container-modern">
                  <img
                    src={previewModal.item.url}
                    alt={previewModal.item.name}
                    className="preview-image-modern"
                  />
                </div>
              )}

              {previewModal.type === "video" && (
                <div className="preview-container-modern">
                  <video
                    src={previewModal.item.url}
                    controls
                    className="preview-video-modern"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {previewModal.type === "details" && (
                <div className="details-grid-modern">
                  <div className="detail-row">
                    <span className="detail-label-modern">📄 File Name</span>
                    <span className="detail-value-modern">
                      {previewModal.item.name}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label-modern">📏 File Size</span>
                    <span className="detail-value-modern">
                      {formatBytes(previewModal.item.size)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label-modern">🏷️ File Type</span>
                    <span className="detail-value-modern">
                      .{getFileExtension(previewModal.item.name).toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label-modern">📅 Upload Date</span>
                    <span className="detail-value-modern">
                      {new Date(previewModal.item.created).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label-modern">🕐 Upload Time</span>
                    <span className="detail-value-modern">
                      {new Date(previewModal.item.created).toLocaleTimeString(
                        "en-US"
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label-modern">
                      📝 Last Modified
                    </span>
                    <span className="detail-value-modern">
                      {new Date(previewModal.item.modified).toLocaleString(
                        "en-US"
                      )}
                    </span>
                  </div>
                  <div className="detail-row detail-row-full">
                    <span className="detail-label-modern">🔗 CDN URL</span>
                    <div className="url-copy-box">
                      <input
                        type="text"
                        value={previewModal.item.url}
                        readOnly
                        className="url-input-modern"
                      />
                      <button
                        onClick={() => copyUrl(previewModal.item.url)}
                        className="btn btn-primary btn-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {showDocs && (
        <div
          className="modal-overlay-modern"
          onClick={() => setShowDocs(false)}
        >
          <div
            className="modal-modern modal-docs-modern"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>📚 API Documentation</h2>
              <button
                className="modal-close-modern"
                onClick={() => setShowDocs(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body-modern docs-content">
              <div className="docs-section-modern">
                <h3>🔑 API Keys</h3>
                <p>Three API keys with different file size limits:</p>
                <ul className="docs-list-modern">
                  <li>
                    <strong>Small:</strong> Up to 5 MB
                  </li>
                  <li>
                    <strong>Medium:</strong> Up to 50 MB
                  </li>
                  <li>
                    <strong>Large:</strong> Unlimited
                  </li>
                </ul>
              </div>

              <div className="docs-section-modern">
                <h3>📡 Main Endpoints</h3>
                <div className="endpoint-modern">
                  <span className="method-badge get">GET</span>
                  <code>/api/info</code>
                  <p>Get storage information</p>
                </div>
                <div className="endpoint-modern">
                  <span className="method-badge get">GET</span>
                  <code>/api/list</code>
                  <p>List all files</p>
                </div>
                <div className="endpoint-modern">
                  <span className="method-badge post">POST</span>
                  <code>/api/file/upload</code>
                  <p>Upload a file with custom name</p>
                </div>
                <div className="endpoint-modern">
                  <span className="method-badge delete">DELETE</span>
                  <code>/api/file/delete</code>
                  <p>Delete a file</p>
                </div>
              </div>

              <div className="docs-section-modern">
                <h3>💡 Upload Example</h3>
                <code className="code-block-modern">{`const formData = new FormData();
formData.append('file', yourFile);
formData.append('customFileName', 'my-file.jpg');

fetch('http://localhost:5000/api/file/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key'
  },
  body: formData
});`}</code>
              </div>

              <p className="docs-footer-text">
                For complete documentation, see{" "}
                <code
                  className="docs-link"
                  onClick={downloadApiDoc}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                >
                  API.md ⬇️
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

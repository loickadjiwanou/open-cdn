import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";
const credentials = require("../src/credentials");

// Use the medium API key by default (max 50MB)
const DEFAULT_API_KEY = credentials.apiKeys.medium.key;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedUploadPath, setSelectedUploadPath] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    show: false,
    type: null,
    item: null,
  });

  // Documentation modal state
  const [showDocs, setShowDocs] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadStorageInfo();
    }
  }, [isAuthenticated, currentPath]);

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
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setLoginError("Connection error: Unable to reach the server");
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/list?folder=${currentPath}`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });
      const data = await response.json();
      if (data.error) {
        console.error(data.message);
      } else {
        setItems(data.items || []);
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

  const buildFolderTree = (items, basePath = "") => {
    const tree = [];

    items.forEach((item) => {
      if (item.type === "folder") {
        const fullPath = basePath ? `${basePath}/${item.name}` : item.name;
        tree.push({
          name: item.name,
          path: fullPath,
          children: null, // null means not loaded yet, [] means loaded but empty
          hasChildren: null, // will be determined when expanded
        });
      }
    });

    return tree;
  };

  const loadFolderTree = async (folderPath = "", parentTree = null) => {
    try {
      const response = await fetch(`${API_URL}/list?folder=${folderPath}`, {
        headers: { "x-api-key": DEFAULT_API_KEY },
      });
      const data = await response.json();

      if (data.items) {
        const folders = data.items.filter((item) => item.type === "folder");

        if (parentTree) {
          return folders.map((folder) => ({
            name: folder.name,
            path: folderPath ? `${folderPath}/${folder.name}` : folder.name,
            children: null,
            hasChildren: null,
          }));
        } else {
          const tree = folders.map((folder) => ({
            name: folder.name,
            path: folder.name,
            children: null,
            hasChildren: null,
          }));
          setFolderTree(tree);
          return tree;
        }
      }
    } catch (error) {
      console.error("Error loading folder tree:", error);
    }
    return [];
  };

  const toggleFolder = async (folderPath) => {
    const isExpanded = expandedFolders[folderPath];

    if (isExpanded) {
      // Collapse
      setExpandedFolders((prev) => ({ ...prev, [folderPath]: false }));
    } else {
      // Expand and load children
      setExpandedFolders((prev) => ({ ...prev, [folderPath]: true }));

      // Load children for this folder
      const children = await loadFolderTree(folderPath);

      // Update the tree with children
      const updateTreeChildren = (tree) => {
        return tree.map((folder) => {
          if (folder.path === folderPath) {
            return {
              ...folder,
              children: children,
              hasChildren: children.length > 0,
            };
          }
          if (
            folder.children &&
            Array.isArray(folder.children) &&
            folder.children.length > 0
          ) {
            return { ...folder, children: updateTreeChildren(folder.children) };
          }
          return folder;
        });
      };

      setFolderTree((prev) => updateTreeChildren(prev));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath = currentPath
      ? `${currentPath}/${newFolderName}`
      : newFolderName;

    try {
      const response = await fetch(`${API_URL}/folder/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": DEFAULT_API_KEY,
        },
        body: JSON.stringify({ folderPath }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewFolderName("");
        setShowCreateFolder(false);
        loadItems();
      } else {
        alert(data.message || "Error creating folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Error creating folder");
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", selectedUploadPath);
    formData.append("keepOriginalName", "true");

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
        setShowFolderSelector(false);
        setSelectedUploadPath("");
        loadItems();
        loadStorageInfo();
        alert("File uploaded successfully!");
      } else {
        setUploadError(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Network error: Unable to upload file");
    }
    setUploading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadError("");
      // Load folder tree when file is selected
      await loadFolderTree();
      setShowFolderSelector(true);
      setSelectedUploadPath(""); // Reset to root
    }
  };

  const renderFolderTree = (folders, level = 0) => {
    return folders.map((folder, index) => {
      const hasSubfolders =
        folder.hasChildren === true || folder.children === null;
      const showToggle =
        hasSubfolders &&
        folder.children !== null &&
        (!Array.isArray(folder.children) || folder.children.length > 0);

      return (
        <div
          key={folder.path}
          className="tree-item"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="tree-item-content">
            {showToggle ? (
              <button
                className="tree-toggle"
                onClick={() => toggleFolder(folder.path)}
              >
                {expandedFolders[folder.path] ? "▼" : "▶"}
              </button>
            ) : (
              <span className="tree-toggle-spacer"></span>
            )}
            <button
              className={`tree-folder ${
                selectedUploadPath === folder.path ? "selected" : ""
              }`}
              onClick={() => setSelectedUploadPath(folder.path)}
            >
              📁 {folder.name}
            </button>
          </div>
          {expandedFolders[folder.path] &&
            folder.children &&
            Array.isArray(folder.children) &&
            folder.children.length > 0 && (
              <div className="tree-children">
                {renderFolderTree(folder.children, level + 1)}
              </div>
            )}
        </div>
      );
    });
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(`Delete ${item.name}?`);
    if (!confirmDelete) return;

    const endpoint = item.type === "folder" ? "folder/delete" : "file/delete";
    const pathKey = item.type === "folder" ? "folderPath" : "filePath";
    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": DEFAULT_API_KEY,
        },
        body: JSON.stringify({ [pathKey]: itemPath }),
      });

      const data = await response.json();

      if (response.ok) {
        loadItems();
        loadStorageInfo();
      } else {
        alert(data.message || "Error deleting item");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting item");
    }
  };

  const navigateToFolder = (folderName) => {
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const navigateUp = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase();
  };

  const isImage = (filename) => {
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    return imageExts.includes(getFileExtension(filename));
  };

  const isVideo = (filename) => {
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
    return videoExts.includes(getFileExtension(filename));
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

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, folder) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (folder && folder.type === "folder") {
      setDragOverFolder(folder.name);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverFolder(null);
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedItem) return;

    // Can't drop into itself
    if (draggedItem.name === targetFolder.name) {
      alert("Cannot move a folder into itself");
      setDraggedItem(null);
      return;
    }

    setIsMoving(true);

    try {
      const sourcePath = currentPath
        ? `${currentPath}/${draggedItem.name}`
        : draggedItem.name;
      const targetPath = currentPath
        ? `${currentPath}/${targetFolder.name}`
        : targetFolder.name;
      const newPath = `${targetPath}/${draggedItem.name}`;

      if (draggedItem.type === "folder") {
        // Move folder
        const response = await fetch(`${API_URL}/move/folder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": DEFAULT_API_KEY,
          },
          body: JSON.stringify({
            sourcePath,
            destinationPath: newPath,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          loadItems();
          loadStorageInfo();
        } else {
          alert(data.message || "Failed to move folder");
        }
      } else {
        // Move file
        const response = await fetch(`${API_URL}/move/file`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": DEFAULT_API_KEY,
          },
          body: JSON.stringify({
            sourcePath,
            destinationPath: newPath,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          loadItems();
          loadStorageInfo();
        } else {
          alert(data.message || "Failed to move file");
        }
      }
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Error moving item");
    }

    setIsMoving(false);
    setDraggedItem(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="logo">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <rect width="60" height="60" rx="12" fill="url(#gradient)" />
              <path
                d="M20 25L30 15L40 25M30 17V40"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 35H45V45H15V35Z"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="60" y2="60">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <h1>OpenCDN</h1>
          </div>
          <p className="subtitle">Local Content Delivery Network</p>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            {loginError && <div className="error">{loginError}</div>}
            <button type="submit" className="btn btn-primary">
              Login to Admin Panel
            </button>
          </form>

          <div className="login-footer">
            <p>
              Change credentials in <code>credentials.js</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-small">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
              <rect width="60" height="60" rx="12" fill="url(#gradient2)" />
              <path
                d="M20 25L30 15L40 25M30 17V40"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 35H45V45H15V35Z"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="gradient2" x1="0" y1="0" x2="60" y2="60">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <h2>OpenCDN</h2>
          </div>

          {storageInfo && (
            <div className="storage-info">
              <span className="storage-label">Storage Used:</span>
              <span className="storage-value">
                {storageInfo.totalSizeMB} MB
              </span>
            </div>
          )}

          <button
            onClick={() => setIsAuthenticated(false)}
            className="btn btn-secondary"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        <div className="toolbar">
          <div className="breadcrumb">
            <button
              onClick={() => setCurrentPath("")}
              className="breadcrumb-item"
            >
              🏠 Home
            </button>
            {currentPath
              .split("/")
              .filter(Boolean)
              .map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span className="breadcrumb-separator">/</span>
                  <button
                    onClick={() =>
                      setCurrentPath(arr.slice(0, index + 1).join("/"))
                    }
                    className="breadcrumb-item"
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <div className="toolbar-actions">
            <button
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="btn btn-primary"
            >
              📁 New Folder
            </button>

            <label className="btn btn-primary file-upload-btn">
              📤 Upload File
              <input
                type="file"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {showCreateFolder && (
          <div className="create-folder-box">
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="input"
              onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <button onClick={handleCreateFolder} className="btn btn-primary">
              Create
            </button>
            <button
              onClick={() => setShowCreateFolder(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}

        {showFolderSelector && uploadFile && (
          <div className="folder-selector-modal">
            <div className="folder-selector-content">
              <h3>📂 Select Upload Destination</h3>
              <p className="folder-selector-file">
                Uploading: <strong>{uploadFile.name}</strong> (
                {formatBytes(uploadFile.size)})
              </p>

              <div className="folder-tree-container">
                <div className="tree-item" style={{ marginLeft: 0 }}>
                  <div className="tree-item-content">
                    <button
                      className={`tree-folder tree-root ${
                        selectedUploadPath === "" ? "selected" : ""
                      }`}
                      onClick={() => setSelectedUploadPath("")}
                    >
                      🏠 Root (Home)
                    </button>
                  </div>
                </div>

                {folderTree.length > 0 ? (
                  renderFolderTree(folderTree)
                ) : (
                  <div className="no-folders">
                    <p>No folders yet. File will be uploaded to root.</p>
                  </div>
                )}
              </div>

              <div className="selected-path-display">
                <strong>Upload to:</strong>
                <span className="selected-path">
                  {selectedUploadPath || "/  (root)"}
                </span>
              </div>

              {uploadError && <div className="upload-error">{uploadError}</div>}

              <div className="folder-selector-actions">
                <button
                  onClick={handleFileUpload}
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "✓ Upload Here"}
                </button>
                <button
                  onClick={() => {
                    setShowFolderSelector(false);
                    setUploadFile(null);
                    setUploadError("");
                    setSelectedUploadPath("");
                  }}
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="items-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>No files or folders here</p>
              <p className="empty-hint">
                Create a folder or upload files to get started
              </p>
            </div>
          ) : (
            <div className="items-grid">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`item-card ${
                    dragOverFolder === item.name ? "drag-over" : ""
                  } ${draggedItem?.name === item.name ? "dragging" : ""}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) =>
                    item.type === "folder" && handleDragOver(e, item)
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => item.type === "folder" && handleDrop(e, item)}
                >
                  <div className="item-icon">
                    {item.type === "folder" ? "📁" : "📄"}
                  </div>

                  <div className="item-details">
                    <div
                      className="item-name"
                      onClick={() =>
                        item.type === "folder" && navigateToFolder(item.name)
                      }
                      style={{
                        cursor: item.type === "folder" ? "pointer" : "default",
                      }}
                    >
                      {item.name}
                    </div>

                    {item.type === "file" && (
                      <>
                        <div className="item-size">
                          {formatBytes(item.size)}
                        </div>

                        <div className="item-actions-row">
                          {(isImage(item.name) || isVideo(item.name)) && (
                            <button
                              onClick={() => openPreview(item)}
                              className="btn-action btn-preview"
                            >
                              👁️ Preview
                            </button>
                          )}
                          <button
                            onClick={() => openDetails(item)}
                            className="btn-action btn-details"
                          >
                            ℹ️ Details
                          </button>
                        </div>

                        <div className="item-url">
                          <input
                            type="text"
                            value={item.url}
                            readOnly
                            className="url-input"
                          />
                          <button
                            onClick={() => copyUrl(item.url)}
                            className="btn-icon"
                            title="Copy URL"
                          >
                            📋
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item)}
                    className="btn-delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewModal.show && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePreview}>
              ✕
            </button>

            {previewModal.type === "image" && (
              <div className="preview-container">
                <h3>{previewModal.item.name}</h3>
                <img
                  src={previewModal.item.url}
                  alt={previewModal.item.name}
                  className="preview-image"
                />
                <div className="preview-info">
                  <p>
                    <strong>Size:</strong> {formatBytes(previewModal.item.size)}
                  </p>
                  <p>
                    <strong>URL:</strong> {previewModal.item.url}
                  </p>
                </div>
              </div>
            )}

            {previewModal.type === "video" && (
              <div className="preview-container">
                <h3>{previewModal.item.name}</h3>
                <video
                  src={previewModal.item.url}
                  controls
                  className="preview-video"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="preview-info">
                  <p>
                    <strong>Size:</strong> {formatBytes(previewModal.item.size)}
                  </p>
                  <p>
                    <strong>URL:</strong> {previewModal.item.url}
                  </p>
                </div>
              </div>
            )}

            {previewModal.type === "details" && (
              <div className="details-container">
                <h3>File Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">
                      {previewModal.item.name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {getFileExtension(previewModal.item.name).toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">
                      {formatBytes(previewModal.item.size)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(previewModal.item.created).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Modified:</span>
                    <span className="detail-value">
                      {new Date(previewModal.item.modified).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item detail-url">
                    <span className="detail-label">URL:</span>
                    <div className="detail-url-container">
                      <input
                        type="text"
                        value={previewModal.item.url}
                        readOnly
                        className="detail-url-input"
                      />
                      <button
                        onClick={() => copyUrl(previewModal.item.url)}
                        className="btn btn-primary btn-small"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentation Modal */}
      {showDocs && (
        <div className="modal-overlay" onClick={() => setShowDocs(false)}>
          <div
            className="modal-content modal-docs"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowDocs(false)}>
              ✕
            </button>
            <div className="docs-container">
              <h2>📚 OpenCDN API Documentation</h2>

              <div className="docs-section">
                <h3>Base URL</h3>
                <code className="code-block">http://localhost:5000/api</code>
              </div>

              <div className="docs-section">
                <h3>🔑 API Key System</h3>
                <p>
                  OpenCDN uses three API keys with different file size limits:
                </p>
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>API Key Type</th>
                      <th>Max File Size</th>
                      <th>Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Small</strong>
                      </td>
                      <td>5 MB</td>
                      <td>Thumbnails, icons, small images</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Medium</strong>
                      </td>
                      <td>50 MB</td>
                      <td>Images, documents, audio files</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Large</strong>
                      </td>
                      <td>Unlimited</td>
                      <td>Videos, large files, backups</td>
                    </tr>
                  </tbody>
                </table>
                <div className="docs-note">
                  <strong>Note:</strong> API keys are configured in{" "}
                  <code>credentials.js</code>
                </div>
              </div>

              <div className="docs-section">
                <h3>📡 Main Endpoints</h3>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-get">GET</span>
                    <span className="endpoint-path">/api/info</span>
                  </div>
                  <p>Get storage information and API key details</p>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-get">GET</span>
                    <span className="endpoint-path">/api/list?folder=path</span>
                  </div>
                  <p>List all files and folders in a directory</p>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-post">POST</span>
                    <span className="endpoint-path">/api/folder/create</span>
                  </div>
                  <p>Create a new folder or nested folders</p>
                  <code className="code-block">
                    {'{ "folderPath": "images/thumbnails" }'}
                  </code>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-delete">DELETE</span>
                    <span className="endpoint-path">/api/folder/delete</span>
                  </div>
                  <p>Delete a folder and all its contents</p>
                  <code className="code-block">
                    {'{ "folderPath": "images/old" }'}
                  </code>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-post">POST</span>
                    <span className="endpoint-path">/api/file/upload</span>
                  </div>
                  <p>Upload a file (multipart/form-data)</p>
                  <ul className="endpoint-params">
                    <li>
                      <code>file</code> - The file to upload
                    </li>
                    <li>
                      <code>folder</code> - Destination folder (optional)
                    </li>
                    <li>
                      <code>keepOriginalName</code> - true/false (optional)
                    </li>
                  </ul>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header (size validated)
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-delete">DELETE</span>
                    <span className="endpoint-path">/api/file/delete</span>
                  </div>
                  <p>Delete a file from storage</p>
                  <code className="code-block">
                    {'{ "filePath": "images/photo.jpg" }'}
                  </code>
                  <div className="endpoint-auth">
                    🔒 Requires: x-api-key header
                  </div>
                </div>

                <div className="endpoint">
                  <div className="endpoint-header">
                    <span className="method method-get">GET</span>
                    <span className="endpoint-path">
                      /files/path/to/file.jpg
                    </span>
                  </div>
                  <p>Direct file access (no authentication required)</p>
                  <div className="endpoint-public">🌐 Public access</div>
                </div>
              </div>

              <div className="docs-section">
                <h3>💡 Example Usage</h3>
                <pre className="code-block code-example">{`// Upload a file with JavaScript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'images');

fetch('http://localhost:5000/api/file/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-medium-files-50mb-key'
  },
  body: formData
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('File URL:', data.file.url);
  } else {
    console.error('Error:', data.message);
  }
});`}</pre>
              </div>

              <div className="docs-section">
                <h3>❌ Error Handling</h3>
                <div className="docs-note error-note">
                  <strong>File Too Large Example:</strong>
                  <pre className="code-block">{`{
  "error": "Payload Too Large",
  "message": "Your file size is 40.00 MB, but your API key 
             (Small Files max 5MB) only allows files up to 5 MB.",
  "suggestion": "Please use the Medium Files API key (max 50MB) 
                or Large Files API key (unlimited)."
}`}</pre>
                </div>
              </div>

              <div className="docs-section">
                <h3>🔐 Security Notes</h3>
                <ul className="docs-list">
                  <li>
                    Always change default API keys in{" "}
                    <code>credentials.js</code>
                  </li>
                  <li>Never expose API keys in client-side code</li>
                  <li>Use appropriate API key for your file sizes</li>
                  <li>Enable HTTPS in production environments</li>
                  <li>Regularly backup your cdn-storage directory</li>
                </ul>
              </div>

              <div className="docs-footer">
                <p>
                  For complete documentation, see <code>API.md</code> in the
                  project root.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Documentation Button */}
      <button
        className="floating-docs-btn"
        onClick={() => setShowDocs(true)}
        title="View API Documentation"
      >
        📚
      </button>

      {/* Moving Loader */}
      {isMoving && (
        <div className="moving-loader">
          <div className="loader-content">
            <div className="spinner"></div>
            <p>Moving item...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

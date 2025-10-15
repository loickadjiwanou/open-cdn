# OpenCDN API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All API endpoints (except `/admin/login` and `/files/*`) require an API key for authentication.

### API Key System

OpenCDN implements a three-tier API key system with file size limits:

| API Key Type | Default Key | Max File Size | Use Case |
|--------------|-------------|---------------|----------|
| **Small** | `opencdn-small-files-5mb-key` | 5 MB | Thumbnails, icons, small images |
| **Medium** | `opencdn-medium-files-50mb-key` | 50 MB | Regular images, documents, audio |
| **Large** | `opencdn-large-files-unlimited-key` | Unlimited | Videos, large files, backups |

### Headers Required
```
x-api-key: your-api-key-here
```

The API keys are defined in `credentials.js` file:
```javascript
apiKeys: {
  small: {
    key: 'opencdn-small-files-5mb-key',
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
    label: 'Small Files (max 5MB)'
  },
  medium: {
    key: 'opencdn-medium-files-50mb-key',
    maxSize: 50 * 1024 * 1024, // 50MB in bytes
    label: 'Medium Files (max 50MB)'
  },
  large: {
    key: 'opencdn-large-files-unlimited-key',
    maxSize: Infinity, // No limit
    label: 'Large Files (unlimited)'
  }
}
```

**Important:** Change these API keys before deploying to production!

---

## Endpoints

### 1. Get Storage Information

Get information about the CDN storage usage and API key info.

**Endpoint:** `GET /api/info`

**Headers:**
- `x-api-key: your-api-key`

**Response:**
```json
{
  "storagePath": "/path/to/cdn-storage",
  "totalSize": 1048576,
  "totalSizeMB": "1.00",
  "apiKeyInfo": "Medium Files (max 50MB)"
}
```

**Example (cURL):**
```bash
curl -H "x-api-key: opencdn-medium-files-50mb-key" \
  http://localhost:5000/api/info
```

---

### 2. List Files and Folders

List all files and folders in a specific directory.

**Endpoint:** `GET /api/list`

**Headers:**
- `x-api-key: your-api-key`

**Query Parameters:**
- `folder` (optional): Path to the folder (e.g., `images/thumbnails`)

**Response:**
```json
{
  "items": [
    {
      "name": "photo.jpg",
      "type": "file",
      "size": 204800,
      "created": "2025-10-14T10:30:00.000Z",
      "modified": "2025-10-14T10:30:00.000Z",
      "url": "http://localhost:5000/files/images/photo.jpg"
    },
    {
      "name": "thumbnails",
      "type": "folder",
      "size": 0,
      "created": "2025-10-14T09:00:00.000Z",
      "modified": "2025-10-14T09:00:00.000Z",
      "url": null
    }
  ],
  "currentPath": "images"
}
```

**Error Response (Folder not found):**
```json
{
  "error": "Folder not found",
  "message": "The folder \"images/missing\" does not exist in the CDN storage.",
  "path": "images/missing"
}
```

**Example (cURL):**
```bash
curl -H "x-api-key: opencdn-medium-files-50mb-key" \
  "http://localhost:5000/api/list?folder=images"
```

---

### 3. Create Folder

Create a new folder in the CDN storage. Supports nested folder creation.

**Endpoint:** `POST /api/folder/create`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: application/json`

**Body:**
```json
{
  "folderPath": "images/thumbnails/2025"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "path": "images/thumbnails/2025"
}
```

**Response (Conflict):**
```json
{
  "error": "Conflict: Folder already exists",
  "message": "A folder with the path \"images/thumbnails/2025\" already exists.",
  "path": "images/thumbnails/2025"
}
```

**Response (Bad Request):**
```json
{
  "error": "Bad Request: Folder path is required",
  "message": "Please provide a \"folderPath\" in the request body."
}
```

**Example (cURL):**
```bash
curl -X POST \
  -H "x-api-key: opencdn-medium-files-50mb-key" \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"images/thumbnails/2025"}' \
  http://localhost:5000/api/folder/create
```

**Example (JavaScript):**
```javascript
fetch('http://localhost:5000/api/folder/create', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-medium-files-50mb-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    folderPath: 'images/thumbnails/2025'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 4. Delete Folder

Delete a folder and all its contents from the CDN storage.

**Endpoint:** `DELETE /api/folder/delete`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: application/json`

**Body:**
```json
{
  "folderPath": "images/thumbnails"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Folder deleted successfully",
  "path": "images/thumbnails"
}
```

**Response (Not Found):**
```json
{
  "error": "Not Found: Folder does not exist",
  "message": "The folder \"images/missing\" was not found.",
  "path": "images/missing"
}
```

**Example (cURL):**
```bash
curl -X DELETE \
  -H "x-api-key: opencdn-medium-files-50mb-key" \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"images/thumbnails"}' \
  http://localhost:5000/api/folder/delete
```

---

### 5. Upload File

Upload a file to the CDN storage with a custom filename.

**Endpoint:** `POST /api/file/upload`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: The file to upload (required)
- `customFileName`: Custom name for the file in CDN (required). **The extension from the original file will be preserved automatically.**

**Important Notes:**
- The file extension is automatically extracted from the original file and appended
- You only need to provide the filename without extension
- Example: If you upload `photo.jpg` with `customFileName: "vacation-2025"`, it will be saved as `vacation-2025.jpg`
- File size is validated against the API key's limit
- All files are stored in the root directory

**Response (Success):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "originalName": "photo.jpg",
    "filename": "photo.jpg",
    "size": 2048000,
    "sizeMB": "1.95",
    "path": "images/photo.jpg",
    "url": "http://localhost:5000/files/images/photo.jpg"
  },
  "apiKeyUsed": "Small Files (max 5MB)"
}
```

**Response (File Too Large - IMPORTANT):**
```json
{
  "error": "Payload Too Large: File size exceeds API key limit",
  "message": "Your file size is 40.00 MB, but your API key (Small Files max 5MB) only allows files up to 5 MB.",
  "fileSize": 41943040,
  "fileSizeMB": "40.00",
  "maxSize": 5242880,
  "maxSizeMB": "5",
  "apiKeyType": "Small Files (max 5MB)",
  "suggestion": "Please use the Medium Files API key (max 50MB) or Large Files API key (unlimited)."
}
```

**Response (No File):**
```json
{
  "error": "Bad Request: No file uploaded",
  "message": "Please provide a file in the \"file\" field of the multipart form data."
}
```

**Example (cURL - Upload with custom name):**
```bash
# Upload a file with custom name "my-vacation" - extension .jpg will be preserved
curl -X POST \
  -H "x-api-key: opencdn-small-files-5mb-key" \
  -F "file=@/path/to/photo.jpg" \
  -F "customFileName=my-vacation" \
  http://localhost:5000/api/file/upload

# Result: File will be saved as "my-vacation.jpg"
```

**Example (cURL - Large File):**
```bash
curl -X POST \
  -H "x-api-key: opencdn-large-files-unlimited-key" \
  -F "file=@/path/to/large-video.mp4" \
  -F "customFileName=presentation-video" \
  http://localhost:5000/api/file/upload

# Result: File will be saved as "presentation-video.mp4"
```

**Example (JavaScript with FormData):**
```javascript
// Get original file extension
const getFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
};

const file = fileInput.files[0];
const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
const extension = getFileExtension(file.name);

const formData = new FormData();
formData.append('file', file);
// Only provide the name without extension - extension is preserved automatically
formData.append('customFileName', 'my-custom-name' + extension);

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
    console.log('Final filename:', data.file.filename);
    // Final filename will be: my-custom-name.jpg (or whatever extension)
  } else {
    console.error('Upload failed:', data.message);
  }
});
```

**Example (Node.js with form-data):**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const form = new FormData();
const filePath = '/path/to/file.jpg';
const fileName = path.basename(filePath, path.extname(filePath)); // Get name without extension

form.append('file', fs.createReadStream(filePath));
form.append('customFileName', 'my-renamed-file' + path.extname(filePath));

fetch('http://localhost:5000/api/file/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-large-files-unlimited-key',
    ...form.getHeaders()
  },
  body: form
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 6. Delete File

Delete a file from the CDN storage.

**Endpoint:** `DELETE /api/file/delete`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: application/json`

**Body:**
```json
{
  "filePath": "images/photo.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "path": "images/photo.jpg"
}
```

**Response (Not Found):**
```json
{
  "error": "Not Found: File does not exist",
  "message": "The file \"images/missing.jpg\" was not found.",
  "path": "images/missing.jpg"
}
```

**Response (Path is Directory):**
```json
{
  "error": "Bad Request: Path is a directory",
  "message": "\"images\" is a directory, not a file. Use the folder delete endpoint instead.",
  "path": "images"
}
```

**Example (cURL):**
```bash
curl -X DELETE \
  -H "x-api-key: opencdn-medium-files-50mb-key" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"images/photo.jpg"}' \
  http://localhost:5000/api/file/delete
```

---

### 7. Move File

Move or rename a file within the CDN storage.

**Endpoint:** `POST /api/move/file`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: application/json`

**Body:**
```json
{
  "sourcePath": "images/old-photo.jpg",
  "destinationPath": "archive/2024/photo.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File moved successfully",
  "from": "images/old-photo.jpg",
  "to": "archive/2024/photo.jpg"
}
```

**Response (Source Not Found):**
```json
{
  "error": "Not Found: Source file does not exist",
  "message": "The file \"images/old-photo.jpg\" was not found.",
  "path": "images/old-photo.jpg"
}
```

**Response (Destination Exists):**
```json
{
  "error": "Conflict: Destination already exists",
  "message": "A file already exists at \"archive/2024/photo.jpg\".",
  "path": "archive/2024/photo.jpg"
}
```

**Example (cURL):**
```bash
curl -X POST \
  -H "x-api-key: opencdn-medium-files-50mb-key" \
  -H "Content-Type: application/json" \
  -d '{"sourcePath":"images/old-photo.jpg","destinationPath":"archive/2024/photo.jpg"}' \
  http://localhost:5000/api/move/file
```

**Example (JavaScript):**
```javascript
// Move a file to a different folder
fetch('http://localhost:5000/api/move/file', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-medium-files-50mb-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sourcePath: 'temp/upload.jpg',
    destinationPath: 'images/2025/upload.jpg'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Note:** The destination folder structure will be created automatically if it doesn't exist.

---

### 8. Move Folder

Move or rename an entire folder within the CDN storage.

**Endpoint:** `POST /api/move/folder`

**Headers:**
- `x-api-key: your-api-key`
- `Content-Type: application/json`

**Body:**
```json
{
  "sourcePath": "temp-images",
  "destinationPath": "archive/old-images"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Folder moved successfully",
  "from": "temp-images",
  "to": "archive/old-images"
}
```

**Response (Cannot Move Into Itself):**
```json
{
  "error": "Bad Request: Cannot move folder into itself",
  "message": "Cannot move \"images\" into its own subfolder \"images/subfolder\".",
  "sourcePath": "images",
  "destinationPath": "images/subfolder"
}
```

**Response (Destination Exists):**
```json
{
  "error": "Conflict: Destination already exists",
  "message": "A folder already exists at \"archive/old-images\".",
  "path": "archive/old-images"
}
```

**Example (cURL):**
```bash
curl -X POST \
  -H "x-api-key: opencdn-medium-files-50mb-key" \
  -H "Content-Type: application/json" \
  -d '{"sourcePath":"temp-images","destinationPath":"archive/old-images"}' \
  http://localhost:5000/api/move/folder
```

**Example (JavaScript):**
```javascript
// Move an entire folder
fetch('http://localhost:5000/api/move/folder', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-medium-files-50mb-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sourcePath: 'old-projects',
    destinationPath: 'archive/2024/projects'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Note:** 
- The destination parent folders will be created automatically if they don't exist
- You cannot move a folder into itself or its own subfolders
- All contents of the folder are moved recursively

---

### 9. Access Files (Direct URLs)

Files can be accessed directly via their URLs **without authentication**.

**Endpoint:** `GET /files/{path}`

**Example:**
```
http://localhost:5000/files/images/photo.jpg
http://localhost:5000/files/videos/2025/movie.mp4
```

You can use these URLs in:
- `<img>` tags
- `<video>` tags
- `<audio>` tags
- Direct downloads
- Any HTTP client

**Example (HTML):**
```html
<img src="http://localhost:5000/files/images/photo.jpg" alt="Photo">
<video controls>
  <source src="http://localhost:5000/files/videos/movie.mp4" type="video/mp4">
</video>
```

---

### 10. Admin Login

Authenticate to access the admin panel (web interface only).

**Endpoint:** `POST /api/admin/login`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "apiKeys": {
    "small": "Small Files (max 5MB)",
    "medium": "Medium Files (max 50MB)",
    "large": "Large Files (unlimited)"
  }
}
```

**Response (Failed):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid credentials",
  "message": "The username or password you entered is incorrect."
}
```

**Response (Missing Credentials):**
```json
{
  "success": false,
  "error": "Bad Request: Missing credentials",
  "message": "Please provide both username and password."
}
```

**Note:** Admin credentials are defined in `credentials.js`:
```javascript
admin: {
  username: 'admin',
  password: 'admin'
}
```

---

## Error Responses

All endpoints return detailed, actionable error messages.

### 401 Unauthorized (Missing API Key)
```json
{
  "error": "Unauthorized: API key is missing",
  "message": "Please provide an API key in the x-api-key header"
}
```

### 401 Unauthorized (Invalid API Key)
```json
{
  "error": "Unauthorized: Invalid API key",
  "message": "The provided API key is not recognized. Please check your credentials."
}
```

### 413 Payload Too Large (File Size Exceeds Limit)
```json
{
  "error": "Payload Too Large: File size exceeds API key limit",
  "message": "Your file size is 40.00 MB, but your API key (Small Files max 5MB) only allows files up to 5 MB.",
  "fileSize": 41943040,
  "fileSizeMB": "40.00",
  "maxSize": 5242880,
  "maxSizeMB": "5",
  "apiKeyType": "Small Files (max 5MB)",
  "suggestion": "Please use the Medium Files API key (max 50MB) or Large Files API key (unlimited)."
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request: [Specific issue]",
  "message": "[Detailed explanation of what went wrong]"
}
```

### 404 Not Found
```json
{
  "error": "Not Found: [Resource type]",
  "message": "[Detailed message about what wasn't found]",
  "path": "[Path that was attempted]"
}
```

### 409 Conflict
```json
{
  "error": "Conflict: [Issue]",
  "message": "[Explanation of the conflict]",
  "path": "[Conflicting path]"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "[Detailed error message]"
}
```

---

## Choosing the Right API Key

Use this guide to select the appropriate API key for your use case:

### Small Files API Key (5MB limit)
**Use for:**
- Thumbnails
- Profile pictures
- Icons
- Small images
- Text files
- Small PDFs

### Medium Files API Key (50MB limit)
**Use for:**
- High-resolution images
- Standard documents
- Audio files
- Presentations
- Medium-sized PDFs
- Compressed archives

### Large Files API Key (Unlimited)
**Use for:**
- Videos
- Large archives
- Backups
- High-resolution videos
- Large datasets
- Any file over 50MB

---

## Security Best Practices

1. **Change Default Keys:** Always change the default API keys in `credentials.js`
2. **Use Appropriate Keys:** Don't share the unlimited key with untrusted sources
3. **Key Rotation:** Regularly rotate your API keys
4. **HTTPS:** Use HTTPS in production to encrypt API requests
5. **Firewall:** Restrict access to the CDN server
6. **API Key Protection:** Never expose API keys in client-side code or public repositories
7. **Regular Backups:** Backup your CDN storage directory regularly
8. **Monitor Usage:** Track which API keys are being used and how

---

## Example Integration

### Complete Upload Workflow with Error Handling

```javascript
// Configuration
const CDN_URL = 'http://localhost:5000';
const API_KEYS = {
  small: 'opencdn-small-files-5mb-key',
  medium: 'opencdn-medium-files-50mb-key',
  large: 'opencdn-large-files-unlimited-key'
};

// Choose API key based on file size
function getApiKeyForFile(fileSize) {
  if (fileSize <= 5 * 1024 * 1024) return API_KEYS.small;
  if (fileSize <= 50 * 1024 * 1024) return API_KEYS.medium;
  return API_KEYS.large;
}

// Create folder
async function createFolder(folderPath) {
  const response = await fetch(`${CDN_URL}/api/folder/create`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEYS.medium,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ folderPath })
  });
  return response.json();
}

// Upload file with automatic API key selection
async function uploadFile(file, folder = '') {
  const apiKey = getApiKeyForFile(file.size);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('keepOriginalName', 'true');

  const response = await fetch(`${CDN_URL}/api/file/upload`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: formData
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }
  
  return data;
}

// Move file to organize storage
async function moveFile(sourcePath, destinationPath) {
  const response = await fetch(`${CDN_URL}/api/move/file`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEYS.medium,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sourcePath, destinationPath })
  });
  return response.json();
}

// Move folder to reorganize
async function moveFolder(sourcePath, destinationPath) {
  const response = await fetch(`${CDN_URL}/api/move/folder`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEYS.medium,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sourcePath, destinationPath })
  });
  return response.json();
}

// Usage example
async function main() {
  try {
    // Create a folder structure
    await createFolder('uploads/2025/images');
    
    // Upload a file
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    
    console.log(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const uploadResult = await uploadFile(file, 'uploads/2025/images');
    
    console.log('Upload Success!');
    console.log('File URL:', uploadResult.file.url);
    console.log('API Key Used:', uploadResult.apiKeyUsed);
    
    // Later, move the file to archive
    await moveFile(
      'uploads/2025/images/photo.jpg',
      'archive/2025/photos/photo.jpg'
    );
    
    console.log('File moved to archive!');
    
    // Or move entire folder
    await moveFolder(
      'uploads/2025/images',
      'archive/2025/all-images'
    );
    
    console.log('Folder reorganized!');
    
  } catch (error) {
    console.error('Error:', error.message);
    // The error message will guide you on which API key to use
  }
}
```

---

## Support

For issues or questions about OpenCDN:
1. Check this API documentation
2. Review the README.md file
3. Examine error messages - they provide specific guidance
4. Modify the source code as needed for your use case

---

**OpenCDN API v1.0** - Built with Express and Node.js
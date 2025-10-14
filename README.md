# OpenCDN 🚀

A local Content Delivery Network (CDN) built with Electron and React. Store and serve files directly from your device with a beautiful web interface and RESTful API.

## Features

✨ **Beautiful Modern Interface** - Clean green-themed UI using full screen space  
📁 **Nested Folder Management** - Create folders and subfolders with proper navigation  
📤 **Smart File Upload** - Visual folder tree selector for choosing upload destination  
🎯 **Drag & Drop** - Drag files and folders to move them between directories  
🔑 **Three-Tier API Keys** - Different keys for small (5MB), medium (50MB), and large (unlimited) files  
👁️ **Media Preview** - Preview images and play videos directly in the app  
ℹ️ **File Details** - View complete file information including size, dates, and URLs  
🔗 **Direct CDN URLs** - Get instant CDN URLs for all uploaded files  
🔐 **Secure Access** - API key authentication with precise error messages  
🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux  
⚡ **No Backend Required** - Everything runs locally on your device  

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
```bash
npm install
```

3. **Configure credentials** (Important!):

Edit `credentials.js` to set your own credentials:
```javascript
module.exports = {
  admin: {
    username: 'your-username',
    password: 'your-password'
  },
  apiKeys: {
    small: {
      key: 'your-small-files-key',
      maxSize: 5 * 1024 * 1024, // 5MB
      label: 'Small Files (max 5MB)'
    },
    medium: {
      key: 'your-medium-files-key',
      maxSize: 50 * 1024 * 1024, // 50MB
      label: 'Medium Files (max 50MB)'
    },
    large: {
      key: 'your-large-files-key',
      maxSize: Infinity, // Unlimited
      label: 'Large Files (unlimited)'
    }
  }
};
```

## Running the Application

### Development Mode
```bash
npm start
```

This will:
- Start the React development server on `http://localhost:3000`
- Launch the Electron app
- Start the CDN API server on `http://localhost:5000`

### Build for Production
```bash
npm run build
npm run dist
```

This creates a distributable application in the `dist` folder.

## Usage

### Admin Panel

1. Launch the application
2. Login with your credentials (from `credentials.js`)
3. Use the interface to:
   - Navigate through folders using the breadcrumb
   - Create folders and subfolders
   - Upload files using the visual folder tree selector
   - Drag & drop files and folders to move them
   - Preview images and videos
   - View file details
   - Copy file URLs
   - Delete files and folders

### File Upload with Folder Selection

When uploading a file:
1. Click **📤 Upload File** and select a file
2. A modal opens showing the complete folder tree
3. Navigate the tree structure (click arrows to expand/collapse)
4. Click on a folder to select it as the destination
5. Click **✓ Upload Here** to upload
6. The file is uploaded to the selected location

### Drag & Drop to Move Items

**Move files or folders easily:**
1. Click and hold on any file or folder
2. Drag it to the destination folder
3. The destination folder highlights in green
4. Release to move
5. A loader appears during the operation

**Rules:**
- ❌ Cannot move a folder into itself
- ❌ Cannot move into a subfolder of itself
- ✅ Both files and folders can be dragged
- ✅ Works with nested folder structures

### File Preview & Details

**For Images:**
- Click **👁️ Preview** to see the image in full size
- Click **ℹ️ Details** to view file information

**For Videos:**
- Click **👁️ Preview** to play the video with full controls
- Click **ℹ️ Details** to view file information

**For Other Files:**
- Click **ℹ️ Details** to view complete file information

### API Integration

See [API.md](API.md) for complete API documentation.

**Quick Example with Size Limits:**
```javascript
// Small files (up to 5MB)
const smallFileFormData = new FormData();
smallFileFormData.append('file', smallFile); // Must be ≤ 5MB
smallFileFormData.append('folder', 'thumbnails');

fetch('http://localhost:5000/api/file/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-small-files-5mb-key'
  },
  body: smallFileFormData
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('File URL:', data.file.url);
  } else {
    console.error(data.message); // Precise error if size exceeds limit
  }
});

// Large files (unlimited)
const largeFileFormData = new FormData();
largeFileFormData.append('file', largeFile); // Any size
largeFileFormData.append('folder', 'videos');

fetch('http://localhost:5000/api/file/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'opencdn-large-files-unlimited-key'
  },
  body: largeFileFormData
});
```

## API Key System

OpenCDN uses a three-tier API key system to control file upload sizes:

| API Key Type | Max File Size | Use Case |
|--------------|---------------|----------|
| **Small** | 5 MB | Thumbnails, icons, small images |
| **Medium** | 50 MB | Regular images, documents, audio files |
| **Large** | Unlimited | Videos, large archives, backups |

### Error Messages

When you try to upload a file that exceeds your API key's limit, you'll receive a detailed error:

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

## File Storage

Files are stored in your application's user data directory:

- **Windows:** `%APPDATA%/opencdn/cdn-storage`
- **macOS:** `~/Library/Application Support/opencdn/cdn-storage`
- **Linux:** `~/.config/opencdn/cdn-storage`

Files maintain the folder structure you create in the app.

## API Endpoints

| Method | Endpoint | Description | Requires API Key |
|--------|----------|-------------|------------------|
| GET | `/api/info` | Get storage information | ✅ |
| GET | `/api/list` | List files and folders | ✅ |
| POST | `/api/folder/create` | Create a new folder | ✅ |
| DELETE | `/api/folder/delete` | Delete a folder | ✅ |
| POST | `/api/file/upload` | Upload a file (size checked) | ✅ |
| DELETE | `/api/file/delete` | Delete a file | ✅ |
| POST | `/api/move/file` | Move or rename a file | ✅ |
| POST | `/api/move/folder` | Move or rename a folder | ✅ |
| POST | `/api/admin/login` | Admin panel login | ❌ |
| GET | `/files/{path}` | Access files directly | ❌ |

All endpoints (except `/api/admin/login` and `/files/*`) require the `x-api-key` header.

See [API.md](API.md) for detailed documentation with examples.

## Project Structure

```
opencdn/
├── electron/
│   └── main.js           # Electron main + Express server with API key validation
├── src/
│   ├── App.js            # React admin interface with preview modals
│   ├── App.css           # Green-themed full-width styles
│   └── index.js          # React entry point
├── public/
│   └── index.html        # HTML template
├── credentials.js        # Admin credentials + 3 API keys
├── package.json          # Dependencies and scripts
├── API.md               # Complete API documentation
└── README.md            # This file
```

## Technologies

- **Electron** - Desktop application framework
- **React** - UI framework with modal components
- **Express** - HTTP server and API with file size validation
- **Multer** - File upload handling
- **Node.js File System** - File storage and management

## Security

⚠️ **Important Security Notes:**

1. **Change all default credentials** in `credentials.js` before using
2. **Keep your API keys secret** - don't commit them to public repositories
3. **Use appropriate API keys** - Don't share the unlimited key publicly
4. **Firewall:** Restrict access to port 5000 if needed
5. **HTTPS:** For production, consider using HTTPS
6. **Backups:** Regularly backup your `cdn-storage` directory

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify the `CDN_PORT` constant in `electron/main.js`.

### Files Not Accessible
Ensure the CDN server is running on `http://localhost:5000` and check firewall settings.

### Upload Fails with Size Error
Check the error message - it will tell you exactly which API key to use. If uploading a 40MB file:
- ❌ Small key (5MB limit) - Will fail with clear error
- ✅ Medium key (50MB limit) - Will succeed
- ✅ Large key (unlimited) - Will succeed

### File Uploaded to Wrong Folder
Make sure you're in the correct folder before uploading. The breadcrumb shows your current location.

**New:** Use the visual folder tree selector when uploading to choose exactly where the file should go.

### Drag & Drop Not Working
- Ensure you're dragging onto a folder (not a file)
- The destination folder will highlight in green when valid
- Check browser console for any JavaScript errors

### Preview Not Working
- Images: Ensure the file has a valid image extension (.jpg, .png, .gif, etc.)
- Videos: Ensure the file has a valid video extension (.mp4, .webm, .ogg, etc.)
- Your browser must support the media format

## Changelog

### Version 1.0.0
- ✅ Three-tier API key system with size limits
- ✅ Full-screen green-themed modern UI
- ✅ Image and video preview with modal
- ✅ Detailed file information view
- ✅ Proper nested folder navigation
- ✅ Visual folder tree selector for uploads
- ✅ Drag & drop to move files and folders
- ✅ Move/rename files and folders via API
- ✅ Animated loader during operations
- ✅ Smart folder tree (no arrows for empty folders)
- ✅ Automatic folder creation on upload
- ✅ Precise error messages for all API operations
- ✅ Copy-to-clipboard for file URLs
- ✅ Integrated API documentation viewer

## License

MIT License - feel free to modify and use for your projects!

## Contributing

This is an open-source project. Feel free to fork, modify, and improve it!

---

Made with 💚 using Electron and React
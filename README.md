# OpenCDN 🚀

A modern, professional Content Delivery Network (CDN) built with Electron and React. Store and serve files directly from your device with a stunning interface and powerful features.

## ✨ Features

### Core Features
- 🎨 **Modern Professional UI** - Beautiful gradient design with smooth animations
- 📁 **Simple File Management** - All files in one place, no complex folder structures
- 📤 **Custom File Names** - Choose your own file names during upload
- 🔑 **Three-Tier API Keys** - Different keys for small (5MB), medium (50MB), and large (unlimited) files
- 🔍 **Advanced Search & Filter** - Search by name, sort by date/size/name
- 📊 **Comprehensive Statistics** - Detailed insights into your CDN usage
- 👁️ **Media Preview** - Preview images and play videos with elegant modals
- ℹ️ **Detailed File Info** - Complete metadata for every file
- 🔗 **One-Click URL Copy** - Instant CDN URL copying with toast notifications
- 💾 **Persistent Sessions** - Stay logged in across page refreshes
- 📚 **Built-in API Docs** - Access documentation without leaving the app

### Statistics Dashboard
- 📈 Total files and storage usage
- 📊 File type distribution with visual bars
- ⏱️ Recent uploads timeline
- 🏆 Largest files ranking
- 📉 Average file size calculation

### User Experience
- ⚡ Lightning-fast performance
- 🎯 Intuitive navigation with sidebar
- 📱 Fully responsive design
- 🌙 Professional color scheme
- ✨ Smooth transitions and animations
- 🔔 Toast notifications for actions

## 🚀 Installation

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

## 🎮 Running the Application

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

## 📖 Usage Guide

### Getting Started

1. **Launch the application**
2. **Login** with your credentials (from `credentials.js`)
3. Your session will be saved - no need to login again!

### File Management

#### Upload Files
1. Click the **"Upload File"** button
2. Select a file from your computer
3. Enter a **custom name** for the file (extension is preserved automatically)
4. Click **"Upload File"** to confirm

**Note:** The file extension cannot be changed - only the filename. For example, if you upload `photo.jpg` and name it `vacation-2025`, it will be saved as `vacation-2025.jpg` in your CDN.

#### Search & Filter
- Use the **search bar** to find files by name
- Use the **sort dropdown** to organize files by:
  - 📅 Newest/Oldest first
  - 📊 Largest/Smallest first
  - 🔤 Name (A-Z or Z-A)

#### File Actions
Each file card provides quick actions:
- **👁️ Preview** - View images or play videos (for media files)
- **ℹ️ Details** - See complete file information including:
  - File name and type
  - File size
  - Upload date and time
  - Last modified date
  - Full CDN URL
- **📋 Copy URL** - Instantly copy the CDN URL to clipboard
- **🗑️ Delete** - Remove files from your CDN

### Statistics Dashboard

Access comprehensive statistics by clicking **"Statistics"** in the sidebar:

- **Overview Cards**: Total files, total size, file types count, average file size
- **File Types Distribution**: Visual breakdown of file types with percentage bars
- **Recent Uploads**: Last 10 uploaded files with timestamps
- **Largest Files**: Top 10 largest files in your CDN

### API Documentation

Click **"API Docs"** in the sidebar to view:
- Base URL and authentication
- API key tiers explanation
- All available endpoints
- Quick examples

## 🔌 API Integration

See [API.md](API.md) for complete API documentation.

### Quick Example - Upload with Custom Name

```javascript
const formData = new FormData();
formData.append('file', yourFile);
formData.append('customFileName', 'my-custom-name.jpg');

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
    // http://localhost:5000/files/my-custom-name.jpg
  }
});
```

## 🗂️ File Storage

All files are stored in root directory at:

- **Windows:** `%APPDATA%/opencdn/cdn-storage`
- **macOS:** `~/Library/Application Support/opencdn/cdn-storage`
- **Linux:** `~/.config/opencdn/cdn-storage`

No folder structure - all files in one location for simplicity.

## 🔐 API Key System

OpenCDN uses a three-tier API key system:

| API Key | Max Size | Best For |
|---------|----------|----------|
| **Small** | 5 MB | Icons, thumbnails, small images |
| **Medium** | 50 MB | Photos, documents, audio files |
| **Large** | Unlimited | Videos, large files, backups |

When a file exceeds the API key limit, you'll receive a detailed error message suggesting the correct key to use.

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/info` | Get storage statistics |
| GET | `/api/list` | List all files |
| POST | `/api/file/upload` | Upload file with custom name |
| DELETE | `/api/file/delete` | Delete a file |
| POST | `/api/admin/login` | Admin authentication |
| GET | `/files/{filename}` | Direct file access (public) |

All API endpoints (except login and file access) require the `x-api-key` header.

## 🎨 Design Features

- **Modern Gradient UI** with green color scheme
- **Smooth Animations** on all interactions
- **Professional Cards** with hover effects
- **Responsive Layout** works on all screen sizes
- **Toast Notifications** for user feedback
- **Loading States** with elegant spinners
- **Empty States** with helpful messages
- **Modal Dialogs** with blur backdrop
- **Custom Scrollbars** for polish

## 🔧 Technologies

- **Electron** - Desktop application framework
- **React 18** - Modern UI library with hooks
- **Express** - High-performance HTTP server
- **Multer** - File upload handling
- **Node.js File System** - File storage management
- **CSS Variables** - Consistent theming
- **CSS Animations** - Smooth transitions

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 is in use, modify `CDN_PORT` in `electron/main.js`.

### Session Not Persisting
Clear browser storage and restart the app. Check browser console for errors.

### Upload Fails
- Verify API key is correct
- Check file size against API key limit
- Ensure storage directory has write permissions

### Preview Not Working
- Supported formats: Images (jpg, png, gif, etc.), Videos (mp4, webm, ogg)
- Check browser console for errors
- Verify file URL is accessible

## 📊 Project Structure

```
opencdn/
├── electron/
│   └── main.js           # Electron + Express server
├── src/
│   ├── App.js            # React application
│   ├── App.css           # Modern styling
│   └── index.js          # React entry point
├── public/
│   └── index.html        # HTML template
├── credentials.js        # Authentication config
├── package.json          # Dependencies
├── API.md               # API documentation
└── README.md            # This file
```

## 🔒 Security Best Practices

1. **Change Default Credentials** immediately
2. **Keep API Keys Secret** - don't commit to repositories
3. **Use Appropriate Keys** for different file sizes
4. **Enable HTTPS** in production
5. **Firewall Rules** to restrict access if needed
6. **Regular Backups** of cdn-storage directory
7. **Monitor Usage** via Statistics dashboard

## ✨ Changelog

### Version 2.0.0 - Major Redesign
- ✅ Complete UI/UX redesign with modern aesthetics
- ✅ Removed folder/subfolder complexity
- ✅ Custom file naming during upload
- ✅ Advanced search and filtering
- ✅ Comprehensive statistics dashboard
- ✅ Persistent login sessions
- ✅ Professional card-based layout
- ✅ Toast notifications
- ✅ Improved modals with blur backdrop
- ✅ Complete file details view
- ✅ Sidebar navigation
- ✅ Responsive design improvements
- ✅ Smooth animations throughout
- ✅ Better error handling
- ✅ Performance optimizations

## 📝 License

MIT License - feel free to modify and use for your projects!

## 🤝 Contributing

This is an open-source project. Feel free to fork, modify, and improve it!

---

Made with 💚 using Electron and React

**OpenCDN** - Simple, Modern, Professional
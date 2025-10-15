# 🏗️ OpenCDN Build Guide

Guide for building OpenCDN for macOS, Windows, and Linux.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. All dependencies installed: `npm install`

## 🚀 Build Commands

### Build for All Platforms
```bash
npm run dist:all
```
This will create installers for macOS, Windows, and Linux.

### Build for Specific Platforms

#### macOS Only
```bash
npm run dist:mac
```
**Outputs:**
- `dist/OpenCDN-2.0.0.dmg` - DMG installer
- `dist/OpenCDN-2.0.0-mac.zip` - Zipped app
- Supports both Intel (x64) and Apple Silicon (arm64)

#### Windows Only
```bash
npm run dist:win
```
**Outputs:**
- `dist/OpenCDN Setup 2.0.0.exe` - NSIS installer
- `dist/OpenCDN 2.0.0.exe` - Portable version
- Supports both 64-bit and 32-bit

#### Linux Only
```bash
npm run dist:linux
```
**Outputs:**
- `dist/OpenCDN-2.0.0.AppImage` - AppImage (universal)
- `dist/OpenCDN_2.0.0_amd64.deb` - Debian/Ubuntu package
- `dist/OpenCDN-2.0.0.x86_64.rpm` - RedHat/Fedora package

## 📦 Output Directory

All builds will be in the `dist/` folder:
```
dist/
├── mac/
│   ├── OpenCDN-2.0.0.dmg
│   └── OpenCDN-2.0.0-mac.zip
├── win/
│   ├── OpenCDN Setup 2.0.0.exe
│   └── OpenCDN 2.0.0.exe (portable)
└── linux/
    ├── OpenCDN-2.0.0.AppImage
    ├── OpenCDN_2.0.0_amd64.deb
    └── OpenCDN-2.0.0.x86_64.rpm
```

## 🎨 Custom Icons (Optional)

To add custom icons, create an `assets` folder in the project root:

```
assets/
├── icon.icns  (macOS - 512x512 or larger)
├── icon.ico   (Windows - 256x256)
└── icon.png   (Linux - 512x512)
```

You can use online tools like:
- https://cloudconvert.com/png-to-icns (for macOS)
- https://cloudconvert.com/png-to-ico (for Windows)

## ⚙️ Build Configuration

The build is configured in `package.json` under the `build` section.

### Key Settings:
- **appId**: `com.opencdn.app`
- **productName**: `OpenCDN`
- **version**: `2.0.0`

### macOS Settings:
- Universal app (Intel + Apple Silicon)
- DMG and ZIP formats
- Category: Developer Tools

### Windows Settings:
- NSIS installer with options:
  - Choose installation directory
  - Desktop shortcut
  - Start menu shortcut
- Portable version (no installation)

### Linux Settings:
- AppImage (runs everywhere)
- DEB package (Ubuntu/Debian)
- RPM package (Fedora/RHEL)

## 🔧 Troubleshooting

### "Cannot find module" error
```bash
npm install
npm run build
```

### Build fails on macOS
Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Build fails on Windows
Install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

### Build fails on Linux
Install required packages:
```bash
# Ubuntu/Debian
sudo apt-get install -y rpm

# Fedora
sudo dnf install dpkg dpkg-dev
```

## 📝 Build Process

1. **Clean previous builds** (optional):
   ```bash
   rm -rf dist/ build/
   ```

2. **Build React app**:
   ```bash
   npm run build
   ```
   This creates optimized production files in `build/`

3. **Package with Electron**:
   ```bash
   npm run dist:all
   ```
   This packages the app for all platforms

## 🚀 Distribution

### macOS
- **DMG**: Double-click to open, drag to Applications
- **ZIP**: Extract and drag to Applications

### Windows
- **Installer**: Run and follow wizard
- **Portable**: Extract and run directly

### Linux
- **AppImage**: Make executable and run
  ```bash
  chmod +x OpenCDN-2.0.0.AppImage
  ./OpenCDN-2.0.0.AppImage
  ```
- **DEB**: Install with dpkg
  ```bash
  sudo dpkg -i OpenCDN_2.0.0_amd64.deb
  ```
- **RPM**: Install with rpm
  ```bash
  sudo rpm -i OpenCDN-2.0.0.x86_64.rpm
  ```

## 📊 Build Sizes (Approximate)

- **macOS DMG**: ~150-200 MB
- **Windows Installer**: ~120-150 MB
- **Linux AppImage**: ~130-160 MB

## 🔐 Code Signing (Optional)

For production releases, you should code sign your apps:

### macOS
1. Get Apple Developer certificate
2. Add to package.json:
   ```json
   "mac": {
     "identity": "Your Name (XXXXXXXXXX)"
   }
   ```

### Windows
1. Get code signing certificate
2. Add to package.json:
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password"
   }
   ```

## ✅ Testing Built Apps

Always test the built applications before distribution:

1. **Install the app** on the target platform
2. **Test all features**:
   - Login/logout
   - File upload
   - File preview
   - File deletion
   - Statistics
   - API documentation
3. **Check credentials** are working
4. **Verify CDN URLs** are accessible

## 📚 Additional Resources

- [electron-builder docs](https://www.electron.build/)
- [Electron packaging guide](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [Code signing guide](https://www.electron.build/code-signing)

---

**OpenCDN v2.0.0** - Build with confidence! 🚀
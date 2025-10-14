// OpenCDN Credentials Configuration
// Change these values to secure your CDN

module.exports = {
  // Admin Panel Credentials
  admin: {
    username: "admin",
    password: "admin",
  },

  // API Keys with file size limits
  apiKeys: {
    // For files up to 5MB
    small: {
      key: "opencdn-small-files-5mb-key",
      maxSize: 5 * 1024 * 1024, // 5MB in bytes
      label: "Small Files (max 5MB)",
    },
    // For files between 5MB and 50MB
    medium: {
      key: "opencdn-medium-files-50mb-key",
      maxSize: 50 * 1024 * 1024, // 50MB in bytes
      label: "Medium Files (max 50MB)",
    },
    // For files larger than 50MB
    large: {
      key: "opencdn-large-files-unlimited-key",
      maxSize: Infinity, // No limit
      label: "Large Files (unlimited)",
    },
  },
};

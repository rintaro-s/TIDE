"use strict";
/**
 * Cross-platform path utilities for handling paths on Windows, Linux, and macOS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = normalizePath;
exports.toPlatformPath = toPlatformPath;
exports.toUnixPath = toUnixPath;
exports.toWindowsPath = toWindowsPath;
exports.isAbsolutePath = isAbsolutePath;
exports.getPathSeparator = getPathSeparator;
exports.joinPath = joinPath;
const path_1 = require("path");
/**
 * Normalizes a file path to use the correct separators for the current platform
 * @param filePath - The path to normalize
 * @returns Normalized path with platform-appropriate separators
 */
function normalizePath(filePath) {
    if (!filePath)
        return filePath;
    // Use Node.js normalize to handle platform-specific path format
    let normalized = (0, path_1.normalize)(filePath);
    // On Windows, handle forward slashes from Unix paths
    if (process.platform === 'win32') {
        // Convert forward slashes to backslashes
        normalized = normalized.replace(/\//g, '\\');
    }
    else {
        // On Unix systems, convert backslashes to forward slashes
        normalized = normalized.replace(/\\/g, '/');
    }
    return normalized;
}
/**
 * Converts a path from any format to the current platform's format
 * @param filePath - The path to convert
 * @returns Converted path for current platform
 */
function toPlatformPath(filePath) {
    if (!filePath)
        return filePath;
    // Remove file:// protocol if present
    let path = filePath.replace(/^file:\/\//, '');
    if (process.platform === 'win32') {
        // Handle Unix-style paths on Windows
        if (path.startsWith('/')) {
            // This might be a Unix absolute path, convert carefully
            // Check if it's actually a UNC path (\\server\share)
            if (!path.startsWith('//')) {
                // It's a Unix absolute path, keep as-is for normalizePath
                path = path.replace(/\//g, '\\');
            }
        }
        return normalizePath(path);
    }
    else {
        // Unix systems (Linux, macOS)
        // Convert Windows paths to Unix format
        if (path.match(/^[a-zA-Z]:\\/)) {
            // Windows absolute path with drive letter
            // Keep the original path structure for Windows paths on Unix
            console.warn(`Windows path detected on Unix system: ${path}`);
        }
        // Convert all backslashes to forward slashes
        path = path.replace(/\\/g, '/');
        return normalizePath(path);
    }
}
/**
 * Ensures a path is in Unix format (forward slashes)
 * Useful for sending paths over network or storing in configs
 * @param filePath - The path to convert
 * @returns Path with forward slashes
 */
function toUnixPath(filePath) {
    if (!filePath)
        return filePath;
    return filePath.replace(/\\/g, '/');
}
/**
 * Ensures a path is in Windows format (backslashes)
 * @param filePath - The path to convert
 * @returns Path with backslashes
 */
function toWindowsPath(filePath) {
    if (!filePath)
        return filePath;
    return filePath.replace(/\//g, '\\');
}
/**
 * Checks if a path is absolute
 * Works cross-platform
 * @param filePath - The path to check
 * @returns True if path is absolute
 */
function isAbsolutePath(filePath) {
    if (!filePath)
        return false;
    // Windows: C:\... or \\server\share
    if (process.platform === 'win32') {
        return /^([a-zA-Z]:|\\\\.*)/.test(filePath);
    }
    // Unix: /...
    return filePath.startsWith('/');
}
/**
 * Gets the platform-specific path separator
 */
function getPathSeparator() {
    return path_1.sep;
}
/**
 * Safely joins path segments using the current platform's separator
 * @param segments - Path segments to join
 * @returns Joined path
 */
function joinPath(...segments) {
    if (process.platform === 'win32') {
        return path_1.win32.join(...segments);
    }
    return path_1.posix.join(...segments);
}
//# sourceMappingURL=crossPlatformPath.js.map
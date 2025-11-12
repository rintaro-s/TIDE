/**
 * Cross-platform path utilities for handling paths on Windows, Linux, and macOS
 */
/**
 * Normalizes a file path to use the correct separators for the current platform
 * @param filePath - The path to normalize
 * @returns Normalized path with platform-appropriate separators
 */
export declare function normalizePath(filePath: string): string;
/**
 * Converts a path from any format to the current platform's format
 * @param filePath - The path to convert
 * @returns Converted path for current platform
 */
export declare function toPlatformPath(filePath: string): string;
/**
 * Ensures a path is in Unix format (forward slashes)
 * Useful for sending paths over network or storing in configs
 * @param filePath - The path to convert
 * @returns Path with forward slashes
 */
export declare function toUnixPath(filePath: string): string;
/**
 * Ensures a path is in Windows format (backslashes)
 * @param filePath - The path to convert
 * @returns Path with backslashes
 */
export declare function toWindowsPath(filePath: string): string;
/**
 * Checks if a path is absolute
 * Works cross-platform
 * @param filePath - The path to check
 * @returns True if path is absolute
 */
export declare function isAbsolutePath(filePath: string): boolean;
/**
 * Gets the platform-specific path separator
 */
export declare function getPathSeparator(): string;
/**
 * Safely joins path segments using the current platform's separator
 * @param segments - Path segments to join
 * @returns Joined path
 */
export declare function joinPath(...segments: string[]): string;
//# sourceMappingURL=crossPlatformPath.d.ts.map
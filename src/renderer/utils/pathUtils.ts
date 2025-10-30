/**
 * Cross-platform path utilities
 */

/**
 * Get the file name from a path (cross-platform)
 * @param filePath - Full file path
 * @returns File name
 */
export function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || 'untitled';
}

/**
 * Get the parent directory from a path (cross-platform)
 * @param filePath - Full file path
 * @returns Parent directory path
 */
export function getParentPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts.slice(0, -1).join('/');
}

/**
 * Normalize path separators to forward slashes (cross-platform)
 * @param filePath - File path with mixed separators
 * @returns Normalized path with forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Join path segments (cross-platform)
 * @param segments - Path segments to join
 * @returns Joined path
 */
export function joinPath(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/');
}

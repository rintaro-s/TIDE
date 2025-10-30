/**
 * Cross-platform path joining utility
 * Uses forward slashes for consistency across platforms
 */

/**
 * Join path segments with forward slashes (cross-platform)
 * @param segments - Path segments to join
 * @returns Joined path with forward slashes
 */
export function joinPaths(...segments: string[]): string {
  // Filter out empty segments
  const validSegments = segments.filter(s => s && s.length > 0);
  
  // Join with forward slash and normalize multiple slashes
  return validSegments
    .join('/')
    .replace(/\/+/g, '/')           // Replace multiple slashes with single
    .replace(/\\/g, '/');            // Replace backslashes with forward slashes
}

/**
 * Normalize a path to use forward slashes (cross-platform)
 * @param filePath - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Strip path traversal and unsafe characters from a user-supplied download filename.
 */
export function sanitizeFilename(name, fallback = 'download') {
  const cleaned = String(name ?? '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\.+/g, '_')
    .trim()
  return cleaned.slice(0, 200) || fallback
}

/**
 * Allow only a plain stored file key for download API paths.
 */
export function sanitizeStoredFileName(name) {
  return String(name ?? '').replace(/[/\\]/g, '').replace(/\.\./g, '')
}

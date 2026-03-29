// lib/sanitize.ts
// DOMPurify is browser-only. Safe during SSR — falls back to regex strip.

let _initialized = false

/**
 * Synchronous XSS sanitizer. Strips all HTML tags.
 * On the client, uses DOMPurify after initSanitizer() has been called.
 * On the server (SSR), uses a simple tag-stripping regex.
 */
function stripTags(dirty: string): string {
  // First remove script/style blocks including their content
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Then strip remaining HTML tags
    .replace(/<[^>]*>/g, '')
}

export function sanitize(dirty: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback: strip HTML tags
    return stripTags(dirty)
  }
  if (!_initialized) {
    // DOMPurify not yet loaded: strip tags synchronously
    return stripTags(dirty)
  }
  // After initSanitizer(), use DOMPurify (set in module scope)
  return (globalThis as Record<string, unknown>)['__dompurify_sanitize'] as (s: string) => string
    ? ((globalThis as Record<string, unknown>)['__dompurify_sanitize'] as (s: string) => string)(dirty)
    : dirty.replace(/<[^>]*>/g, '')
}

/**
 * Call once on the client to initialize DOMPurify.
 * After this, sanitize() uses DOMPurify for full XSS protection.
 */
export async function initSanitizer(): Promise<void> {
  if (typeof window === 'undefined' || _initialized) return
  const DOMPurify = (await import('dompurify')).default
  ;(globalThis as Record<string, unknown>)['__dompurify_sanitize'] = (dirty: string) =>
    DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  _initialized = true
}

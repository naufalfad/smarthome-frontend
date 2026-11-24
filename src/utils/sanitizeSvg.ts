/**
 * SVG Sanitization Utility (Phase 9 Security Hardening)
 * 
 * Protects against Stored XSS via catalog object SVG content by stripping:
 * - <script> tags and embedded executable code
 * - Inline event handlers (onload, onerror, onclick, etc.)
 * - Dangerous elements (<object>, <iframe>, <embed>, <foreignObject>)
 * - Dangerous protocols in URLs (javascript:, data:text/html, etc.)
 */

/**
 * Strips dangerous executable vectors from raw SVG string.
 */
export function sanitizeSvg(rawSvg: string | null | undefined): string {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return '';
  }

  let sanitized = rawSvg;

  // 1. Remove script tags and their content completely
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 2. Remove dangerous wrapper or injection tags
  sanitized = sanitized.replace(/<\/?(?:iframe|object|embed|foreignObject|meta|link|base)[^>]*>/gi, '');

  // 3. Remove inline JavaScript event handlers (e.g. onload=..., onerror=..., onclick=...)
  sanitized = sanitized.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 4. Remove javascript: or vbscript: pseudoprotocols in href / xlink:href / src
  sanitized = sanitized.replace(/(href|xlink:href|src)\s*=\s*["']\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"']*["']/gi, '$1=""');

  return sanitized;
}

/**
 * Sanitizes and strips outer <svg> wrapper tag to safely embed inside an existing <svg> element.
 */
export function sanitizeSvgInner(rawSvg: string | null | undefined): string {
  const clean = sanitizeSvg(rawSvg);
  return clean.replace(/<svg[^>]*>|<\/svg>/gi, '');
}


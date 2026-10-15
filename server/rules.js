/**
 * ============================================================================
 * LINKPULSE: REDIRECTION RULE ENGINE & VALIDATION SUITE
 * ============================================================================
 * 
 * Responsibilities:
 *   1. Reserved Paths: Prevents alias collisions with system routes (/api, /bio, etc.)
 *   2. Rate Limiting: In-memory sliding window preventing link spam (30 links/min)
 *   3. Target URL Validation: Ensures valid HTTP/S and checks domain safety blocklist
 *   4. Alias Validation: Validates formatting, length, reserved words, and DB uniqueness
 *   5. Short Code Generator: Unambiguous Base58 collision-resistant generator
 *   6. Password Cryptography: SHA-256 verification and HTTP-only session tokens
 *   7. Redirection Evaluation: 7-stage pipeline checking status, expiry, caps, password,
 *      and device targeting overrides (mobile/tablet/desktop) with UTM parameters.
 * ============================================================================
 */

const { Link, DomainBlocklist } = require('./db');
const crypto = require('crypto');

// Reserved system paths that cannot be claimed as short aliases
const RESERVED_SLUGS = new Set([
  'api', 'bio', 'admin', 'dashboard', 'analytics', 'campaigns',
  'login', 'register', 'logout', 'static', 'assets', 'favicon.ico',
  'r', 's', 'qr', 'health', 'public', 'settings', 'import', 'links'
]);

// Basic In-memory Rate Limiter for link creation
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LINKS_PER_WINDOW = 30; // 30 links/minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, clientData);
    return { allowed: true, remaining: MAX_LINKS_PER_WINDOW - 1 };
  }

  if (clientData.count >= MAX_LINKS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((clientData.resetTime - now) / 1000)
    };
  }

  clientData.count += 1;
  rateLimitMap.set(ip, clientData);
  return { allowed: true, remaining: MAX_LINKS_PER_WINDOW - clientData.count };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Validates a target destination URL
 */
async function validateUrl(inputUrl, currentHost = 'localhost:5000') {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL cannot be empty' };
  }

  let formattedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  let parsed;
  try {
    parsed = new URL(formattedUrl);
  } catch (err) {
    return { valid: false, error: 'Malformed URL format. Must be a valid web address.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed.' };
  }

  // Prevent redirect loops (e.g. pointing back to self)
  const host = parsed.host.toLowerCase();
  if (host === currentHost.toLowerCase() || host.includes('linkpulse.io')) {
    return { valid: false, error: 'Self-referencing redirect loops are forbidden.' };
  }

  // Check domain against blocklist
  const blocked = await DomainBlocklist.find({}, 'domain reason').lean();
  for (const item of blocked) {
    const blockedDomain = item.domain.toLowerCase().trim();
    if (host === blockedDomain || host.endsWith('.' + blockedDomain)) {
      return {
        valid: false,
        error: `Security Alert: Domain "${host}" is blocked (${item.reason || 'Safety Policy Violation'}).`,
        blockedDomain: item.domain
      };
    }
  }

  return { valid: true, url: formattedUrl, hostname: host };
}

/**
 * Validates custom alias format and uniqueness
 */
async function validateAlias(alias, currentLinkId = null) {
  if (!alias) {
    return { valid: true }; // alias is optional; will auto-generate if empty
  }

  const cleanAlias = alias.trim().toLowerCase();

  if (cleanAlias.length < 2 || cleanAlias.length > 50) {
    return { valid: false, error: 'Alias must be between 2 and 50 characters' };
  }

  if (!/^[a-z0-9_-]+$/i.test(cleanAlias)) {
    return { valid: false, error: 'Alias can only contain letters, numbers, hyphens (-), and underscores (_)' };
  }

  if (RESERVED_SLUGS.has(cleanAlias)) {
    return { valid: false, error: `"${cleanAlias}" is a reserved system path and cannot be used as an alias` };
  }

  // Check uniqueness in database
  const query = { short_code: cleanAlias };
  if (currentLinkId) {
    query.id = { $ne: Number(currentLinkId) };
  }

  const existing = await Link.findOne(query).lean();
  if (existing) {
    return { valid: false, error: `Alias "${cleanAlias}" is already taken. Please choose another.` };
  }

  return { valid: true, alias: cleanAlias };
}

/**
 * Generates an unambiguous random short code with collision avoidance
 */
async function generateShortCode(length = 6) {
  // Exclude ambiguous characters (0, O, I, l)
  const charset = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempts = 0;

  while (attempts < 20) {
    let code = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += charset[bytes[i] % charset.length];
    }

    if (!RESERVED_SLUGS.has(code.toLowerCase())) {
      const existing = await Link.findOne({ short_code: code }).lean();
      if (!existing) {
        return code;
      }
    }
    attempts++;
  }

  // Fallback to timestamp hash if random repeatedly collides
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Hash password with SHA-256
 */
function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(link, inputPassword) {
  if (!link.is_password_protected) return true;
  if (!inputPassword) return false;
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
  return link.password_hash === inputHash;
}

/**
 * Detect device type from User Agent
 */
function detectDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/bot|crawler|spider|slurp|facebookexternalhit|curl|wget|lighthouse/i.test(ua)) {
    return 'bot';
  }
  return 'desktop';
}

/**
 * Evaluates the full redirection pipeline for a requested short code
 */
function evaluateRedirectRule(link, req) {
  if (!link) {
    return {
      status: 'NOT_FOUND',
      httpCode: 404,
      title: 'Link Not Found',
      message: 'The short link you are trying to visit does not exist or has been removed.'
    };
  }

  // Rule 1: Admin Abuse / Takedown Check
  if (link.status === 'disabled_abuse') {
    return {
      status: 'DISABLED_ABUSE',
      httpCode: 410,
      title: 'Link Suspended',
      message: link.abuse_reason || 'This link has been deactivated by administrators due to a reported security, malware, or policy violation.',
      link
    };
  }

  // Rule 2: Active / Inactive Status Check
  if (link.status === 'inactive') {
    return {
      status: 'INACTIVE',
      httpCode: 403,
      title: 'Link Paused',
      message: 'The creator has temporarily paused or deactivated this link.',
      link
    };
  }

  // Rule 3: Expiration Date Check
  if (link.expires_at) {
    const expiryTime = new Date(link.expires_at).getTime();
    if (Date.now() > expiryTime) {
      return {
        status: 'EXPIRED',
        httpCode: 410,
        title: 'Link Expired',
        message: `This link expired on ${new Date(link.expires_at).toLocaleString()}. Access is no longer available.`,
        link
      };
    }
  }

  // Rule 4: Click Limit / Cap Check
  if (link.click_limit !== null && link.click_limit !== undefined) {
    if (link.click_count >= link.click_limit) {
      return {
        status: 'LIMIT_EXCEEDED',
        httpCode: 410,
        title: 'Click Cap Reached',
        message: `This link was configured with a maximum visit cap of ${link.click_limit} clicks, which has now been exhausted.`,
        link
      };
    }
  }

  // Rule 5: Password Protection Check
  if (link.is_password_protected) {
    const cookies = req?.cookies || {};
    const headers = req?.headers || {};
    const query = req?.query || {};

    const sessionToken = cookies[`lp_auth_${link.id}`];
    const headerPassword = headers['x-link-password'];
    const queryPassword = query.pwd || query.password;

    let isAuthed = false;
    if (sessionToken && sessionToken === link.password_hash) {
      isAuthed = true;
    } else if (headerPassword && verifyPassword(link, headerPassword)) {
      isAuthed = true;
    } else if (queryPassword && verifyPassword(link, queryPassword)) {
      isAuthed = true;
    }

    if (!isAuthed) {
      return {
        status: 'PASSWORD_REQUIRED',
        httpCode: 401,
        title: 'Password Protected',
        message: 'This link requires a password to proceed.',
        link
      };
    }
  }

  // Rule 6: Device-Specific Target Routing
  const userAgent = (req?.headers && req.headers['user-agent']) || '';
  const deviceType = detectDeviceType(userAgent);

  let destination = link.original_url;
  let ruleApplied = 'default';

  if (deviceType === 'mobile' && link.mobile_url) {
    destination = link.mobile_url;
    ruleApplied = 'mobile_override';
  } else if (deviceType === 'tablet' && (link.tablet_url || link.mobile_url)) {
    destination = link.tablet_url || link.mobile_url;
    ruleApplied = 'tablet_override';
  }

  // Append UTM parameters if configured on the link
  if (link.utm_source || link.utm_medium || link.utm_campaign) {
    try {
      const destUrl = new URL(destination);
      if (link.utm_source && !destUrl.searchParams.has('utm_source')) {
        destUrl.searchParams.set('utm_source', link.utm_source);
      }
      if (link.utm_medium && !destUrl.searchParams.has('utm_medium')) {
        destUrl.searchParams.set('utm_medium', link.utm_medium);
      }
      if (link.utm_campaign && !destUrl.searchParams.has('utm_campaign')) {
        destUrl.searchParams.set('utm_campaign', link.utm_campaign);
      }
      destination = destUrl.toString();
    } catch (e) {
      // keep original destination if URL parsing fails
    }
  }

  return {
    status: 'OK',
    destination,
    deviceType,
    ruleApplied,
    link
  };
}

module.exports = {
  checkRateLimit,
  validateUrl,
  validateAlias,
  generateShortCode,
  hashPassword,
  verifyPassword,
  detectDeviceType,
  evaluateRedirectRule,
  RESERVED_SLUGS
};

/**
 * ============================================================================
 * LINKPULSE: FULL-STACK EXPRESS SERVER & API CONTROLLER
 * ============================================================================
 * 
 * Port: 5000 | Database: MongoDB (mongodb://localhost:27017/linkpulse)
 * 
 * Architectural Components:
 *   1. Redirection Router: High-speed handler for /:code, /r/:code, and /s/:code
 *   2. Link Management API: CRUD endpoints, 2-step validation, and tag filtering
 *   3. Campaigns & Workspaces: Organization units for multi-channel growth teams
 *   4. Alerts & Health Center: Proactive warning system for visit caps and expiry
 *   5. Analytics Engine: Aggregated metrics, KPI totals, and live click simulator
 *   6. QR Code Studio: Raster PNG and vector SVG generation with scan tagging
 *   7. Bulk CSV Importer: Dry-run preview validator and batch committer
 *   8. Link-in-Bio Platform: Mobile profile landing page builder & renderer
 *   9. Admin Abuse Governance: Real-time domain blocklist and instant takedowns
 *   10. SPA Static Delivery: Serves React production bundle directly from /dist
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const {
  connectDB,
  getNextId,
  User,
  Workspace,
  Campaign,
  DomainBlocklist,
  Link,
  Click,
  BioPage,
  Setting
} = require('./db');
const {
  checkRateLimit,
  validateUrl,
  validateAlias,
  generateShortCode,
  hashPassword,
  verifyPassword,
  detectDeviceType,
  evaluateRedirectRule,
  RESERVED_SLUGS
} = require('./rules');
const {
  logClickAsync,
  getAggregatedAnalytics,
  resolveGeo,
  categorizeReferrer
} = require('./analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight cookie parsing
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (name) req.cookies[name] = decodeURIComponent(val);
    });
  }
  next();
});

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ==========================================

/**
 * Global Identity Extraction Middleware:
 * Resolves caller persona ('admin' vs 'user') from headers, query params, or body.
 * Assigns req.user = { id, role }
 */
app.use((req, res, next) => {
  const roleRaw = req.headers['x-role'] || req.query.role || req.body?.role || 'user';
  const role = String(roleRaw).toLowerCase() === 'admin' ? 'admin' : 'user';

  const userIdRaw = req.headers['x-user-id'] || req.query.userId || req.body?.userId;
  let userId = userIdRaw ? Number(userIdRaw) : (role === 'admin' ? 2 : 1);
  if (isNaN(userId)) userId = (role === 'admin' ? 2 : 1);

  req.user = {
    id: userId,
    role
  };
  next();
});

/**
 * Admin Route Guard:
 * Blocks any non-admin requester with HTTP 403 Forbidden.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Administrator privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY'
    });
  }
  next();
}

/**
 * Resource Ownership or Admin Override Guard:
 * Allows the creator who owns the link OR any platform administrator.
 * Non-owners attempting to modify/delete someone else's link are rejected with HTTP 403 Forbidden.
 */
async function requireLinkOwnershipOrAdmin(req, res, next) {
  const linkId = Number(req.params.id);
  const link = await Link.findOne({ id: linkId });
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  // Administrators have universal authority
  if (req.user && req.user.role === 'admin') {
    req.targetLink = link;
    return next();
  }

  // Regular creators must own the link
  if (!req.user || link.user_id !== req.user.id) {
    return res.status(403).json({
      error: 'Access Denied: You do not have permission to modify or delete this link.',
      code: 'FORBIDDEN_LINK_OWNER_ONLY'
    });
  }

  req.targetLink = link;
  next();
}

// Helper for UI error/status pages (sleek dark aesthetic with neon indigo accents)
function renderNoticePage({ title, badge, badgeColor, message, shortCode, subDetails = '', showPasswordForm = false, error = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | LinkPulse</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 45%, #030712 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 1.25rem;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.12);
      text-align: center;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
      color: #ffffff;
      text-decoration: none;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1rem;
      color: white;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.25rem;
      background: ${badgeColor || 'rgba(99, 102, 241, 0.15)'};
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    h1 {
      font-size: 1.65rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }
    p {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .code-pill {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(30, 41, 59, 0.7);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      color: #818cf8;
      font-size: 0.9rem;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .input-group {
      margin-bottom: 1.25rem;
      text-align: left;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
    }
    input[type="password"]:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
    }
    .btn {
      display: block;
      width: 100%;
      padding: 0.85rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      color: white;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }
    .btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: none;
      color: #cbd5e1;
      margin-top: 0.75rem;
    }
    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      color: white;
    }
    .error-msg {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      font-size: 0.85rem;
      padding: 0.6rem 0.8rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      text-align: left;
    }
    .footer {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <a href="/" class="brand">
      <span class="brand-icon">⚡</span>
      <span>LinkPulse</span>
    </a>

    <div>
      <span class="badge">${badge}</span>
    </div>

    <h1>${title}</h1>
    <p>${message}</p>

    ${shortCode ? `<p style="margin-bottom: 1.25rem;">Short Code: <span class="code-pill">/${shortCode}</span></p>` : ''}
    ${subDetails ? `<div style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">${subDetails}</div>` : ''}

    ${error ? `<div class="error-msg">⚠️ ${error}</div>` : ''}

    ${showPasswordForm ? `
      <form method="POST" action="/${shortCode}">
        <div class="input-group">
          <label for="password">Enter Access Password</label>
          <input type="password" id="password" name="password" placeholder="••••••••" autofocus required />
        </div>
        <button type="submit" class="btn">Unlock & Proceed →</button>
      </form>
    ` : ''}

    <a href="/" class="btn btn-secondary">Go to LinkPulse Home</a>
  </div>
  <div class="footer">LinkPulse URL Shortener & Analytics Platform</div>
</body>
</html>`;
}

// ==========================================
// 1. REDIRECTION ENGINE (High Priority /:code)
// ==========================================

async function handleRedirect(req, res, code) {
  if (!code || RESERVED_SLUGS.has(code.toLowerCase())) {
    return res.status(404).send(renderNoticePage({
      title: 'Link Not Found',
      badge: '404 Error',
      badgeColor: '#ef4444',
      message: 'This path does not map to any active short link.',
      shortCode: code
    }));
  }

  // Lookup link by short code (case insensitive in MongoDB)
  const link = await Link.findOne({ short_code: code.toLowerCase() }).lean();

  const evaluation = evaluateRedirectRule(link, req);

  switch (evaluation.status) {
    case 'NOT_FOUND':
      return res.status(404).send(renderNoticePage({
        title: 'Link Not Found',
        badge: '404 Not Found',
        badgeColor: '#ef4444',
        message: 'The link code does not exist or may have been deleted.',
        shortCode: code
      }));

    case 'DISABLED_ABUSE':
      return res.status(410).send(renderNoticePage({
        title: 'Link Suspended',
        badge: 'Security Warning',
        badgeColor: '#dc2626',
        message: evaluation.message,
        shortCode: code,
        subDetails: 'This domain or link was identified as hazardous or reported for phishing, malware, or spam.'
      }));

    case 'INACTIVE':
      return res.status(403).send(renderNoticePage({
        title: 'Link Paused',
        badge: 'Deactivated',
        badgeColor: '#64748b',
        message: evaluation.message,
        shortCode: code
      }));

    case 'EXPIRED':
      return res.status(410).send(renderNoticePage({
        title: 'Link Expired',
        badge: 'Expired',
        badgeColor: '#f59e0b',
        message: evaluation.message,
        shortCode: code,
        subDetails: `Expired on: ${new Date(link.expires_at).toLocaleString()}`
      }));

    case 'LIMIT_EXCEEDED':
      return res.status(410).send(renderNoticePage({
        title: 'Click Limit Reached',
        badge: 'Limit Reached',
        badgeColor: '#f97316',
        message: evaluation.message,
        shortCode: code,
        subDetails: `Cap limit: ${link.click_limit} visits (Current: ${link.click_count})`
      }));

    case 'PASSWORD_REQUIRED':
      return res.status(401).send(renderNoticePage({
        title: 'Password Protected',
        badge: 'Authentication Required',
        badgeColor: '#8b5cf6',
        message: 'The owner has protected this link with a password. Please provide the key to continue.',
        shortCode: code,
        showPasswordForm: true
      }));

    case 'OK':
      // Non-blocking async click logging: never slows down redirection!
      logClickAsync(link, req, evaluation);

      // Fast HTTP 302 redirection
      return res.redirect(302, evaluation.destination);

    default:
      return res.status(500).send('Unexpected redirect engine error');
  }
}

// POST endpoint for password submission from HTML form
app.post('/:code', async (req, res) => {
  const code = req.params.code;
  const password = req.body.password;

  const link = await Link.findOne({ short_code: code.toLowerCase() }).lean();
  if (!link) {
    return res.status(404).send(renderNoticePage({
      title: 'Link Not Found',
      badge: '404',
      badgeColor: '#ef4444',
      message: 'Link does not exist',
      shortCode: code
    }));
  }

  if (verifyPassword(link, password)) {
    // Set authentication cookie valid for 1 hour
    res.setHeader('Set-Cookie', `lp_auth_${link.id}=${link.password_hash}; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax`);
    req.cookies[`lp_auth_${link.id}`] = link.password_hash;

    // Re-evaluate redirection
    const evalResult = evaluateRedirectRule(link, req);

    if (evalResult.status === 'OK') {
      logClickAsync(link, req, evalResult);
      return res.redirect(302, evalResult.destination);
    }
  }

  // If password incorrect, re-render form with error
  return res.status(401).send(renderNoticePage({
    title: 'Password Protected',
    badge: 'Authentication Required',
    badgeColor: '#8b5cf6',
    message: 'The owner has protected this link with a password. Please provide the key to continue.',
    shortCode: code,
    showPasswordForm: true,
    error: 'Incorrect password entered. Please try again.'
  }));
});

// Explicit redirect prefixes (/r/:code, /s/:code)
app.get('/r/:code', (req, res) => handleRedirect(req, res, req.params.code));
app.get('/s/:code', (req, res) => handleRedirect(req, res, req.params.code));

// ==========================================
// 2. API: LINKS MANAGEMENT
// ==========================================

// Pre-flight validation endpoint for 2-step link wizard
app.post('/api/links/validate', async (req, res) => {
  const { url, alias, currentLinkId } = req.body;

  const urlCheck = await validateUrl(url, req.get('host'));
  const aliasCheck = await validateAlias(alias, currentLinkId);

  const warnings = [];
  if (urlCheck.valid && !url.startsWith('https://')) {
    warnings.push('URL does not use HTTPS encryption.');
  }

  res.json({
    urlValid: urlCheck.valid,
    urlError: urlCheck.error,
    normalizedUrl: urlCheck.url,
    aliasValid: aliasCheck.valid,
    aliasError: aliasCheck.error,
    warnings
  });
});

// Get all links with filtering & stats
app.get('/api/links', async (req, res) => {
  const { search, campaignId, status, tag, role, userId, workspaceId } = req.query;

  const query = {};

  // Regular users are strictly restricted to their own links; Admins can view all or filter by user
  if (req.user.role !== 'admin') {
    query.user_id = req.user.id;
  } else if (userId) {
    query.user_id = Number(userId);
  }

  if (workspaceId && workspaceId !== 'all') {
    query.workspace_id = Number(workspaceId);
  }

  if (campaignId) {
    query.campaign_id = Number(campaignId);
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (tag) {
    query.tags = tag;
  }

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: searchRegex },
      { short_code: searchRegex },
      { original_url: searchRegex }
    ];
  }

  const links = await Link.find(query).sort({ created_at: -1 }).lean();

  const [campaigns, workspaces] = await Promise.all([
    Campaign.find({}).lean(),
    Workspace.find({}).lean()
  ]);

  const campMap = new Map(campaigns.map(c => [c.id, c]));
  const wsMap = new Map(workspaces.map(w => [w.id, w]));

  const parsedLinks = links.map(l => {
    const camp = campMap.get(l.campaign_id);
    const ws = wsMap.get(l.workspace_id);
    return {
      ...l,
      campaign_name: camp?.name || null,
      campaign_color: camp?.color || null,
      workspace_name: ws?.name || 'Default Workspace',
      tags: Array.isArray(l.tags) ? l.tags : [],
      isExpired: l.expires_at ? new Date() > new Date(l.expires_at) : false,
      isLimitExceeded: l.click_limit !== null && l.click_limit !== undefined ? l.click_count >= l.click_limit : false
    };
  });

  res.json({ links: parsedLinks });
});

// Get single link details + its individual click breakdown
app.get('/api/links/:id', async (req, res) => {
  const linkId = Number(req.params.id);
  const link = await Link.findOne({ id: linkId }).lean();

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const camp = link.campaign_id ? await Campaign.findOne({ id: link.campaign_id }).lean() : null;
  const clicks = await Click.find({ link_id: linkId }).sort({ timestamp: -1 }).limit(100).lean();

  res.json({
    link: {
      ...link,
      campaign_name: camp?.name || null,
      campaign_color: camp?.color || null,
      tags: Array.isArray(link.tags) ? link.tags : [],
      isExpired: link.expires_at ? new Date() > new Date(link.expires_at) : false,
      isLimitExceeded: link.click_limit !== null && link.click_limit !== undefined ? link.click_count >= link.click_limit : false
    },
    clicks
  });
});

// Create Link
app.post('/api/links', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '127.0.0.1';
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Rate limit reached. Please wait ${rateLimit.retryAfterSec} seconds before creating more links.`
    });
  }

  const {
    title,
    original_url,
    custom_alias,
    campaign_id,
    workspace_id,
    click_limit,
    expires_at,
    password,
    mobile_url,
    tablet_url,
    tags,
    utm_source,
    utm_medium,
    utm_campaign,
    user_id = 1
  } = req.body;

  // Validate URL
  const urlCheck = await validateUrl(original_url, req.get('host'));
  if (!urlCheck.valid) {
    return res.status(400).json({ error: urlCheck.error });
  }

  // Validate Mobile URL if given
  let finalMobileUrl = null;
  if (mobile_url && mobile_url.trim()) {
    const mobileCheck = await validateUrl(mobile_url, req.get('host'));
    if (!mobileCheck.valid) {
      return res.status(400).json({ error: `Mobile URL error: ${mobileCheck.error}` });
    }
    finalMobileUrl = mobileCheck.url;
  }

  // Validate Tablet URL if given
  let finalTabletUrl = null;
  if (tablet_url && tablet_url.trim()) {
    const tabletCheck = await validateUrl(tablet_url, req.get('host'));
    if (!tabletCheck.valid) {
      return res.status(400).json({ error: `Tablet URL error: ${tabletCheck.error}` });
    }
    finalTabletUrl = tabletCheck.url;
  }

  // Validate Alias or Auto-generate
  let short_code = custom_alias ? custom_alias.trim().toLowerCase() : '';
  if (short_code) {
    const aliasCheck = await validateAlias(short_code);
    if (!aliasCheck.valid) {
      return res.status(400).json({ error: aliasCheck.error });
    }
  } else {
    short_code = await generateShortCode(6);
  }

  // Password hashing
  const isPasswordProtected = Boolean(password && password.trim());
  const passwordHash = isPasswordProtected ? hashPassword(password.trim()) : null;

  // Tags Array
  let tagsArray = [];
  if (Array.isArray(tags)) {
    tagsArray = tags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof tags === 'string') {
    tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  // Standard creators can only create links for their own account; admins can optionally specify target user_id
  const assignedUserId = (req.user && req.user.role === 'admin' && user_id)
    ? Number(user_id)
    : (req.user ? req.user.id : 1);

  const nextId = await getNextId(Link);

  try {
    const createdLink = await Link.create({
      id: nextId,
      title: title ? title.trim() : short_code,
      original_url: urlCheck.url,
      short_code,
      user_id: assignedUserId,
      campaign_id: campaign_id ? Number(campaign_id) : null,
      workspace_id: workspace_id ? Number(workspace_id) : 1,
      status: 'active',
      click_limit: click_limit ? Number(click_limit) : null,
      click_count: 0,
      expires_at: expires_at ? new Date(expires_at) : null,
      password_hash: passwordHash,
      is_password_protected: isPasswordProtected ? 1 : 0,
      mobile_url: finalMobileUrl,
      tablet_url: finalTabletUrl,
      tags: tagsArray,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null
    });

    res.status(201).json({
      success: true,
      link: createdLink
    });
  } catch (err) {
    console.error('Error creating link:', err);
    res.status(500).json({ error: 'Failed to create short link in database' });
  }
});

// Update Link (Owner or Admin)
app.put('/api/links/:id', requireLinkOwnershipOrAdmin, async (req, res) => {
  const link = req.targetLink;
  const linkId = link.id;

  const {
    title,
    original_url,
    custom_alias,
    campaign_id,
    click_limit,
    expires_at,
    password,
    clear_password,
    mobile_url,
    tablet_url,
    tags,
    status
  } = req.body;

  // Validate URL if changed
  let finalUrl = link.original_url;
  if (original_url && original_url !== link.original_url) {
    const urlCheck = await validateUrl(original_url, req.get('host'));
    if (!urlCheck.valid) return res.status(400).json({ error: urlCheck.error });
    finalUrl = urlCheck.url;
  }

  // Validate Alias if changed
  let finalAlias = link.short_code;
  if (custom_alias && custom_alias !== link.short_code) {
    const aliasCheck = await validateAlias(custom_alias, linkId);
    if (!aliasCheck.valid) return res.status(400).json({ error: aliasCheck.error });
    finalAlias = aliasCheck.alias;
  }

  // Password update logic
  let finalHash = link.password_hash;
  let finalIsProtected = link.is_password_protected;
  if (clear_password) {
    finalHash = null;
    finalIsProtected = 0;
  } else if (password && password.trim()) {
    finalHash = hashPassword(password.trim());
    finalIsProtected = 1;
  }

  let tagsArray = link.tags;
  if (tags !== undefined) {
    tagsArray = Array.isArray(tags) ? tags : [];
  }

  link.title = title || link.title;
  link.original_url = finalUrl;
  link.short_code = finalAlias;
  link.campaign_id = campaign_id !== undefined ? (campaign_id ? Number(campaign_id) : null) : link.campaign_id;
  link.click_limit = click_limit !== undefined ? (click_limit ? Number(click_limit) : null) : link.click_limit;
  link.expires_at = expires_at !== undefined ? (expires_at ? new Date(expires_at) : null) : link.expires_at;
  link.password_hash = finalHash;
  link.is_password_protected = finalIsProtected;
  link.mobile_url = mobile_url !== undefined ? mobile_url : link.mobile_url;
  link.tablet_url = tablet_url !== undefined ? tablet_url : link.tablet_url;
  link.tags = tagsArray;
  link.status = status || link.status;
  link.updated_at = new Date();

  await link.save();

  res.json({
    success: true,
    link
  });
});

// Quick toggle active / inactive status (Owner or Admin)
app.patch('/api/links/:id/status', requireLinkOwnershipOrAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  const link = req.targetLink;

  if (link.status === 'disabled_abuse' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Suspended links cannot be activated without admin review.' });
  }

  link.status = status;
  link.updated_at = new Date();
  await link.save();

  res.json({ success: true, status });
});

// Delete link (Owner or Admin)
app.delete('/api/links/:id', requireLinkOwnershipOrAdmin, async (req, res) => {
  const linkId = req.targetLink.id;
  await Click.deleteMany({ link_id: linkId });
  const result = await Link.deleteOne({ id: linkId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }
  res.json({ success: true, message: 'Link deleted successfully' });
});

// ==========================================
// 3. API: CAMPAIGNS & WORKSPACES
// ==========================================

app.get('/api/campaigns', async (req, res) => {
  const { role, userId } = req.query;

  const query = {};
  if (role !== 'admin' && userId) {
    query.user_id = Number(userId);
  }

  const campaigns = await Campaign.find(query).sort({ created_at: -1 }).lean();

  const campaignList = await Promise.all(campaigns.map(async camp => {
    const links = await Link.find({ campaign_id: camp.id }).lean();
    const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
    const topLink = links.sort((a, b) => (b.click_count || 0) - (a.click_count || 0))[0] || null;

    return {
      ...camp,
      link_count: links.length,
      total_clicks: totalClicks,
      topLink: topLink ? {
        title: topLink.title,
        short_code: topLink.short_code,
        click_count: topLink.click_count
      } : null
    };
  }));

  res.json({ campaigns: campaignList });
});

app.post('/api/campaigns', async (req, res) => {
  const { name, description, color = '#6366f1', user_id = 1 } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Campaign name is required' });
  }

  const nextId = await getNextId(Campaign);
  const created = await Campaign.create({
    id: nextId,
    name: name.trim(),
    description: description ? description.trim() : '',
    color,
    user_id: Number(user_id)
  });

  res.status(201).json({ success: true, campaign: created });
});

app.delete('/api/campaigns/:id', async (req, res) => {
  const campId = Number(req.params.id);
  const camp = await Campaign.findOne({ id: campId });
  if (!camp) return res.status(404).json({ error: 'Campaign not found' });

  if (req.user.role !== 'admin' && camp.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this campaign.' });
  }

  // Unlink links from this campaign before deleting
  await Link.updateMany({ campaign_id: campId }, { $set: { campaign_id: null } });
  await Campaign.deleteOne({ id: campId });
  res.json({ success: true });
});

app.get('/api/workspaces', async (req, res) => {
  const workspaces = await Workspace.find({}).sort({ id: 1 }).lean();
  res.json({ workspaces });
});

app.post('/api/workspaces', async (req, res) => {
  const { name, user_id = 1 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Workspace name is required' });
  const nextId = await getNextId(Workspace);
  const created = await Workspace.create({
    id: nextId,
    name: name.trim(),
    user_id: Number(user_id)
  });
  res.status(201).json({ success: true, workspace: created });
});

// Link Alerts & Health Center API
app.get('/api/alerts', async (req, res) => {
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const allLinks = await Link.find({}).lean();

  const capAlerts = allLinks
    .filter(l => l.click_limit !== null && l.click_limit !== undefined && l.click_count >= (l.click_limit * 0.8))
    .sort((a, b) => b.click_count - a.click_count);

  const expiryAlerts = allLinks
    .filter(l => l.expires_at && new Date(l.expires_at) <= in3Days)
    .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));

  const abuseAlerts = allLinks
    .filter(l => l.status === 'disabled_abuse')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const botClicksByLink = await Click.aggregate([
    { $match: { is_bot: 1 } },
    { $group: { _id: '$link_id', bot_count: { $sum: 1 } } },
    { $match: { bot_count: { $gte: 2 } } },
    { $sort: { bot_count: -1 } }
  ]);

  const linkMap = new Map(allLinks.map(l => [l.id, l]));
  const botAlerts = botClicksByLink.map(b => {
    const link = linkMap.get(b._id);
    return {
      id: b._id,
      title: link?.title || 'Unknown',
      short_code: link?.short_code || 'link',
      bot_count: b.bot_count
    };
  });

  res.json({
    capAlerts,
    expiryAlerts,
    abuseAlerts,
    botAlerts,
    totalAlerts: capAlerts.length + expiryAlerts.length + abuseAlerts.length + botAlerts.length
  });
});

// Platform Settings & User Management
let platformSettings = {
  platformName: 'LinkPulse',
  defaultDomain: 'localhost:5000',
  defaultRateLimitPerMin: 30,
  autoBotFilter: true,
  strictDomainCheck: true,
  enableQrAutoTag: true
};

app.get('/api/settings', (req, res) => {
  res.json({ settings: platformSettings });
});

app.post('/api/settings', requireAdmin, (req, res) => {
  platformSettings = { ...platformSettings, ...req.body };
  res.json({ success: true, settings: platformSettings });
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find({}).sort({ id: 1 }).lean();
  const usersWithStats = await Promise.all(users.map(async u => {
    const links = await Link.find({ user_id: u.id }).lean();
    const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
    return {
      ...u,
      link_count: links.length,
      total_clicks: totalClicks
    };
  }));
  res.json({ users: usersWithStats });
});

// ==========================================
// 4. API: LIVE ANALYTICS
// ==========================================

app.get('/api/analytics', async (req, res) => {
  const { period = '30d', campaignId, linkId, userId, role } = req.query;
  const analytics = await getAggregatedAnalytics({
    period,
    campaignId: campaignId ? Number(campaignId) : null,
    linkId: linkId ? Number(linkId) : null,
    userId: userId ? Number(userId) : 1,
    role: role || 'user'
  });
  res.json(analytics);
});

// Simulate Live Click (Great for hackathon presentation / instant interactive demo!)
app.post('/api/analytics/simulate-click', async (req, res) => {
  const { code, device, country, isQr } = req.body;
  const link = await Link.findOne({ short_code: (code || 'summer26').toLowerCase() }).lean();

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const simulatedReq = {
    headers: {
      'user-agent': device === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'referer': 'https://twitter.com/feed',
      'x-forwarded-for': `${Math.floor(Math.random() * 200 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`
    },
    query: {
      qr: isQr ? '1' : '0'
    }
  };

  logClickAsync(link, simulatedReq, { destination: link.original_url });

  res.json({
    success: true,
    message: `Simulated click registered for /${link.short_code}!`,
    linkId: link.id
  });
});

// ==========================================
// 5. API: QR CODE GENERATOR
// ==========================================

app.get('/api/qr/:code', async (req, res) => {
  const { code } = req.params;
  const {
    format = 'dataurl', // 'dataurl', 'svg', 'png'
    color = '#000000',
    background = '#ffffff',
    ecc = 'M', // 'L', 'M', 'Q', 'H'
    margin = 2,
    size = 400
  } = req.query;

  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol;
  // Automatically attach ?qr=1 to track scans!
  const targetUrl = `${protocol}://${host}/${code}?qr=1`;

  const qrOptions = {
    errorCorrectionLevel: ecc,
    margin: Number(margin) || 2,
    color: {
      dark: color || '#000000',
      light: background || '#ffffff'
    },
    width: Number(size) || 400
  };

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(targetUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="linkpulse-qr-${code}.svg"`);
      return res.send(svg);
    } else if (format === 'png') {
      const buffer = await QRCode.toBuffer(targetUrl, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="linkpulse-qr-${code}.png"`);
      return res.send(buffer);
    } else {
      // Default data URL
      const dataUrl = await QRCode.toDataURL(targetUrl, qrOptions);
      res.json({
        code,
        targetUrl,
        qrDataUrl: dataUrl
      });
    }
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ==========================================
// 6. API: BULK CSV IMPORT WITH DRY-RUN PREVIEW
// ==========================================

app.post('/api/import/preview', async (req, res) => {
  const { csvText, rows: rawRows } = req.body;

  let parsedRows = [];
  if (Array.isArray(rawRows)) {
    parsedRows = rawRows;
  } else if (csvText) {
    // Parse CSV lines
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return res.status(400).json({ error: 'CSV data is empty' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      parsedRows.push(rowObj);
    }
  }

  if (parsedRows.length === 0) {
    return res.status(400).json({ error: 'No data rows found to preview' });
  }

  const seenAliasesInCsv = new Set();
  const previewResults = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let index = 0; index < parsedRows.length; index++) {
    const row = parsedRows[index];
    const rawUrl = row.url || row.original_url || row.destination || '';
    const rawAlias = row.alias || row.short_code || row.custom_alias || '';
    const title = row.title || row.name || rawAlias || rawUrl;
    const campaignName = row.campaign || row.campaign_name || '';
    const tags = row.tags ? row.tags.split(';').map(t => t.trim()) : [];

    const issues = [];

    // URL validation
    const urlCheck = await validateUrl(rawUrl, req.get('host'));
    if (!urlCheck.valid) {
      issues.push(urlCheck.error);
    }

    // Alias validation
    let finalAlias = rawAlias ? rawAlias.toLowerCase().trim() : '';
    if (finalAlias) {
      if (seenAliasesInCsv.has(finalAlias)) {
        issues.push(`Duplicate alias "${finalAlias}" found inside this CSV file.`);
      } else {
        seenAliasesInCsv.add(finalAlias);
      }

      const aliasCheck = await validateAlias(finalAlias);
      if (!aliasCheck.valid) {
        issues.push(aliasCheck.error);
      }
    }

    const isValid = issues.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    previewResults.push({
      rowIndex: index + 1,
      title,
      url: urlCheck.valid ? urlCheck.url : rawUrl,
      alias: finalAlias || '(Auto-generate)',
      campaignName,
      tags,
      isValid,
      issues
    });
  }

  res.json({
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
    rows: previewResults
  });
});

// Commit the valid rows in batch
app.post('/api/import/execute', async (req, res) => {
  const { rows, userId = 1, defaultCampaignId = null } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No valid rows provided for import' });
  }

  const createdLinks = [];
  const errors = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    try {
      let code = row.alias && row.alias !== '(Auto-generate)' ? row.alias : await generateShortCode(6);
      const tagsArray = Array.isArray(row.tags) ? row.tags : [];
      const nextId = await getNextId(Link);

      await Link.create({
        id: nextId,
        title: row.title || code,
        original_url: row.url,
        short_code: code,
        user_id: Number(userId),
        campaign_id: row.campaignId ? Number(row.campaignId) : (defaultCampaignId ? Number(defaultCampaignId) : null),
        status: 'active',
        tags: tagsArray
      });

      createdLinks.push({ title: row.title, code, url: row.url });
    } catch (err) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
    }
  }

  res.json({
    success: true,
    importedCount: createdLinks.length,
    errorsCount: errors.length,
    createdLinks,
    errors
  });
});

// ==========================================
// 7. API: LINK-IN-BIO LANDING PAGES
// ==========================================

app.get('/api/bio/:slug', async (req, res) => {
  const bio = await BioPage.findOne({ slug: req.params.slug.toLowerCase() }).lean();
  if (!bio) return res.status(404).json({ error: 'Bio page not found' });

  res.json({
    bio: {
      ...bio,
      links: bio.links || [],
      socials: bio.socials || {}
    }
  });
});

app.post('/api/bio', async (req, res) => {
  const { slug, title, bio, avatar_url, theme = 'luxury-dark', links = [], socials = {}, userId = 1 } = req.body;
  if (!slug || !title) {
    return res.status(400).json({ error: 'Slug and title are required' });
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  await BioPage.findOneAndUpdate(
    { slug: cleanSlug },
    {
      $set: {
        slug: cleanSlug,
        title: title.trim(),
        bio: bio || '',
        avatar_url: avatar_url || '',
        theme,
        links: Array.isArray(links) ? links : [],
        socials: typeof socials === 'object' ? socials : {},
        user_id: Number(userId)
      }
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, slug: cleanSlug });
});

// Public HTML view for link-in-bio (rendered beautifully!)
app.get('/bio/:slug', async (req, res) => {
  const bio = await BioPage.findOne({ slug: req.params.slug.toLowerCase() }).lean();
  if (!bio) {
    return res.status(404).send(renderNoticePage({
      title: 'Bio Page Not Found',
      badge: '404',
      badgeColor: '#ef4444',
      message: 'The creator profile or bio page you are looking for does not exist.'
    }));
  }

  const links = Array.isArray(bio.links) ? bio.links : [];
  const socials = bio.socials || {};

  const linksHtml = links.map(l => `
    <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="bio-link">
      <span class="bio-link-title">${l.title}</span>
      ${l.subtitle ? `<span class="bio-link-subtitle">${l.subtitle}</span>` : ''}
    </a>
  `).join('');

  const socialsHtml = Object.entries(socials)
    .filter(([_, url]) => Boolean(url))
    .map(([platform, url]) => `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-icon" title="${platform}">
        ${platform.toUpperCase()}
      </a>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bio.title} | LinkPulse Bio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 50% 10%, #1e1b4b 0%, #0b0f19 50%, #030712 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1.5rem;
    }
    .bio-container {
      max-width: 540px;
      width: 100%;
      text-align: center;
    }
    .avatar {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 1.25rem;
      border: 3px solid #6366f1;
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
    }
    .avatar-fallback {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    .bio-desc {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .socials-row {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .social-icon {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s;
    }
    .social-icon:hover {
      background: #6366f1;
      color: white;
      transform: translateY(-2px);
    }
    .links-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .bio-link {
      display: block;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      padding: 1.1rem 1.5rem;
      text-decoration: none;
      color: white;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .bio-link:hover {
      transform: translateY(-3px) scale(1.01);
      border-color: #818cf8;
      background: rgba(30, 41, 59, 0.85);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
    }
    .bio-link-title {
      display: block;
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
    }
    .bio-link-subtitle {
      display: block;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .branding {
      font-size: 0.8rem;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      text-decoration: none;
    }
    .branding:hover { color: #818cf8; }
  </style>
</head>
<body>
  <div class="bio-container">
    ${bio.avatar_url ? `<img src="${bio.avatar_url}" alt="${bio.title}" class="avatar" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'104\\' height=\\'104\\' viewBox=\\'0 0 104 104\\'><circle cx=\\'52\\' cy=\\'52\\' r=\\'52\\' fill=\\'%236366f1\\'/><text x=\\'50%\\' y=\\'55%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'white\\' font-size=\\'40\\' font-family=\\'sans-serif\\'>${bio.title ? bio.title.charAt(0) : 'L'}</text></svg>';" />` : `<div class="avatar-fallback">${bio.title.charAt(0)}</div>`}
    <h1>${bio.title}</h1>
    ${bio.bio ? `<p class="bio-desc">${bio.bio}</p>` : ''}
    <div class="socials-row">${socialsHtml}</div>
    <div class="links-list">${linksHtml}</div>
    <a href="/" class="branding">⚡ Powered by LinkPulse</a>
  </div>
</body>
</html>`;

  res.send(html);
});

// ==========================================
// 8. API: ADMIN & ABUSE MONITORING
// ==========================================

app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  const [
    totalLinks,
    activeLinks,
    disabledAbuseLinks,
    totalClicks,
    botClicks,
    totalUsers,
    blockedDomains,
    flaggedLinksRaw,
    users
  ] = await Promise.all([
    Link.countDocuments(),
    Link.countDocuments({ status: 'active' }),
    Link.countDocuments({ status: 'disabled_abuse' }),
    Click.countDocuments(),
    Click.countDocuments({ is_bot: 1 }),
    User.countDocuments(),
    DomainBlocklist.countDocuments(),
    Link.find({ $or: [{ status: 'disabled_abuse' }, { abuse_reason: { $ne: null } }] }).sort({ updated_at: -1 }).lean(),
    User.find({}).lean()
  ]);

  const userMap = new Map(users.map(u => [u.id, u.email]));
  const flaggedLinks = flaggedLinksRaw.map(l => ({
    ...l,
    user_email: userMap.get(l.user_id) || 'unknown@linkpulse.io'
  }));

  res.json({
    metrics: {
      totalLinks,
      activeLinks,
      disabledAbuseLinks,
      totalClicks,
      botClicks,
      totalUsers,
      blockedDomains
    },
    flaggedLinks
  });
});

app.get('/api/admin/blocklist', requireAdmin, async (req, res) => {
  const blocklist = await DomainBlocklist.find({}).sort({ created_at: -1 }).lean();
  res.json({ blocklist });
});

app.post('/api/admin/blocklist', requireAdmin, async (req, res) => {
  const { domain, reason, addedBy = 2 } = req.body;
  if (!domain || !domain.trim()) {
    return res.status(400).json({ error: 'Domain name is required' });
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];

  try {
    const nextId = await getNextId(DomainBlocklist);
    await DomainBlocklist.create({
      id: nextId,
      domain: cleanDomain,
      reason: reason || 'Manually added by administrator',
      added_by: addedBy
    });

    // Auto-disable any existing active links that point to this newly blocked domain
    const domainRegex = new RegExp(`://${cleanDomain}`, 'i');
    const affected = await Link.updateMany(
      {
        status: 'active',
        $or: [
          { original_url: domainRegex },
          { mobile_url: domainRegex }
        ]
      },
      {
        $set: {
          status: 'disabled_abuse',
          abuse_reason: `Domain ${cleanDomain} was added to platform safety blocklist`,
          updated_at: new Date()
        }
      }
    );

    res.status(201).json({
      success: true,
      domain: cleanDomain,
      affectedLinksCount: affected.modifiedCount || 0
    });
  } catch (err) {
    res.status(400).json({ error: 'Domain already exists in blocklist or database error' });
  }
});

app.delete('/api/admin/blocklist/:id', requireAdmin, async (req, res) => {
  const idParam = req.params.id;
  if (/^\d+$/.test(idParam)) {
    await DomainBlocklist.deleteOne({ id: Number(idParam) });
  } else {
    await DomainBlocklist.deleteOne({ _id: idParam });
  }
  res.json({ success: true });
});

// Admin Instant Takedown / Disable Link
app.post('/api/admin/links/:id/disable', requireAdmin, async (req, res) => {
  const { reason = 'Deactivated by administrator for policy violation' } = req.body;
  await Link.updateOne(
    { id: Number(req.params.id) },
    {
      $set: {
        status: 'disabled_abuse',
        abuse_reason: reason,
        updated_at: new Date()
      }
    }
  );

  res.json({ success: true, message: 'Link suspended immediately.' });
});

// Admin Restore Link
app.post('/api/admin/links/:id/restore', requireAdmin, async (req, res) => {
  await Link.updateOne(
    { id: Number(req.params.id) },
    {
      $set: {
        status: 'active',
        abuse_reason: null,
        updated_at: new Date()
      }
    }
  );

  res.json({ success: true, message: 'Link restored to active status.' });
});

// ==========================================
// 9. ROOT / STATIC FRONTEND SERVING
// ==========================================

const distPath = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback for root or short links:
// If request doesn't match static files or API, evaluate as short link or SPA fallback
app.get('/:code', (req, res) => {
  const code = req.params.code;
  // If dist exists and code is index or asset, express.static already handled it.
  // Otherwise, handle as short code redirect
  handleRedirect(req, res, code);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LinkPulse API', db: 'mongodb', timestamp: new Date().toISOString() });
});

// SPA fallback for frontend routes if dist is built
app.use((req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.json({
      service: 'LinkPulse API & Redirection Server',
      status: 'running',
      hint: 'Frontend client is being served via Vite or run npm run build in client directory'
    });
  }
});

// Start Express Server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 LinkPulse Server running on http://localhost:${PORT} with MongoDB`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();

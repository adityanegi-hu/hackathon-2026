/**
 * ============================================================================
 * LINKPULSE: 100% STATIC IN-BROWSER DATA STORE & CLIENT-SIDE ENGINE
 * ============================================================================
 * 
 * Runs entirely inside the browser without requiring any backend or external API.
 * - LocalStorage persistence for all models (Links, Campaigns, Workspaces, Clicks, Bio, Settings)
 * - In-browser analytical aggregations for charts, KPIs, referrers, devices & regions
 * - In-browser QR code generation using canvas/SVG
 * - In-browser CSV parsing & pre-validation
 * - In-browser redirection rule simulator
 * ============================================================================
 */

import QRCode from 'qrcode';

const STORAGE_KEY_PREFIX = 'linkpulse_static_';

// Reserved URL slugs that cannot be used as custom short codes
export const RESERVED_SLUGS = [
  'api', 'bio', 'admin', 'dashboard', 'analytics', 'campaigns',
  'settings', 'login', 'signup', 'register', 'auth', 'public',
  'assets', 'dist', 'favicon', 'index', 'status', 'health', 'help'
];

// In-browser SHA-256 helper
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ----------------------------------------------------------------------------
// SEED DATA GENERATOR
// ----------------------------------------------------------------------------

function getInitialSeedData() {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const createdAt14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  // SHA-256 for 'pulse2026'
  const demoPasswordHash = 'c637a7b8dfa8db2bbdb24d31846bcf3a1b5590928f96be4b06f5fe549e358b54';

  const users = [
    { id: 1, username: 'alex_growth', email: 'alex@linkpulse.io', role: 'user' },
    { id: 2, username: 'admin_sarah', email: 'sarah@linkpulse.io', role: 'admin' }
  ];

  const workspaces = [
    { id: 1, name: 'Default Workspace', user_id: 1 },
    { id: 2, name: 'Marketing & Growth', user_id: 1 },
    { id: 3, name: 'Enterprise Client Portals', user_id: 1 }
  ];

  const campaigns = [
    { id: 1, name: 'Summer Launch 2026', description: 'Global product launch across social and email', color: '#6366f1', user_id: 1 },
    { id: 2, name: 'Tech Summit Keynote', description: 'Live presentation attendee links & resources', color: '#ec4899', user_id: 1 },
    { id: 3, name: 'Mobile App Acquisition', description: 'Targeted app store install links with device routing', color: '#10b981', user_id: 1 },
    { id: 4, name: 'Black Friday Sneak Peek', description: 'VIP access campaign with password protection', color: '#f59e0b', user_id: 1 }
  ];

  const blocklist = [
    { id: 1, domain: 'malware-drop-test.xyz', reason: 'Identified as known phishing/malware distribution domain', added_by: 2, created_at: createdAt14DaysAgo },
    { id: 2, domain: 'free-crypto-airdrop-scam.biz', reason: 'Deceptive fraudulent scheme', added_by: 2, created_at: createdAt14DaysAgo },
    { id: 3, domain: 'credential-harvesting-site.ru', reason: 'Credential phishing attempt', added_by: 2, created_at: createdAt14DaysAgo }
  ];

  const links = [
    {
      id: 1,
      title: 'Summer 2026 Product Showcase',
      original_url: 'https://github.com/features/actions',
      short_code: 'summer26',
      user_id: 1,
      campaign_id: 1,
      workspace_id: 2,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 142,
      expires_at: futureDate,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: 'https://github.com/mobile',
      tablet_url: null,
      tags: ['launch', 'showcase', 'social'],
      utm_source: 'twitter',
      utm_medium: 'social',
      utm_campaign: 'summer2026',
      created_at: createdAt14DaysAgo
    },
    {
      id: 2,
      title: 'LinkPulse Mobile App Download',
      original_url: 'https://linkpulse.io/desktop-app',
      short_code: 'get-app',
      user_id: 1,
      campaign_id: 3,
      workspace_id: 2,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 89,
      expires_at: null,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: 'https://apps.apple.com/app/id123456789',
      tablet_url: 'https://play.google.com/store/apps/details?id=io.linkpulse',
      tags: ['mobile', 'ios', 'android', 'app'],
      utm_source: 'qr-poster',
      utm_medium: 'offline',
      utm_campaign: 'acquisition',
      created_at: createdAt14DaysAgo
    },
    {
      id: 3,
      title: 'VIP Investor Pitch Deck 2026',
      original_url: 'https://docs.google.com/presentation/d/demo-pitch-deck',
      short_code: 'vip-deck',
      user_id: 1,
      campaign_id: 4,
      workspace_id: 1,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 34,
      expires_at: futureDate,
      password_hash: demoPasswordHash,
      is_password_protected: 1,
      mobile_url: null,
      tablet_url: null,
      tags: ['investors', 'pitch', 'confidential'],
      utm_source: 'email',
      utm_medium: 'newsletter',
      utm_campaign: 'vip',
      created_at: createdAt14DaysAgo
    },
    {
      id: 4,
      title: 'Limited Beta Access (First 50 Users)',
      original_url: 'https://linkpulse.io/beta-register',
      short_code: 'early50',
      user_id: 1,
      campaign_id: 1,
      workspace_id: 1,
      status: 'active',
      abuse_reason: null,
      click_limit: 50,
      click_count: 50,
      expires_at: futureDate,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: null,
      tablet_url: null,
      tags: ['beta', 'giveaway', 'limited'],
      utm_source: 'linkedin',
      utm_medium: 'post',
      utm_campaign: 'launch',
      created_at: createdAt14DaysAgo
    },
    {
      id: 5,
      title: 'Early Bird Conference Discount (Expired)',
      original_url: 'https://techsummit2026.io/tickets/early-bird',
      short_code: 'summit-early',
      user_id: 1,
      campaign_id: 2,
      workspace_id: 2,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 76,
      expires_at: pastDate,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: null,
      tablet_url: null,
      tags: ['tickets', 'conference', 'discount'],
      utm_source: 'email',
      utm_medium: 'promo',
      utm_campaign: 'summit',
      created_at: createdAt14DaysAgo
    },
    {
      id: 6,
      title: 'Suspicious Crypto Airdrop Link (Disabled)',
      original_url: 'https://free-crypto-airdrop-scam.biz/claim',
      short_code: 'free-eth',
      user_id: 1,
      campaign_id: null,
      workspace_id: 1,
      status: 'disabled_abuse',
      abuse_reason: 'Phishing attempt detected by abuse monitor (matches blocklist)',
      click_limit: null,
      click_count: 12,
      expires_at: null,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: null,
      tablet_url: null,
      tags: ['unverified', 'flagged'],
      utm_source: 'telegram',
      utm_medium: 'spam',
      utm_campaign: 'airdrop',
      created_at: createdAt14DaysAgo
    },
    {
      id: 7,
      title: 'Keynote Live Stream & Q&A Hub',
      original_url: 'https://youtube.com/live/example-keynote',
      short_code: 'keynote',
      user_id: 1,
      campaign_id: 2,
      workspace_id: 2,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 115,
      expires_at: futureDate,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: null,
      tablet_url: null,
      tags: ['summit', 'live', 'video'],
      utm_source: 'slides',
      utm_medium: 'live',
      utm_campaign: 'keynote',
      created_at: createdAt14DaysAgo
    },
    {
      id: 8,
      title: 'Developer API & Integration Guide',
      original_url: 'https://docs.github.com/en/rest',
      short_code: 'dev-docs',
      user_id: 1,
      campaign_id: 1,
      workspace_id: 1,
      status: 'active',
      abuse_reason: null,
      click_limit: null,
      click_count: 68,
      expires_at: null,
      password_hash: null,
      is_password_protected: 0,
      mobile_url: null,
      tablet_url: null,
      tags: ['developers', 'api', 'docs'],
      utm_source: 'github',
      utm_medium: 'readme',
      utm_campaign: 'docs',
      created_at: createdAt14DaysAgo
    }
  ];

  const sampleCountries = [
    { country: 'United States', code: 'US', cities: ['San Francisco', 'New York', 'Austin', 'Seattle'] },
    { country: 'United Kingdom', code: 'GB', cities: ['London', 'Manchester', 'Edinburgh'] },
    { country: 'Germany', code: 'DE', cities: ['Berlin', 'Munich', 'Frankfurt'] },
    { country: 'India', code: 'IN', cities: ['Bengaluru', 'Mumbai', 'New Delhi'] },
    { country: 'Canada', code: 'CA', cities: ['Toronto', 'Vancouver', 'Montreal'] },
    { country: 'France', code: 'FR', cities: ['Paris', 'Lyon'] },
    { country: 'Japan', code: 'JP', cities: ['Tokyo', 'Osaka'] },
    { country: 'Australia', code: 'AU', cities: ['Sydney', 'Melbourne'] }
  ];

  const sampleReferrers = [
    { ref: 'https://t.co/xyz123', type: 'Social' },
    { ref: 'https://www.google.com/search', type: 'Search' },
    { ref: 'https://www.linkedin.com/feed', type: 'Social' },
    { ref: 'https://news.ycombinator.com', type: 'Social' },
    { ref: 'https://mail.google.com', type: 'Email' },
    { ref: 'https://reddit.com/r/technology', type: 'Social' },
    { ref: 'direct', type: 'Direct' }
  ];

  const sampleDevices = [
    { type: 'desktop', browser: 'Chrome', os: 'Windows' },
    { type: 'desktop', browser: 'Chrome', os: 'macOS' },
    { type: 'desktop', browser: 'Firefox', os: 'Linux' },
    { type: 'desktop', browser: 'Edge', os: 'Windows' },
    { type: 'desktop', browser: 'Safari', os: 'macOS' },
    { type: 'mobile', browser: 'Safari', os: 'iOS' },
    { type: 'mobile', browser: 'Chrome', os: 'Android' },
    { type: 'tablet', browser: 'Safari', os: 'iOS' }
  ];

  const linkClickTargets = [
    { id: 1, code: 'summer26', count: 142, dest: 'https://github.com/features/actions' },
    { id: 2, code: 'get-app', count: 89, dest: 'https://apps.apple.com/app/id123456789' },
    { id: 3, code: 'vip-deck', count: 34, dest: 'https://docs.google.com/presentation/d/demo-pitch-deck' },
    { id: 4, code: 'early50', count: 50, dest: 'https://linkpulse.io/beta-register' },
    { id: 5, code: 'summit-early', count: 76, dest: 'https://techsummit2026.io/tickets/early-bird' },
    { id: 7, code: 'keynote', count: 115, dest: 'https://youtube.com/live/example-keynote' },
    { id: 8, code: 'dev-docs', count: 68, dest: 'https://docs.github.com/en/rest' }
  ];

  const clicks = [];
  let clickId = 1;
  linkClickTargets.forEach(target => {
    for (let i = 0; i < target.count; i++) {
      const daysAgo = Math.random() * 14;
      const clickDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const geo = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
      const city = geo.cities[Math.floor(Math.random() * geo.cities.length)];
      const refObj = sampleReferrers[Math.floor(Math.random() * sampleReferrers.length)];
      const dev = sampleDevices[Math.floor(Math.random() * sampleDevices.length)];
      const isQr = Math.random() < 0.22 ? 1 : 0;
      const isBot = Math.random() < 0.04 ? 1 : 0;

      clicks.push({
        id: clickId++,
        link_id: target.id,
        short_code: target.code,
        timestamp: clickDate,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: `Mozilla/5.0 (${dev.os}) ${dev.browser}`,
        device_type: isBot ? 'bot' : dev.type,
        browser: isBot ? 'Googlebot' : dev.browser,
        os: dev.os,
        referrer: refObj.ref,
        referrer_type: refObj.type,
        country: geo.country,
        country_code: geo.code,
        city: city,
        is_bot: isBot,
        is_qr: isQr,
        destination_used: target.dest
      });
    }
  });

  const bioPage = {
    slug: 'alex-growth',
    title: 'Alex Rivera | Growth & Product Lead',
    bio: 'Curating high-impact marketing tools, open-source projects, and keynote recordings.',
    avatar_url: '',
    theme: 'luxury-dark',
    links: [
      { title: '🚀 Summer 2026 Product Showcase', url: `${window.location.origin}/summer26`, subtitle: 'Explore the newest features' },
      { title: '📱 Download LinkPulse Mobile App', url: `${window.location.origin}/get-app`, subtitle: 'iOS & Android targeting' },
      { title: '🎤 Tech Summit Keynote Replay', url: `${window.location.origin}/keynote`, subtitle: 'Watch the full 45-min talk' },
      { title: '⚡ Developer API & SDK Documentation', url: `${window.location.origin}/dev-docs`, subtitle: 'Start building today' }
    ],
    socials: {
      twitter: 'https://twitter.com',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com'
    },
    user_id: 1
  };

  const settings = {
    platformName: 'LinkPulse Static',
    defaultDomain: 'localhost:5173',
    defaultRateLimitPerMin: 60,
    autoBotFilter: true,
    strictDomainCheck: true,
    enableQrAutoTag: true,
    enableSafeBrowsing: true,
    engine: 'In-Browser LocalStorage'
  };

  return {
    users,
    workspaces,
    campaigns,
    blocklist,
    links,
    clicks,
    bioPage,
    settings
  };
}

// ----------------------------------------------------------------------------
// LOCAL STORAGE ADAPTER
// ----------------------------------------------------------------------------

function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveKey(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// Ensure state is initialized
function initStorage() {
  const initialized = localStorage.getItem(STORAGE_KEY_PREFIX + 'initialized');
  if (!initialized) {
    const seed = getInitialSeedData();
    Object.keys(seed).forEach(k => saveKey(k, seed[k]));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized', 'true');
  }
}

initStorage();

// ----------------------------------------------------------------------------
// STATIC DATA STORE API
// ----------------------------------------------------------------------------

export const staticStore = {
  // Reset all to seed data
  resetAll() {
    const seed = getInitialSeedData();
    Object.keys(seed).forEach(k => saveKey(k, seed[k]));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized', 'true');
    return seed;
  },

  // LINKS
  getLinks({ role = 'user', userId = 1, campaignId, workspaceId, search } = {}) {
    let list = loadKey('links', []);
    const campaigns = loadKey('campaigns', []);
    const workspaces = loadKey('workspaces', []);
    const campMap = new Map(campaigns.map(c => [c.id, c.name]));
    const workMap = new Map(workspaces.map(w => [w.id, w.name]));

    if (role !== 'admin' && userId) {
      list = list.filter(l => l.user_id === Number(userId));
    }
    if (campaignId) {
      list = list.filter(l => l.campaign_id === Number(campaignId));
    }
    if (workspaceId && workspaceId !== 'all') {
      list = list.filter(l => l.workspace_id === Number(workspaceId));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l => 
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.short_code && l.short_code.toLowerCase().includes(q)) ||
        (l.original_url && l.original_url.toLowerCase().includes(q)) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    const populated = list.map(l => ({
      ...l,
      campaign_name: l.campaign_id ? (campMap.get(l.campaign_id) || 'Unassigned') : 'Unassigned',
      workspace_name: l.workspace_id ? (workMap.get(l.workspace_id) || 'Default') : 'Default'
    }));

    return { links: populated };
  },

  getLinkById(id) {
    const links = loadKey('links', []);
    const campaigns = loadKey('campaigns', []);
    const workspaces = loadKey('workspaces', []);
    const clicks = loadKey('clicks', []);

    const link = links.find(l => l.id === Number(id));
    if (!link) return { error: 'Link not found' };

    const campMap = new Map(campaigns.map(c => [c.id, c.name]));
    const workMap = new Map(workspaces.map(w => [w.id, w.name]));
    const linkClicks = clicks.filter(c => c.link_id === Number(id)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      link: {
        ...link,
        campaign_name: link.campaign_id ? (campMap.get(link.campaign_id) || 'Unassigned') : 'Unassigned',
        workspace_name: link.workspace_id ? (workMap.get(link.workspace_id) || 'Default') : 'Default'
      },
      clicks: linkClicks
    };
  },

  async validateLink({ original_url, short_code }) {
    if (!original_url || !original_url.trim()) {
      return { valid: false, error: 'Target URL is required.' };
    }

    let formattedUrl = original_url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const parsed = new URL(formattedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS URLs are permitted.' };
      }

      // Check blocklist
      const blocklist = loadKey('blocklist', []);
      const hostname = parsed.hostname.toLowerCase();
      const isBlocked = blocklist.some(b => hostname === b.domain.toLowerCase() || hostname.endsWith('.' + b.domain.toLowerCase()));
      if (isBlocked) {
        return { valid: false, error: `The target domain "${hostname}" is blocked for security and safety reasons.` };
      }
    } catch {
      return { valid: false, error: 'Invalid URL format. Please provide a valid web address.' };
    }

    if (short_code && short_code.trim()) {
      const alias = short_code.trim().toLowerCase();
      if (RESERVED_SLUGS.includes(alias)) {
        return { valid: false, error: `The alias "${alias}" is a reserved system keyword.` };
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
        return { valid: false, error: 'Alias can only contain letters, numbers, hyphens, and underscores.' };
      }

      const links = loadKey('links', []);
      const exists = links.some(l => l.short_code.toLowerCase() === alias);
      if (exists) {
        return { valid: false, error: `The short code "/${alias}" is already taken.` };
      }
    }

    return { valid: true };
  },

  async createLink({
    title,
    original_url,
    short_code,
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
  }) {
    const val = await this.validateLink({ original_url, short_code });
    if (!val.valid) throw new Error(val.error);

    const links = loadKey('links', []);
    let finalCode = short_code && short_code.trim() ? short_code.trim().toLowerCase() : Math.random().toString(36).substring(2, 8);

    // Collision protection
    while (links.some(l => l.short_code === finalCode)) {
      finalCode = Math.random().toString(36).substring(2, 8);
    }

    let passwordHash = null;
    let isProtected = 0;
    if (password && password.trim()) {
      passwordHash = await sha256(password.trim());
      isProtected = 1;
    }

    const nextId = links.length > 0 ? Math.max(...links.map(l => l.id)) + 1 : 1;
    const newLink = {
      id: nextId,
      title: title && title.trim() ? title.trim() : `${new URL(original_url.startsWith('http') ? original_url : 'https://' + original_url).hostname} Link`,
      original_url: original_url.startsWith('http') ? original_url.trim() : 'https://' + original_url.trim(),
      short_code: finalCode,
      user_id: Number(user_id),
      campaign_id: campaign_id ? Number(campaign_id) : null,
      workspace_id: workspace_id ? Number(workspace_id) : 1,
      status: 'active',
      abuse_reason: null,
      click_limit: click_limit ? Number(click_limit) : null,
      click_count: 0,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      password_hash: passwordHash,
      is_password_protected: isProtected,
      mobile_url: mobile_url ? mobile_url.trim() : null,
      tablet_url: tablet_url ? tablet_url.trim() : null,
      tags: Array.isArray(tags) ? tags : [],
      utm_source: utm_source ? utm_source.trim() : null,
      utm_medium: utm_medium ? utm_medium.trim() : null,
      utm_campaign: utm_campaign ? utm_campaign.trim() : null,
      created_at: new Date().toISOString()
    };

    links.unshift(newLink);
    saveKey('links', links);
    return { success: true, link: newLink };
  },

  async updateLink(id, updateData) {
    const links = loadKey('links', []);
    const idx = links.findIndex(l => l.id === Number(id));
    if (idx === -1) throw new Error('Link not found');

    const link = links[idx];
    if (updateData.title !== undefined) link.title = updateData.title.trim();
    if (updateData.original_url !== undefined) {
      link.original_url = updateData.original_url.startsWith('http') ? updateData.original_url.trim() : 'https://' + updateData.original_url.trim();
    }
    if (updateData.mobile_url !== undefined) link.mobile_url = updateData.mobile_url ? updateData.mobile_url.trim() : null;
    if (updateData.tablet_url !== undefined) link.tablet_url = updateData.tablet_url ? updateData.tablet_url.trim() : null;
    if (updateData.click_limit !== undefined) link.click_limit = updateData.click_limit ? Number(updateData.click_limit) : null;
    if (updateData.expires_at !== undefined) link.expires_at = updateData.expires_at ? new Date(updateData.expires_at).toISOString() : null;
    if (updateData.campaign_id !== undefined) link.campaign_id = updateData.campaign_id ? Number(updateData.campaign_id) : null;
    if (updateData.tags !== undefined) link.tags = Array.isArray(updateData.tags) ? updateData.tags : link.tags;

    links[idx] = link;
    saveKey('links', links);
    return { success: true, link };
  },

  toggleLinkStatus(id) {
    const links = loadKey('links', []);
    const idx = links.findIndex(l => l.id === Number(id));
    if (idx === -1) throw new Error('Link not found');

    const current = links[idx].status;
    links[idx].status = current === 'active' ? 'paused' : 'active';
    saveKey('links', links);
    return { success: true, link: links[idx] };
  },

  deleteLink(id) {
    let links = loadKey('links', []);
    links = links.filter(l => l.id !== Number(id));
    saveKey('links', links);
    return { success: true };
  },

  // CAMPAIGNS
  getCampaigns({ role = 'user', userId = 1 } = {}) {
    let campaigns = loadKey('campaigns', []);
    const links = loadKey('links', []);

    if (role !== 'admin' && userId) {
      campaigns = campaigns.filter(c => c.user_id === Number(userId));
    }

    const campaignList = campaigns.map(camp => {
      const campLinks = links.filter(l => l.campaign_id === camp.id);
      const totalClicks = campLinks.reduce((sum, l) => sum + (l.click_count || 0), 0);
      const topLink = campLinks.sort((a, b) => (b.click_count || 0) - (a.click_count || 0))[0] || null;

      return {
        ...camp,
        link_count: campLinks.length,
        total_clicks: totalClicks,
        topLink: topLink ? {
          title: topLink.title,
          short_code: topLink.short_code,
          click_count: topLink.click_count
        } : null
      };
    });

    return { campaigns: campaignList };
  },

  createCampaign({ name, description, color = '#6366f1', user_id = 1 }) {
    if (!name || !name.trim()) throw new Error('Campaign name is required');
    const campaigns = loadKey('campaigns', []);
    const nextId = campaigns.length > 0 ? Math.max(...campaigns.map(c => c.id)) + 1 : 1;
    const newCamp = {
      id: nextId,
      name: name.trim(),
      description: description ? description.trim() : '',
      color,
      user_id: Number(user_id),
      created_at: new Date().toISOString()
    };
    campaigns.unshift(newCamp);
    saveKey('campaigns', campaigns);
    return { success: true, campaign: newCamp };
  },

  deleteCampaign(id) {
    let campaigns = loadKey('campaigns', []);
    campaigns = campaigns.filter(c => c.id !== Number(id));
    saveKey('campaigns', campaigns);

    // Unassign links
    const links = loadKey('links', []);
    links.forEach(l => {
      if (l.campaign_id === Number(id)) l.campaign_id = null;
    });
    saveKey('links', links);

    return { success: true };
  },

  // WORKSPACES
  getWorkspaces() {
    return { workspaces: loadKey('workspaces', []) };
  },

  createWorkspace(name) {
    if (!name || !name.trim()) throw new Error('Workspace name is required');
    const workspaces = loadKey('workspaces', []);
    const nextId = workspaces.length > 0 ? Math.max(...workspaces.map(w => w.id)) + 1 : 1;
    const newWork = {
      id: nextId,
      name: name.trim(),
      user_id: 1,
      created_at: new Date().toISOString()
    };
    workspaces.push(newWork);
    saveKey('workspaces', workspaces);
    return { success: true, workspace: newWork };
  },

  // ANALYTICS & TELEMETRY
  getAnalytics({ period = '30d', campaignId, workspaceId } = {}) {
    let clicks = loadKey('clicks', []);
    let links = loadKey('links', []);

    if (campaignId) {
      const campLinks = links.filter(l => l.campaign_id === Number(campaignId)).map(l => l.id);
      clicks = clicks.filter(c => campLinks.includes(c.link_id));
      links = links.filter(l => l.campaign_id === Number(campaignId));
    }
    if (workspaceId && workspaceId !== 'all') {
      const workLinks = links.filter(l => l.workspace_id === Number(workspaceId)).map(l => l.id);
      clicks = clicks.filter(c => workLinks.includes(c.link_id));
      links = links.filter(l => l.workspace_id === Number(workspaceId));
    }

    const now = new Date();
    let cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === '24h') cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (period === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'all') cutoff = new Date(0);

    const filteredClicks = clicks.filter(c => new Date(c.timestamp) >= cutoff);

    // KPIs
    const totalVisits = filteredClicks.length;
    const humanVisits = filteredClicks.filter(c => !c.is_bot).length;
    const botVisits = filteredClicks.filter(c => c.is_bot).length;
    const uniqueIps = new Set(filteredClicks.map(c => c.ip)).size;
    const qrScans = filteredClicks.filter(c => c.is_qr).length;
    const activeLinksCount = links.filter(l => l.status === 'active').length;

    // Time-Series (daily grouping)
    const timeMap = new Map();
    filteredClicks.forEach(c => {
      const d = c.timestamp.slice(0, 10);
      timeMap.set(d, (timeMap.get(d) || 0) + 1);
    });
    const timeSeries = Array.from(timeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, clicksCount]) => ({ date, clicks: clicksCount }));

    // Devices
    const devMap = new Map();
    filteredClicks.forEach(c => {
      const t = c.device_type || 'desktop';
      devMap.set(t, (devMap.get(t) || 0) + 1);
    });
    const devices = Array.from(devMap.entries()).map(([type, count]) => ({ device_type: type, type, count }));

    // Referrers
    const refMap = new Map();
    filteredClicks.forEach(c => {
      const r = c.referrer_type || 'Direct';
      refMap.set(r, (refMap.get(r) || 0) + 1);
    });
    const referrers = Array.from(refMap.entries()).map(([source, count]) => ({ referrer: source, referrer_type: source, source, count }));

    // Countries
    const geoMap = new Map();
    filteredClicks.forEach(c => {
      const country = c.country || 'United States';
      const code = c.country_code || 'US';
      if (!geoMap.has(country)) geoMap.set(country, { country, country_code: code, count: 0 });
      geoMap.get(country).count++;
    });
    const countries = Array.from(geoMap.values()).sort((a, b) => b.count - a.count);

    // Top Links
    const linkMap = new Map();
    filteredClicks.forEach(c => {
      linkMap.set(c.link_id, (linkMap.get(c.link_id) || 0) + 1);
    });
    const topLinks = Array.from(linkMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, clicksCount]) => {
        const found = links.find(l => l.id === id);
        return {
          id,
          title: found?.title || 'Unknown Link',
          short_code: found?.short_code || String(id),
          campaign_name: found?.campaign_name,
          click_count: clicksCount,
          clicks: clicksCount
        };
      });

    // Recent Clicks
    const recentClicks = filteredClicks
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return {
      kpis: {
        totalVisits,
        humanVisits,
        botVisits,
        uniqueIps,
        qrScans,
        activeLinksCount
      },
      timeSeries,
      devices,
      referrers,
      countries,
      topLinks,
      recentClicks
    };
  },

  simulateClick({ short_code, code, device = 'desktop', referrer = 'Direct', country = 'United States', isQr = false }) {
    const targetCode = (code || short_code || '').toLowerCase();
    const links = loadKey('links', []);
    const link = links.find(l => l.short_code.toLowerCase() === targetCode) || links[0];
    if (!link) throw new Error('No links available to simulate');

    const clicks = loadKey('clicks', []);
    const nextId = clicks.length > 0 ? Math.max(...clicks.map(c => c.id)) + 1 : 1;

    const countryCodeMap = {
      'United States': 'US',
      'Germany': 'DE',
      'India': 'IN',
      'United Kingdom': 'GB',
      'Japan': 'JP',
      'France': 'FR',
      'Canada': 'CA'
    };
    const cityMap = {
      'United States': 'San Francisco',
      'Germany': 'Berlin',
      'India': 'Bengaluru',
      'United Kingdom': 'London',
      'Japan': 'Tokyo',
      'France': 'Paris',
      'Canada': 'Toronto'
    };

    let destination = link.original_url;
    if (device === 'mobile' && link.mobile_url) destination = link.mobile_url;
    else if (device === 'tablet' && link.tablet_url) destination = link.tablet_url;

    const newClick = {
      id: nextId,
      link_id: link.id,
      short_code: link.short_code,
      timestamp: new Date().toISOString(),
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: `Simulated Browser (${device})`,
      device_type: device,
      browser: 'Chrome Simulation',
      os: 'SimOS',
      referrer: referrer === 'Direct' ? 'direct' : (referrer.startsWith('http') ? referrer : `https://${referrer.toLowerCase()}.com`),
      referrer_type: referrer.includes('twitter') ? 'Twitter' : (referrer.includes('linkedin') ? 'LinkedIn' : (referrer.includes('direct') ? 'Direct' : 'Social')),
      country,
      country_code: countryCodeMap[country] || 'US',
      city: cityMap[country] || 'San Francisco',
      is_bot: 0,
      is_qr: isQr ? 1 : 0,
      destination_used: destination
    };

    clicks.unshift(newClick);
    saveKey('clicks', clicks);

    // Increment click_count on link
    link.click_count = (link.click_count || 0) + 1;
    saveKey('links', links);

    return { 
      success: true, 
      message: `Simulated visit routed to ${destination}`,
      click: newClick 
    };
  },

  getAlerts() {
    const links = loadKey('links', []);
    const now = new Date();
    const alerts = [];

    links.forEach(link => {
      if (link.status === 'disabled_abuse') {
        alerts.push({
          type: 'danger',
          title: `Suspended Link: /${link.short_code}`,
          message: link.abuse_reason || 'Flagged by safety blocklist monitor',
          link_id: link.id
        });
      }
      if (link.click_limit && link.click_count >= link.click_limit * 0.9) {
        alerts.push({
          type: 'warning',
          title: `Click Cap Warning: /${link.short_code}`,
          message: `Reached ${link.click_count} of ${link.click_limit} allocated visits (${Math.round(link.click_count / link.click_limit * 100)}%)`,
          link_id: link.id
        });
      }
      if (link.expires_at) {
        const exp = new Date(link.expires_at);
        const hoursLeft = (exp - now) / (1000 * 60 * 60);
        if (hoursLeft <= 72 && hoursLeft > 0) {
          alerts.push({
            type: 'info',
            title: `Expiring Soon: /${link.short_code}`,
            message: `Link expires in ${Math.round(hoursLeft)} hours`,
            link_id: link.id
          });
        }
      }
    });

    return { alerts };
  },

  // QR CODE GENERATOR (IN-BROWSER)
  async generateQr({ code, color = '#000000', background = '#ffffff', ecc = 'M', size = 360, format = 'dataurl' }) {
    const fullUrl = `${window.location.origin}/${code}?qr=1`;
    const options = {
      errorCorrectionLevel: ecc,
      margin: 2,
      width: Number(size),
      color: {
        dark: color,
        light: background
      }
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(fullUrl, { ...options, type: 'svg' });
      return { svgString };
    }

    const qrDataUrl = await QRCode.toDataURL(fullUrl, options);
    return { qrDataUrl };
  },

  // BULK IMPORT
  async previewBulkImport(csvText) {
    if (!csvText || !csvText.trim()) throw new Error('CSV content cannot be empty.');
    const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) throw new Error('No rows found in CSV.');

    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('url') || firstLine.includes('alias')) startIndex = 1;

    const blocklist = loadKey('blocklist', []);
    const existingLinks = loadKey('links', []);
    const seenAliases = new Set();
    const rows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const rawUrl = parts[0] || '';
      const alias = (parts[1] || '').toLowerCase();
      const title = parts[2] || '';
      const campaignName = parts[3] || '';
      const tags = parts[4] ? parts[4].split(';').map(t => t.trim()) : [];

      const issues = [];
      if (!rawUrl) issues.push('Missing URL');

      let parsedUrl = null;
      try {
        const full = rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;
        parsedUrl = new URL(full);
        const host = parsedUrl.hostname.toLowerCase();
        if (blocklist.some(b => host === b.domain.toLowerCase() || host.endsWith('.' + b.domain.toLowerCase()))) {
          issues.push(`Domain "${host}" is blocklisted`);
        }
      } catch {
        issues.push('Invalid URL format');
      }

      if (alias) {
        if (RESERVED_SLUGS.includes(alias)) issues.push(`Reserved alias "/${alias}"`);
        if (seenAliases.has(alias)) issues.push(`Duplicate alias "/${alias}" in file`);
        if (existingLinks.some(l => l.short_code.toLowerCase() === alias)) issues.push(`Alias "/${alias}" already exists`);
        seenAliases.add(alias);
      }

      const isValid = issues.length === 0;
      if (isValid) validCount++; else invalidCount++;

      rows.push({
        rowIndex: i + 1,
        url: rawUrl,
        alias,
        title: title || (parsedUrl ? `${parsedUrl.hostname} Link` : 'Short Link'),
        campaignName,
        tags,
        isValid,
        issues
      });
    }

    return {
      validCount,
      invalidCount,
      totalRows: rows.length,
      rows
    };
  },

  async executeBulkImport(validRows) {
    let links = loadKey('links', []);
    const campaigns = loadKey('campaigns', []);
    let count = 0;

    for (const r of validRows) {
      if (!r.isValid) continue;
      let campId = null;
      if (r.campaignName) {
        const found = campaigns.find(c => c.name.toLowerCase() === r.campaignName.toLowerCase());
        if (found) campId = found.id;
      }

      const nextId = links.length > 0 ? Math.max(...links.map(l => l.id)) + 1 : 1;
      let finalCode = r.alias || Math.random().toString(36).substring(2, 8);
      while (links.some(l => l.short_code === finalCode)) {
        finalCode = Math.random().toString(36).substring(2, 8);
      }

      const newLink = {
        id: nextId,
        title: r.title,
        original_url: r.url.startsWith('http') ? r.url : 'https://' + r.url,
        short_code: finalCode,
        user_id: 1,
        campaign_id: campId,
        workspace_id: 1,
        status: 'active',
        abuse_reason: null,
        click_limit: null,
        click_count: 0,
        expires_at: null,
        password_hash: null,
        is_password_protected: 0,
        mobile_url: null,
        tablet_url: null,
        tags: r.tags || [],
        utm_source: 'bulk-import',
        utm_medium: 'spreadsheet',
        utm_campaign: r.campaignName || null,
        created_at: new Date().toISOString()
      };

      links.unshift(newLink);
      count++;
    }

    saveKey('links', links);
    return { success: true, importedCount: count };
  },

  // BIO PAGE
  getBio() {
    return { bio: loadKey('bioPage', getInitialSeedData().bioPage) };
  },

  saveBio(data) {
    const current = loadKey('bioPage', getInitialSeedData().bioPage);
    const updated = {
      ...current,
      ...data,
      user_id: 1
    };
    saveKey('bioPage', updated);
    return { success: true, bio: updated };
  },

  // ADMIN ABUSE
  getAdminOverview() {
    const links = loadKey('links', []);
    const clicks = loadKey('clicks', []);
    const users = loadKey('users', []);
    const blocklist = loadKey('blocklist', []);

    const metrics = {
      totalLinks: links.length,
      activeLinks: links.filter(l => l.status === 'active').length,
      disabledAbuseLinks: links.filter(l => l.status === 'disabled_abuse').length,
      totalClicks: clicks.length,
      botClicks: clicks.filter(c => c.is_bot).length,
      totalUsers: users.length,
      blockedDomains: blocklist.length,
      blocklistCount: blocklist.length
    };

    const flaggedLinks = links.filter(l => l.status === 'disabled_abuse');

    return {
      metrics,
      flaggedLinks,
      ...metrics
    };
  },

  getAdminBlocklist() {
    return { blocklist: loadKey('blocklist', []) };
  },

  addAdminBlocklist({ domain, reason }) {
    if (!domain || !domain.trim()) throw new Error('Domain is required');
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const blocklist = loadKey('blocklist', []);
    if (blocklist.some(b => b.domain === clean)) throw new Error('Domain is already blocklisted');

    const nextId = blocklist.length > 0 ? Math.max(...blocklist.map(b => b.id)) + 1 : 1;
    const entry = {
      id: nextId,
      domain: clean,
      reason: reason ? reason.trim() : 'Flagged as malicious by administrator',
      added_by: 2,
      created_at: new Date().toISOString()
    };
    blocklist.unshift(entry);
    saveKey('blocklist', blocklist);

    // Auto-quarantine matching links
    const links = loadKey('links', []);
    let quarantinedCount = 0;
    links.forEach(l => {
      try {
        const host = new URL(l.original_url).hostname.toLowerCase();
        if (host === clean || host.endsWith('.' + clean)) {
          l.status = 'disabled_abuse';
          l.abuse_reason = `Auto-quarantined: Destination domain "${clean}" added to safety blocklist`;
          quarantinedCount++;
        }
      } catch {
        // ignore
      }
    });
    saveKey('links', links);

    return { success: true, entry, quarantinedCount };
  },

  removeAdminBlocklist(id) {
    let blocklist = loadKey('blocklist', []);
    blocklist = blocklist.filter(b => b.id !== Number(id));
    saveKey('blocklist', blocklist);
    return { success: true };
  },

  disableLinkAbuse(linkId, reason) {
    const links = loadKey('links', []);
    const link = links.find(l => l.id === Number(linkId));
    if (!link) throw new Error('Link not found');

    link.status = 'disabled_abuse';
    link.abuse_reason = reason ? reason.trim() : 'Administrative safety quarantine';
    saveKey('links', links);
    return { success: true, link };
  },

  restoreLink(linkId) {
    const links = loadKey('links', []);
    const link = links.find(l => l.id === Number(linkId));
    if (!link) throw new Error('Link not found');

    link.status = 'active';
    link.abuse_reason = null;
    saveKey('links', links);
    return { success: true, link };
  },

  getAdminUsers() {
    const users = loadKey('users', []);
    const links = loadKey('links', []);
    const clicks = loadKey('clicks', []);

    const enriched = users.map(u => {
      const userLinks = links.filter(l => l.user_id === u.id);
      const userLinkIds = userLinks.map(l => l.id);
      const userClicks = clicks.filter(c => userLinkIds.includes(c.link_id));
      return {
        ...u,
        link_count: userLinks.length,
        total_clicks: userClicks.length,
        created_at: u.created_at || '2026-01-01T00:00:00.000Z'
      };
    });

    return { users: enriched };
  },

  // SETTINGS
  getSettings() {
    return { settings: loadKey('settings', getInitialSeedData().settings) };
  },

  saveSettings(payload) {
    const current = loadKey('settings', getInitialSeedData().settings);
    const updated = { ...current, ...payload };
    saveKey('settings', updated);
    return { success: true, settings: updated };
  },

  // REDIRECTION SIMULATOR ENGINE (CLIENT-SIDE)
  async evaluateRedirect(code, { device = 'desktop', password = '' } = {}) {
    const links = loadKey('links', []);
    const blocklist = loadKey('blocklist', []);
    const link = links.find(l => l.short_code.toLowerCase() === code.trim().toLowerCase());

    if (!link) {
      return { status: 404, type: 'not_found', message: `Link "/${code}" does not exist in the database.` };
    }

    if (link.status === 'disabled_abuse') {
      return { status: 410, type: 'suspended', message: link.abuse_reason || 'This link has been suspended due to platform safety violations.' };
    }

    // Check destination blocklist
    try {
      const host = new URL(link.original_url).hostname.toLowerCase();
      if (blocklist.some(b => host === b.domain || host.endsWith('.' + b.domain))) {
        return { status: 410, type: 'blocked_domain', message: `Destination domain "${host}" is prohibited by the safety blocklist.` };
      }
    } catch {
      // ignore
    }

    if (link.status === 'paused') {
      return { status: 403, type: 'paused', message: 'This link has been temporarily paused by its creator.' };
    }

    const now = new Date();
    if (link.expires_at && new Date(link.expires_at) < now) {
      return { status: 410, type: 'expired', message: `This campaign link expired on ${new Date(link.expires_at).toLocaleString()}.` };
    }

    if (link.click_limit && link.click_count >= link.click_limit) {
      return { status: 410, type: 'limit_reached', message: `This promotion reached its maximum capacity of ${link.click_limit} visits.` };
    }

    if (link.is_password_protected && link.password_hash) {
      if (!password) {
        return { status: 401, type: 'password_required', message: 'This link is password protected.' };
      }
      const enteredHash = await sha256(password);
      if (enteredHash !== link.password_hash) {
        return { status: 401, type: 'password_invalid', message: 'Invalid password. Please enter the correct key.' };
      }
    }

    // Device routing
    let destination = link.original_url;
    if (device === 'mobile' && link.mobile_url) {
      destination = link.mobile_url;
    } else if (device === 'tablet' && link.tablet_url) {
      destination = link.tablet_url;
    }

    // Forward UTM parameters
    try {
      const destUrl = new URL(destination);
      if (link.utm_source && !destUrl.searchParams.has('utm_source')) destUrl.searchParams.set('utm_source', link.utm_source);
      if (link.utm_medium && !destUrl.searchParams.has('utm_medium')) destUrl.searchParams.set('utm_medium', link.utm_medium);
      if (link.utm_campaign && !destUrl.searchParams.has('utm_campaign')) destUrl.searchParams.set('utm_campaign', link.utm_campaign);
      destination = destUrl.toString();
    } catch {
      // ignore
    }

    return {
      status: 302,
      type: 'redirect',
      destination,
      link
    };
  }
};

export default staticStore;

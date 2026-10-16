/**
 * ============================================================================
 * LINKPULSE: MONGODB DATABASE CONFIGURATION & SCHEMAS
 * ============================================================================
 * 
 * Technology: Mongoose ODM over MongoDB (mongodb://localhost:27017/linkpulse)
 * 
 * Data Models:
 *   - User: Authenticated team members & platform administrators.
 *   - Workspace: Workspaces allowing teams to group and isolate links.
 *   - Campaign: Multi-channel marketing campaigns with custom color branding.
 *   - DomainBlocklist: Real-time safety list of malicious domains.
 *   - Link: Core short link document with rules (caps, expiry, password, device targets).
 *   - Click: Asynchronous non-blocking telemetry records for analytics.
 *   - BioPage: Link-in-Bio mobile-responsive landing pages (/bio/:slug).
 *   - Setting: System-wide platform settings and governance policies.
 * ============================================================================
 */

const mongoose = require('mongoose');

// Default to local MongoDB instance
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkpulse';

// ============================================================================
// 1. SCHEMAS & DATA STRUCTURES
// ============================================================================

/**
 * User Schema: Multi-persona user accounts (Visitor, User, Admin)
 */
const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' }, // 'user' (creator) | 'admin' (governance)
  created_at: { type: Date, default: Date.now }
});

/**
 * Workspace Schema: Logical organization containers for team links
 */
const WorkspaceSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  user_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

/**
 * Campaign Schema: Marketing initiative tracking across social, email, or offline channels
 */
const CampaignSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366f1' }, // Hex color badge for UI cards
  user_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

/**
 * DomainBlocklist Schema: Security protection against phishing, malware, or spam domains
 */
const DomainBlocklistSchema = new mongoose.Schema({
  id: { type: Number },
  domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  reason: { type: String, default: 'Safety policy violation' },
  added_by: { type: Number, default: 2 }, // Admin user ID
  created_at: { type: Date, default: Date.now }
});

/**
 * Link Schema: Short link documents with full rule configuration
 */
const LinkSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  original_url: { type: String, required: true },
  short_code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  user_id: { type: Number, required: true, default: 1 },
  campaign_id: { type: Number, default: null },
  workspace_id: { type: Number, default: 1 },
  status: { type: String, default: 'active' }, // 'active', 'inactive', 'disabled_abuse'
  abuse_reason: { type: String, default: null },
  click_limit: { type: Number, default: null }, // Visit cap exhaustion limit
  click_count: { type: Number, default: 0 }, // Fast cached counter incremented by async logger
  expires_at: { type: Date, default: null }, // Access deprecation deadline
  password_hash: { type: String, default: null }, // SHA-256 cryptographic hash
  is_password_protected: { type: Number, default: 0 },
  mobile_url: { type: String, default: null }, // iOS/Android redirect override
  tablet_url: { type: String, default: null }, // iPad/Tablet redirect override
  tags: { type: [String], default: [] },
  utm_source: { type: String, default: null },
  utm_medium: { type: String, default: null },
  utm_campaign: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Strategic indexes for high-speed redirection lookups & dashboard queries
LinkSchema.index({ user_id: 1 });
LinkSchema.index({ campaign_id: 1 });
LinkSchema.index({ status: 1 });

/**
 * Click Schema: Asynchronous click telemetry records
 */
const ClickSchema = new mongoose.Schema({
  link_id: { type: Number, required: true },
  short_code: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String, default: '127.0.0.1' },
  user_agent: { type: String, default: 'Unknown' },
  device_type: { type: String, default: 'desktop' }, // 'desktop', 'mobile', 'tablet', 'bot'
  browser: { type: String, default: 'Other' },
  os: { type: String, default: 'Other' },
  referrer: { type: String, default: 'direct' },
  referrer_type: { type: String, default: 'Direct' }, // 'Social', 'Search', 'Email', 'Direct', 'Other'
  country: { type: String, default: 'United States' },
  country_code: { type: String, default: 'US' },
  city: { type: String, default: 'New York' },
  is_bot: { type: Number, default: 0 }, // Filter flag for crawler traffic
  is_qr: { type: Number, default: 0 },  // Scan flag from ?qr=1 barcodes
  destination_used: { type: String, default: '' }
});

// Compound indexes for time-series timeline aggregation & bot filtering
ClickSchema.index({ link_id: 1, timestamp: -1 });
ClickSchema.index({ is_bot: 1, timestamp: -1 });

/**
 * BioPage Schema: Public profile landing pages (/bio/:slug)
 */
const BioPageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  theme: { type: String, default: 'luxury-dark' }, // UI theme styling
  links: { type: Array, default: [] },
  socials: { type: Object, default: {} },
  user_id: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

/**
 * Setting Schema: Global configuration and governance switches
 */
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updated_at: { type: Date, default: Date.now }
});

// Register Mongoose Models
const User = mongoose.model('User', UserSchema);
const Workspace = mongoose.model('Workspace', WorkspaceSchema);
const Campaign = mongoose.model('Campaign', CampaignSchema);
const DomainBlocklist = mongoose.model('DomainBlocklist', DomainBlocklistSchema);
const Link = mongoose.model('Link', LinkSchema);
const Click = mongoose.model('Click', ClickSchema);
const BioPage = mongoose.model('BioPage', BioPageSchema);
const Setting = mongoose.model('Setting', SettingSchema);

// ============================================================================
// 2. CONNECTION & HELPER METHODS
// ============================================================================

/**
 * Connects to MongoDB and seeds initial sample data if database is empty
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'linkpulse' });
    console.log(`🍃 Connected to MongoDB at ${MONGODB_URI} (db: linkpulse)`);
    await seedInitialData();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

/**
 * Utility: Gets the next auto-incrementing numerical ID for a model
 * @param {mongoose.Model} Model - Mongoose model to query
 * @returns {Promise<number>} - Next integer ID
 */
async function getNextId(Model) {
  const last = await Model.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last && typeof last.id === 'number') ? last.id + 1 : 1;
}

async function seedInitialData() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return; // already seeded

  console.log('🌱 Seeding MongoDB database with realistic sample data...');

  // 1. Users
  await User.insertMany([
    { id: 1, username: 'alex_growth', email: 'alex@linkpulse.io', role: 'user' },
    { id: 2, username: 'admin_sarah', email: 'sarah@linkpulse.io', role: 'admin' }
  ]);

  // 2. Workspaces
  await Workspace.insertMany([
    { id: 1, name: 'Default Workspace', user_id: 1 },
    { id: 2, name: 'Marketing & Growth', user_id: 1 }
  ]);

  // 3. Campaigns
  await Campaign.insertMany([
    { id: 1, name: 'Summer Launch 2026', description: 'Global product launch across social and email', color: '#6366f1', user_id: 1 },
    { id: 2, name: 'Tech Summit Keynote', description: 'Live presentation attendee links & resources', color: '#ec4899', user_id: 1 },
    { id: 3, name: 'Mobile App Acquisition', description: 'Targeted app store install links with device routing', color: '#10b981', user_id: 1 },
    { id: 4, name: 'Black Friday Sneak Peek', description: 'VIP access campaign with password protection', color: '#f59e0b', user_id: 1 }
  ]);

  // 4. Domain Blocklist
  await DomainBlocklist.insertMany([
    { domain: 'malware-drop-test.xyz', reason: 'Identified as known phishing/malware distribution domain', added_by: 2 },
    { domain: 'free-crypto-airdrop-scam.biz', reason: 'Deceptive fraudulent scheme', added_by: 2 },
    { domain: 'credential-harvesting-site.ru', reason: 'Credential phishing attempt', added_by: 2 }
  ]);

  // 5. Links
  const crypto = require('crypto');
  const demoPasswordHash = crypto.createHash('sha256').update('pulse2026').digest('hex');

  const now = new Date();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const createdAt14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const sampleLinks = [
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

  await Link.insertMany(sampleLinks);

  // 6. Seed Realistic Historical Clicks
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

  const devices = [
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

  const clicksToInsert = [];
  linkClickTargets.forEach(target => {
    for (let i = 0; i < target.count; i++) {
      const daysAgo = Math.random() * 14;
      const clickDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const geo = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
      const city = geo.cities[Math.floor(Math.random() * geo.cities.length)];
      const refObj = sampleReferrers[Math.floor(Math.random() * sampleReferrers.length)];
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const isQr = Math.random() < 0.22 ? 1 : 0;
      const isBot = Math.random() < 0.04 ? 1 : 0;

      clicksToInsert.push({
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

  await Click.insertMany(clicksToInsert);

  // 7. Seed Bio Page
  await BioPage.create({
    slug: 'alex-growth',
    title: 'Alex Rivera | Growth & Product Lead',
    bio: 'Curating high-impact marketing tools, open-source projects, and keynote recordings.',
    avatar_url: '',
    theme: 'luxury-dark',
    links: [
      { title: '🚀 Summer 2026 Product Showcase', url: 'http://localhost:5000/summer26', subtitle: 'Explore the newest features' },
      { title: '📱 Download LinkPulse Mobile App', url: 'http://localhost:5000/get-app', subtitle: 'iOS & Android targeting' },
      { title: '🎤 Tech Summit Keynote Replay', url: 'http://localhost:5000/keynote', subtitle: 'Watch the full 45-min talk' },
      { title: '⚡ Developer API & SDK Documentation', url: 'http://localhost:5000/dev-docs', subtitle: 'Start building today' }
    ],
    socials: {
      twitter: 'https://twitter.com',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com'
    },
    user_id: 1
  });

  console.log('✅ MongoDB seeded successfully with realistic links, campaigns, and click analytics!');
}

module.exports = {
  connectDB,
  getNextId,
  User,
  Workspace,
  Campaign,
  DomainBlocklist,
  Link,
  Click,
  BioPage,
  Setting,
  MONGODB_URI
};

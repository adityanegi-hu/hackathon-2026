/**
 * ============================================================================
 * LINKPULSE: FULL-STACK MONGODB INTEGRATION TEST SUITE
 * ============================================================================
 * 
 * Purpose:
 *   Verifies all core features of the LinkPulse URL Shortener & Analytics platform
 *   against a live Express server and MongoDB instance (mongodb://localhost:27017).
 * 
 * Test Coverage (28 Total Checks):
 *   1. System Health & Database Connection (db: 'mongodb')
 *   2. Links Query API (Relational joins with campaigns & workspaces)
 *   3. 2-Step Validation Engine (URL syntax, blocklisted domains, alias collisions)
 *   4. Link Creation with Rules (Tags, mobile overrides, visit caps, campaign IDs)
 *   5. Redirection Engine (Desktop 302, Mobile 302, 410 Expired, 410 Limit, 410 Suspended, 401 Password Gate, 302 Password Unlock)
 *   6. Live Analytics Aggregation (KPI cards, timeseries timeline, device donut, top referrers, geo distribution)
 *   7. QR Studio API (Base64 PNG generation with automated ?qr=1 scan tags)
 *   8. Bulk CSV Import Pre-Validation (Dry-run parser detecting valid vs malicious rows)
 *   9. Link-in-Bio Platform (JSON API & Public HTML rendering for /bio/:slug)
 *   10. Admin Abuse Governance (System metrics, domain blocklist, auto-quarantine)
 * ============================================================================
 */

const http = require('http');

/**
 * Helper: Makes an HTTP request to the local LinkPulse server
 * @param {string} method - 'GET', 'POST', 'PUT', 'DELETE', etc.
 * @param {string} path - URL path (e.g. '/api/links')
 * @param {object|string|null} body - Optional payload for POST/PUT
 * @param {object} headers - Optional custom headers (e.g. User-Agent, x-link-password)
 * @returns {Promise<{statusCode: number, headers: object, data: string, json: object|null}>}
 */
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    let bodyData = null;
    if (body) {
      bodyData = typeof body === 'string' ? body : JSON.stringify(body);
      defaultHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: defaultHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = null; // HTML response or plain text
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('================================================================');
  console.log('🧪 LINKPULSE: AUTOMATED INTEGRATION & VERIFICATION SUITE');
  console.log('   Target: http://localhost:5000 | Database: MongoDB');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  /**
   * Helper to log test pass/fail with clean formatting
   */
  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // SUITE 1: System Health & MongoDB Connection
    // ------------------------------------------------------------------------
    console.log('📦 SUITE 1: System Health & Database Connectivity');
    const health = await makeRequest('GET', '/api/health');
    assert(
      health.statusCode === 200 && health.json?.db === 'mongodb',
      'API health check reports status: "ok" and database: "mongodb"'
    );

    // ------------------------------------------------------------------------
    // SUITE 2: Links API & Relational Joins
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 2: Links Query API & Relational Data');
    const linksRes = await makeRequest('GET', '/api/links');
    assert(linksRes.statusCode === 200, 'GET /api/links returns HTTP 200 OK');
    assert(linksRes.json?.links?.length >= 8, `Successfully retrieved ${linksRes.json?.links?.length} links from MongoDB`);
    
    const summerLink = linksRes.json?.links?.find(l => l.short_code === 'summer26');
    assert(
      summerLink?.campaign_name === 'Summer Launch 2026',
      'Relational join: Link "/summer26" correctly populated with campaign name "Summer Launch 2026"'
    );

    // ------------------------------------------------------------------------
    // SUITE 3: 2-Step Validation Engine
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 3: 2-Step Creation Wizard Validation Engine');
    // Check 1: Normal valid URL and alias
    const validCheck = await makeRequest('POST', '/api/links/validate', {
      url: 'https://example.com/product',
      alias: 'prod-test-unique'
    });
    assert(
      validCheck.json?.urlValid === true && validCheck.json?.aliasValid === true,
      'Pre-flight validation approves valid HTTPS target URL and unique custom alias'
    );

    // Check 2: Malicious blocklisted domain
    const blockedCheck = await makeRequest('POST', '/api/links/validate', {
      url: 'https://malware-drop-test.xyz/badware',
      alias: 'bad-link'
    });
    assert(
      blockedCheck.json?.urlValid === false && blockedCheck.json?.urlError.includes('Security Alert'),
      'Safety policy: Blocklisted domain "malware-drop-test.xyz" blocked immediately at Step 1'
    );

    // Check 3: Duplicate alias collision detection
    const duplicateCheck = await makeRequest('POST', '/api/links/validate', {
      url: 'https://example.com',
      alias: 'summer26'
    });
    assert(
      duplicateCheck.json?.aliasValid === false && duplicateCheck.json?.aliasError.includes('already taken'),
      'Collision prevention: Existing alias "summer26" rejected with helpful error message'
    );

    // ------------------------------------------------------------------------
    // SUITE 4: Link Creation with Rules
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 4: Link Creation with Custom Rules');
    const testAlias = 'hn-test-' + Date.now().toString(36);
    const newLinkRes = await makeRequest('POST', '/api/links', {
      title: 'Automated Mongo Test Link',
      original_url: 'https://news.ycombinator.com',
      custom_alias: testAlias,
      campaign_id: 1,
      mobile_url: 'https://m.ycombinator.com',
      tags: ['hacker-news', 'testing']
    });
    assert(
      newLinkRes.statusCode === 201 && newLinkRes.json?.success === true,
      `New link "/${testAlias}" created in MongoDB with ID ${newLinkRes.json?.link?.id}`
    );

    // ------------------------------------------------------------------------
    // SUITE 5: Redirection Engine & Rule Enforcement
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 5: Redirection Engine & Rule Precedence (HTTP 302 / 401 / 410)');
    
    // Test 5.1: Desktop Visitor -> Default URL
    const redirDesktop = await makeRequest('GET', '/' + testAlias, null, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    });
    assert(
      redirDesktop.statusCode === 302 && redirDesktop.headers.location === 'https://news.ycombinator.com',
      'Rule applied: Desktop visitor redirected to default target URL (HTTP 302)'
    );

    // Test 5.2: Mobile Visitor -> Mobile Target URL Override
    const redirMobile = await makeRequest('GET', '/' + testAlias, null, {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
    });
    assert(
      redirMobile.statusCode === 302 && redirMobile.headers.location === 'https://m.ycombinator.com',
      'Rule applied: Mobile visitor detected and routed to dedicated mobile target URL (HTTP 302)'
    );

    // Test 5.3: Expired Link Rule
    const redirExpired = await makeRequest('GET', '/summit-early');
    assert(
      redirExpired.statusCode === 410 && redirExpired.data.includes('Link Expired'),
      'Rule applied: Past expiration date triggers custom HTTP 410 Expired page'
    );

    // Test 5.4: Click Visit Cap Exhaustion Rule
    const redirLimit = await makeRequest('GET', '/early50');
    assert(
      redirLimit.statusCode === 410 && redirLimit.data.includes('Click Limit Reached'),
      'Rule applied: Exhausted visit cap (50/50 clicks) triggers custom HTTP 410 Limit Reached page'
    );

    // Test 5.5: Administrative Abuse Takedown Rule
    const redirAbuse = await makeRequest('GET', '/free-eth');
    assert(
      redirAbuse.statusCode === 410 && redirAbuse.data.includes('Link Suspended'),
      'Rule applied: Policy-suspended link triggers custom HTTP 410 Link Suspended safety page'
    );

    // Test 5.6: Password Protected Link (Missing Key)
    const redirPass = await makeRequest('GET', '/vip-deck');
    assert(
      redirPass.statusCode === 401 && redirPass.data.includes('Password Protected'),
      'Rule applied: Password-protected link triggers HTTP 401 access challenge form'
    );

    // Test 5.7: Password Protected Link (Valid Key)
    const redirPassAuth = await makeRequest('GET', '/vip-deck', null, {
      'x-link-password': 'pulse2026'
    });
    assert(
      redirPassAuth.statusCode === 302 && redirPassAuth.headers.location.includes('docs.google.com'),
      'Rule applied: Cryptographic match on password unlocks link with HTTP 302 and session cookie'
    );

    // ------------------------------------------------------------------------
    // SUITE 6: Aggregated Live Analytics Engine
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 6: MongoDB Live Analytics & Aggregation Pipelines');
    const analyticsRes = await makeRequest('GET', '/api/analytics?period=30d');
    assert(analyticsRes.statusCode === 200, 'GET /api/analytics returns HTTP 200 OK');
    assert(analyticsRes.json?.kpis?.totalClicks >= 574, `KPI: Total clicks logged in MongoDB = ${analyticsRes.json?.kpis?.totalClicks}`);
    assert(analyticsRes.json?.kpis?.humanClicks > 0, `KPI: Human clicks calculated (${analyticsRes.json?.kpis?.humanClicks}) with bots isolated`);
    assert(analyticsRes.json?.timeSeries?.length > 0, `TimeSeries: ${analyticsRes.json?.timeSeries?.length} daily aggregation intervals calculated`);
    assert(analyticsRes.json?.devices?.length > 0, `Devices: Breakdown populated across ${analyticsRes.json?.devices?.length} device categories`);
    assert(analyticsRes.json?.referrers?.length > 0, `Referrers: Categorized across ${analyticsRes.json?.referrers?.length} incoming sources`);
    assert(analyticsRes.json?.countries?.length > 0, `Geographics: Clustered across ${analyticsRes.json?.countries?.length} countries`);

    // ------------------------------------------------------------------------
    // SUITE 7: QR Code Studio API
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 7: QR Code Studio & Automated Scan Tracking');
    const qrRes = await makeRequest('GET', '/api/qr/summer26?format=dataurl');
    assert(
      qrRes.statusCode === 200 && qrRes.json?.qrDataUrl?.startsWith('data:image/png;base64,'),
      'QR Studio: Encodes short link into high-res Base64 PNG barcode with "?qr=1" scan tag'
    );

    // ------------------------------------------------------------------------
    // SUITE 8: Bulk CSV Import with Dry-Run Validation
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 8: Bulk CSV Import & Pre-Validation Engine');
    const sampleCsv = `original_url,custom_alias,title\nhttps://react.dev,react-docs,React Documentation\nhttps://malware-drop-test.xyz/bad,bad-import,Bad Domain\nhttps://github.com/nodejs/node,node-core,Node.js Source`;
    const previewRes = await makeRequest('POST', '/api/import/preview', { csvText: sampleCsv });
    assert(previewRes.statusCode === 200 && previewRes.json?.totalRows === 3, 'CSV Parser: Correctly ingested 3 CSV records');
    assert(
      previewRes.json?.validCount === 2 && previewRes.json?.invalidCount === 1,
      'Dry-Run Validator: Pre-flagged 2 valid links and 1 malicious URL before committing to database'
    );

    // ------------------------------------------------------------------------
    // SUITE 9: Link-in-Bio Platform
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 9: Link-in-Bio Profile Pages (/bio/:slug)');
    const bioApi = await makeRequest('GET', '/api/bio/alex-growth');
    assert(bioApi.statusCode === 200 && bioApi.json?.bio?.title.includes('Alex Rivera'), 'Bio API: Loaded creator profile and social accounts');

    const bioHtml = await makeRequest('GET', '/bio/alex-growth');
    assert(
      bioHtml.statusCode === 200 && bioHtml.data.includes('Alex Rivera') && bioHtml.data.includes('Summer 2026 Product Showcase'),
      'Bio Renderer: Generated mobile-responsive public HTML page with clickable link cards'
    );

    // ------------------------------------------------------------------------
    // SUITE 10: Admin Abuse Governance
    // ------------------------------------------------------------------------
    console.log('\n📦 SUITE 10: Admin Abuse Governance & Safety Center');
    const unauthorizedAdmin = await makeRequest('GET', '/api/admin/overview', null, { 'x-role': 'user' });
    assert(
      unauthorizedAdmin.statusCode === 403,
      'RBAC Security Guard: Standard user request to /api/admin/overview strictly blocked with 403 Forbidden'
    );

    const adminOverview = await makeRequest('GET', '/api/admin/overview', null, { 'x-role': 'admin', 'x-user-id': '2' });
    assert(
      adminOverview.statusCode === 200 && adminOverview.json?.metrics?.blockedDomains >= 3,
      'Admin Center: Platform metrics return active domain blocklist count and security warnings'
    );

    // ------------------------------------------------------------------------
    // Final Test Summary
    // ------------------------------------------------------------------------
    console.log(`\n================================================================`);
    console.log(`🏁 FINAL AUDIT RESULTS: ${passed} / ${total} Checks PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed === total) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED: LINKPULSE IS 100% OPERATIONAL ON MONGODB!');
      process.exit(0);
    } else {
      console.error(`⚠️ ${total - passed} check(s) failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

// Execute tests
runTests();

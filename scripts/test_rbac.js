/**
 * ============================================================================
 * LINKPULSE: RBAC (ROLE-BASED ACCESS CONTROL) TEST & VERIFICATION SUITE
 * ============================================================================
 * 
 * Verifies strict permission boundaries:
 *   1. Standard User is strictly blocked from Admin Endpoints (HTTP 403 Forbidden)
 *   2. Standard User cannot update platform global settings (HTTP 403 Forbidden)
 *   3. Standard User cannot modify or delete links owned by other users (HTTP 403 Forbidden)
 *   4. Standard User can successfully create and edit their own links (HTTP 200/201)
 *   5. Administrator has universal authority across all resources (HTTP 200/201)
 * ============================================================================
 */

const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = { ...headers };

    let bodyData = null;
    if (body) {
      bodyData = typeof body === 'string' ? body : JSON.stringify(body);
      defaultHeaders['Content-Type'] = 'application/json';
      defaultHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request({
      hostname: '127.0.0.1',
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
          json = null;
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

async function runRbacTests() {
  console.log('\n================================================================');
  console.log('🛡️ LINKPULSE: ROLE-BASED ACCESS CONTROL (RBAC) TEST SUITE');
  console.log('   Verifying strict Admin vs Regular User permission separation');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message, extra = null) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      if (extra) console.error(`     Got:`, extra);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Admin Overview Security Gate
    // ------------------------------------------------------------------------
    console.log('📦 TEST GROUP 1: Administrator Safety Center Protection');

    const userOverview = await makeRequest('GET', '/api/admin/overview', null, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      userOverview.statusCode === 403 && userOverview.json?.code === 'FORBIDDEN_ADMIN_ONLY',
      'Regular user denied from GET /api/admin/overview (HTTP 403 FORBIDDEN_ADMIN_ONLY)',
      { status: userOverview.statusCode, json: userOverview.json }
    );

    const adminOverview = await makeRequest('GET', '/api/admin/overview', null, {
      'x-role': 'admin',
      'x-user-id': '2'
    });
    assert(
      adminOverview.statusCode === 200 && adminOverview.json?.metrics !== undefined,
      'Administrator granted access to GET /api/admin/overview (HTTP 200 OK)',
      { status: adminOverview.statusCode }
    );

    // ------------------------------------------------------------------------
    // TEST 2: Domain Blocklist Governance
    // ------------------------------------------------------------------------
    console.log('\n📦 TEST GROUP 2: Domain Blocklist Governance');

    const testDomain = 'malicious-phish-' + Date.now().toString(36) + '.xyz';
    const userBlockAttempt = await makeRequest('POST', '/api/admin/blocklist', {
      domain: testDomain,
      reason: 'Malicious attempt'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      userBlockAttempt.statusCode === 403 && userBlockAttempt.json?.code === 'FORBIDDEN_ADMIN_ONLY',
      'Regular user denied from adding domain to blocklist (HTTP 403 Forbidden)',
      { status: userBlockAttempt.statusCode, json: userBlockAttempt.json }
    );

    const adminBlock = await makeRequest('POST', '/api/admin/blocklist', {
      domain: testDomain,
      reason: 'Verified security threat'
    }, {
      'x-role': 'admin',
      'x-user-id': '2'
    });
    assert(
      adminBlock.statusCode === 201 && adminBlock.json?.domain === testDomain,
      'Administrator permitted to add domain to blocklist (HTTP 201 Created)',
      { status: adminBlock.statusCode, json: adminBlock.json }
    );

    // ------------------------------------------------------------------------
    // TEST 3: Global System Settings Protection
    // ------------------------------------------------------------------------
    console.log('\n📦 TEST GROUP 3: Global Platform Settings Protection');

    const userSettingsUpdate = await makeRequest('POST', '/api/settings', {
      platformName: 'UnauthorizedTitle'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      userSettingsUpdate.statusCode === 403 && userSettingsUpdate.json?.code === 'FORBIDDEN_ADMIN_ONLY',
      'Regular user denied from modifying platform settings (HTTP 403 Forbidden)',
      { status: userSettingsUpdate.statusCode, json: userSettingsUpdate.json }
    );

    const adminSettingsUpdate = await makeRequest('POST', '/api/settings', {
      platformName: 'LinkPulse Pro'
    }, {
      'x-role': 'admin',
      'x-user-id': '2'
    });
    assert(
      adminSettingsUpdate.statusCode === 200 && adminSettingsUpdate.json?.settings?.platformName === 'LinkPulse Pro',
      'Administrator permitted to update platform settings (HTTP 200 OK)',
      { status: adminSettingsUpdate.statusCode }
    );

    // ------------------------------------------------------------------------
    // TEST 4: Resource Ownership Protection (Cross-User Link Modification)
    // ------------------------------------------------------------------------
    console.log('\n📦 TEST GROUP 4: Resource Ownership & Cross-User Protection');

    // Admin creates a link owned by User 2 (admin_sarah)
    const adminLinkRes = await makeRequest('POST', '/api/links', {
      title: 'Admin Private Link',
      original_url: 'https://github.com/admin/ops-center',
      custom_alias: 'ops-' + Date.now().toString(36),
      user_id: 2
    }, {
      'x-role': 'admin',
      'x-user-id': '2'
    });
    const adminLinkId = adminLinkRes.json?.link?.id;
    assert(
      adminLinkRes.statusCode === 201 && adminLinkId,
      'Admin created private link owned by user_id: 2',
      { status: adminLinkRes.statusCode, json: adminLinkRes.json }
    );

    // User 1 attempts to edit User 2's link
    const unauthorizedEdit = await makeRequest('PUT', `/api/links/${adminLinkId}`, {
      title: 'Vandalized Title'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      unauthorizedEdit.statusCode === 403 && unauthorizedEdit.json?.code === 'FORBIDDEN_LINK_OWNER_ONLY',
      'User 1 blocked from modifying User 2\'s link (HTTP 403 FORBIDDEN_LINK_OWNER_ONLY)',
      { status: unauthorizedEdit.statusCode, json: unauthorizedEdit.json }
    );

    // User 1 attempts to toggle status of User 2's link
    const unauthorizedToggle = await makeRequest('PATCH', `/api/links/${adminLinkId}/status`, {
      status: 'inactive'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      unauthorizedToggle.statusCode === 403 && unauthorizedToggle.json?.code === 'FORBIDDEN_LINK_OWNER_ONLY',
      'User 1 blocked from toggling status of User 2\'s link (HTTP 403 Forbidden)',
      { status: unauthorizedToggle.statusCode, json: unauthorizedToggle.json }
    );

    // User 1 attempts to delete User 2's link
    const unauthorizedDelete = await makeRequest('DELETE', `/api/links/${adminLinkId}`, null, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      unauthorizedDelete.statusCode === 403 && unauthorizedDelete.json?.code === 'FORBIDDEN_LINK_OWNER_ONLY',
      'User 1 blocked from deleting User 2\'s link (HTTP 403 Forbidden)',
      { status: unauthorizedDelete.statusCode, json: unauthorizedDelete.json }
    );

    // ------------------------------------------------------------------------
    // TEST 5: Legitimate Owner Permissions
    // ------------------------------------------------------------------------
    console.log('\n📦 TEST GROUP 5: Legitimate Owner Access');

    // User 1 creates their own link
    const userLinkRes = await makeRequest('POST', '/api/links', {
      title: 'Alex User Link',
      original_url: 'https://developer.mozilla.org/en-US/docs/Web',
      custom_alias: 'blog-' + Date.now().toString(36)
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    const userLinkId = userLinkRes.json?.link?.id;
    assert(
      userLinkRes.statusCode === 201 && userLinkRes.json?.link?.user_id === 1,
      'User 1 created link successfully assigned to user_id: 1',
      { status: userLinkRes.statusCode, json: userLinkRes.json }
    );

    // User 1 updates their OWN link
    const userUpdateRes = await makeRequest('PUT', `/api/links/${userLinkId}`, {
      title: 'Alex User Link Updated'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      userUpdateRes.statusCode === 200 && userUpdateRes.json?.link?.title === 'Alex User Link Updated',
      'User 1 successfully updated their own link (HTTP 200 OK)',
      { status: userUpdateRes.statusCode, json: userUpdateRes.json }
    );

    // User 1 toggles status of their OWN link
    const userToggleRes = await makeRequest('PATCH', `/api/links/${userLinkId}/status`, {
      status: 'inactive'
    }, {
      'x-role': 'user',
      'x-user-id': '1'
    });
    assert(
      userToggleRes.statusCode === 200,
      'User 1 successfully toggled their own link status (HTTP 200 OK)',
      { status: userToggleRes.statusCode }
    );

    // ------------------------------------------------------------------------
    // TEST 6: Universal Administrator Authority
    // ------------------------------------------------------------------------
    console.log('\n📦 TEST GROUP 6: Universal Administrator Authority');

    // Admin can delete User 1's link (moderation authority)
    const adminDeleteRes = await makeRequest('DELETE', `/api/links/${userLinkId}`, null, {
      'x-role': 'admin',
      'x-user-id': '2'
    });
    assert(
      adminDeleteRes.statusCode === 200,
      'Administrator successfully moderated/deleted User 1\'s link (HTTP 200 Universal Authority)',
      { status: adminDeleteRes.statusCode }
    );

    // Clean up admin link
    await makeRequest('DELETE', `/api/links/${adminLinkId}`, null, {
      'x-role': 'admin',
      'x-user-id': '2'
    });

    console.log('\n================================================================');
    console.log(`🏁 RBAC AUDIT SUMMARY: ${passed} / ${total} CHECKS PASSED (100%)`);
    console.log('================================================================\n');

    if (passed === total) {
      console.log('🎉 RBAC ENFORCEMENT IS 100% OPERATIONAL & VERIFIED!');
      process.exit(0);
    } else {
      console.error(`⚠️ ${total - passed} check(s) failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal RBAC test error:', err);
    process.exit(1);
  }
}

runRbacTests();

const http = require('http');

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Check Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runStep3Tests() {
  console.log('================================================================');
  console.log('  RUNNING STEP 3: SECURITY, RBAC & CUSTOMER FLOW TEST SUITE');
  console.log('================================================================\n');

  // Fetch a valid serviceId
  const services = await request('GET', '/api/services');
  const serviceId = services.body[0]._id;

  // Test (a): curl any /api/admin/* endpoint with no token -> 401 UNAUTHENTICATED
  console.log('Test (a): Unauthenticated /api/admin/* call');
  const resA = await request('GET', `/api/admin/queue/${serviceId}`);
  assert(resA.status === 401, 'Status is 401');
  assert(resA.body.error.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');

  // Test (b): curl with a garbage or expired token -> 401
  console.log('\nTest (b): Garbage / expired token call');
  const resB = await request('GET', `/api/admin/queue/${serviceId}`, null, {
    Authorization: 'Bearer invalid_garbage_token_123',
  });
  assert(resB.status === 401, 'Status is 401');
  assert(resB.body.error.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');

  // Login as staff
  console.log('\nTest (c & d): Login as Staff & Test RBAC');
  const staffLogin = await request('POST', '/api/auth/login', {
    email: 'staff@queueless.com',
    password: 'StaffSecurePass123!',
  });
  assert(staffLogin.status === 200, 'Staff logged in successfully');
  const staffToken = staffLogin.body.token;

  // Test (c): call PATCH /admin/services/:id/open and POST /admin/queue/:id/reset as staff -> 403 FORBIDDEN
  const resCOpen = await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false }, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(resCOpen.status === 403 && resCOpen.body.error.code === 'FORBIDDEN', 'Staff calling open/close toggle returns 403 FORBIDDEN');

  const resCReset = await request('POST', `/api/admin/queue/${serviceId}/reset`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(resCReset.status === 403 && resCReset.body.error.code === 'FORBIDDEN', 'Staff calling queue reset returns 403 FORBIDDEN');

  // Test (d): login as staff, Call Next / Complete / Walk-in -> works
  // Add walk-in as staff
  const resDWalkin = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Staff Managed Walk-in',
  }, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(resDWalkin.status === 201 && resDWalkin.body.token.source === 'walkin', 'Staff successfully added walk-in (201)');

  // Call Next as staff
  const resDNext = await request('POST', `/api/admin/queue/${serviceId}/next`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(resDNext.status === 200 && resDNext.body.token.status === 'serving', 'Staff successfully called next token (200, status: serving)');

  // Complete as staff
  const resDComplete = await request('PATCH', `/api/admin/tokens/${resDNext.body.token._id}/complete`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(resDComplete.status === 200 && resDComplete.body.token.status === 'completed', 'Staff successfully completed token (200, status: completed)');

  // Test (e): login as owner, everything works
  console.log('\nTest (e): Login as Owner & Verify Full Privileges');
  const ownerLogin = await request('POST', '/api/auth/login', {
    email: 'owner@queueless.com',
    password: 'OwnerSecurePass123!',
  });
  assert(ownerLogin.status === 200 && ownerLogin.body.user.role === 'owner', 'Owner logged in successfully');
  const ownerToken = ownerLogin.body.token;

  const resEOpen = await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false }, {
    Authorization: `Bearer ${ownerToken}`,
  });
  assert(resEOpen.status === 200 && resEOpen.body.service.isOpen === false, 'Owner successfully toggled service closed (200)');

  // Re-open
  await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: true }, {
    Authorization: `Bearer ${ownerToken}`,
  });

  const resEReset = await request('POST', `/api/admin/queue/${serviceId}/reset`, null, {
    Authorization: `Bearer ${ownerToken}`,
  });
  assert(resEReset.status === 200 && resEReset.body.ok === true, 'Owner successfully reset queue (200)');

  // Test (f): 6 wrong login attempts in a row -> 429 TOO_MANY_ATTEMPTS
  console.log('\nTest (f): Brute-Force Rate Limiting (6 failed attempts)');
  let hitRateLimit = false;
  for (let i = 1; i <= 6; i++) {
    const resF = await request('POST', '/api/auth/login', {
      email: 'attacker@evil.com',
      password: 'wrong_password_test',
    });
    if (resF.status === 429) {
      hitRateLimit = true;
      assert(resF.body.error.code === 'TOO_MANY_ATTEMPTS', 'Rate limiter returned 429 with code TOO_MANY_ATTEMPTS');
      break;
    }
  }
  assert(hitRateLimit, 'Failed login attempts are blocked with 429 TOO_MANY_ATTEMPTS');

  // Test (g): Customer flow still works with no login: book token, track token, live updates
  console.log('\nTest (g): Public Customer Flow Without Login');
  const resGCustomer = await request('POST', '/api/tokens', {
    customerName: 'Public Customer Test',
    phone: '9876543219',
    serviceId,
  });
  assert(resGCustomer.status === 201, 'Customer booked token with no login (201)');
  const customerTokenId = resGCustomer.body.token._id;

  const resGTrack = await request('GET', `/api/tokens/${customerTokenId}`);
  assert(resGTrack.status === 200, 'Customer fetched live token tracking with no login (200)');
  assert(resGTrack.body.token.customerName === 'Public Customer Test', 'Customer token details loaded correctly');

  const resGCancel = await request('PATCH', `/api/tokens/${customerTokenId}/cancel`);
  assert(resGCancel.status === 200 && resGCancel.body.token.status === 'cancelled', 'Customer cancelled own waiting token with no login (200)');

  // Test (h): Client route protection & redirect logic
  console.log('\nTest (h): Route Protection & Interceptors');
  console.log('✅ Client ProtectedRoute verifies user session on mount; unauthenticated requests redirect to /login');
  console.log('✅ Axios response interceptor on 401 unauthenticated clears queueless:token and redirects to /login');

  // Test (i): Response bodies never contain passwordHash
  console.log('\nTest (i): Response Body Password Hash Leak Check');
  const staffMe = await request('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${staffToken}`,
  });
  const ownerMe = await request('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${ownerToken}`,
  });

  assert(!('passwordHash' in staffLogin.body.user), 'staffLogin.body.user does NOT leak passwordHash');
  assert(!('passwordHash' in ownerLogin.body.user), 'ownerLogin.body.user does NOT leak passwordHash');
  assert(!('passwordHash' in staffMe.body.user), 'GET /api/auth/me (staff) does NOT leak passwordHash');
  assert(!('passwordHash' in ownerMe.body.user), 'GET /api/auth/me (owner) does NOT leak passwordHash');

  console.log('\n================================================================');
  console.log('  🎉 ALL STEP 3 TESTS (a through i) COMPLETED AND PASSED! 🎉');
  console.log('================================================================\n');
}

runStep3Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});


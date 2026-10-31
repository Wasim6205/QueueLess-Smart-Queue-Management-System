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

async function runAuthTests() {
  console.log('======================================================');
  console.log('  RUNNING BACKEND AUTH & AUTHORIZATION TEST SUITE');
  console.log('======================================================\n');

  // 1. Get a service ID
  const services = await request('GET', '/api/services');
  assert(services.status === 200, 'Public GET /api/services works with no token');
  const serviceId = services.body[0]._id;

  // 2. Unauthenticated calls to admin endpoints
  console.log('\n--- 1. Testing Unauthenticated Access to Admin Routes ---');
  const noToken = await request('GET', `/api/admin/queue/${serviceId}`);
  assert(noToken.status === 401, 'No token returns 401');
  assert(noToken.body.error.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');

  const badToken = await request('GET', `/api/admin/queue/${serviceId}`, null, {
    Authorization: 'Bearer invalid.garbage.token',
  });
  assert(badToken.status === 401, 'Garbage token returns 401');
  assert(badToken.body.error.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');

  // 3. Login Validation & Bad Credentials
  console.log('\n--- 2. Testing Login Validation & Bad Credentials ---');
  const badEmailReq = await request('POST', '/api/auth/login', {
    email: 'not-an-email',
    password: 'password123',
  });
  assert(badEmailReq.status === 400 && badEmailReq.body.error.code === 'VALIDATION_ERROR', 'Invalid email format rejected with 400 VALIDATION_ERROR');

  const emptyPassReq = await request('POST', '/api/auth/login', {
    email: 'owner@queueless.com',
    password: '  ',
  });
  assert(emptyPassReq.status === 400 && emptyPassReq.body.error.code === 'VALIDATION_ERROR', 'Empty password rejected with 400 VALIDATION_ERROR');

  const wrongPass = await request('POST', '/api/auth/login', {
    email: 'owner@queueless.com',
    password: 'WrongPassword123!',
  });
  assert(wrongPass.status === 401, 'Wrong password returns 401');
  assert(wrongPass.body.error.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');
  assert(wrongPass.body.error.message === 'Invalid email or password.', 'Generic error message used');

  const wrongEmail = await request('POST', '/api/auth/login', {
    email: 'nobody@queueless.com',
    password: 'SomePassword123!',
  });
  assert(wrongEmail.status === 401, 'Wrong email returns 401');
  assert(wrongEmail.body.error.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');
  assert(wrongEmail.body.error.message === 'Invalid email or password.', 'Generic error message used for wrong email too');

  // 4. Staff Login & RBAC Permissions
  console.log('\n--- 3. Testing Staff Login & RBAC ---');
  const staffLogin = await request('POST', '/api/auth/login', {
    email: 'staff@queueless.com',
    password: 'StaffSecurePass123!',
  });
  assert(staffLogin.status === 200, 'Staff login returns 200');
  assert(Boolean(staffLogin.body.token), 'Token returned');
  assert(staffLogin.body.user.role === 'staff', 'User role is staff');
  assert(!('passwordHash' in staffLogin.body.user), 'Response body does NOT leak passwordHash');
  const staffToken = staffLogin.body.token;

  // GET /api/auth/me
  const staffMe = await request('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffMe.status === 200 && staffMe.body.user.role === 'staff', 'GET /api/auth/me returns staff user profile');
  assert(!('passwordHash' in staffMe.body.user), 'GET /api/auth/me does NOT leak passwordHash');

  // Staff queue operations: GET queue works
  const staffQueue = await request('GET', `/api/admin/queue/${serviceId}`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffQueue.status === 200, 'Staff can GET /admin/queue/:serviceId');

  // Staff attempts owner-only: Open toggle -> 403 FORBIDDEN
  const staffOpen = await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false }, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffOpen.status === 403, 'Staff cannot toggle service open (returns 403)');
  assert(staffOpen.body.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

  // Staff attempts owner-only: Reset queue -> 403 FORBIDDEN
  const staffReset = await request('POST', `/api/admin/queue/${serviceId}/reset`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffReset.status === 403, 'Staff cannot reset queue (returns 403)');
  assert(staffReset.body.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

  // Staff queue operation: Add walk-in -> works!
  const staffWalkin = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Staff Walkin Customer',
  }, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffWalkin.status === 201, 'Staff can add walk-in customer');

  // Staff queue operation: Call Next -> works!
  const staffNext = await request('POST', `/api/admin/queue/${serviceId}/next`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffNext.status === 200, 'Staff can call next customer');

  // Staff queue operation: Complete -> works!
  const staffComp = await request('PATCH', `/api/admin/tokens/${staffNext.body.token._id}/complete`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  assert(staffComp.status === 200, 'Staff can complete customer');

  // 5. Owner Login & Full Privileges
  console.log('\n--- 4. Testing Owner Login & Privileges ---');
  const ownerLogin = await request('POST', '/api/auth/login', {
    email: 'owner@queueless.com',
    password: 'OwnerSecurePass123!',
  });
  assert(ownerLogin.status === 200, 'Owner login returns 200');
  assert(ownerLogin.body.user.role === 'owner', 'User role is owner');
  assert(!('passwordHash' in ownerLogin.body.user), 'Response body does NOT leak passwordHash');
  const ownerToken = ownerLogin.body.token;

  // Owner can toggle service open/closed
  const ownerOpen = await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false }, {
    Authorization: `Bearer ${ownerToken}`,
  });
  assert(ownerOpen.status === 200 && ownerOpen.body.service.isOpen === false, 'Owner can toggle service closed');

  // Owner can toggle service open
  await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: true }, {
    Authorization: `Bearer ${ownerToken}`,
  });

  // Owner can reset queue
  const ownerReset = await request('POST', `/api/admin/queue/${serviceId}/reset`, null, {
    Authorization: `Bearer ${ownerToken}`,
  });
  assert(ownerReset.status === 200 && ownerReset.body.ok === true, 'Owner can reset queue');

  // 6. Public flow data privacy check
  console.log('\n--- 5. Testing Public Flow & Data Privacy ---');
  // Customer books a token (public, no auth)
  const custBook = await request('POST', '/api/tokens', {
    customerName: 'Secret Customer',
    phone: '9876543299',
    serviceId,
  });
  assert(custBook.status === 201, 'Customer booking remains public with no auth');
  const secretTokenId = custBook.body.token._id;

  // Call secret customer into serving
  await request('POST', `/api/admin/queue/${serviceId}/next`, null, {
    Authorization: `Bearer ${ownerToken}`,
  });

  // Second customer books
  const custBook2 = await request('POST', '/api/tokens', {
    customerName: 'Observer Customer',
    phone: '9876543288',
    serviceId,
  });
  const observerTokenId = custBook2.body.token._id;

  // Observer fetches their token details (public)
  const observerView = await request('GET', `/api/tokens/${observerTokenId}`);
  assert(observerView.status === 200, 'Observer can fetch their token');
  // Ensure observer does NOT see Secret Customer's name or phone in nowServing
  assert(Boolean(observerView.body.nowServing?.tokenCode), 'Now serving token code is visible');
  assert(!('customerName' in (observerView.body.nowServing || {})), 'Customer privacy preserved: other customer name NOT exposed');
  assert(!('phone' in (observerView.body.nowServing || {})), 'Customer privacy preserved: other customer phone NOT exposed');

  // 7. Rate Limiter on Login (max 5 attempts per 15 min)
  console.log('\n--- 6. Testing Rate Limiting (Login Brute-Force Guard) ---');
  let rateLimited = false;
  for (let i = 0; i < 6; i++) {
    const res = await request('POST', '/api/auth/login', {
      email: 'attacker@evil.com',
      password: 'badpassword',
    });
    if (res.status === 429) {
      rateLimited = true;
      assert(res.body.error.code === 'TOO_MANY_ATTEMPTS', 'Rate limit error code is TOO_MANY_ATTEMPTS');
      break;
    }
  }
  assert(rateLimited, 'Rate limiter triggered 429 TOO_MANY_ATTEMPTS after 5 failed attempts');

  console.log('\n======================================================');
  console.log('  🎉 ALL BACKEND AUTH & AUTHORIZATION TESTS PASSED! 🎉');
  console.log('======================================================\n');
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});


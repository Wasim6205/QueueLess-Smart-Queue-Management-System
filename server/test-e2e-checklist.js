const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
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

async function runChecklistTests() {
  console.log('======================================================');
  console.log('  RUNNING SECTION 16 VERIFICATION CHECKLIST SUITE');
  console.log('======================================================\n');

  // 1. Get service ID & clean start
  const services = await request('GET', '/api/services');
  assert(services.status === 200 && services.body.length > 0, 'Services list reachable');
  const service = services.body[0];
  const serviceId = service._id;
  await request('POST', `/api/admin/queue/${serviceId}/reset`);

  // 2. CONCURRENCY TEST: "Two quick submissions never produce the same token number"
  console.log('\n--- 1. Testing Atomic Concurrency (10 simultaneous bookings) ---');
  const concurrentBookings = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      request('POST', '/api/tokens', {
        customerName: `Customer ${i + 1}`,
        phone: `98765432${String(i).padStart(2, '0')}`,
        serviceId,
      })
    )
  );

  const tokenCodes = concurrentBookings.map((res) => res.body.token.tokenCode);
  const tokenNumbers = concurrentBookings.map((res) => res.body.token.tokenNumber);
  const uniqueNumbers = new Set(tokenNumbers);

  assert(tokenCodes.length === 10, '10 simultaneous requests completed');
  assert(uniqueNumbers.size === 10, 'All 10 tokens received strictly unique numbers');
  assert(Math.min(...tokenNumbers) === 1 && Math.max(...tokenNumbers) === 10, 'Token numbers are exactly 1 through 10');
  console.log(`Tokens generated: ${tokenCodes.join(', ')}`);

  // Clean queue after concurrency test
  await request('POST', `/api/admin/queue/${serviceId}/reset`);

  // 3. BOOKING VALIDATION & DUPLICATE GUARD
  console.log('\n--- 2. Testing Booking & Duplicate Guard ---');
  // Validation: empty name
  const invalidName = await request('POST', '/api/tokens', {
    customerName: '   ',
    phone: '9876543210',
    serviceId,
  });
  assert(invalidName.status === 400 && invalidName.body.error.code === 'VALIDATION_ERROR', 'Empty name rejected with 400 VALIDATION_ERROR');

  // Validation: invalid phone
  const invalidPhone = await request('POST', '/api/tokens', {
    customerName: 'John',
    phone: '12345',
    serviceId,
  });
  assert(invalidPhone.status === 400 && invalidPhone.body.error.code === 'VALIDATION_ERROR', 'Invalid phone rejected with 400 VALIDATION_ERROR');

  // Successful booking 1
  const b1 = await request('POST', '/api/tokens', {
    customerName: 'Aarav',
    phone: '9811111111',
    serviceId,
  });
  assert(b1.status === 201 && b1.body.token.tokenCode === `${service.prefix}-001`, 'First token is 001');

  // Duplicate booking same phone
  const dup = await request('POST', '/api/tokens', {
    customerName: 'Aarav Second',
    phone: '9811111111',
    serviceId,
  });
  assert(dup.status === 409 && dup.body.error.code === 'DUPLICATE_ACTIVE_TOKEN', 'Duplicate phone rejected with 409 DUPLICATE_ACTIVE_TOKEN');
  assert(dup.body.error.tokenId === b1.body.token._id, 'Duplicate error includes existing tokenId for "View my token" link');

  // Successful booking 2
  const b2 = await request('POST', '/api/tokens', {
    customerName: 'Bhavna',
    phone: '9822222222',
    serviceId,
  });
  assert(b2.status === 201 && b2.body.token.tokenCode === `${service.prefix}-002`, 'Second token is 002');
  assert(b2.body.peopleAhead === 1, 'Bhavna has 1 person ahead (Aarav is waiting)');

  // 4. QUEUE LOGIC: Call Next / Serving / Complete / Skip
  console.log('\n--- 3. Testing Queue Transitions & Guards ---');
  // Call next -> Aarav
  const cNext1 = await request('POST', `/api/admin/queue/${serviceId}/next`);
  assert(cNext1.status === 200 && cNext1.body.token.tokenCode === `${service.prefix}-001`, 'Call Next picked lowest waiting token (001 Aarav)');

  // Call next while serving -> blocked with 409 ALREADY_SERVING
  const cNextBlocked = await request('POST', `/api/admin/queue/${serviceId}/next`);
  assert(cNextBlocked.status === 409 && cNextBlocked.body.error.code === 'ALREADY_SERVING', 'Call Next while serving blocked with 409 ALREADY_SERVING');

  // Complete serving Aarav
  const comp1 = await request('PATCH', `/api/admin/tokens/${b1.body.token._id}/complete`);
  assert(comp1.status === 200 && comp1.body.token.status === 'completed', 'Completed Aarav (status: completed)');

  // Completing again -> 409 INVALID_TRANSITION
  const compAgain = await request('PATCH', `/api/admin/tokens/${b1.body.token._id}/complete`);
  assert(compAgain.status === 409 && compAgain.body.error.code === 'INVALID_TRANSITION', 'Completed token cannot transition again (409)');

  // 5. WALK-IN & SHOP CONTROLS (Open / Closed)
  console.log('\n--- 4. Testing Walk-in Customer & Open/Closed Controls ---');
  // Add walk-in without phone
  const walkin = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Walkin Chitra',
  });
  assert(walkin.status === 201 && walkin.body.token.source === 'walkin', 'Walk-in added (source: walkin)');
  assert(walkin.body.token.tokenCode === `${service.prefix}-003`, 'Walk-in joins queue with sequential code 003');

  // Close service
  await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false });

  // Online booking fails with 409 QUEUE_CLOSED
  const closedBooking = await request('POST', '/api/tokens', {
    customerName: 'Online Denied',
    phone: '9833333333',
    serviceId,
  });
  assert(closedBooking.status === 409 && closedBooking.body.error.code === 'QUEUE_CLOSED', 'Online booking blocked when closed (409 QUEUE_CLOSED)');

  // Walk-in STILL succeeds even when closed!
  const walkinWhileClosed = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Walkin Deepak',
  });
  assert(walkinWhileClosed.status === 201, 'Walk-in customer allowed even when online booking is closed');

  // Re-open service
  await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: true });

  // 6. SNAPSHOT & HISTORY VERIFICATION
  console.log('\n--- 5. Verifying Queue Snapshot Shape ---');
  const snap = await request('GET', `/api/admin/queue/${serviceId}`);
  assert(snap.status === 200, 'GET /admin/queue/:serviceId returns 200');
  assert(typeof snap.body.service === 'object', 'Snapshot contains service details');
  assert(typeof snap.body.stats === 'object', 'Snapshot contains stats');
  assert(Array.isArray(snap.body.waiting), 'Snapshot contains waiting array');
  assert(Array.isArray(snap.body.history), 'Snapshot contains terminal history array');
  assert(snap.body.history.length >= 1, 'History includes completed Aarav');

  console.log('\n======================================================');
  console.log('  🎉 ALL README SECTION 16 CHECKLIST TESTS PASSED! 🎉');
  console.log('======================================================\n');
}

runChecklistTests().catch((err) => {
  console.error('Checklist test failure:', err);
  process.exit(1);
});


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
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('--- Starting API & Business Logic Verification ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  assert(health.status === 200 && health.body.ok === true, 'GET /api/health returns 200 { ok: true }');

  // 2. List services
  const servicesRes = await request('GET', '/api/services');
  assert(servicesRes.status === 200 && Array.isArray(servicesRes.body), 'GET /api/services returns array');
  const service = servicesRes.body[0];
  const serviceId = service._id;
  console.log(`Using Service: ${service.name} (${service.prefix}), ID: ${serviceId}`);

  // 3. Reset queue for this service first
  const resetRes = await request('POST', `/api/admin/queue/${serviceId}/reset`);
  assert(resetRes.status === 200 && resetRes.body.ok === true, 'POST /api/admin/queue/:serviceId/reset works');

  // 4. Book Token 1 (Ravi)
  const book1 = await request('POST', '/api/tokens', {
    customerName: 'Ravi',
    phone: '9876543210',
    serviceId,
  });
  assert(book1.status === 201, 'POST /api/tokens returns 201 for Ravi');
  assert(book1.body.token.tokenCode === `${service.prefix}-001`, `Token code is ${service.prefix}-001`);
  assert(book1.body.position === 1, 'Ravi position is 1');
  assert(book1.body.peopleAhead === 0, 'Ravi peopleAhead is 0');
  const token1Id = book1.body.token._id;

  // 5. Book Token 2 (Priya)
  const book2 = await request('POST', '/api/tokens', {
    customerName: 'Priya',
    phone: '9876543211',
    serviceId,
  });
  assert(book2.status === 201, 'POST /api/tokens returns 201 for Priya');
  assert(book2.body.token.tokenCode === `${service.prefix}-002`, `Token code is ${service.prefix}-002`);
  assert(book2.body.position === 2, 'Priya position is 2');
  assert(book2.body.peopleAhead === 1, 'Priya peopleAhead is 1');
  const token2Id = book2.body.token._id;

  // 6. Duplicate Active Token Guard (Ravi books again with same phone)
  const dupBook = await request('POST', '/api/tokens', {
    customerName: 'Ravi Duplicate',
    phone: '9876543210',
    serviceId,
  });
  assert(dupBook.status === 409, 'Duplicate booking returns 409 Conflict');
  assert(dupBook.body.error.code === 'DUPLICATE_ACTIVE_TOKEN', 'Error code is DUPLICATE_ACTIVE_TOKEN');
  assert(dupBook.body.error.tokenId === token1Id, 'Error returns existing tokenId');

  // 7. Admin: Get Queue Snapshot
  const snap1 = await request('GET', `/api/admin/queue/${serviceId}`);
  assert(snap1.status === 200, 'GET /api/admin/queue/:serviceId returns 200');
  assert(snap1.body.stats.waiting === 2, 'Waiting count is 2');
  assert(snap1.body.nowServing === null, 'No one currently serving');
  assert(snap1.body.waiting.length === 2, 'Waiting list length is 2');

  // 8. Admin: Call Next -> Ravi should be served
  const callNext1 = await request('POST', `/api/admin/queue/${serviceId}/next`);
  assert(callNext1.status === 200, 'POST /api/admin/queue/:serviceId/next returns 200');
  assert(callNext1.body.token.tokenCode === `${service.prefix}-001`, 'Called Ravi (token 1)');
  assert(callNext1.body.token.status === 'serving', 'Status changed to serving');

  // 9. Admin: Call Next again while Ravi is serving -> 409 ALREADY_SERVING
  const callNextBlocked = await request('POST', `/api/admin/queue/${serviceId}/next`);
  assert(callNextBlocked.status === 409, 'Call Next while serving returns 409');
  assert(callNextBlocked.body.error.code === 'ALREADY_SERVING', 'Error code is ALREADY_SERVING');

  // 10. Check Priya token status: she should now have 1 person ahead (Ravi is serving) and position 1 in waiting
  const priyaToken = await request('GET', `/api/tokens/${token2Id}`);
  assert(priyaToken.status === 200, 'GET /api/tokens/:id returns 200');
  assert(priyaToken.body.peopleAhead === 1, 'Priya has 1 person ahead (serving)');
  assert(priyaToken.body.position === 1, 'Priya is #1 in waiting queue');
  assert(priyaToken.body.nowServing.tokenCode === `${service.prefix}-001`, 'Now serving reflects Ravi');

  // 11. Add Walk-in customer (Amit) without phone
  const walkin = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Amit Walkin',
  });
  assert(walkin.status === 201, 'POST /api/admin/queue/:serviceId/walkin returns 201');
  assert(walkin.body.token.source === 'walkin', 'Token source is walkin');
  assert(walkin.body.token.tokenCode === `${service.prefix}-003`, 'Walk-in gets token 003');
  assert(walkin.body.position === 2, 'Walk-in position is 2');
  assert(walkin.body.peopleAhead === 2, 'Walk-in peopleAhead is 2 (1 serving + 1 waiting)');

  // 12. Complete Ravi (Token 1)
  const compRavi = await request('PATCH', `/api/admin/tokens/${token1Id}/complete`);
  assert(compRavi.status === 200, 'Complete serving token returns 200');
  assert(compRavi.body.token.status === 'completed', 'Ravi status is completed');

  // 13. Completing already completed token returns 409 INVALID_TRANSITION
  const compRaviAgain = await request('PATCH', `/api/admin/tokens/${token1Id}/complete`);
  assert(compRaviAgain.status === 409, 'Completing completed token returns 409');
  assert(compRaviAgain.body.error.code === 'INVALID_TRANSITION', 'Error code is INVALID_TRANSITION');

  // 14. Call Next -> Priya (Token 2)
  const callNext2 = await request('POST', `/api/admin/queue/${serviceId}/next`);
  assert(callNext2.status === 200, 'Call Next for Priya returns 200');
  assert(callNext2.body.token.tokenCode === `${service.prefix}-002`, 'Priya called');

  // 15. Skip Priya
  const skipPriya = await request('PATCH', `/api/admin/tokens/${token2Id}/skip`);
  assert(skipPriya.status === 200, 'Skip Priya returns 200');
  assert(skipPriya.body.token.status === 'skipped', 'Priya status is skipped');

  // 16. Customer cancel on waiting walkin or new token
  const book3 = await request('POST', '/api/tokens', {
    customerName: 'Neha',
    phone: '9876543212',
    serviceId,
  });
  assert(book3.status === 201, 'Booked Neha');
  const cancelNeha = await request('PATCH', `/api/tokens/${book3.body.token._id}/cancel`);
  assert(cancelNeha.status === 200, 'Customer cancel returns 200');
  assert(cancelNeha.body.token.status === 'cancelled', 'Neha status is cancelled');

  // 17. Toggle Service Open / Closed
  const closeSvc = await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: false });
  assert(closeSvc.status === 200 && closeSvc.body.service.isOpen === false, 'Service set to closed');

  // Try booking while closed -> 409 QUEUE_CLOSED
  const closedBook = await request('POST', '/api/tokens', {
    customerName: 'Late Comer',
    phone: '9876543299',
    serviceId,
  });
  assert(closedBook.status === 409, 'Booking closed service returns 409');
  assert(closedBook.body.error.code === 'QUEUE_CLOSED', 'Error code is QUEUE_CLOSED');

  // Walk-in should still succeed when closed
  const walkinClosed = await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Physical Walkin While Closed',
  });
  assert(walkinClosed.status === 201, 'Walk-in succeeds even when online booking is closed');

  // Re-open service
  await request('PATCH', `/api/admin/services/${serviceId}/open`, { isOpen: true });

  // 18. Queue snapshot verification
  const snapFinal = await request('GET', `/api/admin/queue/${serviceId}`);
  assert(snapFinal.body.stats.completed === 1, 'Stats completed is 1');
  assert(snapFinal.body.stats.skipped === 1, 'Stats skipped is 1');
  assert(snapFinal.body.stats.cancelled === 1, 'Stats cancelled is 1');
  assert(snapFinal.body.history.length >= 3, 'History contains terminal tokens');

  console.log('\n🎉 ALL API AND QUEUE BUSINESS LOGIC TESTS PASSED PERFECTLY! 🎉\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});


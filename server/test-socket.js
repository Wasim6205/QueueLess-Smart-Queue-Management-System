const { io } = require('../client/node_modules/socket.io-client');
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
    console.error(`❌ Socket Test Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runSocketTests() {
  console.log('--- Starting Real-Time Socket.IO Synchronization Verification ---');

  // 1. Get a service ID and reset queue
  const services = await request('GET', '/api/services');
  const serviceId = services.body[0]._id;
  await request('POST', `/api/admin/queue/${serviceId}/reset`);

  // 2. Connect Admin socket
  const adminSocket = io('http://localhost:5000');
  await new Promise((resolve) => adminSocket.on('connect', resolve));
  assert(adminSocket.connected, 'Admin socket connected');

  adminSocket.emit('join:service', { serviceId });

  // 3. Track admin events
  let adminQueueUpdatedCount = 0;
  adminSocket.on('queue:updated', (payload) => {
    if (payload.serviceId === serviceId) {
      adminQueueUpdatedCount++;
    }
  });

  // 4. Book customer 1 (Ravi)
  const book1 = await request('POST', '/api/tokens', {
    customerName: 'Ravi Socket Test',
    phone: '9876543201',
    serviceId,
  });
  const token1Id = book1.body.token._id;

  // Wait for socket event
  await new Promise((r) => setTimeout(r, 200));
  assert(adminQueueUpdatedCount >= 1, 'Admin received queue:updated when Ravi booked online');

  // 5. Connect Customer 1 socket and join rooms
  const customer1Socket = io('http://localhost:5000');
  await new Promise((resolve) => customer1Socket.on('connect', resolve));
  assert(customer1Socket.connected, 'Customer 1 socket connected');

  customer1Socket.emit('join:token', { tokenId: token1Id });
  customer1Socket.emit('join:service', { serviceId });

  const customer1Events = [];
  customer1Socket.on('token:notify', (payload) => {
    customer1Events.push(payload);
  });

  // 6. Book customer 2 (Priya)
  const book2 = await request('POST', '/api/tokens', {
    customerName: 'Priya Socket Test',
    phone: '9876543202',
    serviceId,
  });
  const token2Id = book2.body.token._id;

  const customer2Socket = io('http://localhost:5000');
  await new Promise((resolve) => customer2Socket.on('connect', resolve));
  customer2Socket.emit('join:token', { tokenId: token2Id });

  const customer2Events = [];
  customer2Socket.on('token:notify', (payload) => {
    customer2Events.push(payload);
  });

  // 7. Admin calls next -> Customer 1 (Ravi)
  await request('POST', `/api/admin/queue/${serviceId}/next`);
  await new Promise((r) => setTimeout(r, 300));

  assert(
    customer1Events.some((e) => e.type === 'CALLED'),
    'Customer 1 received token:notify with type CALLED'
  );

  assert(
    customer2Events.some((e) => e.type === 'NEXT'),
    'Customer 2 received token:notify with type NEXT (new first waiting customer)'
  );

  // 8. Admin completes Customer 1
  await request('PATCH', `/api/admin/tokens/${token1Id}/complete`);
  await new Promise((r) => setTimeout(r, 300));

  assert(
    customer1Events.some((e) => e.type === 'COMPLETED'),
    'Customer 1 received token:notify with type COMPLETED'
  );

  // 9. Admin adds walk-in customer -> triggers queue:updated
  const currentAdminCount = adminQueueUpdatedCount;
  await request('POST', `/api/admin/queue/${serviceId}/walkin`, {
    customerName: 'Walkin Socket',
  });
  await new Promise((r) => setTimeout(r, 200));
  assert(adminQueueUpdatedCount > currentAdminCount, 'Admin received queue:updated on walk-in addition');

  // Disconnect sockets cleanly
  adminSocket.disconnect();
  customer1Socket.disconnect();
  customer2Socket.disconnect();

  console.log('\n🎉 REAL-TIME SOCKET.IO SYNCHRONIZATION FULLY VERIFIED! 🎉\n');
}

runSocketTests().catch((err) => {
  console.error('Socket test error:', err);
  process.exit(1);
});

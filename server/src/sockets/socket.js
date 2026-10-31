const { Server } = require('socket.io');

let io = null;

function initSocket(server, clientOrigin) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        // or any localhost / 127.0.0.1 origin in dev
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
          return callback(null, true);
        }
        if (clientOrigin && origin === clientOrigin) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client joins a service room
    socket.on('join:service', ({ serviceId }) => {
      if (serviceId) {
        socket.join(`service:${serviceId}`);
      }
    });

    // Client joins a personal token room
    socket.on('join:token', ({ tokenId }) => {
      if (tokenId) {
        socket.join(`token:${tokenId}`);
      }
    });

    socket.on('leave:service', ({ serviceId }) => {
      if (serviceId) {
        socket.leave(`service:${serviceId}`);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitQueueUpdated(serviceId) {
  if (io && serviceId) {
    const sId = String(serviceId);
    io.to(`service:${sId}`).emit('queue:updated', { serviceId: sId });
  }
}

function emitTokenNotify(tokenId, type, message) {
  if (io && tokenId) {
    const tId = String(tokenId);
    io.to(`token:${tId}`).emit('token:notify', { tokenId: tId, type, message });
  }
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdated,
  emitTokenNotify,
};

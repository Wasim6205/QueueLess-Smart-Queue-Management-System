const { Server } = require('socket.io');

let io = null;

function initSocket(server, clientOrigin) {
  io = new Server(server, {
    cors: {
      origin: clientOrigin || 'http://localhost:5173',
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
  });

  return io;
}

function getIO() {
  return io;
}

function emitQueueUpdated(serviceId) {
  if (io && serviceId) {
    io.to(`service:${serviceId}`).emit('queue:updated', { serviceId });
  }
}

function emitTokenNotify(tokenId, type, message) {
  if (io && tokenId) {
    io.to(`token:${tokenId}`).emit('token:notify', { tokenId, type, message });
  }
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdated,
  emitTokenNotify,
};


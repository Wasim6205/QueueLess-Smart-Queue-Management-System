import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export default function ConnectionIndicator() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-surface/80 border border-line text-ink backdrop-blur-xs select-none"
      title={isConnected ? 'Connected to real-time server' : 'Reconnecting to real-time server…'}
    >
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isConnected ? 'bg-mint-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span className="text-[11px] font-semibold text-ink/80">
        {isConnected ? 'Live' : 'Connecting…'}
      </span>
    </div>
  );
}

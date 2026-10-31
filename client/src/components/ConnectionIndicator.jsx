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
    <div className="flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
        }`}
      />
      <span className={isConnected ? 'text-slate-700' : 'text-amber-700'}>
        {isConnected ? 'Live' : 'Connecting…'}
      </span>
    </div>
  );
}


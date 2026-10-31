import { useState, useEffect, useCallback, useRef } from 'react';
import { tokensApi, getErrorMessage } from '../api/client';
import { socket } from '../lib/socket';

export function useToken(tokenId, onNotify) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const onNotifyRef = useRef(onNotify);
  const serviceIdRef = useRef(null);

  useEffect(() => {
    onNotifyRef.current = onNotify;
  }, [onNotify]);

  const fetchToken = useCallback(async (isInitial = false) => {
    if (!tokenId) return;
    const currentReqId = ++requestIdRef.current;
    if (isInitial) setLoading(true);

    try {
      const details = await tokensApi.getById(tokenId);
      if (currentReqId === requestIdRef.current) {
        setData(details);
        setError(null);
        if (details?.token?.service) {
          const sId = details.token.service._id || details.token.service;
          serviceIdRef.current = sId;
          socket.emit('join:service', { serviceId: sId });
        }
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (currentReqId === requestIdRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, [tokenId]);

  useEffect(() => {
    if (!tokenId) return;

    fetchToken(true);

    function joinRooms() {
      socket.emit('join:token', { tokenId });
      if (serviceIdRef.current) {
        socket.emit('join:service', { serviceId: serviceIdRef.current });
      }
    }

    joinRooms();

    function onQueueUpdated(payload) {
      if (!payload?.serviceId || payload.serviceId === serviceIdRef.current) {
        fetchToken(false);
      }
    }

    function onTokenNotify(payload) {
      if (payload?.tokenId === tokenId) {
        if (payload.type === 'CALLED' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(200);
          } catch (e) {
            // vibration not supported / disallowed
          }
        }
        if (onNotifyRef.current) {
          onNotifyRef.current(payload);
        }
        fetchToken(false);
      }
    }

    socket.on('queue:updated', onQueueUpdated);
    socket.on('token:notify', onTokenNotify);
    socket.on('connect', joinRooms);

    return () => {
      socket.off('queue:updated', onQueueUpdated);
      socket.off('token:notify', onTokenNotify);
      socket.off('connect', joinRooms);
    };
  }, [tokenId, fetchToken]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchToken(false),
  };
}

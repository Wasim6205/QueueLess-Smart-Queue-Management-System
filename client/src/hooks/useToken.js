import { useState, useEffect, useCallback, useRef } from 'react';
import { tokensApi, getErrorMessage } from '../api/client';
import { socket } from '../lib/socket';

export function useToken(tokenId, onNotify) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const onNotifyRef = useRef(onNotify);

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
      if (data?.token?.service) {
        socket.emit('join:service', { serviceId: data.token.service });
      }
    }

    joinRooms();

    function onQueueUpdated(payload) {
      if (!payload?.serviceId || payload.serviceId === data?.token?.service) {
        fetchToken(false);
      }
    }

    function onTokenNotify(payload) {
      if (payload?.tokenId === tokenId) {
        if (payload.type === 'CALLED' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(200);
          } catch (e) {
            // ignore if unsupported/blocked
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
  }, [tokenId, data?.token?.service, fetchToken]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchToken(false),
  };
}


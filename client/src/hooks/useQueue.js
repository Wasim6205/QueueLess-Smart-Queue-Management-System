import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, getErrorMessage } from '../api/client';
import { socket } from '../lib/socket';

export function useQueue(serviceId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fetchQueue = useCallback(async (isInitial = false) => {
    if (!serviceId) return;
    const currentReqId = ++requestIdRef.current;
    if (isInitial) setLoading(true);

    try {
      const snapshot = await adminApi.getQueue(serviceId);
      if (currentReqId === requestIdRef.current) {
        setData(snapshot);
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
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) return;

    fetchQueue(true);

    function joinRoom() {
      socket.emit('join:service', { serviceId });
    }

    joinRoom();

    function onQueueUpdated(payload) {
      if (!payload?.serviceId || payload.serviceId === serviceId) {
        fetchQueue(false);
      }
    }

    socket.on('queue:updated', onQueueUpdated);
    socket.on('connect', joinRoom);

    return () => {
      socket.emit('leave:service', { serviceId });
      socket.off('queue:updated', onQueueUpdated);
      socket.off('connect', joinRoom);
    };
  }, [serviceId, fetchQueue]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchQueue(false),
  };
}

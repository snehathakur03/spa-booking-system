import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useStore from '../store';
import { bookingsAPI } from '../api';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

export const useBookings = (date) => {
  const { setBookings, addBooking, updateBooking, removeBooking } = useStore();

  const query = useQuery({
    queryKey: ['bookings', date],
    queryFn: async () => {
      const resp = await bookingsAPI.list({ date, per_page: 2000 });
      const data = resp.data?.data || resp.data || [];
      setBookings(data);
      return data;
    },
    staleTime: 60000,
    retry: 2,
    onError: (err) => {
      logger.error('HOOK', 'Failed to fetch bookings', err);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onMutate: (data) => {
      // Optimistic add
      const tempId = `temp-${Date.now()}`;
      addBooking({ ...data, id: tempId, status: 'confirmed' });
      return { tempId };
    },
    onSuccess: (resp, vars, ctx) => {
      const real = resp.data?.data || resp.data;
      if (real?.id && ctx?.tempId) {
        removeBooking(ctx.tempId);
        addBooking(real);
      }
      toast.success('Booking created');
      logger.action('BOOKING_CREATED_SERVER', real);
    },
    onError: (err, vars, ctx) => {
      if (ctx?.tempId) removeBooking(ctx.tempId);
      toast.error(err.message || 'Failed to create booking');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookingsAPI.update(id, data),
    onMutate: ({ id, data }) => {
      // Snapshot old value
      const old = useStore.getState().bookingsMap[id];
      updateBooking(id, data);
      return { old, id };
    },
    onSuccess: () => toast.success('Booking updated'),
    onError: (err, vars, ctx) => {
      // Rollback
      if (ctx?.old) updateBooking(ctx.id, ctx.old);
      toast.error(err.message || 'Failed to update');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (data) => bookingsAPI.cancel(data),
    onMutate: ({ booking_id }) => {
      updateBooking(booking_id, { status: 'cancelled' });
    },
    onSuccess: () => toast.success('Booking cancelled'),
    onError: (err) => toast.error(err.message || 'Failed to cancel'),
  });

  return { query, createMutation, updateMutation, cancelMutation };
};

import { useMemo } from 'react';
import useStore from '../store';

const useFilteredBookings = () => {
  const bookings    = useStore((s) => s.bookings);
  const selectedDate = useStore((s) => s.selectedDate);
  const searchQuery  = useStore((s) => s.searchQuery);
  const statusFilter = useStore((s) => s.statusFilter);
  const therapistFilter = useStore((s) => s.therapistFilter);

  return useMemo(() => {
    return bookings.filter((b) => {
      const dateStr = b.start_time?.slice(0, 10);
      if (dateStr !== selectedDate) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (therapistFilter && b.therapist_id !== therapistFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.client?.name?.toLowerCase().includes(q) ||
          b.booking_ref?.toLowerCase().includes(q) ||
          b.therapist?.name?.toLowerCase().includes(q) ||
          b.service?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, selectedDate, searchQuery, statusFilter, therapistFilter]);
};

export default useFilteredBookings;

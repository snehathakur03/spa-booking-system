export const THERAPIST_COLORS = {
  female: '#EC4899',
  male: '#3B82F6',
  default: '#8B5CF6',
};

export const STATUS_COLORS = {
  confirmed: { bg: '#3B82F6', text: '#fff', label: 'Confirmed' },
  checkin: { bg: '#EC4899', text: '#fff', label: 'Check-in' },
  inprogress: { bg: '#EC4899', text: '#fff', label: 'In Progress' },
  cancelled: { bg: '#9CA3AF', text: '#fff', label: 'Cancelled' },
  completed: { bg: '#10B981', text: '#fff', label: 'Completed' },
  pending: { bg: '#F59E0B', text: '#fff', label: 'Pending' },
};

export const getTherapistColor = (gender) => {
  const g = (gender || '').toLowerCase();
  if (g === 'female' || g === 'f') return THERAPIST_COLORS.female;
  if (g === 'male' || g === 'm') return THERAPIST_COLORS.male;
  return THERAPIST_COLORS.default;
};

export const getStatusStyle = (status) => {
  const s = (status || '').toLowerCase().replace(/[\s-_]/g, '');
  return STATUS_COLORS[s] || STATUS_COLORS.confirmed;
};

export const getStatusBorderColor = (status) => getStatusStyle(status).bg;

export const BOOKING_STATUSES = Object.entries(STATUS_COLORS).map(([value, { label }]) => ({
  value,
  label,
}));

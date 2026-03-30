import {
  format,
  parseISO,
  addMinutes,
  differenceInMinutes,
  startOfDay,
  isSameDay,
  isValid,
} from 'date-fns';

export const SLOT_HEIGHT = 60; // px per hour
export const SLOT_MINUTES = 15;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 22;
export const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

export const formatTime = (date) => format(new Date(date), 'HH:mm');
export const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd');
export const formatDisplay = (date) => format(new Date(date), 'dd MMM yyyy');
export const formatDateTime = (date) => format(new Date(date), 'dd MMM yyyy HH:mm');

export const minutesFromDayStart = (dateStr) => {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes() - DAY_START_HOUR * 60;
};

export const topPosition = (dateStr) => {
  const mins = minutesFromDayStart(dateStr);
  return (mins / 60) * SLOT_HEIGHT;
};

export const blockHeight = (startStr, endStr) => {
  const mins = differenceInMinutes(new Date(endStr), new Date(startStr));
  return Math.max((mins / 60) * SLOT_HEIGHT, 20);
};

export const generateTimeSlots = () => {
  const slots = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push({ hour: h, minute: m, label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
    }
  }
  return slots;
};

export const snapToSlot = (y) => {
  const mins = (y / SLOT_HEIGHT) * 60;
  const snapped = Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  return snapped;
};

export const minsToTime = (date, mins) => {
  const d = startOfDay(new Date(date));
  return addMinutes(d, DAY_START_HOUR * 60 + mins);
};

export const parseDate = (str) => {
  if (!str) return null;
  const d = typeof str === 'string' ? parseISO(str) : new Date(str);
  return isValid(d) ? d : null;
};

export const isSameDate = (a, b) => isSameDay(new Date(a), new Date(b));

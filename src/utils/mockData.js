import { format, addMinutes, startOfDay } from 'date-fns';

const SERVICES = [
  { id: 1, name: 'Swedish Massage', duration: 60, price: 80 },
  { id: 2, name: 'Deep Tissue Massage', duration: 90, price: 110 },
  { id: 3, name: 'Hot Stone Therapy', duration: 75, price: 95 },
  { id: 4, name: 'Aromatherapy', duration: 60, price: 85 },
  { id: 5, name: 'Facial Treatment', duration: 45, price: 70 },
  { id: 6, name: 'Body Scrub', duration: 60, price: 75 },
  { id: 7, name: 'Reflexology', duration: 45, price: 65 },
  { id: 8, name: 'Thai Massage', duration: 90, price: 100 },
];

const FIRST_NAMES_F = ['Lily', 'Emma', 'Sophia', 'Olivia', 'Ava', 'Isabella', 'Mia', 'Luna', 'Grace', 'Zoe'];
const FIRST_NAMES_M = ['James', 'Liam', 'Noah', 'Oliver', 'Elijah', 'Lucas', 'Mason', 'Ethan', 'Aiden', 'Logan'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Chen', 'Patel'];
const STATUSES = ['confirmed', 'confirmed', 'confirmed', 'checkin', 'inprogress', 'cancelled', 'completed'];
const ROOMS = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Room ${i + 1}` }));

const rng = (max) => Math.floor(Math.random() * max);
const pick = (arr) => arr[rng(arr.length)];

export const generateTherapists = (count = 30) => {
  const therapists = [];
  for (let i = 0; i < count; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const names = gender === 'female' ? FIRST_NAMES_F : FIRST_NAMES_M;
    const firstName = names[i % names.length];
    const lastName = LAST_NAMES[rng(LAST_NAMES.length)];
    therapists.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      gender,
      specialization: pick(SERVICES).name,
      room: ROOMS[i % ROOMS.length],
    });
  }
  return therapists;
};

export const generateBookings = (therapists, date, count = 200) => {
  const bookings = [];
  const dayStart = startOfDay(new Date(date));

  for (let i = 0; i < count; i++) {
    const therapist = therapists[rng(therapists.length)];
    const service = pick(SERVICES);
    const startHour = 8 + rng(12);
    const startMin = pick([0, 15, 30, 45]);
    const startTime = addMinutes(dayStart, startHour * 60 + startMin);
    const endTime = addMinutes(startTime, service.duration);

    const clientFirst = pick(['Alice', 'Bob', 'Carol', 'Dan', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']);
    const clientLast = pick(LAST_NAMES);

    bookings.push({
      id: 1000 + i,
      booking_ref: `BK${String(10000 + i).padStart(5, '0')}`,
      therapist_id: therapist.id,
      therapist: therapist,
      client: { id: 500 + i, name: `${clientFirst} ${clientLast}`, phone: `+1${rng(9000000000) + 1000000000}` },
      service,
      service_id: service.id,
      room: therapist.room,
      room_id: therapist.room.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: pick(STATUSES),
      notes: rng(3) === 0 ? 'Sensitive skin, use hypoallergenic oils.' : '',
      request_type: pick(['Standard', 'VIP', 'Couple', 'Corporate']),
      created_at: new Date().toISOString(),
    });
  }

  return bookings;
};

export const MOCK_SERVICES = SERVICES;
export const MOCK_ROOMS = ROOMS;
export const MOCK_CLIENTS = Array.from({ length: 50 }, (_, i) => ({
  id: 500 + i,
  name: `Client ${i + 1}`,
  phone: `+1${rng(9000000000) + 1000000000}`,
  email: `client${i + 1}@example.com`,
}));

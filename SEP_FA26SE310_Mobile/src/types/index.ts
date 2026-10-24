export type TabKey = 'home' | 'bookings' | 'profile';
export type AppRole = 'student' | 'driver' | 'bus-attendant' | 'lecturer';

export type ReservationStatus = 'booked' | 'waitlist' | 'boarded';

export interface Trip {
  id: string;
  from: string;
  to: string;
  time: string;
  arrival: string;
  date: string;
  slot: number;
  bus: string;
  seats: number;
  totalSeats: number;
  status?: ReservationStatus;
}

export interface UserProfile {
  name: string;
  email: string;
  preferredStop: string;
  preferredStopId?: number;
}

export type ReservationResult = 'booked' | 'waitlist' | 'already-reserved' | 'not-found';

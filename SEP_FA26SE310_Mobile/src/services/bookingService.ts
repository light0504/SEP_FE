import { ReservationResult, Trip } from '../types';

export function reserveSeat(trips: Trip[], tripId: string): { trips: Trip[]; result: ReservationResult } {
  const selected = trips.find((trip) => trip.id === tripId);
  if (!selected) return { trips, result: 'not-found' };
  if (selected.status) return { trips, result: 'already-reserved' };

  if (selected.seats <= 0) {
    return {
      trips: trips.map((trip) => trip.id === tripId ? { ...trip, status: 'waitlist' as const } : trip),
      result: 'waitlist',
    };
  }

  return {
    trips: trips.map((trip) => trip.id === tripId ? { ...trip, seats: trip.seats - 1, status: 'booked' as const } : trip),
    result: 'booked',
  };
}

export function cancelReservation(trips: Trip[], tripId: string): Trip[] {
  return trips.map((trip) => {
    if (trip.id !== tripId || !trip.status || trip.status === 'boarded') return trip;
    const seats = trip.status === 'booked' ? Math.min(trip.totalSeats, trip.seats + 1) : trip.seats;
    return { ...trip, seats, status: undefined };
  });
}

export function checkIn(trips: Trip[], tripId: string): Trip[] {
  return trips.map((trip) => trip.id === tripId && trip.status === 'booked'
    ? { ...trip, status: 'boarded' as const }
    : trip);
}

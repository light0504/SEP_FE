export interface TripStop {
  tripStopId: number; stopId: number; name: string; position: number; arrivalAt: string;
}
export interface StudentTrip {
  tripId: number; tripCode: string; routeId: number; routeName: string; date: string; time: string;
  arrivalTime: string; slot: number; vehicle: string; driver: string; capacity: number;
  availableSeats: number; status: string; stops: TripStop[];
}
export interface AvailableSeat { seatId: number; seatCode: string; status: 'AVAILABLE' | 'BOOKED' }
export interface TripSearch {
  date: string; routeId: number; boardingStopId: number; alightingStopId: number; slot?: number;
}
export interface CreateBooking {
  tripId: number; boardingTripStopId: number; alightingTripStopId: number; seatId: number; idempotencyKey: string;
}

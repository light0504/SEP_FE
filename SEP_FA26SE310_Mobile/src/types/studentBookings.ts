export interface StudentBooking {
  bookingId: number;
  bookingCode: string;
  tripId: number;
  tripCode: string;
  boardingStopId: number;
  boardingStop: string;
  alightingStopId: number;
  alightingStop: string;
  seatId: number;
  seatCode: string;
  status: string;
  reservedAt: string;
  checkedInAt: string | null;
  cancelledAt: string | null;
  departureAt?: string;
}

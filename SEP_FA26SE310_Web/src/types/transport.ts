export interface StopInfo { stopId: number; stopCode: string; name: string; address: string; offsetMinutes?: number }
export interface ApiRoute { routeId: number; routeCode: string; name: string; stops: StopInfo[] }
export interface ApiTrip {
  tripId: number; tripCode: string; routeId: number; routeName: string; date: string; time: string;
  arrivalTime: string; slot: number; vehicle: string; driver: string; capacity: number; booked: number;
  status: 'SCHEDULED' | 'PAUSED'; availableSeats: number;
  vehicleId: number | null; driverId: number | null; busAttendantId: number | null; busAttendant: string | null;
  stops: { tripStopId: number; stopId: number; name: string; position: number; arrivalAt: string }[];
}
export interface StaffMember { userId: number; fullName: string; email: string; role: 'DRIVER' | 'BUS_ATTENDANT' }
export interface Vehicle {
  vehicleId: number; licensePlate: string; capacity: number; driverId: number; driverName: string;
  busAttendantId: number | null; busAttendantName: string | null; status: 'ACTIVE' | 'INACTIVE';
}

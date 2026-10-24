import type { RouteInfo, Trip } from './types'

export const initialTrips: Trip[] = [
  { id: 'TR-2401', route: 'FU HCM → FU Tân Uyên', date: '2026-10-14', time: '07:00', vehicle: '51B-123.45', driver: 'Nguyễn Minh Anh', booked: 38, capacity: 45, status: 'Đang hoạt động' },
  { id: 'TR-2402', route: 'FU Tân Uyên → FU HCM', date: '2026-10-14', time: '08:00', vehicle: '51B-678.90', driver: 'Trần Quốc Bảo', booked: 42, capacity: 45, status: 'Sắp khởi hành' },
  { id: 'TR-2403', route: 'FU HCM → FU Tân Uyên', date: '2026-10-14', time: '09:30', vehicle: '51B-246.80', driver: 'Lê Thu Hà', booked: 29, capacity: 40, status: 'Sắp khởi hành' },
  { id: 'TR-2404', route: 'FU Tân Uyên → FU HCM', date: '2026-10-14', time: '11:00', vehicle: '51B-123.45', driver: 'Nguyễn Minh Anh', booked: 35, capacity: 45, status: 'Đang hoạt động' },
  { id: 'TR-2405', route: 'FU HCM → FU Tân Uyên', date: '2026-10-15', time: '07:00', vehicle: '51B-678.90', driver: 'Trần Quốc Bảo', booked: 0, capacity: 45, status: 'Tạm dừng' },
]

export const initialRoutes: RouteInfo[] = [
  { id: 'RT-01', name: 'FU HCM — FU Tân Uyên', code: 'HCM-TU', stops: ['FU HCM', 'Điểm đón trung chuyển', 'FU Tân Uyên'], duration: 'Chưa thiết lập', buses: 4 },
  { id: 'RT-02', name: 'FU Tân Uyên — FU HCM', code: 'TU-HCM', stops: ['FU Tân Uyên', 'Điểm đón trung chuyển', 'FU HCM'], duration: 'Chưa thiết lập', buses: 4 },
]

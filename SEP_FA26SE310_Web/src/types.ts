export type Page = 'overview' | 'trips' | 'routes' | 'reports' | 'users' | 'vehicles'

export type Trip = {
  id: string
  route: string
  date: string
  time: string
  vehicle: string
  driver: string
  booked: number
  capacity: number
  status: 'Đang hoạt động' | 'Sắp khởi hành' | 'Tạm dừng'
}

export type RouteInfo = { id: string; name: string; code: string; stops: string[]; duration: string; buses: number }

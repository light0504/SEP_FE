# Fbus Mobile

React Native, Expo và TypeScript. Mobile kết nối backend Spring Boot tại `../../Temp_BE/SEP_FA26SE310_BE` để học sinh tìm chuyến và đặt chỗ.

## Chạy

Thư mục: `E:\SEP_FE\SEP_FA26SE310_Mobile`.

```powershell
npm ci
Copy-Item .env.example .env
# Sửa địa chỉ API trong .env
npm start
```

Node.js 22.13+. Mặc định API là `http://10.0.2.2:8081/api` trên Android emulator, `http://localhost:8081/api` trên nền tảng khác. Điện thoại thật phải đặt `EXPO_PUBLIC_API_BASE_URL=http://<IP-LAN-máy-tính>:8081/api` và dùng cùng mạng. Nếu cần, cho phép cổng 8081 trong Windows Firewall trên mạng riêng. Khởi động lại Expo sau khi sửa .env.

Máy hiện tại: API `http://192.168.1.83:8081/api`; Expo Go mở `exp://192.168.1.83:8082`. Cổng 8082 phục vụ app, cổng 8081 phục vụ backend. Sau khi đổi cấu hình, chạy lại Expo với `npx expo start --lan --port 8082 --clear`, đóng hẳn Expo Go rồi mở lại đường dẫn để nhận bản mới. Nếu máy tính đổi IP LAN, cập nhật `.env`. Kiểm tra đường kết nối trên trình duyệt điện thoại bằng `http://192.168.1.83:8081/api/health`.

Backend dev: `student` / `Student@12345`, `lecturer` / `Lecturer@12345`, `driver` / `Driver@12345`, `attendant` / `Attendant@12345`. Bấm đăng nhập bằng tài khoản/mật khẩu để dùng API thật. STUDENT và LECTURER dùng luồng đặt chỗ; DRIVER và BUS_ATTENDANT xem chuyến được phân công.

## Cấu trúc

- `src/screens/TripSearchScreen.tsx`: lọc và tìm chuyến.
- `src/screens/SeatBookingScreen.tsx`: ghế và xác nhận đặt chỗ.
- `src/screens/BookingsScreen.tsx`: lịch sử, hủy đặt chỗ.
- `src/services/studentTripService.ts`: tìm chuyến, ghế, tạo booking.
- `src/services/studentBookingService.ts`: lịch sử booking.
- `src/services/apiClient.ts`: URL cấu hình, bearer token, retry sau refresh.
- `src/components/CalendarDatePicker.tsx`: lịch dùng chung.
- `src/context/AppContext.tsx`: phiên đăng nhập và luồng demo.

Hợp đồng đang dùng: [Backend API](../../Temp_BE/SEP_FA26SE310_BE/docs/API.md). Các file trong `docs/api` ghi lại API Render cũ được giữ để tham khảo; trạng thái pending trong tài liệu lịch sử không áp dụng cho backend local mới.

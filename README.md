# Fbus

Hệ thống xe bus FU HCM ↔ FU Tân Uyên gồm 3 dự án:

| Dự án | Công nghệ | Hướng dẫn |
| --- | --- | --- |
| SEP_FA26SE310_BE | Spring Boot 3.5.16, Java 21, JDBC, Flyway | [Backend](../Temp_BE/SEP_FA26SE310_BE/README.md) |
| SEP_FA26SE310_Web | React, Vite, TypeScript | [Admin web](SEP_FA26SE310_Web/README.md) |
| SEP_FA26SE310_Mobile | React Native, Expo, TypeScript | [Mobile](SEP_FA26SE310_Mobile/README.md) |

## Vị trí dự án

- Frontend: `E:\SEP_FE` (web và mobile).
- Backend: `E:\Temp_BE\SEP_FA26SE310_BE`.
- Java/Maven portable: `E:\Temp_BE\.tools`.
- Backend và frontend là hai repository riêng.

## Khởi chạy

1. Trong `E:\Temp_BE\SEP_FA26SE310_BE`: `./run.ps1 -Build` (JDK 21/Maven hoặc bộ công cụ portable local). API ở cổng 8081, database H2 lưu file. Có thể dùng Docker/PostgreSQL theo hướng dẫn backend.
2. Trong `E:\SEP_FE\SEP_FA26SE310_Web`: `npm ci`, `npm run dev`. URL API mặc định `http://localhost:8081/api`.
3. Trong `E:\SEP_FE\SEP_FA26SE310_Mobile`: `npm ci`, sao chép `.env.example` thành `.env`, cấu hình địa chỉ API, `npm start`.

Tài khoản dev: admin / Admin@12345 trên web; student / Student@12345 trên mobile. Google OAuth vẫn chưa tích hợp; chọn đăng nhập tài khoản/mật khẩu để dùng backend.

Admin tạo tài khoản nhân sự → xe với biển số/số ghế/tài xế/bus attendant → tuyến → chọn xe và nhiều ngày tạo chuyến. Lịch quản lý hiển thị theo tuần và slot, bấm ô xem chi tiết. Student/lecturer đặt chỗ trên mobile; driver/bus attendant xem các chuyến được phân công. Các vai trò được kiểm tra ở server. Chiều ngược được tạo thành tuyến riêng.

Điện thoại thật cần địa chỉ LAN của máy chạy backend, không dùng localhost. Android emulator dùng 10.0.2.2. Đổi API bằng `VITE_API_BASE_URL` (web) hoặc `EXPO_PUBLIC_API_BASE_URL` (mobile); khởi động lại dev server sau khi đổi.

Admin vào **Người dùng → Email được phép** để tải mẫu và nhập Excel danh sách email (Email bắt buộc; Họ tên/Vai trò tùy chọn, mặc định STUDENT). Hỗ trợ .xlsx/.xls, tối đa 2 MB / 2.000 dòng, bỏ qua trùng cùng vai trò và báo lỗi từng dòng. Nhập chỉ cấp quyền email, không tạo mật khẩu hay tự xác thực người dùng.

Xem [hợp đồng API](../Temp_BE/SEP_FA26SE310_BE/docs/API.md). API mới độc lập với API Render trước đây; dữ liệu cũ không tự chuyển sang database mới. Google OAuth, check-in/điểm danh, danh sách chờ tự động và báo cáo chưa được nối backend. Tài khoản dev bổ sung: driver / Driver@12345, attendant / Attendant@12345, lecturer / Lecturer@12345.

Java/Maven portable trong `E:\Temp_BE\.tools`, thư viện cài đặt, file database, target/dist và secret được bỏ qua bởi Git. Quy ước UI trong [AGENTS.md](AGENTS.md) áp dụng cho cả các trang hiện tại và sau này.

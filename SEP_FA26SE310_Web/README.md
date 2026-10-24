# Fbus Admin Web

React, TypeScript và Vite. Đăng nhập với role ADMIN, tạo điểm dừng, tuyến và chuyến qua backend Spring Boot tại `../../Temp_BE/SEP_FA26SE310_BE`.

## Chạy

Thư mục: `E:\SEP_FE\SEP_FA26SE310_Web`.

```powershell
npm ci
npm run dev
```

API mặc định `http://localhost:8081/api`; đổi bằng `VITE_API_BASE_URL` trong `.env` theo `.env.example`, sau đó khởi động lại Vite. Backend local cần chạy trước. Node.js 22.13+.

Profile backend dev: `admin` / `Admin@12345`. Google là giao diện đăng nhập chính nhưng chưa có OAuth; nút tài khoản/mật khẩu dùng API thật. Không có FEID hoặc chọn cơ sở. Web từ chối tài khoản thiếu role ADMIN; backend cũng kiểm tra quyền trên mọi endpoint.

## Tính năng

- Tổng quan: số tuyến, chuyến, điểm dừng và tổng mức chiếm chỗ cao nhất trên từng chuyến từ dữ liệu thật.
- Tuyến & điểm dừng: tạo điểm với mã/tên/địa chỉ; tạo tuyến với thứ tự điểm và số phút từ điểm đầu. Tạo tuyến riêng cho chiều ngược.
- Quản lý xe: tạo/sửa biển số, số ghế, tài xế và bus attendant mặc định; ngừng sử dụng xe.
- Quản lý chuyến: nhập biển số, số ghế, tài xế và bus attendant; có thể chọn xe có sẵn để điền các ô rồi chỉnh lại. Gợi ý nhân sự liên kết tài khoản theo ID; vẫn cho nhập tên thủ công. Chọn nhiều ngày (tối đa 90), giờ và slot 1–6. Cả lần tạo bị từ chối nếu một ngày trùng lịch xe hoặc nhân sự.
- Lịch tuần: 7 ngày × 6 slot, chuyển tuần hoặc chọn tuần theo ngày; mỗi ô hiển thị số chuyến và số chuyến tạm dừng. Bấm ô xem giờ, tuyến, xe, nhân sự, điểm dừng và tạm dừng/mở lại.
- Người dùng: danh sách có phân trang; tạo tài khoản DRIVER, BUS_ATTENDANT, LECTURER và STUDENT.
- Người dùng → Email được phép: tải mẫu Excel, nhập email từ .xlsx/.xls (2 MB / 2.000 dòng); phân trang danh sách, báo số dòng đã thêm/trùng/lỗi và số dòng Excel cần sửa. File mẫu gồm Email bắt buộc, Họ tên và Vai trò tùy chọn; vai trò trống dùng STUDENT. Không cấp ADMIN hoặc ghi đè quyền qua import.
- Làm mới access token, đăng xuất session, hiển thị lỗi và trạng thái tải.
- Báo cáo: chưa khả dụng, không hiển thị số liệu mẫu như dữ liệu thật.

Dữ liệu tuyến, chuyến, xe và phân công nhân sự được lưu trong backend. Mỗi chuyến giữ snapshot tại thời điểm tạo; chỉnh các ô trong form chuyến không sửa mặc định xe, sửa xe không thay đổi chuyến cũ. Tên nhân sự chưa liên kết tài khoản chỉ được lưu trên chuyến, không tạo phân công cho tài khoản mobile. Import Excel cấp quyền email, không tạo tài khoản hoặc mật khẩu. Login Google và sửa tuyến chưa khả dụng. Tải mẫu dùng Bearer token và hỗ trợ refresh; import gửi multipart, không tự đặt Content-Type.

## Cấu trúc

- `src/App.tsx`: phiên đăng nhập và điều hướng.
- `src/pages/OperationsPage.tsx`: tạo/xem điểm, tuyến, chuyến.
- `src/pages/UsersPage.tsx`: người dùng và phân trang.
- `src/pages/VehiclesPage.tsx`: quản lý xe và nhân sự mặc định.
- `src/components/TripCreateForm.tsx`, `MultiDatePicker.tsx`, `WeeklyTripCalendar.tsx`: chọn xe, chọn nhiều ngày, lịch tuần và chi tiết slot.
- `src/components/Modal.tsx`: hộp thoại có giữ focus và phím Escape.
- `src/services/`: API có xác thực, refresh và auth.
- `src/types/transport.ts`: kiểu dữ liệu tuyến/chuyến từ backend.

Hợp đồng hiện tại: [Backend API](../../Temp_BE/SEP_FA26SE310_BE/docs/API.md). Tài liệu API Render và thiết kế database cũ được giữ để tham khảo; Flyway trong backend là schema đang chạy. Token chỉ nằm trong bộ nhớ trình duyệt, tải lại trang cần đăng nhập lại.

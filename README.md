# Xiaomi HR – Quản lý nhân sự chuỗi cửa hàng

## Chạy trên máy tính
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Mở http://localhost:8080. Camera và GPS chỉ hoạt động trên `localhost` hoặc `https://`.

## Dùng trên điện thoại
Đưa cả thư mục lên một hosting có HTTPS (Netlify Drop, GitHub Pages, Vercel...). Trên điện thoại mở link rồi chọn "Thêm vào màn hình chính".

## Tài khoản dùng thử
| Tài khoản | Mật khẩu | Quyền |
|---|---|---|
| admin | admin123 | Quản trị toàn chuỗi |
| hung | 123456 | Quản lý Xiaomi Hoàng Văn Thụ |
| mai | 123456 | Nhân viên |

## Cần làm trước khi dùng thật
1. **Phòng ban & vị trí**: sửa tọa độ GPS từng cửa hàng (bấm "Lấy vị trí hiện tại" khi đứng tại cửa hàng).
2. **Hồ sơ nhân sự**: đăng ký "Ảnh mẫu" khuôn mặt cho từng người.
3. **Công thức lương**: chỉnh lại các mẫu lương cho đúng chính sách công ty.
4. Đổi mật khẩu các tài khoản mẫu.

## Giới hạn của bản này
- Dữ liệu lưu trong trình duyệt (localStorage, khoảng 5 MB), **mỗi máy một bản riêng**, chưa đồng bộ giữa các máy. Sao lưu tại Cài đặt → Sao lưu dữ liệu.
- Mật khẩu lưu dạng chữ thường trong trình duyệt, chỉ phù hợp để dùng thử.
- Để nhiều nhân viên dùng chung cần nối backend (Supabase / Firebase).

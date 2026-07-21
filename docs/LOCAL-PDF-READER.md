# PDF reader local

1. Tên file bắt buộc: `dac-nhan-tam.pdf`.
2. Vị trí: `backend/storage/private/ebooks/dac-nhan-tam.pdf`.
3. Chỉ `dac-nhan-tam.pdf` được `.gitignore` cho phép theo dõi để phục vụ demo; mọi PDF khác trong thư mục vẫn bị chặn. Không chuyển PDF sang `frontend/public`.
4. Tự chạy `npm run seed:dac-nhan-tam` khi đã nạp `DATABASE_URL` hoặc `MONGODB_URI` vào terminal.
5. Đăng nhập, mở `/books/dac-nhan-tam`, dùng PayOS hoặc nút cấp quyền local trong development, rồi mở thư viện.

Reader gọi session metadata trước, sau đó PDF.js gửi request có Bearer token tới API content. Backend kiểm tra `ReadingRight`, giải quyết `objectKey` bên trong storage root, trả `206 Partial Content` khi có Range. Tiến độ được debounce và lưu theo trang; watermark chỉ là overlay động, không tạo bản sao PDF cho từng người.

`BookStorage` là ranh giới thay thế provider. Khi chuyển S3, thêm provider trả stream/range tương đương và đổi binding trong `StorageModule`; schema, quyền đọc và frontend không cần viết lại.

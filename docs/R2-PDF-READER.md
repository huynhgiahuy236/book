# Cloudflare R2 PDF reader

PDF sách được lưu trong private R2 bucket. Credential chỉ tồn tại ở backend; frontend luôn đọc qua API NestJS sau khi kiểm tra JWT và `ReadingRight`.

## Đắc Nhân Tâm hiện có

Object hiện tại trong bucket: `ebooks/Dac Nhan Tam.pdf`.

Seed `backend/scripts/seed-dac-nhan-tam.mjs` liên kết object này bằng `ebookFile.objectKey`. Sau khi tự chạy seed, admin có thể preview tại `/read/dac-nhan-tam` nếu tài khoản có role `ADMIN`.

## Upload từ Admin

1. Mở `/admin` bằng tài khoản ADMIN.
2. Tại dòng sách cần quản lý, chọn **Tải PDF** hoặc **Thay PDF**.
3. Chọn một file PDF hợp lệ.
4. Backend kiểm tra MIME, đuôi file, magic bytes và dung lượng rồi tải lên R2.

Upload mới dùng key có phiên bản: `ebooks/<slug>/<slug>-<timestamp>.pdf`. File cũ chỉ bị xóa sau khi file mới đã upload và metadata MongoDB đã lưu thành công.

Reader hỗ trợ HTTP Range qua backend. Bucket không cần và không nên bật public access.

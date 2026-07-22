# Biến môi trường CapstoneBook

Không đưa `.env`, access token, OTP, PDF bản quyền hoặc khóa PayOS lên Git. Root `.env` dành cho backend; `frontend/.env.local` chỉ chứa biến công khai bắt đầu bằng `NEXT_PUBLIC_`.

## Bắt buộc khi chạy local

| Biến | Loại | Lấy ở đâu | Tác dụng |
|---|---|---|---|
| `DATABASE_URL` hoặc `MONGODB_URI` | Bí mật | MongoDB local hoặc Atlas → Connect → Drivers | Kết nối database. Backend chấp nhận một trong hai tên để tương thích cấu hình cũ. |
| `JWT_ACCESS_SECRET` | Bí mật tự tạo | Chuỗi ngẫu nhiên ít nhất 24 ký tự | Ký access token ngắn hạn. |
| `JWT_REFRESH_SECRET` | Bí mật tự tạo | Chuỗi ngẫu nhiên khác access secret | Ký refresh token; token được lưu dạng hash trong `authsessions`. |
| `CLIENT_URL` | Cấu hình | Mặc định `http://localhost:3000` | CORS và redirect OAuth. |
| `NEXT_PUBLIC_API_URL` | Công khai | `http://localhost:4000/api/v1` | Frontend gọi NestJS. Chỉ đặt trong `frontend/.env.local`. |
| `BOOK_STORAGE_DRIVER` | Cấu hình | `r2` | Chọn Cloudflare R2 làm storage PDF private. |
| `R2_ACCOUNT_ID` | Bí mật backend | Không | Account ID Cloudflare. |
| `R2_ACCESS_KEY_ID` | Bí mật backend | Không | Access key của R2 API token. |
| `R2_SECRET_ACCESS_KEY` | Bí mật backend | Không | Secret của R2 API token. |
| `R2_BUCKET_NAME` | Cấu hình backend | Không | Bucket private chứa PDF. |
| `R2_ENDPOINT` | Cấu hình backend | Không | Endpoint account, không kèm bucket name. |
| `R2_REGION` | Cấu hình backend | `auto` | Region tương thích S3 của R2. |

Tạo JWT secret bằng trình tạo mật mã của hệ điều hành hoặc password manager. Hai secret phải khác nhau; không dùng ví dụ trong tài liệu cho môi trường thật.

## PayOS — cần mã từ nhà cung cấp

Đăng nhập PayOS, mở kênh thanh toán/tích hợp API và lấy `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. `PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` là URL frontend; webhook phải trỏ tới `POST /api/v1/payments/payos/webhook`. Return URL chỉ phục vụ UX, webhook đã kiểm chữ ký mới cấp `ReadingRight`.

`PAYOS_ENABLED=false` cho phép backend khởi động khi chưa cấu hình PayOS. Khi bật, cả ba credential phải có giá trị. Không đặt các biến PayOS ở frontend.

## Google OAuth — tùy chọn

Trong Google Cloud Console: tạo project → OAuth consent screen → Credentials → OAuth client ID kiểu Web application. Thêm redirect URI chính xác bằng `GOOGLE_CALLBACK_URL`, local mặc định là `http://localhost:4000/api/v1/auth/google/callback`. Copy client ID/secret vào backend `.env`.

## Gmail OTP — tùy chọn

Bật Gmail API trong cùng Google Cloud project, tạo OAuth client và lấy refresh token có scope gửi email. Cấu hình `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`, sau đó bật `EMAIL_ENABLED=true`. Backend hash OTP, giới hạn năm lần thử và không log mã.

## OpenAI — tùy chọn

Tạo API key trong trang quản trị OpenAI, đặt `OPENAI_API_KEY` ở backend và bật `AI_ENABLED=true`. Frontend không bao giờ nhận key. Chatbot chỉ được cung cấp catalog lấy từ MongoDB và trả `bookId` có thật.

## Mặc định an toàn

Các biến `PORT`, `TZ`, thời hạn JWT, `PAYOS_PAYMENT_EXPIRES_MINUTES`, `AI_MAX_OUTPUT_TOKENS`, `AI_REQUEST_TIMEOUT_MS` có mặc định trong `.env.example`. Secret, Mongo URI và credential nhà cung cấp luôn phải tự cấp.

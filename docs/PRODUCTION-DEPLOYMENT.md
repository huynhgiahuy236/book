# Cấu hình production CapstoneBook

## URL công khai

Backend:

```env
CLIENT_URL=https://book-frontend-mocha-rho.vercel.app
BACKEND_URL=https://kkh34qrhp0.execute-api.ap-southeast-1.amazonaws.com
PAYOS_RETURN_URL=https://book-frontend-mocha-rho.vercel.app/payment/payos/success
PAYOS_CANCEL_URL=https://book-frontend-mocha-rho.vercel.app/payment/payos/cancel
PAYOS_WEBHOOK_URL=https://kkh34qrhp0.execute-api.ap-southeast-1.amazonaws.com/api/v1/payments/payos/webhook
```

Frontend Vercel:

```env
NEXT_PUBLIC_API_URL=https://kkh34qrhp0.execute-api.ap-southeast-1.amazonaws.com/api/v1
```

Không đưa credential PayOS, R2, MongoDB, JWT hoặc Cloudinary vào frontend.

## PayOS webhook

Đăng ký URL sau trong PayOS Dashboard:

```text
https://kkh34qrhp0.execute-api.ap-southeast-1.amazonaws.com/api/v1/payments/payos/webhook
```

Trang success chỉ hiển thị trạng thái. Chỉ webhook đã xác minh chữ ký mới được cập nhật đơn và cấp quyền đọc.

## Smoke test sau deploy

1. Kiểm tra frontend trả HTTP 200.
2. Kiểm tra `GET /api/v1` trả `status: ok`.
3. Đăng nhập tài khoản admin và mở từng route `/admin/*`.
4. Kiểm tra `GET /payments/payos/admin/config-status` bằng admin JWT.
5. Tạo một giao dịch PayOS giá trị nhỏ trên môi trường được phép.
6. Xác nhận webhook đổi Order sang `PAID` đúng một lần.
7. Xác nhận một ReadingRight được tạo và không bị trùng.
8. Xác nhận Gift vật lý bị trừ đúng một lần nếu đơn có quà.
9. Hủy/refund trên môi trường thử nghiệm và xác nhận Gift được hoàn đúng một lần.

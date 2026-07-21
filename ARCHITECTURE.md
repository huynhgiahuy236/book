# Kiến trúc source CapstoneBook

## Nguyên tắc phụ thuộc

Frontend tuân theo hướng phụ thuộc:

```text
app → features → shared
```

- `app/` chỉ ghép route, metadata và feature component.
- Mỗi `features/<domain>` sở hữu component, dữ liệu và logic của domain đó.
- `shared/` không được import ngược từ một feature cụ thể.
- `app/globals.css` chỉ ghép các stylesheet trong `styles/`; selector không bị dồn vào route layer.
- Component dùng chung bên trong catalog, như `BookCover`, nằm cùng catalog thay vì đặt vào thư mục `components/` tổng hợp thiếu ngữ nghĩa.

Backend tuân theo hướng:

```text
controller → service → model/repository
```

- Mỗi miền nằm trong `src/modules/<domain>`.
- DTO chỉ nhận và validate dữ liệu đầu vào.
- Schema chỉ mô tả persistence.
- Controller không chứa nghiệp vụ.
- Service chịu trách nhiệm nghiệp vụ và gọi service của module khác qua export rõ ràng.
- `payments` gọi `LibraryService` sau khi xác minh giao dịch, không cấp quyền trong controller.

## Ranh giới bảo mật

- Frontend không giữ PayOS secret hoặc MongoDB URI.
- Backend luôn tra giá từ MongoDB, không tin giá gửi từ client.
- Reader phải qua JWT và ReadingRight.
- Redirect PayOS chỉ hiển thị trạng thái; webhook đã xác minh mới cấp quyền.
- Endpoint mua demo bị chặn khi `NODE_ENV=production`.

## Quy ước mở rộng

Khi thêm feature mới, tạo `frontend/src/features/<feature>` và `backend/src/modules/<feature>`. Không thêm logic nghiệp vụ vào `app/page.tsx`, `app.module.ts`, controller hoặc file tiện ích chung.

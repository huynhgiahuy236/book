# CapstoneBook

CapstoneBook gồm hai workspace rõ ràng:

- `frontend/`: Next.js, storefront, tài khoản, thư viện và PDF.js reader.
- `backend/`: NestJS, MongoDB, auth, PayOS, Cloudflare R2 private, quyền đọc và AI.

Tài liệu cấu hình chi tiết:

- [Biến môi trường](docs/ENVIRONMENT.md)
- [PDF reader trên R2](docs/R2-PDF-READER.md)

Vertical slice chính dùng ID/slug `dac-nhan-tam`. PDF đọc online được lưu trong Cloudflare R2 private bucket; backend proxy nội dung sau khi kiểm tra JWT và quyền đọc. Metadata được upsert bằng script `npm run seed:dac-nhan-tam` do người phát triển tự chạy sau khi cấu hình MongoDB.

Monorepo nhà sách và trình đọc Ebook, tổ chức thành đúng hai ứng dụng độc lập:

```text
CapstoneBook/
├── frontend/                 # Next.js 16 + React 19
│   ├── public/
│   └── src/
│       ├── app/              # Route và metadata, không chứa nghiệp vụ lớn
│       ├── features/         # Code theo miền nghiệp vụ
│       │   ├── auth/
│       │   ├── catalog/
│       │   ├── library/
│       │   └── reader/
│       ├── shared/           # API client và tiện ích dùng chung
│       └── styles/           # CSS tách theo vùng giao diện
├── backend/                  # NestJS + MongoDB + PayOS
│   ├── data/                 # Snapshot metadata sách dùng để seed
│   ├── scripts/              # Importer Open Library
│   ├── test/                 # E2E test
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── books/
│       │   ├── library/
│       │   └── payments/
│       ├── app.module.ts
│       └── main.ts
├── .env                      # Secret local, không commit
├── .env.example              # Danh sách biến môi trường
├── package.json              # Workspace scripts
└── ARCHITECTURE.md           # Quy tắc tổ chức source
```

## Chạy local

Yêu cầu MongoDB service đang chạy tại `127.0.0.1:27017`.

```powershell
npm install
npm run dev:backend
```

Mở terminal thứ hai:

```powershell
npm run dev:frontend
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api/v1`
- Catalog API: `http://localhost:4000/api/v1/books`

Backend ưu tiên `backend/.env.local`, sau đó mới đọc `.env` ở root. Frontend chỉ được phép nhận biến công khai qua `frontend/.env.local`.

## Luồng Ebook hoàn chỉnh

```text
Đăng ký/Đăng nhập → JWT → Chi tiết sách → Order
→ PayOS webhook hoặc test mua local → ReadingRight
→ Thư viện → Reader → ReadingProgress trong MongoDB
```

Các trang chính:

- `/auth`: đăng ký và đăng nhập.
- `/books/:id`: chi tiết và mua sách.
- `/library`: các Ebook đã được cấp quyền.
- `/read/:bookId`: reader có kiểm tra ReadingRight.
- `/read/demo`: reader công khai dùng thử.

Nút **Test mua local** chỉ hoạt động ngoài production. Redirect PayOS không tự cấp quyền; chỉ webhook hợp lệ hoặc endpoint development mới tạo ReadingRight.

## Dữ liệu sách

```powershell
npm run import:books
```

Importer ghi cùng một snapshot vào:

- `backend/data/books.real.json` để seed MongoDB.
- `frontend/src/features/catalog/data/books.real.json` để dựng catalog tĩnh nhanh.

Metadata và bìa đến từ Open Library. Giá, Premium và nội dung đọc là dữ liệu demo học thuật.

## Kiểm tra chất lượng

```powershell
npm run lint
npm run build
npm test
```

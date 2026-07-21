# Private ebook storage

Đặt file PDF demo chính xác tại:

`backend/storage/private/ebooks/dac-nhan-tam.pdf`

Thư mục này nằm ngoài `frontend/public` và nội dung ebook bị `.gitignore` loại khỏi Git. Backend chỉ đọc file thông qua `BookStorage`; trình duyệt nhận byte qua API có xác thực và hỗ trợ HTTP Range.

Khi chuyển sang S3, giữ nguyên `objectKey` trong MongoDB và cài provider S3 cho token `BOOK_STORAGE`; reader và nghiệp vụ quyền đọc không cần đổi.

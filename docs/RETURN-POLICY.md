# Chính sách đổi trả đề xuất cho CapstoneBook

Đây là cấu hình nghiệp vụ đề xuất, cần được chủ website/pháp chế duyệt trước khi công bố chính thức.

## Sách giấy và quà tặng vật lý

- Nhận yêu cầu trong 7 ngày từ lúc đơn được ghi nhận `DELIVERED`.
- Chấp nhận khi giao sai/thiếu sản phẩm hoặc quà, sản phẩm hư hỏng do vận chuyển, lỗi in ấn, hoặc không đúng mô tả.
- Người mua cung cấp mã đơn, mô tả và ảnh/video bằng chứng khi có thể.
- Sản phẩm cần còn nguyên trạng hợp lý, trừ lỗi phát sinh trước khi khách nhận.
- CapstoneBook chịu chi phí đổi trả khi lỗi thuộc người bán hoặc vận chuyển.
- Yêu cầu đổi ý cá nhân chỉ được giải quyết nếu chính sách chương trình cho phép và hàng còn nguyên vẹn.

## Ebook

- Không tự động hoàn tiền sau khi người dùng đã mở nội dung hoặc phát sinh tiến độ đọc, trừ lỗi kỹ thuật kéo dài, mua trùng hoặc giao sai quyền truy cập.
- Yêu cầu kỹ thuật cần được kiểm tra từ ReadingRight, ReadingProgress và audit log.
- Thu hồi quyền đọc chỉ thực hiện sau khi refund được xác nhận theo phương thức thanh toán thực tế.

## Quy trình

1. Người dùng gửi `ReturnRequest` với lý do và bằng chứng.
2. Admin kiểm tra đơn, trạng thái giao hàng, quyền đọc và lịch sử thanh toán.
3. Admin APPROVED hoặc REJECTED kèm lý do.
4. Khi APPROVED, Order chuyển `REFUNDED`; quà vật lý đã trừ được hoàn kho đúng một lần.
5. Việc chuyển tiền hoàn lại phải được xác nhận riêng; không xem thay đổi trạng thái nội bộ là bằng chứng ngân hàng đã hoàn tiền.

## Nguồn tham khảo

- Luật Bảo vệ quyền lợi người tiêu dùng 2023: https://vanban.chinhphu.vn/?docid=208363&pageid=27160
- Chính sách đổi/trả/hoàn tiền FAHASA: https://www.fahasa.com/doi-tra-hang
- Hướng dẫn bảo vệ người tiêu dùng trong thương mại điện tử của Bộ Công Thương: https://moit.gov.vn/bao-ve-nen-tang-tu-tuong-cua-dang/tang-cuong-bao-ve-nguoi-tieu-dung-tren-cac-hoat-dong-thuong-mai-dien-tu.html

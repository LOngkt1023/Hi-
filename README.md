# Lời nhắn tốt nghiệp

Website tĩnh dành cho Tran Hanh, từ Nguyen Long, ngày 11/08/2026. Màn hình terminal mở đầu phát nhạc sau thao tác người dùng, tiếp nối bằng Hero Editorial tech, phong bì và từng đoạn lời nhắn hiện nhẹ nhàng.

Không framework, dependency, backend, ảnh hoặc bước build. Nội dung thư dùng Google Font `Playwrite VN` hỗ trợ tiếng Việt, kèm system fallback khi font mạng chưa tải.

## Nhạc preview local

`index.html` đang chứa URL `https://philia093.com/assets/NewPage-Cdk3jmGc.mp3` trong `data-local-src`. JavaScript chỉ gán URL này khi mở file trực tiếp hoặc chạy qua `localhost`, `127.0.0.1`, `[::1]`; bản deploy không tải và không phát nguồn đó.

Metadata và giấy phép của file chưa được xác nhận. Không tải lại, phân phối hoặc bật trên production nếu chưa có quyền. Khi có MP3 hợp pháp, thay `data-local-src` bằng đường dẫn file tự host và ghi title, artist, license, attribution tại đây.

## Chạy trên máy

```bash
python -m http.server 8000
```

Mở `http://localhost:8000/`.

## Chỉnh nội dung

- Nội dung tĩnh và fallback khi JavaScript tắt nằm trong các `.message__line` tại `index.html`.
- `data-pause`: khoảng nghỉ sau mỗi đoạn được hiện, tính bằng mili giây.
- Màu chính nằm trong các biến đầu `styles.css`.

## Kiểm tra

```bash
node --check script.js
```

Mở `http://localhost:8000/?check=1` và xem Console. Không có `Assertion failed` nghĩa là cấu trúc chính hợp lệ.

Kiểm tra thủ công:

- Màn hình terminal nằm giữa viewport, click/chạm hoặc nhấn phím để vào hero và phát nhạc preview local.
- Nút **Nhạc** bật/tắt đúng; trên hostname production không có request tới `philia093.com` và nút nhạc không hiện.
- Xem headline cân giữa, không lệch hoặc tràn; marquee chạy liền mạch, không giật ở điểm nối.
- Chạm **Chạm để mở**, xem phong bì mở, tờ giấy trượt lên rồi lời nhắn viết tay hiện theo từng đoạn.
- Click vùng nền hoặc nhấn `Escape` để đóng; click trong thư không đóng.
- Câu `See you tomorrow ♪` hiện sau cùng, sau đó có nút **Xem lại**.
- Thử viewport 320 × 700, 390 × 844, xoay ngang và zoom 200%; chữ tiếng Việt không bị cắt hoặc tràn ngang.
- Bật `prefers-reduced-motion`: Hero đứng yên, marquee còn một dòng tĩnh, toàn bộ lời nhắn hiện ngay sau khi mở.
- Tắt JavaScript: lời nhắn đầy đủ vẫn đọc được.

## Triển khai

Đưa bốn file lên GitHub Pages, Vercel, Netlify hoặc hosting tĩnh bất kỳ. Toàn bộ đường dẫn là relative.

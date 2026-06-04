# Quorum-Based Distributed Locking – Global Profile Service

## Giới thiệu

Đồ án mô phỏng cơ chế **Quorum-Based Distributed Locking** trong hệ thống quản lý hồ sơ người dùng phân tán (Global Profile Service).

Dữ liệu hồ sơ người dùng được sao chép (replicate) trên **3 Site** khác nhau. Để cập nhật hồ sơ, hệ thống phải lấy được khóa (lock) từ **đa số Site (2/3)** trước khi thực hiện ghi dữ liệu.

Mục tiêu của đồ án là đánh giá khả năng duy trì hiệu năng của hệ thống khi:

* Một Site hoạt động bình thường (Healthy).
* Một Site bị chậm (Slow Node - 500ms).
* Một Site bị ngắt kết nối (Node Down).
* Không đạt đủ Quorum (Quorum Fail).

---

# Mục tiêu đề tài

Dataset:

```python
User_Profile = {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
}
```

Được sao chép trên 3 Site.

Yêu cầu:

* Muốn cập nhật hồ sơ phải lấy được lock từ đa số Site.
* Sử dụng cơ chế Quorum (2/3).
* Mô phỏng một Site có độ trễ 500ms.
* So sánh thời gian phản hồi giữa các kịch bản khác nhau.

---

# Kiến trúc hệ thống

```text
                    Client / Web UI
                            |
                            v
                    Quorum Manager
                            |
        -------------------------------------
        |                |                 |
        v                v                 v

      Site 1          Site 2           Site 3
      20ms            25ms             30ms

    UserProfile    UserProfile      UserProfile
```

Trong đó:

* Client gửi yêu cầu cập nhật hồ sơ.
* Quorum Manager chịu trách nhiệm lấy lock từ các Site.
* Mỗi Site lưu một bản sao của User Profile.

---

# Quy tắc Quorum

Hệ thống sử dụng:

```text
Write Quorum = 2/3
```

Điều này có nghĩa:

* Phải lấy được lock từ ít nhất 2 Site.
* Nếu chỉ lấy được lock từ 1 Site thì giao dịch thất bại.

Ví dụ:

```text
Site1 + Site2 = Thành công
Site1 + Site3 = Thành công
Site2 + Site3 = Thành công

Chỉ Site1 = Thất bại
```

---

# Các kịch bản mô phỏng

## 1. Healthy

Tất cả Site hoạt động bình thường.

```text
Site 1 = 20ms
Site 2 = 25ms
Site 3 = 30ms
```

Kết quả mong đợi:

* Đạt Quorum.
* Giao dịch thành công.
* Độ trễ thấp.

---

## 2. Slow Node

Site 3 bị chậm.

```text
Site 1 = 20ms
Site 2 = 25ms
Site 3 = 500ms
```

Kết quả mong đợi:

* Vẫn đạt Quorum bằng Site 1 và Site 2.
* Giao dịch thành công.
* Hiệu năng gần như không thay đổi.

---

## 3. Node Down

Site 3 bị ngắt kết nối.

```text
Site 1 = 20ms
Site 2 = 25ms
Site 3 = DOWN
```

Kết quả mong đợi:

* Vẫn đạt Quorum bằng Site 1 và Site 2.
* Giao dịch thành công.
* Hệ thống vẫn hoạt động ổn định.

---

## 4. Quorum Fail

Không còn đủ Site để đạt Quorum.

```text
Site 1 = 20ms
Site 2 = DOWN
Site 3 = DOWN
```

Kết quả mong đợi:

* Không đạt Quorum.
* Giao dịch thất bại.

---

# Công nghệ sử dụng

## Backend

* Python 3
* Flask
* Threading
* ThreadPoolExecutor

## Frontend

* HTML
* Tailwind CSS
* JavaScript
* Chart.js

---

# Cấu trúc thư mục

```text
project/
│
├── app.py
│
├── templates/
│   └── index.html
│
├── static/
│   └── app.js
│
├── requirements.txt
│
└── README.md
```

---

# Hướng dẫn cài đặt

## Bước 1: Clone project

```bash
git clone <repository-url>
cd quorum-distributed-locking
```

## Bước 2: Tạo môi trường ảo

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/MacOS:

```bash
source venv/bin/activate
```

## Bước 3: Cài đặt thư viện

```bash
pip install -r requirements.txt
```

## Bước 4: Chạy ứng dụng

```bash
python app.py
```

Mở trình duyệt:

```text
http://127.0.0.1:5000
```

---

# Các chỉ số đánh giá

## Average Latency

Thời gian phản hồi trung bình của mỗi giao dịch.

Đơn vị:

```text
ms
```

---

## Throughput

Số lượng giao dịch xử lý thành công trong một giây.

Đơn vị:

```text
tx/s
```

---

## Success Rate

Tỷ lệ giao dịch thành công.

Đơn vị:

```text
%
```

---

# Kết quả thực nghiệm (Ví dụ)

| Kịch bản    | Latency (ms) | Throughput (tx/s) | Success Rate |
| ----------- | ------------ | ----------------- | ------------ |
| Healthy     | 26.95        | 37.09             | 100%         |
| Slow Node   | 26.22        | 38.14             | 100%         |
| Node Down   | 29.46        | 33.94             | 100%         |
| Quorum Fail | 0            | 0                 | 0%           |

---

# Phân tích kết quả

Kết quả cho thấy:

* Khi Site 3 bị chậm 500ms, độ trễ trung bình gần như không thay đổi.
* Khi Site 3 bị ngắt kết nối, hệ thống vẫn hoạt động bình thường.
* Quorum được hình thành từ Site 1 và Site 2.
* Hiệu năng được duy trì khi đa số Site vẫn phản hồi nhanh.
* Giao dịch chỉ thất bại khi không đạt đủ số lượng lock yêu cầu.

---

# Kết luận

Đồ án đã mô phỏng thành công cơ chế Quorum-Based Distributed Locking với 3 Site sao chép dữ liệu.

Kết quả thực nghiệm chứng minh:

* Cơ chế Quorum giúp đảm bảo tính nhất quán dữ liệu.
* Hệ thống vẫn duy trì hiệu năng khi một Site bị chậm hoặc bị lỗi.
* Giao dịch chỉ được thực hiện khi đạt đa số lock (2/3).
* Hệ thống có khả năng chịu lỗi tốt trong môi trường phân tán.

---

# Tác giả

Đồ án cuối kỳ môn Cơ sở dữ liệu phân tán (Distributed Database Systems)

Đề tài: **Quorum-Based Distributed Locking – Global Profile Service**

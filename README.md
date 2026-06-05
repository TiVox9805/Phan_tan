# Quorum-Based Distributed Locking trong Hệ Quản Lý Hồ Sơ Người Dùng Phân Tán

## Giới thiệu

Đồ án mô phỏng cơ chế **Quorum-Based Distributed Locking** trong hệ cơ sở dữ liệu phân tán dùng để quản lý hồ sơ người dùng.

Trong hệ thống, dữ liệu hồ sơ người dùng được sao chép (Replication) trên nhiều Site nhằm tăng tính sẵn sàng và khả năng chịu lỗi. Khi có yêu cầu cập nhật dữ liệu, hệ thống phải lấy được khóa (Lock) từ đa số Site trước khi cho phép ghi dữ liệu.

Đồ án tập trung đánh giá khả năng hoạt động của hệ thống trong các điều kiện khác nhau như hoạt động bình thường, một nút bị chậm, một nút bị lỗi hoặc không đạt đủ số lượng Site cần thiết để hình thành Quorum.

---

# Mục tiêu đề tài

Trong cơ sở dữ liệu phân tán, dữ liệu thường được lưu trữ trên nhiều Site khác nhau để đảm bảo khả năng truy cập liên tục và tăng độ tin cậy của hệ thống.

Tuy nhiên, việc cập nhật dữ liệu trên nhiều bản sao cùng lúc có thể dẫn đến:

* Mất tính nhất quán dữ liệu.
* Xung đột ghi dữ liệu.
* Một số Site được cập nhật trong khi các Site khác chưa được cập nhật.

Để giải quyết vấn đề này, đồ án sử dụng cơ chế **Quorum-Based Distributed Locking**.

Mỗi giao dịch cập nhật hồ sơ người dùng phải:

* Lấy được khóa từ ít nhất 2 trong 3 Site.
* Chỉ thực hiện cập nhật khi đạt đủ Quorum.
* Từ chối giao dịch nếu không đạt đủ số lượng khóa yêu cầu.

---

# Đặc tả dữ liệu (Dataset Specification)

## Nguồn dữ liệu

Dữ liệu được tạo thủ công và lưu dưới dạng:

```text
data.csv
```

## Kích thước dữ liệu

* Số lượng hồ sơ người dùng: 500 bản ghi
* Định dạng: CSV
* Dung lượng: khoảng 60–100 KB

## Cấu trúc dữ liệu

| Thuộc tính   | Ý nghĩa                 |
| ------------ | ----------------------- |
| id           | Mã người dùng           |
| name         | Họ tên                  |
| email        | Địa chỉ email           |
| department   | Phòng ban               |
| last_updated | Thời gian cập nhật cuối |

Ví dụ:

```csv
id,name,email,department,last_updated
1,John Smith,john.smith@example.com,IT,2026-01-01
```

---

# Chiến lược sao chép dữ liệu

Đồ án sử dụng cơ chế **Replication**.

Toàn bộ dữ liệu được sao chép trên cả 3 Site:

```text
Site 1 → 500 hồ sơ

Site 2 → 500 hồ sơ

Site 3 → 500 hồ sơ
```

Việc sao chép dữ liệu giúp:

* Tăng tính sẵn sàng.
* Đảm bảo hệ thống vẫn hoạt động khi một Site gặp sự cố.
* Hỗ trợ cơ chế Quorum.

---

# Kiến trúc hệ thống

```text
                    Client / Web UI
                            |
                            v
                    Quorum Manager
                            |
      ---------------------------------------
      |                 |                  |
      v                 v                  v

    Site 1           Site 2            Site 3
    20ms             25ms              30ms

  500 Records      500 Records       500 Records
```

## Thành phần hệ thống

### Client

* Gửi yêu cầu cập nhật hồ sơ.
* Hiển thị kết quả benchmark.

### Quorum Manager

* Gửi yêu cầu khóa đến các Site.
* Thu thập phản hồi.
* Xác định giao dịch có đạt Quorum hay không.

### Site

Mỗi Site:

* Lưu trữ một bản sao dữ liệu.
* Quản lý khóa cục bộ.
* Trả lời yêu cầu khóa từ Quorum Manager.

---

# Thuật toán Quorum-Based Distributed Locking

Hệ thống gồm:

```text
N = 3 Site
```

Số lượng khóa ghi yêu cầu:

```text
Write Quorum (W) = 2
```

Điều kiện:

```text
W > N / 2
```

Hay:

```text
2 > 3 / 2
```

Điều này có nghĩa rằng giao dịch chỉ được phép thực hiện khi nhận được khóa từ ít nhất 2 Site.

Ví dụ:

```text
Site1 + Site2 → Thành công

Site1 + Site3 → Thành công

Site2 + Site3 → Thành công

Chỉ Site1 → Thất bại
```

---

## Thuật toán hoạt động

```text
Bước 1:
Client gửi yêu cầu cập nhật.

Bước 2:
Quorum Manager gửi yêu cầu lock tới tất cả Site.

Bước 3:
Mỗi Site cố gắng lấy lock cục bộ.

Bước 4:
Quorum Manager đếm số Site lock thành công.

Nếu số lock >= 2:
    Thực hiện cập nhật dữ liệu.
    Giải phóng lock.
Ngược lại:
    Hủy giao dịch.
```

Pseudo-code:

```text
AcquireLock(AllSites)

if LockedSites >= 2:
    UpdateProfile()
    ReleaseLocks()
else:
    AbortTransaction()
```

---

# Các kịch bản mô phỏng

## Healthy

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

## Slow Node

Site 3 phản hồi chậm.

```text
Site 1 = 20ms
Site 2 = 25ms
Site 3 = 500ms
```

Kết quả mong đợi:

* Vẫn đạt Quorum nhờ Site 1 và Site 2.
* Hệ thống gần như không bị ảnh hưởng.

---

## Node Down

Site 3 bị ngắt kết nối.

```text
Site 1 = 20ms
Site 2 = 25ms
Site 3 = OFFLINE
```

Kết quả mong đợi:

* Vẫn đạt Quorum.
* Hệ thống tiếp tục hoạt động bình thường.

---

## Quorum Fail

Hai Site không hoạt động.

```text
Site 1 = 20ms
Site 2 = OFFLINE
Site 3 = OFFLINE
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
├── data.csv
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

### Tạo môi trường ảo

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

### Cài đặt thư viện

```bash
pip install -r requirements.txt
```

### Chạy chương trình

```bash
python app.py
```

Truy cập:

```text
http://127.0.0.1:5000
```

---

# Các chỉ số đánh giá

## Average Latency

Thời gian phản hồi trung bình của các giao dịch thành công.

Công thức:

Latency = Tổng thời gian giao dịch / Số giao dịch thành công

Đơn vị:

```text
ms
```

---

## Throughput

Số lượng giao dịch xử lý thành công trong một giây.

Công thức:

Throughput = Số giao dịch thành công / Tổng thời gian benchmark

Đơn vị:

```text
tx/s
```

---

## Success Rate

Tỷ lệ giao dịch thành công.

Công thức:

Success Rate = (Số giao dịch thành công / Tổng số giao dịch) × 100%

Đơn vị:

```text
%
```

---

# Kết quả thực nghiệm

| Kịch bản    | Latency (ms) | Throughput (tx/s) | Success Rate |
| ----------- | ------------ | ----------------- | ------------ |
| Healthy     | 26.29        | 38.04             | 100%         |
| Slow Node   | 26.45        | 37.80             | 100%         |
| Node Down   | 26.28        | 38.10             | 100%         |
| Quorum Fail | 0            | 0                 | 0%           |

---

# Phân tích kết quả

Kết quả thực nghiệm cho thấy:

* Khi Site 3 phản hồi chậm 500ms, độ trễ trung bình gần như không thay đổi.
* Khi Site 3 ngừng hoạt động, hệ thống vẫn tiếp tục xử lý giao dịch bình thường.
* Quorum được hình thành từ Site 1 và Site 2.
* Hiệu năng hệ thống được duy trì khi đa số Site vẫn hoạt động.
* Giao dịch chỉ thất bại khi không đạt đủ số lượng khóa yêu cầu.

Điều này chứng minh rằng cơ chế Quorum giúp hệ thống duy trì tính nhất quán dữ liệu và khả năng chịu lỗi trong môi trường phân tán.

---

# Kết luận

Đồ án đã mô phỏng thành công cơ chế Quorum-Based Distributed Locking trên hệ cơ sở dữ liệu phân tán gồm 3 Site sao chép dữ liệu.

Kết quả thực nghiệm cho thấy:

* Cơ chế Quorum đảm bảo tính nhất quán dữ liệu.
* Hệ thống vẫn hoạt động khi một Site bị lỗi hoặc phản hồi chậm.
* Hiệu năng được duy trì khi còn đủ số lượng Site để hình thành Quorum.
* Giao dịch chỉ được thực hiện khi đạt đa số khóa yêu cầu (2/3).

Qua đó cho thấy Quorum-Based Distributed Locking là một giải pháp hiệu quả nhằm đảm bảo tính nhất quán và khả năng chịu lỗi trong các hệ cơ sở dữ liệu phân tán.

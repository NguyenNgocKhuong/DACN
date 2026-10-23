# 📊 BÁO CÁO TIẾN ĐỘ TUẦN 1 (TÓM TẮT)
## Đề tài: Hệ thống Phân tích & Dự báo Xu hướng Thị trường Chứng khoán

- **Giai đoạn:** Tuần 1 — Kiến trúc Hệ thống & Tầng Dữ liệu Tài chính
- **Trạng thái:** ✅ **Hoàn thành 100%**

---

### 1. KẾT QUẢ ĐÃ THỰC HIỆN

| STT | Hạng mục | Kết quả cụ thể | File mã nguồn |
|:---:|---|---|---|
| **1** | **Bộ chỉ báo kỹ thuật** | Lập trình tính toán tự động 6 chỉ báo chuẩn: **RSI(14), MACD(12,26,9), Bollinger Bands, EMA(20,50), ATR(14), OBV**. | [indicator_service.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/services/indicator_service.py) |
| **2** | **Mở rộng Cơ sở dữ liệu** | Tạo mới **7 bảng quan hệ** quản lý: Cổ phiếu, Lịch sử giá OHLCV, Chỉ báo kỹ thuật, Tin tức cảm xúc, Lịch sử dự đoán AI, Lệnh giao dịch và Backtesting. | [stock_model.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/models/stock_model.py) |
| **3** | **Pipeline nạp dữ liệu** | Tự động tính toán & nạp thành công: <br>• **16 mã cổ phiếu** (VN30 & US Tech)<br>• **870 bản ghi** giá OHLCV & **870 bản ghi** chỉ báo kỹ thuật<br>• Dữ liệu mẫu tin tức thị trường, AI Audit Log và kết quả Backtest. | [seed_advanced_data.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/database/seed_advanced_data.py) |
| **4** | **Backend REST APIs** | Mở rộng 4 API mới (Đã test đạt **HTTP 200, phản hồi < 50ms**):<br>• `GET /api/stocks/indicators/<symbol>`: Lấy giá kèm chỉ báo<br>• `GET /api/stocks/news`: Tin tức & điểm Sentiment<br>• `GET /api/stocks/predictions/audit`: Kiểm chứng độ chính xác AI<br>• `GET /api/stocks/backtest/results`: Đánh giá chiến lược tài chính. | [routes/stock.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/routes/stock.py) |

---

### 2. ĐIỂM NÂNG CẤP SO VỚI ĐỒ ÁN CƠ SỞ

*   **Đặc trưng đầu vào:** Từ 5 chỉ số giá thô đơn giản $\rightarrow$ Bổ sung thêm **6 chỉ báo kỹ thuật chuyên sâu** phản ánh động lượng, biến động và dòng tiền.
*   **Cơ sở dữ liệu:** Từ SQLite lưu 3 bảng user/portfolio cơ bản $\rightarrow$ Chuẩn hóa mô hình lưu trữ chuỗi thời gian tài chính, phục vụ kiểm chứng AI liên tục (Audit Trail).
*   **Khung đánh giá:** Bổ sung các chỉ số lượng tử tài chính (**Sharpe Ratio, Max Drawdown, Win Rate, Profit Factor**) bên cạnh các chỉ số Học máy thông thường (RMSE, Accuracy, F1).

---

### 3. KẾ HOẠCH TUẦN 2

1. **Mô hình Transformer Đa biến:** Nâng cấp đầu vào từ 5 lên **12 đặc trưng** (OHLCV + 6 chỉ báo kỹ thuật + Sentiment), tăng chu kỳ quan sát từ 3 phiên lên **30 phiên**.
2. **Huấn luyện Đối chuẩn (Benchmarks):** Viết script chia tập dữ liệu theo chuỗi thời gian (Time-series Split), huấn luyện và so sánh định lượng giữa **Transformer vs LSTM vs XGBoost**.

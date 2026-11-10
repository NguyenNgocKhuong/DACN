# 🗓️ KẾ HOẠCH CHI TIẾT CÁC TUẦN TIẾP THEO (TUẦN 2 — TUẦN 10)
## ĐỒ ÁN CHUYÊN NGÀNH: HỆ THỐNG PHÂN TÍCH & DỰ BÁO XU HƯỚNG THỊ TRƯỜNG CHỨNG KHOÁN

---

### 📌 BẢNG TỔNG QUAN TIẾN ĐỘ THEO TUẦN

| Tuần | Trọng tâm công việc | Đầu ra chính (Deliverables) |
|:---:|---|---|
| **Tuần 1** | *Kiến trúc Hệ thống & Tầng Dữ liệu* | ✅ *Đã hoàn thành: 6 chỉ báo kỹ thuật, 7 bảng DB, 4 REST APIs.* |
| **Tuần 2** | **Nâng cấp Mô hình Transformer Đa biến** | Model Transformer 12 đặc trưng, chuỗi 30 phiên, script huấn luyện. |
| **Tuần 3** | **Huấn luyện Đối chuẩn (Benchmarks)** | Bảng so sánh định lượng: Transformer vs LSTM vs XGBoost. |
| **Tuần 4** | **Pipeline Tin tức & Cảm xúc Tiếng Việt** | Auto Crawler tin tức Cafef/Vietstock + PhoBERT Sentiment. |
| **Tuần 5** | **Biểu đồ Nến Nhật TradingView** | Giao diện nến Candlestick + Volume + Chỉ báo kỹ thuật tương tác. |
| **Tuần 6** | **Hệ thống Thời gian thực (WebSocket)** | Nhảy giá trực tiếp, cảnh báo tín hiệu Mua/Bán theo thời gian thực. |
| **Tuần 7** | **Động cơ Backtesting Chiến lược** | Đo lường hiệu quả tài chính: Sharpe Ratio, Max Drawdown, Win Rate. |
| **Tuần 8** | **Giao dịch Giả lập (Paper Trading) Nâng cao** | Lệnh Market/Limit, phí sàn, quản lý phân bổ danh mục đầu tư. |
| **Tuần 9** | **Đóng gói Triển khai (Docker & Redis)** | Dockerfile, docker-compose (Frontend, Backend, DB, Redis). |
| **Tuần 10** | **Hoàn thiện Báo cáo Luận văn & Slide** | Cuốn báo cáo 5 chương chuẩn học thuật + Slide thuyết trình bảo vệ. |

---

### 🎯 CHI TIẾT TỪNG TUẦN

#### 🔹 TUẦN 2: Nâng Cấp Mô Hình Transformer Đa Biến (Multimodal AI)
*   **Mục tiêu:** Nâng cấp mô hình từ phân loại đơn giản sang mô hình học sâu chuỗi thời gian nhận 12 đặc trưng.
*   **Công việc cụ thể:**
    1. Cập nhật `ai-model/transformer_model.py`: Mở rộng `input_dim = 12` (OHLCV + 6 chỉ báo kỹ thuật + Sentiment), tăng `d_model = 64`, `num_layers = 3`, thêm Dropout chống Overfitting.
    2. Viết module tiền xử lý dữ liệu chuỗi thời gian: Chia tập Train / Val / Test (70% / 15% / 15%) theo thứ tự thời gian (Time-series Split, không xáo trộn để tránh rò rỉ dữ liệu - Data Leakage).
    3. Viết script huấn luyện `ai-model/train_multimodal_transformer.py` tích hợp Early Stopping và Learning Rate Scheduler (ReduceLROnPlateau).
*   **Sản phẩm đầu ra:** Trọng số mô hình mới `transformer_stock_multimodal.pth`, biểu đồ Loss/Accuracy qua các Epochs.

---

#### 🔹 TUẦN 3: Huấn Luyện Đối Chuẩn (Benchmarks & Ablation Study)
*   **Mục tiêu:** Cung cấp bằng chứng thực nghiệm khoa học chứng minh hiệu quả của mô hình Transformer so với các mô hình truyền thống (Bắt buộc cho Đồ án Chuyên ngành).
*   **Công việc cụ thể:**
    1. Huấn luyện 3 mô hình Baseline trên cùng một tập dữ liệu test:
       - **Mô hình học máy truyền thống:** Random Forest / XGBoost.
       - **Mô hình chuỗi thời gian Recurrent:** LSTM, GRU.
    2. Lập bảng so sánh đa tiêu chí: Sai số ($RMSE, MAE$), Độ chính xác ($Accuracy, F1\text{-}Score$), $AUC\text{-}ROC$.
    3. Thực hiện **Ablation Study**:
       - Thử nghiệm 1: Chỉ dùng giá thô OHLCV.
       - Thử nghiệm 2: Dùng giá thô + Chỉ báo kỹ thuật.
       - Thử nghiệm 3: Dùng giá thô + Chỉ báo kỹ thuật + Điểm cảm xúc (Sentiment).
*   **Sản phẩm đầu ra:** Bảng thực nghiệm đối chuẩn, ma trận nhầm lẫn (Confusion Matrix) và biểu đồ ROC Curve đưa vào báo cáo.

---

#### 🔹 TUẦN 4: Pipeline Cào Tin Tức & NLP Phân Tích Cảm Xúc Tiếng Việt
*   **Mục tiêu:** Tự động hóa quá trình thu thập tin tức tài chính và phân loại cảm xúc theo ngữ cảnh tiếng Việt.
*   **Công việc cụ thể:**
    1. Viết crawler tự động `backend/services/news_crawler.py`: Cào tiêu đề và bài viết từ Cafef, Vietstock theo từng mã cổ phiếu (VN30).
    2. Tích hợp mô hình NLP tiếng Việt (PhoBERT hoặc FinBERT) để phân loại cảm xúc tin tức thành 3 mức: Tích cực (+1), Tiêu cực (-1), Trung lập (0).
    3. Đồng bộ điểm cảm xúc trung bình hàng ngày vào bảng `market_news` và liên kết với ma trận đặc trưng của mô hình AI.
*   **Sản phẩm đầu ra:** Service cào tin tức tự động, pipeline gán nhãn cảm xúc tin tức tài chính tiếng Việt.

---

#### 🔹 TUẦN 5: Tích Hợp Biểu Đồ Nến Nhật TradingView (Lightweight Charts)
*   **Mục tiêu:** Nâng tầm giao diện phân tích tài chính lên chuẩn các sàn chứng khoán hiện đại.
*   **Công việc cụ thể:**
    1. Cài đặt thư viện `lightweight-charts` vào Frontend React.
    2. Xây dựng component `TradingViewChart.js`:
       - Hiển thị nến Nhật (Candlestick: Open, High, Low, Close) kèm thanh khối lượng (Volume bar).
       - Cho phép bật/tắt các đường chỉ báo kỹ thuật: EMA 20, EMA 50, dải Bollinger Bands.
       - Hiển thị sub-chart riêng bên dưới cho chỉ báo dao động: RSI(14) và MACD Histogram.
    3. Hỗ trợ chuyển đổi khung thời gian (1D, 1W, 1M) và điều chỉnh thu phóng mượt mà.
*   **Sản phẩm đầu ra:** Giao diện chi tiết mã cổ phiếu chuẩn TradingView chuyên nghiệp.

---

#### 🔹 TUẦN 6: Nâng Cấp Hệ Thống Thời Gian Thực (WebSocket & Cảnh Báo)
*   **Mục tiêu:** Cập nhật bảng giá và tín hiệu khuyến nghị AI trực tiếp không cần tải lại trang.
*   **Công việc cụ thể:**
    1. Cài đặt `Flask-SocketIO` trên Backend và `socket.io-client` trên React Frontend.
    2. Xây dựng kênh phát sóng (Broadcasting Channel) định kỳ bắn dữ liệu giá nhảy theo giây và tín hiệu AI mới.
    3. Bổ sung Widget giải thích quyết định của AI (Explainability Widget):
       - Hiển thị mức độ đóng góp (Feature Importance / Attention Weight) của từng chỉ báo vào dự báo Tăng/Giảm.
       - Đưa ra khuyến nghị định lượng kèm ngưỡng Cắt lỗ (Stop Loss) và Chốt lời (Take Profit) tính theo ATR.
*   **Sản phẩm đầu ra:** Bảng giá nhảy real-time, hộp tín hiệu khuyến nghị giao dịch AI trực quan.

---

#### 🔹 TUẦN 7: Động Cơ Kiểm Thử Chiến Lược Giao Dịch (Backtesting Engine)
*   **Mục tiêu:** Chứng minh tín hiệu AI đem lại tỷ suất sinh lời thực tế trên dữ liệu lịch sử.
*   **Công việc cụ thể:**
    1. Xây dựng module `backend/services/backtest_engine.py`:
       - Chiến lược mẫu: Mua khi AI dự báo TĂNG và RSI < 70; Bán khi AI dự báo GIẢM hoặc vi phạm Stop Loss 5% / Take Profit 10%.
    2. Tính toán các chỉ số lượng tử tài chính:
       - **Tổng lợi nhuận (Total Return %)** so với chỉ số VN-Index (Buy & Hold Benchmark).
       - **Tỷ số Sharpe (Sharpe Ratio)** đo hiệu quả sinh lời trên rủi ro.
       - **Mức sụt giảm tối đa (Maximum Drawdown - MDD)** đo lường rủi ro lớn nhất từng gặp.
       - **Tỷ lệ lệnh thắng (Win Rate %)** và **Hệ số sinh lời (Profit Factor)**.
    3. Vẽ đồ thị tăng trưởng vốn (Equity Curve) trực tiếp lên Frontend.
*   **Sản phẩm đầu ra:** Trang Dashboard Backtesting trực quan, lưu trữ kết quả kiểm thử vào bảng `backtest_experiments`.

---

#### 🔹 TUẦN 8: Giao Dịch Giả Lập (Paper Trading) Nâng Cao & Quản Lý Danh Mục
*   **Mục tiêu:** Hoàn thiện trải nghiệm người dùng trong hệ sinh thái đầu tư giả lập.
*   **Công việc cụ thể:**
    1. Nâng cấp sổ lệnh: Hỗ trợ lệnh thị trường (Market Order) và lệnh giới hạn (Limit Order).
    2. Tự động tính phí giao dịch sàn (0.15%) và thuế thu nhập.
    3. Tính toán chính xác Lãi/Lỗ chưa thực hiện (Unrealized PnL) theo giá thị trường real-time và Lãi/Lỗ đã chốt (Realized PnL).
    4. Thêm biểu đồ phân bổ tài sản (Asset Allocation Pie Chart) và phân tích rủi ro danh mục.
*   **Sản phẩm đầu ra:** Tính năng Paper Trading hoàn chỉnh, bảng tổng kết danh mục đầu tư chi tiết.

---

#### 🔹 TUẦN 9: Đóng Gói Triển Khai (DevOps - Docker) & Tối Ưu Hiệu Năng
*   **Mục tiêu:** Đảm bảo hệ thống có thể chạy ngay trên bất kỳ máy tính nào của hội đồng chỉ với 1 câu lệnh.
*   **Công việc cụ thể:**
    1. Viết `Dockerfile` độc lập cho Frontend React và Backend Flask.
    2. Viết file `docker-compose.yml` điều phối 4 dịch vụ:
       - Service 1: `frontend` (Port 3000)
       - Service 2: `backend` (Port 5001)
       - Service 3: `postgres` (Cơ sở dữ liệu)
       - Service 4: `redis` (Cache bảng giá và danh mục)
    3. Tích hợp Redis Caching cho các API bảng giá để giảm độ trễ phản hồi xuống dưới 20ms.
*   **Sản phẩm đầu ra:** Bộ mã nguồn đóng gói Docker hoàn chỉnh, khởi động bằng `docker compose up --build`.

---

#### 🔹 TUẦN 10: Hoàn Thiện Luận Văn Báo Cáo & Chuẩn Bị Bảo Vệ
*   **Mục tiêu:** Đạt điểm tối đa trước Hội đồng bảo vệ Đồ án Chuyên ngành.
*   **Công việc cụ thể:**
    1. Soạn thảo cuốn Báo cáo Luận văn chuẩn cấu trúc 5 chương của Bộ GD&ĐT:
       - **Chương 1:** Tổng quan bài toán dự báo chứng khoán & Tính cấp thiết của đề tài.
       - **Chương 2:** Cơ sở lý thuyết về Chuỗi thời gian tài chính, Transformer & NLP Cảm xúc.
       - **Chương 3:** Phân tích & Thiết kế Kiến trúc Hệ thống (C4 Model, Data Pipeline, ERD).
       - **Chương 4:** Thực nghiệm Mô hình AI, Bảng so sánh Đối chuẩn & Đánh giá Backtesting.
       - **Chương 5:** Cài đặt ứng dụng thực tế, Đánh giá kết quả & Hướng phát triển.
    2. Thiết kế bộ Slide bảo vệ (20 - 25 slide): Đầy đủ biểu đồ, sơ đồ kiến trúc, bảng số liệu thực nghiệm định lượng.
    3. Chuẩn bị kịch bản demo trực tiếp và video demo dự phòng (Backup Video).
*   **Sản phẩm đầu ra:** Cuốn báo cáo tốt nghiệp (.pdf), Slide bảo vệ (.pptx) và Video kịch bản demo.

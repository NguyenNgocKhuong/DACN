# 📈 Stock AI Predictor — Hệ thống Dự báo Chứng khoán Thông minh

> **Đồ án Chuyên ngành (DACS)** — Chuyên ngành: Hệ thống Thông tin Dữ liệu

Hệ thống phân tích và dự báo xu hướng chứng khoán tích hợp mô hình học sâu **Transformer** kết hợp với **Phân tích cảm xúc thị trường (Sentiment Analysis)**, cung cấp tín hiệu giao dịch thông minh và nền tảng mô phỏng giao dịch ảo trực quan.

---

## 🎯 Mục tiêu đề tài

- Xây dựng hệ thống Web App giao dịch chứng khoán giả lập, bảo mật và trực quan.
- Nghiên cứu ứng dụng kiến trúc **Transformer Encoder** (học sâu) thay thế các mô hình truyền thống (Random Forest, ARIMA) cho bài toán dự báo chuỗi thời gian tài chính.
- Tích hợp pipeline **NLP (BERT)** để chấm điểm cảm xúc tin tức thị trường, từ đó bổ trợ thêm chiều thông tin cho mô hình dự báo giá.

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|---|---|
| 📊 **Bảng giá thời gian thực** | Theo dõi 34 mã cổ phiếu VN30 & US Tech, cập nhật tự động từ Yahoo Finance |
| 🤖 **Dự báo AI (Lên/Xuống)** | Mô hình Transformer đưa ra tín hiệu xu hướng phiên tiếp theo |
| 📉 **Biểu đồ động** | Biểu đồ đường hiển thị lịch sử giá thực tế từng mã cổ phiếu |
| 💼 **Giao dịch giả lập** | Mua/bán cổ phiếu bằng số dư ảo, tự động tính lời/lỗ và giá vốn trung bình |
| 💬 **Hộp thư nội bộ** | Gửi/nhận thông điệp giữa các tài khoản người dùng |
| 🔒 **Xác thực bảo mật** | Đăng ký, đăng nhập, phân quyền truy cập trang chi tiết |

---

## 🏗️ Kiến trúc hệ thống (3-Tier Architecture)

```
┌──────────────────────────────────────────────────────┐
│         FRONTEND (React.js - Port 3000)              │
│   Vite · Tailwind CSS · Chart.js · Recharts          │
└──────────────────┬───────────────────────────────────┘
                   │ HTTP / REST API (JSON)
┌──────────────────▼───────────────────────────────────┐
│         BACKEND (Python Flask - Port 5001)           │
│   SQLAlchemy ORM · SQLite (app.db) · Flask-Cors      │
│   ┌──────────┐ ┌────────────┐ ┌───────────────────┐  │
│   │ /users   │ │ /stocks    │ │ /messages         │  │
│   └──────────┘ └────────────┘ └───────────────────┘  │
└──────────────────┬───────────────────────────────────┘
                   │ Python calls
┌──────────────────▼───────────────────────────────────┐
│         AI & DATA LAYER                              │
│   PyTorch (Transformer) · Hugging Face (BERT)        │
│   yfinance (Yahoo Finance API) · Pandas · NumPy      │
│   stock_data.csv · market_comments.csv               │
└──────────────────────────────────────────────────────┘
```

---

## 🧠 Mô hình AI cốt lõi

### 1. Mô hình dự báo chuỗi thời gian — `TimeSeriesTransformer`
- **Kiến trúc:** Transformer Encoder (PyTorch), 2 lớp encoder, 4 đầu chú ý (Multi-Head Attention).
- **Đầu vào:** Chuỗi 3 phiên giao dịch liên tiếp × 6 đặc trưng `[open, high, low, close, volume, sentiment]`.
- **Đầu ra:** Xác suất xu hướng ngày tiếp theo — `> 0.5 → Tăng (UP)`, `≤ 0.5 → Giảm (DOWN)`.
- **Kỹ thuật nổi bật:** Positional Encoding (Sin/Cos), MinMaxScaler chuẩn hóa đầu vào, BCEWithLogitsLoss + Adam optimizer.

### 2. Mô hình phân tích cảm xúc — `BERT Multilingual`
- **Model:** `nlptown/bert-base-multilingual-uncased-sentiment` (Hugging Face).
- **Chức năng:** Phân loại bình luận thị trường từ 1–5 sao → chuẩn hóa về điểm số `[-1.0, 1.0]`.
- **Công thức:** `Score = (stars - 3) / 2`

---

## 📦 Cấu trúc thư mục

```
stock-ai-web/
├── frontend/                  # Giao diện React.js
│   └── src/
│       ├── pages/             # Home, StockDetail, Profile, Login,...
│       ├── components/        # Chart, StockCard, Navbar, ChatBox,...
│       └── services/api.js    # Kết nối REST API với Backend
│
├── backend/                   # Server Python Flask
│   ├── app.py                 # Điểm khởi động, đăng ký Blueprint
│   ├── app.db                 # CSDL SQLite (users, portfolio, messages)
│   ├── routes/                # Định tuyến API (user, stock, message)
│   ├── services/              # Logic nghiệp vụ (AI, Sentiment, DataFetcher)
│   └── models/                # Định nghĩa bảng ORM (SQLAlchemy)
│
├── ai-model/                  # Mô hình học sâu
│   ├── transformer_model.py   # Định nghĩa kiến trúc TimeSeriesTransformer
│   ├── train_transformer.py   # Script huấn luyện mô hình
│   ├── predict.py             # Script suy luận độc lập
│   └── transformer_stock.pth  # Trọng số mô hình đã huấn luyện (PyTorch)
│
├── data/
│   ├── stock_data.csv         # Lịch sử giá OHLCV của 34 mã chứng khoán
│   └── market_comments.csv    # Dữ liệu bình luận thị trường (Sentiment)
│
├── START_APP.bat              # Khởi động toàn bộ hệ thống (1 click)
├── install_deps.bat           # Cài đặt thư viện lần đầu
└── README.md                  # Tài liệu dự án
```

---

## 🚀 Hướng dẫn khởi chạy

### ⚡ Cách nhanh (Windows — Khuyến nghị)
```
Bước 1: Chạy install_deps.bat   ← Chỉ cần chạy lần đầu tiên
Bước 2: Chạy START_APP.bat      ← Khởi động toàn bộ hệ thống
```
Hệ thống sẽ tự động mở trình duyệt tại: **http://localhost:3000**

### 🔧 Cách thủ công

**Backend:**
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python app.py
# → Chạy tại http://localhost:5001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → Chạy tại http://localhost:3000
```

---

## 📊 Danh sách 34 mã chứng khoán hỗ trợ

| Nhóm | Mã chứng khoán |
|---|---|
| 🇻🇳 **VN30** | FPT, HPG, VCB, VIC, VNM, MWG, VPB, TCB, VHM, GAS, SSI, SAB, BID, STB, VIB, VJC, HVN, PNJ, HSG, NKG, VND, SHB |
| 🇺🇸 **US Tech** | AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA, NFLX, AMD, INTC, COIN |
| 📈 **Chỉ số** | VNINDEX |

---

## 🗄️ Cơ sở dữ liệu

| Bảng | Mô tả |
|---|---|
| `users` | Thông tin tài khoản và số dư tiền mặt ảo |
| `portfolio_items` | Danh mục cổ phiếu đang nắm giữ theo từng user |
| `messages` | Lịch sử hộp thư trao đổi nội bộ |

**Tài khoản demo mặc định:**
| Username | Password | Số dư |
|---|---|---|
| `admin` | `123455` | $500,000 |
| `user1` | `654321` | $100,000 |

---

*Phát triển bởi BDT Team — Đồ án Chuyên ngành 2026*

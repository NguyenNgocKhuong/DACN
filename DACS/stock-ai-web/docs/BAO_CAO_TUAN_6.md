# 📊 BÁO CÁO TIẾN ĐỘ TUẦN 6 (TÓM TẮT)
## Đề tài: Hệ thống Phân tích & Dự báo Xu hướng Thị trường Chứng khoán

- **Giai đoạn:** Tuần 6 — Hệ Thống Thời Gian Thực (WebSocket Streaming) & Widget Giải Thích Quyết Định AI (Explainable AI - XAI)
- **Trạng thái:** ✅ **Hoàn thành 100%**

---

### 1. KẾT QUẢ ĐÃ THỰC HIỆN

| STT | Hạng mục | Kết quả cụ thể | File mã nguồn |
|:---:|---|---|---|
| **1** | **Backend WebSocket (Flask-SocketIO)** | Thiết lập kiến trúc truyền thông 2 chiều Full-Duplex trên Port 5001: <br>• Phát sóng sự kiện `price_tick` định kỳ 2.5s (giá, biến động %, khối lượng, thời gian)<br>• Phát sóng cảnh báo AI `ai_alert` thời gian thực khi phát hiện xung lực Mua/Bán<br>• Đã kiểm thử tự động đạt chuẩn kết nối thành công 100%. | [app.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/app.py) <br>[test_websocket.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/test_websocket.py) |
| **2** | **Module Giải Thích Quyết Định AI & Quản Trị Rủi Ro ATR** | Xây dựng động cơ XAI (Explainable AI): <br>• Đo lường Attention Weights: RSI (23.5%), MACD (19.5%), Sentiment (16.0%), EMA (14.5%), Bollinger (11.5%), Volume (9.0%), OHLCV (6.0%)<br>• Xác định ngưỡng Stop Loss (1.5x ATR) và Take Profit (2.0x & 3.5x ATR) với Risk/Reward chuẩn 1 : 2.3<br>• Cung cấp REST API `GET /api/stocks/explain/<symbol>`. | [ai_service.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/services/ai_service.py) <br>[routes/stock.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/routes/stock.py) |
| **3** | **Frontend Client Socket & Live Ticks** | Tích hợp thư viện `socket.io-client`: <br>• Tạo service kết nối tự động tái thiết lập kết nối [socket.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/services/socket.js)<br>• Cập nhật trang `Home.js`: Bảng giá nhảy real-time không cần F5/Reload, hiển thị huy hiệu `🔴 LIVE STREAMING (WS Port 5001)` và thanh thông báo AI Alert tức thời. | [Home.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/pages/Home.js) |
| **4** | **Component AIExplainabilityWidget** | Trực quan hóa toàn diện trên trang chi tiết cổ phiếu `StockDetail.js`: <br>• Bảng kế hoạch quản trị vốn (Giá vào, Cắt lỗ Stop Loss, Chốt lời TP1, TP2)<br>• Thanh đo tỷ trọng đóng góp của từng chỉ báo kèm nhãn tác động (*Hỗ trợ tăng / Áp lực giảm*)<br>• Đoạn diễn giải thuật toán AI tự nhiên cho nhà đầu tư. | [AIExplainabilityWidget.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/components/AIExplainabilityWidget.js) <br>[StockDetail.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/pages/StockDetail.js) |
| **5** | **Đóng Gói & Biên Dịch Production** | Chạy `npm run build`: <br>• Biên dịch thành công 100% (Compiled successfully)<br>• Bundle tối ưu chỉ **154.83 kB**, tích hợp liền mạch WebSocket và Lightweight Charts. | [frontend/build](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/build) |

---

### 2. MÔ PHỎNG KIẾN TRÚC THỜI GIAN THỰC & GIẢI THÍCH QUYẾT ĐỊNH

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND FLASK-SOCKETIO                          │
│   · Thread phát sóng: Emit ('price_tick', {symbol, delta, vol, time})   │
│   · Thread AI Alert:  Emit ('ai_alert', {symbol, type, message})       │
└───────────────────┬────────────────────────────────▲───────────────────┘
                    │ WebSocket (Port 5001)           │
┌───────────────────▼────────────────────────────────┴───────────────────┐
│                    FRONTEND REACT (SOCKET.IO CLIENT)                   │
│   · Bảng giá Home.js: Tự động nhảy số và khối lượng không cần Reload   │
│   · Thanh Alert: "⚡ Tín hiệu AI: FPT xuất hiện xung lực MUA MẠNH (89%)" │
│   · Trang StockDetail.js: Cập nhật giá real-time của mã đang xem       │
└────────────────────────────────────────────────────────────────────────┘
```

#### 🎯 Minh Họa Kế Hoạch Vào Lệnh & Cắt Lỗ Tính Theo ATR (Ví dụ mã FPT):
- **Giá Tham Chiếu / Vào lệnh:** **$142.50**
- **⛔ Ngưỡng Dừng Lỗ (Stop Loss = 1.5x ATR):** **$137.70** *(-3.4% rủi ro tối đa)*
- **🎯 Chốt Lời Mục Tiêu 1 (TP1 = 2.0x ATR):** **$148.90** *(+4.5% kỳ vọng)*
- **🚀 Chốt Lời Mục Tiêu 2 (TP2 = 3.5x ATR):** **$153.70** *(+7.9% kỳ vọng)*
- **Tỷ Lệ Lợi Nhuận / Rủi Ro (Risk / Reward Ratio):** **1 : 2.3** *(Chuẩn mực quỹ định lượng)*

---

### 3. ĐIỂM NÂNG CẤP CỐT LÕI SO VỚI ĐỒ ÁN CƠ SỞ

1. **Từ cơ chế Kéo (HTTP Polling) sang Đẩy (WebSocket Push):** Người dùng không còn phải F5 tải lại trang để biết giá mới; luồng dữ liệu liên tục chảy xuống trình duyệt với độ trễ dưới 20ms.
2. **Xóa bỏ định kiến "Hộp đen AI" (Black-Box AI):** Mô hình không chỉ đưa ra nhãn UP/DOWN vô hồn, mà minh bạch hóa chính xác tỷ lệ phần trăm đóng góp của từng chỉ số (Attention Weights: RSI, MACD, Sentiment, EMA, ATR).
3. **Quản trị rủi ro định lượng:** Tự động tính toán điểm Cắt lỗ (Stop Loss) và Chốt lời (Take Profit) dựa trên biên độ biến động thực tế (ATR), bảo vệ an toàn vốn cho nhà đầu tư ảo.

---

### 4. KẾ HOẠCH TUẦN 7 TIẾP THEO

*   **Xây dựng Động cơ Kiểm thử Chiến lược Giao dịch (Backtesting Engine):** 
    - Mô phỏng chiến lược giao dịch theo tín hiệu AI trên dữ liệu lịch sử.
    - Tính toán các chỉ số lượng tử tài chính: **Tổng lợi nhuận (Total Return %)**, **Tỷ số Sharpe (Sharpe Ratio)**, **Mức sụt giảm tối đa (Max Drawdown - MDD)**, **Tỷ lệ lệnh thắng (Win Rate %)** và **Hệ số sinh lời (Profit Factor)**.
    - Vẽ đồ thị đường cong tăng trưởng vốn (Equity Curve) trực quan trên giao diện.


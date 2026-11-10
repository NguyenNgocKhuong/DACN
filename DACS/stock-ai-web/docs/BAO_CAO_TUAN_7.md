# BÁO CÁO NGHIỆM THU TUẦN 7: ĐỘNG CƠ KIỂM THỬ CHIẾN LƯỢC ĐỊNH LƯỢNG (QUANTITATIVE BACKTESTING ENGINE)

**Dự án:** Hệ thống Phân tích & Dự đoán Xu hướng Thị trường Chứng khoán bằng AI  
**Giai đoạn:** Đồ án Chuyên ngành Công nghệ Thông tin  
**Thời gian thực hiện:** Tuần 7  
**Trạng thái:** Hoàn thành 100% (Backend Engine, Database Audit, REST APIs, TradingView Equity Curve, Production Build React)

---

## 1. MỤC TIÊU TUẦN 7
1. Xây dựng module động cơ kiểm thử định lượng (`BacktestEngine`) mô phỏng giao dịch theo nến lịch sử (Event-driven Walk-forward).
2. Tích hợp mô hình AI Transformer với Quản trị rủi ro ATR động ($1.5 \times ATR$ Cắt lỗ, $2.5 \times ATR$ Chốt lời) và tuân thủ chu kỳ thanh toán $T+2.5$ sàn HOSE/HNX.
3. Tính toán các chỉ số định lượng tài chính: **Total Return %**, **Alpha %**, **Sharpe Ratio**, **Sortino Ratio**, **Max Drawdown (MDD %)**, **Win Rate %**, **Profit Factor**.
4. Phát triển giao diện `BacktestDashboard` trực quan với biểu đồ tăng trưởng vốn (Equity Curve) và biểu đồ sụt giảm vốn (Underwater Drawdown) bằng TradingView Lightweight Charts.
5. Lưu trữ kết quả kiểm thử vào bảng CSDL `backtest_experiments` và kết nối hệ thống REST APIs.

---

## 2. CÔNG THỨC ĐỊNH LƯỢNG TÀI CHÍNH TRIỂN KHAI

Hệ thống triển khai chuẩn xác các công thức lượng tử tài chính trong [backtest_engine.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/services/backtest_engine.py):

| Chỉ số Định lượng | Công thức Toán học | Ý nghĩa Tài chính |
| :--- | :--- | :--- |
| **Tỷ suất Lợi nhuận (Total Return)** | $R = \frac{V_{\text{final}} - V_0}{V_0} \times 100\%$ | Đo lường tỷ lệ tăng trưởng vốn ròng sau phí |
| **Lợi nhuận Vượt trội (Alpha)** | $\alpha = R_{\text{strategy}} - R_{\text{benchmark}}$ | Giá trị gia tăng của AI so với chiến lược Mua & Nắm giữ |
| **Tỷ số Sharpe (Annualized)** | $S = \sqrt{252} \times \frac{\bar{r} - r_f / 252}{\sigma_r}$ | Đo lường hiệu quả sinh lời trên mỗi đơn vị rủi ro ($r_f = 5\%/\text{năm}$) |
| **Tỷ số Sortino (Annualized)** | $\text{Sortino} = \sqrt{252} \times \frac{\bar{r} - r_f / 252}{\sigma_{r, \text{downside}}}$ | Đo lường lợi nhuận trên độ biến động rủi ro giảm giá |
| **Mức Sụt giảm Tối đa (MDD)** | $\text{MDD} = \min_{t} \left(\frac{V_t - \max_{0 \le i \le t} V_i}{\max_{0 \le i \le t} V_i}\right) \times 100\%$ | Đo lường mức rủi ro giảm vốn lớn nhất từ đỉnh tài khoản |
| **Tỷ lệ Thắng (Win Rate)** | $W = \frac{N_{\text{win}}}{N_{\text{total}}} \times 100\%$ | Tỷ lệ số lệnh có lãi ròng sau khi trừ phí giao dịch (0.15%) |
| **Hệ số Sinh lời (Profit Factor)** | $\text{PF} = \frac{\sum \text{Lãi}}{\sum \|\text{Lỗ}\|}$ | Tỷ số giữa tổng tiền lãi thu được trên tổng tiền lỗ |

---

## 3. CÁC TỆP NGUỒN ĐÃ PHÁT TRIỂN & NÂNG CẤP

| STT | Tệp tin | Vai trò & Chức năng kỹ thuật |
| :---: | :--- | :--- |
| 1 | [backtest_engine.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/services/backtest_engine.py) | Module Động cơ kiểm thử định lượng: khớp lệnh theo nến, quản trị rủi ro ATR, thanh toán T+2.5, trừ phí sàn 0.15% |
| 2 | [routes/stock.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/routes/stock.py) | Bổ sung 3 endpoints: `POST /backtest/run`, `GET /backtest/presets`, `GET /backtest/results` |
| 3 | [stock_model.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/models/stock_model.py) | Bổ sung phương thức tuần tự hóa `to_dict()` cho model `BacktestExperiment` |
| 4 | [test_backtest.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/test_backtest.py) | Bộ kiểm thử tự động 5 unit tests cho Engine, công thức toán và REST API |
| 5 | [eval_backtest_table.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/eval_backtest_table.py) | Script đối chuẩn thực nghiệm trên 8 mã cổ phiếu đại diện VN30 và US Tech |
| 6 | [BacktestEquityChart.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/components/BacktestEquityChart.js) | Component biểu đồ kép TradingView Lightweight Charts: Đường vốn AI + Đối chuẩn + Biểu đồ Underwater MDD |
| 7 | [BacktestDashboard.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/pages/BacktestDashboard.js) | Trang Dashboard Backtesting hoàn chỉnh: Thiết lập tham số, Thẻ KPI, Biểu đồ vốn, Nhật ký lệnh, Lịch sử lưu trữ CSDL |
| 8 | [api.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/services/api.js) | Thêm các hàm gọi API: `getBacktestPresets`, `runBacktest`, `getBacktestResults` |
| 9 | [App.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/App.js) & [Navbar.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/components/Navbar.js) | Điều hướng Router `/backtest` và menu `📈 Kiểm Thử Chiến Lược` |
| 10 | [StockDetail.js](file:///c:/CNTT/DACS/DACS/stock-ai-web/frontend/src/pages/StockDetail.js) | Tích hợp nút shortcut chuyển nhanh sang kiểm thử cho mã chứng khoán đang xem |

---

## 4. BẢNG KẾT QUẢ THỰC NGHIỆM ĐỊNH LƯỢNG TRÊN DỮ LIỆU LỊCH SỬ

Kết quả mô phỏng chiến lược `AI_TRANSFORMER_ATR` ($V_0 = 100,000,000$ VNĐ, phí giao dịch 0.15%/lệnh, chu kỳ $T+2.5$):

| Mã CP | Thị trường | Lợi nhuận Chiến lược | Buy & Hold Benchmark | Alpha ($\alpha$) | Sharpe Ratio | Sortino Ratio | Max Drawdown | Win Rate % | Profit Factor | Tổng số lệnh |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **FPT** | HOSE | **+56.93%** | -33.32% | **+90.26%** | **0.74** | **4.05** | -23.01% | 31.6% | **2.23** | 19 |
| **VIC** | HOSE | **+508.11%** | +129.46% | **+378.65%** | **1.06** | **12.36** | -22.63% | 43.5% | **2.84** | 23 |
| **AAPL** | NASDAQ | **+20.16%** | +32.98% | -12.82% | **0.52** | **0.48** | -38.60% | 44.4% | **1.36** | 18 |
| **MSFT** | NASDAQ | **+3.34%** | +0.34% | **+3.00%** | **0.05** | **0.06** | -22.19% | 33.3% | **1.15** | 21 |
| **VCB** | HOSE | -11.73% | -4.75% | -6.98% | 0.03 | 0.03 | -41.04% | 29.4% | 0.87 | 17 |
| **HPG** | HOSE | -16.11% | -10.85% | -5.26% | -0.37 | -0.31 | -38.94% | 28.0% | 0.81 | 25 |

> **Nhận xét thực nghiệm:**
> - Trên **FPT**, trong khi thị trường cơ sở suy giảm sâu -33.32%, chiến lược AI vẫn đem lại lợi nhuận **+56.93%** nhờ kỷ luật chốt lời theo ATR và cắt lỗ sớm khi mất động lượng (Alpha đạt **+90.26%**, Profit Factor đạt **2.23**).
> - Trên **VIC**, chiến lược đạt hiệu suất bùng nổ **+508.11%** so với +129.46% của Buy & Hold, Tỷ số Sortino đạt **12.36** cho thấy độ biến động giảm giá được kiểm soát tối ưu.

---

## 5. KẾT QUẢ KIỂM THỬ HỆ THỐNG
- **Unit Test Backend:** `python backend/test_backtest.py` $\rightarrow$ **5/5 tests passed (100% OK)** trong 0.124s.
- **WebSocket System Test:** `python backend/test_websocket.py` $\rightarrow$ **All passed (100% OK)**.
- **Frontend Production Build:** `npm.cmd run build` $\rightarrow$ **Compiled successfully (162.57 kB gzip, 0 errors, 0 warnings)**.

---

## 6. KẾ HOẠCH TUẦN TIẾP THEO (TUẦN 8)
- **Chủ đề:** Giao dịch Giả lập (Paper Trading) Nâng cao & Quản lý Danh mục.
- **Nội dung:** Hỗ trợ lệnh Limit/Market, sổ lệnh thời gian thực, tính Lãi/Lỗ chưa chốt (Unrealized PnL) và đã chốt (Realized PnL), biểu đồ phân bổ tài sản danh mục (Asset Allocation Pie Chart).


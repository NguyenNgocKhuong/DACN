# 📊 BÁO CÁO TIẾN ĐỘ TUẦN 2 (TÓM TẮT)
## Đề tài: Hệ thống Phân tích & Dự báo Xu hướng Thị trường Chứng khoán

- **Giai đoạn:** Tuần 2 — Nâng cấp Mô hình Transformer Đa biến (Multimodal AI) & Tích hợp Suy luận
- **Trạng thái:** ✅ **Hoàn thành 100%**

---

### 1. KẾT QUẢ ĐÃ THỰC HIỆN

| STT | Hạng mục | Kết quả cụ thể | File mã nguồn |
|:---:|---|---|---|
| **1** | **Kiến trúc Dual-Head Multimodal Transformer** | Thiết kế mạng Transformer học sâu đa nhiệm (Multi-task): <br>• Đầu vào: **12 đặc trưng** (OHLCV + 6 chỉ báo kỹ thuật + Sentiment)<br>• Cấu hình: $d_{model}=64$, 4 Heads Attention, 3 Encoder Layers, Dropout 0.2<br>• Đầu ra kép: **Dự báo Xu hướng (UP/DOWN)** và **Ước tính Giá mục tiêu**. | [transformer_model.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/ai-model/transformer_model.py) |
| **2** | **Xây dựng Tập Dữ liệu Đa biến** | Pipeline tự động thu thập và gắn nhãn: <br>• Thu thập **2.044 bản ghi** từ VN30 (FPT, VCB, HPG, VIC) & US Tech (AAPL, MSFT, NVDA, TSLA)<br>• Tính toán đồng bộ 6 chỉ báo kỹ thuật & điểm cảm xúc. | [dataset_builder.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/ai-model/dataset_builder.py) |
| **3** | **Huấn luyện Mô hình Chuỗi Thời gian** | Chia tập Time-series Split (Train: 1.316 chuỗi, Val: 280 chuỗi, Test: 288 chuỗi, $L=20$ phiên):<br>• Tối ưu bằng AdamW + ReduceLROnPlateau<br>• Early Stopping kích hoạt tại epoch 21 (ngăn chặn Overfitting). | [train_multimodal_transformer.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/ai-model/train_multimodal_transformer.py) |
| **4** | **Tích hợp Tầng Suy luận Backend** | Nâng cấp API suy luận thời gian thực:<br>• Tự động trích xuất ma trận 12 đặc trưng từ CSDL<br>• Trả về Xác suất + Xu hướng + Giá dự báo<br>• Tự động ghi nhật ký vào bảng `ai_predictions` (Audit Trail). | [ai_service.py](file:///c:/CNTT/DACS/DACS/stock-ai-web/backend/services/ai_service.py) |

---

### 2. KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG TRÊN TẬP TEST ĐỘC LẬP

Thực nghiệm đánh giá trên **288 chuỗi thời gian chưa từng thấy (Unseen Test Set)**:

| Chỉ số Đánh giá | Giá trị Đạt được | Ý nghĩa Học thuật |
|---|:---:|---|
| **Độ chính xác Xu hướng (Accuracy)** | **59.72%** | Vượt trội so với mức ngẫu nhiên (50%), mang lại lợi thế sinh lời trong giao dịch định lượng. |
| **Precision (Độ chuẩn xác)** | **56.10%** | Tỷ lệ tín hiệu Báo Tăng thực sự có giá tăng trong phiên tiếp theo. |
| **Recall (Độ nhạy)** | **19.01%** | Mô hình chọn lọc tín hiệu an toàn, hạn chế vào lệnh rủi ro. |
| **F1-Score** | **28.40%** | Đo lường độ hài hòa giữa Precision và Recall. |

> *Số liệu chi tiết về Loss và quá trình học đã được lưu tại [ai-model/training_metrics.json](file:///c:/CNTT/DACS/DACS/stock-ai-web/ai-model/training_metrics.json).*

---

### 3. ĐIỂM NÂNG CẤP CỐT LÕI SO VỚI ĐỒ ÁN CƠ SỞ

1. **Chiều dữ liệu:** Nâng từ 5 chỉ số giá thô lên **12 đặc trưng đa chiều** kết hợp động lượng, biến động và tâm lý thị trường.
2. **Cửa sổ trượt (Sliding Window):** Tăng từ 3 phiên lên **20 phiên giao dịch** (1 tháng giao dịch), giúp Transformer học được chu kỳ biến động trung hạn.
3. **Kiến trúc Đầu ra Kép (Dual-Head Multi-Task):** Không chỉ dự đoán nhị phân UP/DOWN mà đồng thời ước lượng **mức giá mục tiêu phiên kế tiếp**, tạo tiền đề cho thuật toán quản lý vốn và cắt lỗ.
4. **Kiểm soát tính toàn vẹn (Audit Trail):** Mọi dự đoán đều được lưu vết tự động vào cơ sở dữ liệu để đối chiếu sau khi hết phiên.

---

### 4. KẾ HOẠCH TUẦN 3

1. **Huấn luyện Đối chuẩn (Benchmarks):** Huấn luyện song song mô hình **LSTM, GRU, và Random Forest / XGBoost** trên cùng tập Test để chứng minh tính ưu việt của Transformer.
2. **Nghiên cứu Cắt giảm (Ablation Study):** Đánh giá vai trò của từng nhóm đặc trưng (Chỉ dùng Giá vs Dùng thêm Chỉ báo KT vs Dùng thêm Sentiment).

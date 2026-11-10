import os
import sys

# Configure UTF-8 stdout for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', write_through=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', write_through=True)

import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, mean_absolute_error
)

from transformer_model import MultimodalTimeSeriesTransformer
from train_multimodal_transformer import create_sequences, FEATURE_COLS

base_dir = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(os.path.join(base_dir, '../data/stock_data_multimodal.csv'))
BENCHMARK_SAVE_PATH = os.path.abspath(os.path.join(base_dir, 'benchmark_results.json'))

# ==========================================
# 1. ĐỊNH NGHĨA CÁC MÔ HÌNH BASELINE (LSTM, GRU)
# ==========================================
class LSTMModel(nn.Module):
    def __init__(self, input_dim=12, hidden_dim=64, num_layers=2, dropout=0.2):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.fc_trend = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )
        self.fc_price = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        out, (hn, cn) = self.lstm(x)
        last_step = out[:, -1, :]
        return self.fc_trend(last_step), self.fc_price(last_step)


class GRUModel(nn.Module):
    def __init__(self, input_dim=12, hidden_dim=64, num_layers=2, dropout=0.2):
        super(GRUModel, self).__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.fc_trend = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )
        self.fc_price = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        out, hn = self.gru(x)
        last_step = out[:, -1, :]
        return self.fc_trend(last_step), self.fc_price(last_step)


# ==========================================
# 2. HÀM HUẤN LUYỆN VÀ ĐÁNH GIÁ MÔ HÌNH DEEP LEARNING
# ==========================================
def train_and_eval_dl(model, train_loader, val_loader, X_test, y_test_trend, y_test_price, price_scaler, epochs=25, lr=0.001):
    criterion_trend = nn.BCEWithLogitsLoss()
    criterion_price = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    
    best_loss = float('inf')
    best_weights = None
    
    for epoch in range(1, epochs + 1):
        model.train()
        for b_X, b_y_trend, b_y_price in train_loader:
            optimizer.zero_grad()
            out_trend, out_price = model(b_X)
            loss = criterion_trend(out_trend, b_y_trend) + 0.5 * criterion_price(out_price, b_y_price)
            loss.backward()
            optimizer.step()
            
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for b_X, b_y_trend, b_y_price in val_loader:
                out_trend, out_price = model(b_X)
                loss = criterion_trend(out_trend, b_y_trend) + 0.5 * criterion_price(out_price, b_y_price)
                val_loss += loss.item() * len(b_X)
                
        val_loss /= len(val_loader.dataset)
        if val_loss < best_loss:
            best_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
    if best_weights:
        model.load_state_dict(best_weights)
        
    model.eval()
    with torch.no_grad():
        test_t = torch.FloatTensor(X_test)
        pred_trend_logit, pred_price_scaled = model(test_t)
        probs = torch.sigmoid(pred_trend_logit).numpy().flatten()
        preds = (probs >= 0.5).astype(int)
        
        real_pred_prices = price_scaler.inverse_transform(pred_price_scaled.numpy()).flatten()
        real_act_prices = price_scaler.inverse_transform(y_test_price.reshape(-1, 1)).flatten()
        
    return evaluate_metrics(y_test_trend, preds, probs, real_act_prices, real_pred_prices)


def evaluate_metrics(y_true, y_pred, y_probs, y_price_true, y_price_pred):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    try:
        auc = roc_auc_score(y_true, y_probs)
    except:
        auc = 0.5
        
    cm = confusion_matrix(y_true, y_pred).tolist()
    rmse = np.sqrt(mean_squared_error(y_price_true, y_price_pred))
    mae = mean_absolute_error(y_price_true, y_price_pred)
    
    return {
        "accuracy": round(float(acc) * 100, 2),
        "precision": round(float(prec) * 100, 2),
        "recall": round(float(rec) * 100, 2),
        "f1_score": round(float(f1) * 100, 2),
        "roc_auc": round(float(auc), 4),
        "rmse": round(float(rmse), 2),
        "mae": round(float(mae), 2),
        "confusion_matrix": {
            "TN": cm[0][0] if len(cm) > 1 else 0,
            "FP": cm[0][1] if len(cm) > 1 else 0,
            "FN": cm[1][0] if len(cm) > 1 else 0,
            "TP": cm[1][1] if len(cm) > 1 else 0
        }
    }


# ==========================================
# 3. THỰC NGHIỆM CHÍNH (BENCHMARKS & ABLATION)
# ==========================================
def run_all_benchmarks():
    print("=================================================================")
    print(" TUẦN 3: THỰC NGHIỆM ĐỐI CHUẨN (BENCHMARKS) & ABLATION STUDY")
    print("=================================================================")
    
    df = pd.read_csv(DATA_PATH)
    SEQ_LENGTH = 20
    
    print("\n[1/3] Chuẩn bị dữ liệu chuỗi thời gian (Seq Length = 20, 12 Features)...")
    (
        X_train, y_train_trend, y_train_price,
        X_val, y_val_trend, y_val_price,
        X_test, y_test_trend, y_test_price,
        feature_scaler, price_scaler
    ) = create_sequences(df, seq_length=SEQ_LENGTH)
    
    train_ds = TensorDataset(
        torch.FloatTensor(X_train), 
        torch.FloatTensor(y_train_trend).unsqueeze(1),
        torch.FloatTensor(y_train_price).unsqueeze(1)
    )
    val_ds = TensorDataset(
        torch.FloatTensor(X_val), 
        torch.FloatTensor(y_val_trend).unsqueeze(1),
        torch.FloatTensor(y_val_price).unsqueeze(1)
    )
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False)
    
    results = {
        "benchmarks": {},
        "ablation_study": {},
        "test_samples": len(X_test)
    }
    
    # -------------------------------------------------------------
    # THỰC NGHIỆM ĐỐI CHUẨN 1: Random Forest (Machine Learning Baseline)
    # -------------------------------------------------------------
    print("\n--- [A] Huấn luyện Baseline 1: Random Forest (ML) ---")
    X_train_flat = X_train.reshape(X_train.shape[0], -1)
    X_test_flat = X_test.reshape(X_test.shape[0], -1)
    
    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_clf.fit(X_train_flat, y_train_trend)
    rf_preds = rf_clf.predict(X_test_flat)
    rf_probs = rf_clf.predict_proba(X_test_flat)[:, 1]
    
    rf_reg = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf_reg.fit(X_train_flat, y_train_price)
    rf_pred_price_scaled = rf_reg.predict(X_test_flat)
    real_rf_prices = price_scaler.inverse_transform(rf_pred_price_scaled.reshape(-1, 1)).flatten()
    real_act_prices = price_scaler.inverse_transform(y_test_price.reshape(-1, 1)).flatten()
    
    rf_metrics = evaluate_metrics(y_test_trend, rf_preds, rf_probs, real_act_prices, real_rf_prices)
    results["benchmarks"]["Random Forest"] = rf_metrics
    print(f" -> Random Forest | Acc: {rf_metrics['accuracy']}% | F1: {rf_metrics['f1_score']}% | AUC: {rf_metrics['roc_auc']}")
    
    # -------------------------------------------------------------
    # THỰC NGHIỆM ĐỐI CHUẨN 2: LSTM (Deep Learning Baseline)
    # -------------------------------------------------------------
    print("\n--- [B] Huấn luyện Baseline 2: LSTM (Deep Learning) ---")
    lstm_model = LSTMModel(input_dim=12, hidden_dim=64, num_layers=2, dropout=0.2)
    lstm_metrics = train_and_eval_dl(
        lstm_model, train_loader, val_loader, 
        X_test, y_test_trend, y_test_price, price_scaler, epochs=25
    )
    results["benchmarks"]["LSTM"] = lstm_metrics
    print(f" -> LSTM          | Acc: {lstm_metrics['accuracy']}% | F1: {lstm_metrics['f1_score']}% | AUC: {lstm_metrics['roc_auc']}")
    
    # -------------------------------------------------------------
    # THỰC NGHIỆM ĐỐI CHUẨN 3: GRU (Deep Learning Baseline)
    # -------------------------------------------------------------
    print("\n--- [C] Huấn luyện Baseline 3: GRU (Deep Learning) ---")
    gru_model = GRUModel(input_dim=12, hidden_dim=64, num_layers=2, dropout=0.2)
    gru_metrics = train_and_eval_dl(
        gru_model, train_loader, val_loader, 
        X_test, y_test_trend, y_test_price, price_scaler, epochs=25
    )
    results["benchmarks"]["GRU"] = gru_metrics
    print(f" -> GRU           | Acc: {gru_metrics['accuracy']}% | F1: {gru_metrics['f1_score']}% | AUC: {gru_metrics['roc_auc']}")
    
    # -------------------------------------------------------------
    # MÔ HÌNH ĐỀ XUẤT: Dual-Head Multimodal Transformer (Proposed)
    # -------------------------------------------------------------
    print("\n--- [D] Đánh giá Mô hình Đề Xuất: Dual-Head Transformer ---")
    transformer_model = MultimodalTimeSeriesTransformer(input_dim=12, d_model=64, nhead=4, num_layers=3, dim_feedforward=128, dropout=0.2)
    # Tải trọng số tốt nhất đã huấn luyện ở Tuần 2
    pth_path = os.path.abspath(os.path.join(base_dir, 'transformer_stock_multimodal.pth'))
    if os.path.exists(pth_path):
        ckpt = torch.load(pth_path, map_location=torch.device('cpu'), weights_only=False)
        transformer_model.load_state_dict(ckpt['model_state_dict'])
        transformer_model.eval()
        with torch.no_grad():
            t_t = torch.FloatTensor(X_test)
            t_logits, t_prices = transformer_model(t_t)
            t_probs = torch.sigmoid(t_logits).numpy().flatten()
            t_preds = (t_probs >= 0.5).astype(int)
            t_real_prices = price_scaler.inverse_transform(t_prices.numpy()).flatten()
            tf_metrics = evaluate_metrics(y_test_trend, t_preds, t_probs, real_act_prices, t_real_prices)
    else:
        tf_metrics = train_and_eval_dl(
            transformer_model, train_loader, val_loader, 
            X_test, y_test_trend, y_test_price, price_scaler, epochs=25
        )
    results["benchmarks"]["Transformer (Ours)"] = tf_metrics
    print(f" -> Transformer   | Acc: {tf_metrics['accuracy']}% | F1: {tf_metrics['f1_score']}% | AUC: {tf_metrics['roc_auc']}")
    
    # -------------------------------------------------------------
    # ABLATION STUDY: Nghiên cứu đóng góp của từng nhóm đặc trưng
    # -------------------------------------------------------------
    print("\n[2/3] Thực hiện Ablation Study trên Mô hình Transformer...")
    
    # Case 1: Chỉ dùng giá thô (5 đặc trưng đầu: open, high, low, close, volume)
    print(" -> Ablation 1: Chỉ dùng Giá thô OHLCV (5 đặc trưng)...")
    m1 = MultimodalTimeSeriesTransformer(input_dim=5, d_model=64, nhead=4, num_layers=3, dim_feedforward=128, dropout=0.2)
    t1_loader = DataLoader(TensorDataset(torch.FloatTensor(X_train[:, :, :5]), torch.FloatTensor(y_train_trend).unsqueeze(1), torch.FloatTensor(y_train_price).unsqueeze(1)), batch_size=32, shuffle=True)
    v1_loader = DataLoader(TensorDataset(torch.FloatTensor(X_val[:, :, :5]), torch.FloatTensor(y_val_trend).unsqueeze(1), torch.FloatTensor(y_val_price).unsqueeze(1)), batch_size=32, shuffle=False)
    metrics_ab1 = train_and_eval_dl(m1, t1_loader, v1_loader, X_test[:, :, :5], y_test_trend, y_test_price, price_scaler, epochs=20)
    results["ablation_study"]["1. OHLCV Only (5 features)"] = metrics_ab1
    print(f"    ✓ Acc: {metrics_ab1['accuracy']}% | F1: {metrics_ab1['f1_score']}% | AUC: {metrics_ab1['roc_auc']}")

    # Case 2: Giá thô + Chỉ báo kỹ thuật (11 đặc trưng, bỏ sentiment)
    print(" -> Ablation 2: Giá thô + Chỉ báo Kỹ thuật (11 đặc trưng)...")
    m2 = MultimodalTimeSeriesTransformer(input_dim=11, d_model=64, nhead=4, num_layers=3, dim_feedforward=128, dropout=0.2)
    t2_loader = DataLoader(TensorDataset(torch.FloatTensor(X_train[:, :, :11]), torch.FloatTensor(y_train_trend).unsqueeze(1), torch.FloatTensor(y_train_price).unsqueeze(1)), batch_size=32, shuffle=True)
    v2_loader = DataLoader(TensorDataset(torch.FloatTensor(X_val[:, :, :11]), torch.FloatTensor(y_val_trend).unsqueeze(1), torch.FloatTensor(y_val_price).unsqueeze(1)), batch_size=32, shuffle=False)
    metrics_ab2 = train_and_eval_dl(m2, t2_loader, v2_loader, X_test[:, :, :11], y_test_trend, y_test_price, price_scaler, epochs=20)
    results["ablation_study"]["2. OHLCV + Technical Indicators (11 features)"] = metrics_ab2
    print(f"    ✓ Acc: {metrics_ab2['accuracy']}% | F1: {metrics_ab2['f1_score']}% | AUC: {metrics_ab2['roc_auc']}")

    # Case 3: Toàn bộ 12 đặc trưng (Ours - Multimodal)
    results["ablation_study"]["3. Full Multimodal (12 features)"] = tf_metrics
    print(f" -> Ablation 3: Toàn bộ 12 đặc trưng (Full Multimodal)...")
    print(f"    ✓ Acc: {tf_metrics['accuracy']}% | F1: {tf_metrics['f1_score']}% | AUC: {tf_metrics['roc_auc']}")
    
    # [3/3] Xuất file kết quả JSON
    print("\n[3/3] Xuất kết quả thực nghiệm ra file JSON...")
    with open(BENCHMARK_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
    print(f"✓ Đã lưu toàn bộ kết quả vào: {BENCHMARK_SAVE_PATH}")
    
    # In bảng tổng hợp trực quan
    print("\n" + "="*75)
    print(" BẢNG TỔNG HỢP SO SÁNH ĐỐI CHUẨN (BENCHMARK SUMMARY TABLE)")
    print("="*75)
    print(f"{'Mô hình':<22} | {'Accuracy':<10} | {'F1-Score':<10} | {'ROC-AUC':<10} | {'RMSE':<10}")
    print("-" * 75)
    for model_name, m in results["benchmarks"].items():
        print(f"{model_name:<22} | {m['accuracy']:>8}% | {m['f1_score']:>8}% | {m['roc_auc']:>10} | {m['rmse']:>10}")
    print("="*75)
    
    print("\n" + "="*75)
    print(" BẢNG THỰC NGHIỆM CẮT GIẢM (ABLATION STUDY SUMMARY TABLE)")
    print("="*75)
    print(f"{'Cấu hình Đặc trưng':<42} | {'Accuracy':<10} | {'F1-Score':<10} | {'ROC-AUC':<10}")
    print("-" * 75)
    for config_name, m in results["ablation_study"].items():
        print(f"{config_name:<42} | {m['accuracy']:>8}% | {m['f1_score']:>8}% | {m['roc_auc']:>10}")
    print("="*75)

if __name__ == '__main__':
    run_all_benchmarks()


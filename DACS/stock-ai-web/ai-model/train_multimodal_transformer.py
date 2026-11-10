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
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error

from transformer_model import MultimodalTimeSeriesTransformer

# Set paths
base_dir = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(os.path.join(base_dir, '../data/stock_data_multimodal.csv'))
MODEL_SAVE_PATH = os.path.abspath(os.path.join(base_dir, 'transformer_stock_multimodal.pth'))
METRICS_SAVE_PATH = os.path.abspath(os.path.join(base_dir, 'training_metrics.json'))

FEATURE_COLS = [
    'open', 'high', 'low', 'close', 'volume',
    'rsi_14', 'macd', 'macd_signal', 'bb_middle',
    'ema_20', 'atr_14', 'sentiment'
]

def create_sequences(df, seq_length=20):
    """
    Tạo các cửa sổ trượt (sliding windows) cho từng mã cổ phiếu riêng biệt
    Chia tập Train (70%), Val (15%), Test (15%) theo đúng trình tự thời gian
    """
    train_X, train_y_trend, train_y_price = [], [], []
    val_X, val_y_trend, val_y_price = [], [], []
    test_X, test_y_trend, test_y_price = [], [], []
    
    symbols = df['symbol'].unique()
    
    feature_scaler = MinMaxScaler(feature_range=(0, 1))
    price_scaler = MinMaxScaler(feature_range=(0, 1))
    
    # Gom toàn bộ dữ liệu train để fit scaler (tránh Data Leakage)
    train_data_collector = []
    train_price_collector = []
    
    for sym in symbols:
        sym_df = df[df['symbol'] == sym].sort_values(by='date').reset_index(drop=True)
        n = len(sym_df)
        n_train = int(n * 0.70)
        train_data_collector.append(sym_df.iloc[:n_train][FEATURE_COLS].values)
        train_price_collector.append(sym_df.iloc[:n_train][['target_next_close']].values)
        
    all_train_features = np.vstack(train_data_collector)
    all_train_prices = np.vstack(train_price_collector)
    
    feature_scaler.fit(all_train_features)
    price_scaler.fit(all_train_prices)
    
    for sym in symbols:
        sym_df = df[df['symbol'] == sym].sort_values(by='date').reset_index(drop=True)
        features = sym_df[FEATURE_COLS].values
        trends = sym_df['target_trend'].values
        prices = sym_df[['target_next_close']].values
        
        scaled_features = feature_scaler.transform(features)
        scaled_prices = price_scaler.transform(prices)
        
        X_sym, y_trend_sym, y_price_sym = [], [], []
        for i in range(len(sym_df) - seq_length):
            X_sym.append(scaled_features[i:i + seq_length])
            y_trend_sym.append(trends[i + seq_length - 1])
            y_price_sym.append(scaled_prices[i + seq_length - 1][0])
            
        n_seq = len(X_sym)
        idx_train = int(n_seq * 0.70)
        idx_val = int(n_seq * 0.85)
        
        train_X.extend(X_sym[:idx_train])
        train_y_trend.extend(y_trend_sym[:idx_train])
        train_y_price.extend(y_price_sym[:idx_train])
        
        val_X.extend(X_sym[idx_train:idx_val])
        val_y_trend.extend(y_trend_sym[idx_train:idx_val])
        val_y_price.extend(y_price_sym[idx_train:idx_val])
        
        test_X.extend(X_sym[idx_val:])
        test_y_trend.extend(y_trend_sym[idx_val:])
        test_y_price.extend(y_price_sym[idx_val:])
        
    return (
        np.array(train_X), np.array(train_y_trend), np.array(train_y_price),
        np.array(val_X), np.array(val_y_trend), np.array(val_y_price),
        np.array(test_X), np.array(test_y_trend), np.array(test_y_price),
        feature_scaler, price_scaler
    )

def train_multimodal_model():
    print("=== [BƯỚC 2/3] HUẤN LUYỆN DUAL-HEAD MULTIMODAL TRANSFORMER ===")
    
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return
        
    df = pd.read_csv(DATA_PATH)
    print(f" • Đọc dữ liệu thành công: {len(df)} bản ghi.")
    
    SEQ_LENGTH = 20
    (
        X_train, y_train_trend, y_train_price,
        X_val, y_val_trend, y_val_price,
        X_test, y_test_trend, y_test_price,
        feature_scaler, price_scaler
    ) = create_sequences(df, seq_length=SEQ_LENGTH)
    
    print(f" • Kích thước tập dữ liệu chuỗi (Seq Length = {SEQ_LENGTH}):")
    print(f"   - Tập Huấn luyện (Train): {len(X_train)} mẫu chuỗi")
    print(f"   - Tập Kiểm định (Val):   {len(X_val)} mẫu chuỗi")
    print(f"   - Tập Kiểm thử (Test):   {len(X_test)} mẫu chuỗi")
    
    # Chuyển đổi sang PyTorch Tensors
    train_dataset = TensorDataset(
        torch.FloatTensor(X_train), 
        torch.FloatTensor(y_train_trend).unsqueeze(1),
        torch.FloatTensor(y_train_price).unsqueeze(1)
    )
    val_dataset = TensorDataset(
        torch.FloatTensor(X_val), 
        torch.FloatTensor(y_val_trend).unsqueeze(1),
        torch.FloatTensor(y_val_price).unsqueeze(1)
    )
    test_dataset = TensorDataset(
        torch.FloatTensor(X_test), 
        torch.FloatTensor(y_test_trend).unsqueeze(1),
        torch.FloatTensor(y_test_price).unsqueeze(1)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    # Thiết lập mô hình
    input_dim = len(FEATURE_COLS) # 12
    d_model = 64
    nhead = 4
    num_layers = 3
    dim_feedforward = 128
    dropout = 0.2
    
    model = MultimodalTimeSeriesTransformer(
        input_dim=input_dim,
        d_model=d_model,
        nhead=nhead,
        num_layers=num_layers,
        dim_feedforward=dim_feedforward,
        dropout=dropout
    )
    
    # Loss functions & Optimizer
    criterion_trend = nn.BCEWithLogitsLoss()
    criterion_price = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)
    
    best_val_loss = float('inf')
    best_weights = None
    patience = 12
    patience_counter = 0
    history = {"train_loss": [], "val_loss": [], "val_acc": []}
    
    print("\n -> Bắt đầu quá trình huấn luyện (Max Epochs: 50)...")
    
    for epoch in range(1, 51):
        model.train()
        total_train_loss = 0.0
        
        for batch_X, batch_y_trend, batch_y_price in train_loader:
            optimizer.zero_grad()
            out_trend, out_price = model(batch_X)
            
            loss_trend = criterion_trend(out_trend, batch_y_trend)
            loss_price = criterion_price(out_price, batch_y_price)
            loss = loss_trend + 0.5 * loss_price
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_train_loss += loss.item() * len(batch_X)
            
        train_loss = total_train_loss / len(train_dataset)
        
        # Validation loop
        model.eval()
        total_val_loss = 0.0
        val_preds_trend = []
        val_targets_trend = []
        
        with torch.no_grad():
            for batch_X, batch_y_trend, batch_y_price in val_loader:
                out_trend, out_price = model(batch_X)
                loss_trend = criterion_trend(out_trend, batch_y_trend)
                loss_price = criterion_price(out_price, batch_y_price)
                loss = loss_trend + 0.5 * loss_price
                
                total_val_loss += loss.item() * len(batch_X)
                preds = (torch.sigmoid(out_trend) > 0.5).int().cpu().numpy()
                val_preds_trend.extend(preds)
                val_targets_trend.extend(batch_y_trend.cpu().numpy())
                
        val_loss = total_val_loss / len(val_dataset)
        val_acc = accuracy_score(val_targets_trend, val_preds_trend)
        scheduler.step(val_loss)
        
        history["train_loss"].append(round(train_loss, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(float(val_acc), 4))
        
        if epoch % 5 == 0 or epoch == 1:
            print(f"    Epoch [{epoch:02d}/50] | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}%")
            
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = model.state_dict().copy()
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"    ! Early stopping kích hoạt tại epoch {epoch} (Validation loss không cải thiện).")
                break
                
    # Load best weights
    model.load_state_dict(best_weights)
    
    # === [BƯỚC 3/3] ĐÁNH GIÁ ĐỊNH LƯỢNG TRÊN TẬP TEST ĐỘC LẬP ===
    print("\n=== [BƯỚC 3/3] ĐÁNH GIÁ ĐỊNH LƯỢNG TRÊN TẬP TEST ĐỘC LẬP ===")
    model.eval()
    with torch.no_grad():
        test_tensor_X = torch.FloatTensor(X_test)
        test_out_trend, test_out_price = model(test_tensor_X)
        
        test_probs = torch.sigmoid(test_out_trend).numpy()
        test_preds = (test_probs > 0.5).astype(int).flatten()
        test_targets = y_test_trend.flatten()
        
        # Đánh giá phân loại xu hướng
        acc = accuracy_score(test_targets, test_preds)
        prec = precision_score(test_targets, test_preds, zero_division=0)
        rec = recall_score(test_targets, test_preds, zero_division=0)
        f1 = f1_score(test_targets, test_preds, zero_division=0)
        
        # Đánh giá hồi quy giá
        pred_prices_scaled = test_out_price.numpy()
        pred_prices_real = price_scaler.inverse_transform(pred_prices_scaled).flatten()
        actual_prices_real = price_scaler.inverse_transform(y_test_price.reshape(-1, 1)).flatten()
        
        rmse = np.sqrt(mean_squared_error(actual_prices_real, pred_prices_real))
        mae = mean_absolute_error(actual_prices_real, pred_prices_real)
        mape = np.mean(np.abs((actual_prices_real - pred_prices_real) / actual_prices_real)) * 100
        
    print(f" • Kết quả Phân loại Xu hướng (Directional Prediction):")
    print(f"   - Accuracy:  {acc*100:.2f}%")
    print(f"   - Precision: {prec*100:.2f}%")
    print(f"   - Recall:    {rec*100:.2f}%")
    print(f"   - F1-Score:  {f1*100:.2f}%")
    print(f" • Kết quả Dự báo Giá (Price Estimation):")
    print(f"   - RMSE: {rmse:.2f} điểm/USD")
    print(f"   - MAE:  {mae:.2f} điểm/USD")
    print(f"   - MAPE: {mape:.2f}%")
    
    # Lưu Checkpoint mô hình
    checkpoint_data = {
        'model_state_dict': model.state_dict(),
        'feature_scaler': feature_scaler,
        'price_scaler': price_scaler,
        'features': FEATURE_COLS,
        'seq_length': SEQ_LENGTH,
        'params': {
            'input_dim': input_dim,
            'd_model': d_model,
            'nhead': nhead,
            'num_layers': num_layers,
            'dim_feedforward': dim_feedforward,
            'dropout': dropout
        },
        'metrics': {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'rmse': round(float(rmse), 4),
            'mae': round(float(mae), 4),
            'mape': round(float(mape), 4)
        }
    }
    
    torch.save(checkpoint_data, MODEL_SAVE_PATH)
    # Đồng thời cập nhật transformer_stock.pth cho backend dùng ngay
    default_pth = os.path.abspath(os.path.join(base_dir, 'transformer_stock.pth'))
    torch.save(checkpoint_data, default_pth)
    
    # Lưu metrics ra JSON
    with open(METRICS_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump({
            "model": "Dual-Head Multimodal TimeSeries Transformer",
            "features": FEATURE_COLS,
            "seq_length": SEQ_LENGTH,
            "metrics": checkpoint_data["metrics"],
            "history": history
        }, f, indent=4)
        
    print(f"\n✓ Đã lưu trọng số mô hình tốt nhất vào: {MODEL_SAVE_PATH}")
    print(f"✓ Đã xuất số liệu thực nghiệm chi tiết vào: {METRICS_SAVE_PATH}")
    return checkpoint_data["metrics"]

if __name__ == '__main__':
    train_multimodal_model()

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
import os
from transformer_model import TimeSeriesTransformer

# Set paths
base_dir = os.path.dirname(__file__)
price_path = os.path.join(base_dir, '../data/stock_data.csv')
sentiment_path = os.path.join(base_dir, '../data/market_comments.csv')
model_save_path = os.path.join(base_dir, 'transformer_stock.pth')

def train_model():
    # Load data
    df_price = pd.read_csv(price_path)
    df_sentiment = pd.read_csv(sentiment_path)
    
    # Merge on date and symbol
    df = pd.merge(df_price, df_sentiment[['date', 'symbol', 'sentiment']], on=['date', 'symbol'], how='left')
    df['sentiment'] = df['sentiment'].fillna(0) # Fill missing sentiment with neutral
    
    # Features: open, high, low, close, volume, sentiment
    features = ['open', 'high', 'low', 'close', 'volume', 'sentiment']
    data = df[features].values
    
    # Normalize
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)
    
    # Create sequences (e.g., look back 3 days to predict the next trend)
    seq_length = 3
    X, y = [], []
    for i in range(len(data_scaled) - seq_length):
        X.append(data_scaled[i:i+seq_length])
        # Predict trend of the NEXT day (0 or 1)
        # Using close price trend as target for simplicity
        target = 1 if data_scaled[i+seq_length][3] > data_scaled[i+seq_length-1][3] else 0
        y.append(target)
    
    X = torch.FloatTensor(np.array(X))
    y = torch.FloatTensor(np.array(y)).unsqueeze(1)
    
    # Model parameters
    input_dim = len(features)
    d_model = 32
    nhead = 4
    num_layers = 2
    dim_feedforward = 64
    
    model = TimeSeriesTransformer(input_dim, d_model, nhead, num_layers, dim_feedforward)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Training loop (mock short training)
    print("Training Transformer model...")
    model.train()
    for epoch in range(50):
        optimizer.zero_grad()
        output = model(X)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()
        if (epoch+1) % 10 == 0:
            print(f'Epoch [{epoch+1}/50], Loss: {loss.item():.4f}')
            
    # Save model and scaler
    torch.save({
        'model_state_dict': model.state_dict(),
        'scaler': scaler,
        'features': features,
        'params': {
            'input_dim': input_dim,
            'd_model': d_model,
            'nhead': nhead,
            'num_layers': num_layers,
            'dim_feedforward': dim_feedforward
        }
    }, model_save_path)
    print(f"Model saved to {model_save_path}")

if __name__ == "__main__":
    train_model()

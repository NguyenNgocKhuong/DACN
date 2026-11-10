import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    """
    Mã hóa vị trí thời gian (Sinusoidal Positional Encoding)
    Giúp Transformer nắm bắt thứ tự chuỗi thời gian của các phiên giao dịch
    """
    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super(PositionalEncoding, self).__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: [batch_size, seq_len, d_model]
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class MultimodalTimeSeriesTransformer(nn.Module):
    """
    Kiến trúc Transformer Đa Biến (Dual-Head Architecture) cho Chuỗi Thời Gian Tài Chính
    - Đầu vào: [batch_size, seq_len, 12] (Giá OHLCV + 6 Chỉ báo kỹ thuật + Sentiment)
    - Đầu ra kép (Multi-Task):
        1. Trend Head: Xác suất xu hướng ngày tiếp theo (UP: 1 / DOWN: 0)
        2. Price Head: Giá đóng cửa ước lượng phiên tiếp theo (Normalized Close Price)
    """
    def __init__(
        self,
        input_dim: int = 12,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 3,
        dim_feedforward: int = 128,
        dropout: float = 0.2
    ):
        super(MultimodalTimeSeriesTransformer, self).__init__()
        self.model_type = 'MultimodalTransformer'
        self.input_dim = input_dim
        self.d_model = d_model
        
        # 1. Tầng chiếu đặc trưng đầu vào lên không gian nhúng d_model
        self.input_projection = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.LayerNorm(d_model),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        # 2. Tầng mã hóa vị trí
        self.pos_encoder = PositionalEncoding(d_model, dropout)
        
        # 3. Transformer Encoder Blocks (Multi-Head Self-Attention + FeedForward)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
            activation='gelu'
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # 4. Tầng chuẩn hóa cuối cùng của encoder
        self.encoder_norm = nn.LayerNorm(d_model)
        
        # 5. Dual-Head Output:
        # Head A: Phân loại xu hướng Tăng / Giảm (Trend Classification Head)
        self.trend_head = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1) # Raw logit cho BCEWithLogitsLoss
        )
        
        # Head B: Ước lượng mức giá mục tiêu phiên tiếp theo (Price Regression Head)
        self.price_head = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Linear(32, 1) # Giá chuẩn hóa
        )

    def forward(self, src: torch.Tensor):
        # src: [batch_size, seq_len, input_dim]
        projected = self.input_projection(src) # [batch_size, seq_len, d_model]
        encoded = self.pos_encoder(projected)  # [batch_size, seq_len, d_model]
        
        transformer_out = self.transformer_encoder(encoded) # [batch_size, seq_len, d_model]
        normalized_out = self.encoder_norm(transformer_out)
        
        # Lấy biểu diễn đặc trưng tại bước thời gian cuối cùng của chuỗi (Latest Context)
        last_step = normalized_out[:, -1, :] # [batch_size, d_model]
        
        trend_logit = self.trend_head(last_step) # [batch_size, 1]
        predicted_price = self.price_head(last_step) # [batch_size, 1]
        
        return trend_logit, predicted_price

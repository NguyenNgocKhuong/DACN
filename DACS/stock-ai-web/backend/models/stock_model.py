from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from database.db import Base
from datetime import datetime

class Stock(Base):
    """
    Danh mục mã chứng khoán được theo dõi trong hệ thống
    """
    __tablename__ = 'stocks'
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    exchange = Column(String(20), default='HOSE') # HOSE, HNX, UPCOM, NASDAQ, NYSE
    sector = Column(String(100), default='General') # Ngân hàng, Bất động sản, Công nghệ,...
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prices = relationship("StockDailyPrice", back_populates="stock", cascade="all, delete-orphan")
    indicators = relationship("TechnicalIndicator", back_populates="stock", cascade="all, delete-orphan")
    predictions = relationship("AIPrediction", back_populates="stock", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "exchange": self.exchange,
            "sector": self.sector,
            "is_active": self.is_active
        }


class StockDailyPrice(Base):
    """
    Dữ liệu lịch sử giá OHLCV theo ngày
    """
    __tablename__ = 'stock_daily_prices'
    
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey('stocks.id'), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    change = Column(Float, default=0.0)
    change_percent = Column(Float, default=0.0)

    stock = relationship("Stock", back_populates="prices")

    __table_args__ = (
        Index('idx_symbol_date', 'symbol', 'date', unique=True),
    )

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "date": self.date,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "change": self.change,
            "change_percent": self.change_percent
        }


class TechnicalIndicator(Base):
    """
    Các chỉ báo kỹ thuật phục vụ Feature Engineering cho AI và hiển thị biểu đồ
    """
    __tablename__ = 'technical_indicators'
    
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey('stocks.id'), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True)
    
    # Momentum indicators
    rsi_14 = Column(Float, nullable=True) # RSI 14 phiên
    
    # Trend indicators
    ema_20 = Column(Float, nullable=True)
    ema_50 = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    macd_signal = Column(Float, nullable=True)
    macd_hist = Column(Float, nullable=True)
    
    # Volatility indicators
    bb_upper = Column(Float, nullable=True)
    bb_middle = Column(Float, nullable=True)
    bb_lower = Column(Float, nullable=True)
    atr_14 = Column(Float, nullable=True)
    
    # Volume indicator
    obv = Column(Float, nullable=True)

    stock = relationship("Stock", back_populates="indicators")

    __table_args__ = (
        Index('idx_indicator_symbol_date', 'symbol', 'date', unique=True),
    )

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "date": self.date,
            "rsi_14": self.rsi_14,
            "ema_20": self.ema_20,
            "ema_50": self.ema_50,
            "macd": self.macd,
            "macd_signal": self.macd_signal,
            "macd_hist": self.macd_hist,
            "bb_upper": self.bb_upper,
            "bb_middle": self.bb_middle,
            "bb_lower": self.bb_lower,
            "atr_14": self.atr_14,
            "obv": self.obv
        }


class MarketNews(Base):
    """
    Tin tức tài chính phục vụ Sentiment Analysis
    """
    __tablename__ = 'market_news'
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), nullable=True, index=True) # Gắn với mã cụ thể hoặc NULL nếu là tin toàn thị trường
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=True)
    source = Column(String(100), default='Vietstock') # Vietstock, Cafef, VnExpress
    url = Column(String(500), nullable=True)
    published_date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    
    # Kết quả phân tích cảm xúc
    sentiment_score = Column(Float, default=0.0) # Từ -1.0 (Rất tiêu cực) đến 1.0 (Rất tích cực)
    sentiment_label = Column(String(20), default='NEUTRAL') # POSITIVE, NEGATIVE, NEUTRAL
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "title": self.title,
            "summary": self.summary,
            "source": self.source,
            "url": self.url,
            "published_date": self.published_date,
            "sentiment_score": self.sentiment_score,
            "sentiment_label": self.sentiment_label
        }


class AIPrediction(Base):
    """
    Nhật ký dự báo của mô hình AI để kiểm chứng độ chính xác liên tục (Audit Trail)
    """
    __tablename__ = 'ai_predictions'
    
    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey('stocks.id'), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    model_name = Column(String(50), default='Transformer_Multimodal_v1')
    prediction_time = Column(DateTime, default=datetime.utcnow)
    target_date = Column(String(20), nullable=False) # Ngày mục tiêu được dự báo
    
    predicted_trend = Column(String(10), nullable=False) # UP / DOWN
    trend_probability = Column(Float, nullable=False) # Xác suất (0.0 - 1.0)
    predicted_price = Column(Float, nullable=True) # Giá mục tiêu ước lượng
    
    # Kết quả thực tế được cập nhật sau khi phiên kết thúc
    actual_price = Column(Float, nullable=True)
    actual_trend = Column(String(10), nullable=True) # UP / DOWN
    is_correct = Column(Boolean, nullable=True) # True / False

    stock = relationship("Stock", back_populates="predictions")

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "model_name": self.model_name,
            "prediction_time": self.prediction_time.isoformat() if self.prediction_time else None,
            "target_date": self.target_date,
            "predicted_trend": self.predicted_trend,
            "trend_probability": self.trend_probability,
            "predicted_price": self.predicted_price,
            "actual_price": self.actual_price,
            "actual_trend": self.actual_trend,
            "is_correct": self.is_correct
        }


class TradeOrder(Base):
    """
    Lịch sử giao dịch mô phỏng (Paper Trading Orders)
    """
    __tablename__ = 'trade_orders'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    order_type = Column(String(10), nullable=False) # BUY / SELL
    order_action = Column(String(20), default='MARKET') # MARKET, LIMIT
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    fee = Column(Float, default=0.0) # Phí giao dịch sàn (0.15%)
    status = Column(String(20), default='EXECUTED') # EXECUTED, CANCELLED, PENDING
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "symbol": self.symbol,
            "order_type": self.order_type,
            "quantity": self.quantity,
            "price": self.price,
            "total_value": self.total_value,
            "fee": self.fee,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class BacktestExperiment(Base):
    """
    Lưu kết quả các phiên kiểm thử chiến lược giao dịch định lượng (Backtesting)
    """
    __tablename__ = 'backtest_experiments'
    
    id = Column(Integer, primary_key=True)
    strategy_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    symbol = Column(String(20), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    
    # Financial Evaluation Metrics
    initial_capital = Column(Float, default=100000000.0) # Vốn khởi điểm: 100 triệu VND
    final_capital = Column(Float, nullable=False)
    total_return_pct = Column(Float, nullable=False) # Lợi nhuận %
    benchmark_return_pct = Column(Float, nullable=False) # Lợi nhuận Buy & Hold %
    
    sharpe_ratio = Column(Float, nullable=True) # Tỷ số Sharpe
    max_drawdown_pct = Column(Float, nullable=True) # Mức sụt giảm tối đa %
    win_rate_pct = Column(Float, nullable=True) # Tỷ lệ lệnh thắng %
    profit_factor = Column(Float, nullable=True) # Tổng lời / Tổng lỗ
    total_trades = Column(Integer, default=0) # Tổng số lệnh giao dịch
    
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "strategy_name": self.strategy_name,
            "model_version": self.model_version,
            "symbol": self.symbol,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "period": f"{self.start_date} -> {self.end_date}",
            "initial_capital": self.initial_capital,
            "final_capital": self.final_capital,
            "total_return_pct": self.total_return_pct,
            "benchmark_return_pct": self.benchmark_return_pct,
            "sharpe_ratio": self.sharpe_ratio,
            "max_drawdown_pct": self.max_drawdown_pct,
            "win_rate_pct": self.win_rate_pct,
            "profit_factor": self.profit_factor,
            "total_trades": self.total_trades,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

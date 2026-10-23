import numpy as np
import pandas as pd

class IndicatorService:
    """
    Dịch vụ tính toán các chỉ báo kỹ thuật tài chính chuyên sâu
    Áp dụng các công thức chuẩn toán học cho Feature Engineering và Biểu đồ
    """

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """
        RSI (Relative Strength Index)
        Công thức: RSI = 100 - (100 / (1 + RS))
        RS = Average Gain / Average Loss (Wilder's Smoothing)
        """
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        # Exponential moving average for Wilder's smoothing
        avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50.0).round(2)

    @staticmethod
    def calculate_ema(series: pd.Series, span: int) -> pd.Series:
        """
        EMA (Exponential Moving Average)
        """
        return series.ewm(span=span, adjust=False).mean().round(2)

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
        """
        MACD (Moving Average Convergence Divergence)
        MACD Line = EMA(fast) - EMA(slow)
        Signal Line = EMA(MACD Line, signal)
        Histogram = MACD Line - Signal Line
        """
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        
        return macd_line.round(2), signal_line.round(2), histogram.round(2)

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, period: int = 20, std_dev: float = 2.0):
        """
        Bollinger Bands
        Middle = SMA(period)
        Upper = Middle + (std_dev * StdDev)
        Lower = Middle - (std_dev * StdDev)
        """
        middle = series.rolling(window=period, min_periods=1).mean()
        std = series.rolling(window=period, min_periods=1).std().fillna(0)
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        
        return upper.round(2), middle.round(2), lower.round(2)

    @staticmethod
    def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """
        ATR (Average True Range) - Đo lường độ biến động giá
        TR = max(High - Low, |High - Close_prev|, |Low - Close_prev|)
        ATR = EMA(TR, period)
        """
        high = df['high']
        low = df['low']
        close_prev = df['close'].shift(1)
        
        tr1 = high - low
        tr2 = (high - close_prev).abs()
        tr3 = (low - close_prev).abs()
        
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        return atr.fillna(tr).round(2)

    @staticmethod
    def calculate_obv(df: pd.DataFrame) -> pd.Series:
        """
        OBV (On-Balance Volume) - Đo áp lực dòng tiền mua / bán
        Nếu Close > Close_prev: OBV = OBV_prev + Volume
        Nếu Close < Close_prev: OBV = OBV_prev - Volume
        Nếu Close == Close_prev: OBV = OBV_prev
        """
        close_diff = df['close'].diff()
        direction = np.where(close_diff > 0, 1, np.where(close_diff < 0, -1, 0))
        obv = (direction * df['volume']).cumsum()
        return obv.round(2)

    @classmethod
    def compute_all_indicators(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Hàm xử lý toàn bộ bảng giá và trả về DataFrame đầy đủ đặc trưng kỹ thuật
        Yêu cầu df có các cột: 'date', 'open', 'high', 'low', 'close', 'volume'
        """
        df_sorted = df.sort_values(by='date').copy()
        
        # Momentum & Trend
        df_sorted['rsi_14'] = cls.calculate_rsi(df_sorted['close'], period=14)
        df_sorted['ema_20'] = cls.calculate_ema(df_sorted['close'], span=20)
        df_sorted['ema_50'] = cls.calculate_ema(df_sorted['close'], span=50)
        
        macd, signal, hist = cls.calculate_macd(df_sorted['close'])
        df_sorted['macd'] = macd
        df_sorted['macd_signal'] = signal
        df_sorted['macd_hist'] = hist
        
        # Volatility
        bb_upper, bb_mid, bb_lower = cls.calculate_bollinger_bands(df_sorted['close'], period=20, std_dev=2.0)
        df_sorted['bb_upper'] = bb_upper
        df_sorted['bb_middle'] = bb_mid
        df_sorted['bb_lower'] = bb_lower
        df_sorted['atr_14'] = cls.calculate_atr(df_sorted, period=14)
        
        # Volume
        df_sorted['obv'] = cls.calculate_obv(df_sorted)
        
        return df_sorted

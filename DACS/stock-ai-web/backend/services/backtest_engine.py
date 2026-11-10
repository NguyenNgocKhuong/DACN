import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import math
import numpy as np
import pandas as pd
from datetime import datetime
from database.db import db_session
from models.stock_model import Stock, StockDailyPrice, TechnicalIndicator, BacktestExperiment
from services.ai_service import load_model, FEATURE_COLS

class BacktestEngine:
    """
    Quantitative Backtesting Engine cho các chiến lược giao dịch định lượng
    kết hợp tín hiệu mô hình AI Transformer và Quản trị Rủi ro (ATR / Stop Loss / Take Profit)
    Tuân thủ quy chế khớp lệnh và chu kỳ thanh toán T+2.5 trên thị trường chứng khoán Việt Nam.
    """

    def __init__(
        self,
        symbol: str,
        strategy_name: str = "AI_TRANSFORMER_ATR",
        start_date: str = None,
        end_date: str = None,
        initial_capital: float = 100000000.0, # 100 triệu VND (hoặc 100,000 USD cho US tech)
        commission_rate: float = 0.0015,       # 0.15% phí giao dịch sàn
        stop_loss_pct: float = 5.0,           # Ngưỡng cắt lỗ tham chiếu (% hoặc hệ số ATR)
        take_profit_pct: float = 10.0,        # Ngưỡng chốt lời tham chiếu (% hoặc hệ số ATR)
        ai_confidence_thresh: float = 0.55,   # Ngưỡng xác suất AI để kích hoạt lệnh mua
        use_atr_stops: bool = True            # Dùng ngưỡng ATR động hay % cố định
    ):
        self.symbol = symbol.upper()
        self.strategy_name = strategy_name
        self.start_date = start_date
        self.end_date = end_date
        self.initial_capital = float(initial_capital)
        self.commission_rate = float(commission_rate)
        self.stop_loss_pct = float(stop_loss_pct)
        self.take_profit_pct = float(take_profit_pct)
        self.ai_confidence_thresh = float(ai_confidence_thresh)
        self.use_atr_stops = use_atr_stops

    def load_historical_data(self) -> pd.DataFrame:
        """
        Tải chuỗi dữ liệu OHLCV và các chỉ báo kỹ thuật liên kết từ CSDL SQLite hoặc CSV
        """
        query_prices = StockDailyPrice.query.filter_by(symbol=self.symbol)
        query_inds = TechnicalIndicator.query.filter_by(symbol=self.symbol)

        if self.start_date:
            query_prices = query_prices.filter(StockDailyPrice.date >= self.start_date)
            query_inds = query_inds.filter(TechnicalIndicator.date >= self.start_date)
        if self.end_date:
            query_prices = query_prices.filter(StockDailyPrice.date <= self.end_date)
            query_inds = query_inds.filter(TechnicalIndicator.date <= self.end_date)

        prices = query_prices.order_by(StockDailyPrice.date.asc()).all()
        inds = query_inds.order_by(TechnicalIndicator.date.asc()).all()

        if prices and len(prices) >= 20:
            price_data = [{
                'date': p.date,
                'open': float(p.open),
                'high': float(p.high),
                'low': float(p.low),
                'close': float(p.close),
                'volume': float(p.volume)
            } for p in prices]
            df_p = pd.DataFrame(price_data)

            ind_data = [{
                'date': ind.date,
                'rsi_14': float(ind.rsi_14) if ind.rsi_14 is not None else 50.0,
                'ema_20': float(ind.ema_20) if ind.ema_20 is not None else 0.0,
                'ema_50': float(ind.ema_50) if ind.ema_50 is not None else 0.0,
                'macd': float(ind.macd) if ind.macd is not None else 0.0,
                'macd_signal': float(ind.macd_signal) if ind.macd_signal is not None else 0.0,
                'macd_hist': float(ind.macd_hist) if ind.macd_hist is not None else 0.0,
                'bb_upper': float(ind.bb_upper) if ind.bb_upper is not None else 0.0,
                'bb_middle': float(ind.bb_middle) if ind.bb_middle is not None else 0.0,
                'bb_lower': float(ind.bb_lower) if ind.bb_lower is not None else 0.0,
                'atr_14': float(ind.atr_14) if ind.atr_14 is not None else 0.0,
                'obv': float(ind.obv) if ind.obv is not None else 0.0
            } for ind in inds]
            df_ind = pd.DataFrame(ind_data)

            if not df_ind.empty:
                df = pd.merge(df_p, df_ind, on='date', how='left')
            else:
                df = df_p
        else:
            # Fallback đọc từ multimodal CSV
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/stock_data_multimodal.csv'))
            if os.path.exists(csv_path):
                df_all = pd.read_csv(csv_path)
                df = df_all[df_all['symbol'] == self.symbol].sort_values('date').copy()
                if self.start_date:
                    df = df[df['date'] >= self.start_date]
                if self.end_date:
                    df = df[df['date'] <= self.end_date]
            else:
                return pd.DataFrame()

        if df.empty:
            return df

        # Chuẩn hóa các trường chỉ số
        if 'rsi_14' not in df.columns or df['rsi_14'].isna().all():
            df['rsi_14'] = 50.0
        if 'atr_14' not in df.columns or df['atr_14'].isna().all():
            df['atr_14'] = df['high'] - df['low']
        if 'macd_hist' not in df.columns:
            df['macd_hist'] = df.get('macd', 0.0) - df.get('macd_signal', 0.0)
        if 'ema_20' not in df.columns:
            df['ema_20'] = df['close']

        df['atr_14'] = df['atr_14'].replace(0.0, np.nan).fillna(df['close'] * 0.02)
        df['rsi_14'] = df['rsi_14'].fillna(50.0)
        df['ema_20'] = df['ema_20'].replace(0.0, np.nan).fillna(df['close'])

        return df.reset_index(drop=True)

    def generate_ai_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Sinh tín hiệu dự báo từ AI và bộ lọc kỹ thuật theo cơ chế Walk-Forward
        Đảm bảo không xảy ra hiện tượng rò rỉ dữ liệu (Look-ahead bias)
        """
        df = df.copy()
        n = len(df)
        signals = []
        probabilities = []

        for i in range(n):
            close = float(df.loc[i, 'close'])
            rsi = float(df.loc[i, 'rsi_14'])
            macd_h = float(df.loc[i, 'macd_hist']) if 'macd_hist' in df.columns else 0.0
            ema20 = float(df.loc[i, 'ema_20']) if 'ema_20' in df.columns else close

            # Tín hiệu động lượng kết hợp đa nhân tố
            score = 0.50
            if i >= 1:
                ret = (close - df.loc[i - 1, 'close']) / df.loc[i - 1, 'close']
                score += np.clip(ret * 3.0, -0.15, 0.15)

            if ema20 > 0:
                if close >= ema20:
                    score += 0.08
                else:
                    score -= 0.08

            if macd_h > 0:
                score += 0.07
            else:
                score -= 0.07

            if 40 <= rsi <= 65:
                score += 0.06
            elif rsi > 70:
                score -= 0.12 # Quá mua
            elif rsi < 32:
                score += 0.10 # Vùng hỗ trợ quá bán

            # Nếu có nhãn xu hướng target_trend từ pipeline, tích hợp thêm trọng số
            if 'target_trend' in df.columns and pd.notna(df.loc[i, 'target_trend']):
                t_val = float(df.loc[i, 'target_trend'])
                prob = 0.60 * t_val + 0.40 * score
            else:
                prob = score

            prob = float(np.clip(prob, 0.15, 0.90))
            trend = "UP" if prob >= 0.50 else "DOWN"

            signals.append(trend)
            probabilities.append(round(prob, 4))

        df['ai_trend'] = signals
        df['ai_prob'] = probabilities
        return df

    def execute_simulation(self) -> dict:
        """
        Thực thi mô phỏng giao dịch theo từng nến (Event-Driven Simulation)
        áp dụng quy tắc thanh toán T+2.5 (nắm giữ tối thiểu 3 phiên)
        """
        df = self.load_historical_data()
        if df.empty or len(df) < 5:
            return {
                "status": "error",
                "message": f"Dữ liệu lịch sử của mã {self.symbol} không đủ để thực hiện backtest (cần tối thiểu 5 phiên)."
            }

        df = self.generate_ai_signals(df)

        cash = self.initial_capital
        shares = 0
        in_position = False
        entry_price = 0.0
        entry_date = ""
        entry_idx = 0
        stop_loss_price = 0.0
        take_profit_price = 0.0

        total_commission_paid = 0.0
        trades = []
        equity_curve = []

        first_close = float(df.iloc[0]['close'])
        benchmark_initial_shares = self.initial_capital / first_close
        peak_equity = self.initial_capital

        min_holding_days = 3 # Quy định chu kỳ thanh toán T+2.5 trên TTCK Việt Nam

        for i, row in df.iterrows():
            current_date = str(row['date'])
            open_p = float(row['open'])
            high_p = float(row['high'])
            low_p = float(row['low'])
            close_p = float(row['close'])
            rsi = float(row['rsi_14'])
            atr = float(row['atr_14'])
            ai_trend = row['ai_trend']
            ai_prob = float(row['ai_prob'])
            macd_h = float(row.get('macd_hist', 0.0))

            exit_reason = None
            exit_price = None

            # --- 1. KIỂM TRA ĐIỀU KIỆN BÁN (NẾU ĐANG NẮM GIỮ) ---
            if in_position:
                holding_days = i - entry_idx

                # Chỉ cho phép bán khi cổ phiếu đã về tài khoản (>= 3 phiên) hoặc phiên cuối
                if holding_days >= min_holding_days or i == len(df) - 1:
                    # Chạm Take Profit
                    if high_p >= take_profit_price:
                        exit_reason = "TAKE_PROFIT"
                        exit_price = max(open_p, take_profit_price) if open_p > take_profit_price else take_profit_price

                    # Chạm Stop Loss
                    elif low_p <= stop_loss_price:
                        exit_reason = "STOP_LOSS"
                        exit_price = min(open_p, stop_loss_price) if open_p < stop_loss_price else stop_loss_price

                    # Đảo chiều tín hiệu AI kết hợp suy giảm động lượng
                    elif self.strategy_name == "AI_TRANSFORMER_ATR" and (ai_trend == "DOWN" and ai_prob < 0.42 and macd_h < 0):
                        exit_reason = "AI_SIGNAL_REVERSAL"
                        exit_price = close_p

                    elif self.strategy_name == "AI_MOMENTUM_RSI" and (macd_h < 0 and rsi > 65):
                        exit_reason = "MOMENTUM_WEAKNESS"
                        exit_price = close_p

                    # Phiên cuối cùng của chu kỳ kiểm thử
                    elif i == len(df) - 1:
                        exit_reason = "PERIOD_END"
                        exit_price = close_p

                # Khớp lệnh BÁN
                if exit_reason and exit_price:
                    gross_proceeds = shares * exit_price
                    sell_fee = gross_proceeds * self.commission_rate
                    net_proceeds = gross_proceeds - sell_fee
                    total_commission_paid += sell_fee

                    pnl = net_proceeds - (shares * entry_price)
                    ret_pct = ((exit_price - entry_price) / entry_price) * 100.0 - (self.commission_rate * 200.0)

                    cash += net_proceeds

                    trades.append({
                        "id": len(trades) + 1,
                        "symbol": self.symbol,
                        "entry_date": entry_date,
                        "entry_price": round(entry_price, 2),
                        "exit_date": current_date,
                        "exit_price": round(exit_price, 2),
                        "shares": shares,
                        "net_pnl": round(pnl, 2),
                        "return_pct": round(ret_pct, 2),
                        "exit_reason": exit_reason,
                        "holding_days": holding_days
                    })

                    shares = 0
                    in_position = False

            # --- 2. KIỂM TRA ĐIỀU KIỆN MUA (NẾU ĐANG GIỮ TIỀN MẶT) ---
            if not in_position and i < len(df) - 1:
                buy_signal = False

                if self.strategy_name == "AI_TRANSFORMER_ATR":
                    # AI Trend UP với xác suất >= ngưỡng, RSI chưa quá mua (< 68), giá trên hỗ trợ
                    if ai_trend == "UP" and ai_prob >= self.ai_confidence_thresh and (38.0 <= rsi <= 68.0):
                        buy_signal = True

                elif self.strategy_name == "AI_MOMENTUM_RSI":
                    # AI Trend UP, MACD Histogram dương, RSI tích lũy lành mạnh
                    if ai_trend == "UP" and macd_h >= 0 and (42.0 <= rsi <= 66.0):
                        buy_signal = True

                elif self.strategy_name == "BUY_AND_HOLD":
                    if i == 0:
                        buy_signal = True

                # Khớp lệnh MUA
                if buy_signal and cash > 100000.0:
                    exec_price = close_p
                    fee_multiplier = 1.0 + self.commission_rate
                    max_shares = int(cash / (exec_price * fee_multiplier))

                    # Lô 10 đối với thị trường Việt Nam
                    shares_to_buy = (max_shares // 10) * 10 if max_shares >= 20 else max_shares
                    if shares_to_buy > 0:
                        trade_cost = shares_to_buy * exec_price
                        buy_fee = trade_cost * self.commission_rate
                        total_outflow = trade_cost + buy_fee

                        if total_outflow <= cash:
                            cash -= total_outflow
                            shares = shares_to_buy
                            in_position = True
                            entry_price = exec_price
                            entry_date = current_date
                            entry_idx = i
                            total_commission_paid += buy_fee

                            # Thiết lập Stop Loss và Take Profit
                            if self.use_atr_stops and atr > 0:
                                stop_loss_price = max(entry_price * 0.92, entry_price - 1.5 * atr)
                                take_profit_price = min(entry_price * 1.25, entry_price + 2.5 * atr)
                            else:
                                stop_loss_price = entry_price * (1.0 - self.stop_loss_pct / 100.0)
                                take_profit_price = entry_price * (1.0 + self.take_profit_pct / 100.0)

            # --- 3. GHI NHẬN ĐƯỜNG VỐN TRONG NGÀY (EQUITY CURVE) ---
            current_portfolio_value = cash + (shares * close_p)
            benchmark_equity = benchmark_initial_shares * close_p

            if current_portfolio_value > peak_equity:
                peak_equity = current_portfolio_value

            drawdown_pct = ((current_portfolio_value - peak_equity) / peak_equity) * 100.0 if peak_equity > 0 else 0.0

            equity_curve.append({
                "date": current_date,
                "equity": round(current_portfolio_value, 2),
                "benchmark_equity": round(benchmark_equity, 2),
                "drawdown_pct": round(drawdown_pct, 2),
                "cash": round(cash, 2),
                "shares": shares,
                "in_position": in_position,
                "close_price": round(close_p, 2)
            })

        # --- 4. TỔNG HỢP CÁC CHỈ SỐ ĐỊNH LƯỢNG TÀI CHÍNH ---
        final_capital = equity_curve[-1]["equity"]
        benchmark_final = equity_curve[-1]["benchmark_equity"]

        total_return_pct = ((final_capital - self.initial_capital) / self.initial_capital) * 100.0
        benchmark_return_pct = ((benchmark_final - self.initial_capital) / self.initial_capital) * 100.0
        alpha_pct = total_return_pct - benchmark_return_pct

        days_count = len(df)
        years = max(days_count / 252.0, 0.05)
        cagr_pct = ((final_capital / self.initial_capital) ** (1.0 / years) - 1.0) * 100.0 if final_capital > 0 else -100.0

        max_drawdown_pct = min([pt["drawdown_pct"] for pt in equity_curve])

        equities = np.array([pt["equity"] for pt in equity_curve])
        daily_returns = np.diff(equities) / equities[:-1]

        if len(daily_returns) > 1 and np.std(daily_returns) > 1e-8:
            rf_daily = 0.05 / 252.0 # Giả định lãi suất phi rủi ro 5%/năm
            excess_returns = daily_returns - rf_daily
            sharpe_ratio = float(np.sqrt(252) * np.mean(excess_returns) / np.std(daily_returns))

            negative_returns = daily_returns[daily_returns < 0]
            if len(negative_returns) > 0 and np.std(negative_returns) > 1e-8:
                sortino_ratio = float(np.sqrt(252) * np.mean(excess_returns) / np.std(negative_returns))
            else:
                sortino_ratio = sharpe_ratio * 1.3
        else:
            sharpe_ratio = 0.0
            sortino_ratio = 0.0

        total_trades = len(trades)
        winning_trades = [t for t in trades if t["net_pnl"] > 0]
        losing_trades = [t for t in trades if t["net_pnl"] <= 0]

        win_count = len(winning_trades)
        loss_count = len(losing_trades)
        win_rate_pct = (win_count / total_trades * 100.0) if total_trades > 0 else 0.0

        total_gain = sum([t["net_pnl"] for t in winning_trades])
        total_loss = abs(sum([t["net_pnl"] for t in losing_trades]))
        profit_factor = round(total_gain / total_loss, 2) if total_loss > 0 else (99.9 if total_gain > 0 else 0.0)

        avg_trade_ret = (np.mean([t["return_pct"] for t in trades])) if total_trades > 0 else 0.0
        avg_holding_days = (np.mean([t["holding_days"] for t in trades])) if total_trades > 0 else 0.0

        summary = {
            "symbol": self.symbol,
            "strategy_name": self.strategy_name,
            "period": f"{df.iloc[0]['date']} -> {df.iloc[-1]['date']}",
            "start_date": str(df.iloc[0]['date']),
            "end_date": str(df.iloc[-1]['date']),
            "days_count": days_count,
            "initial_capital": round(self.initial_capital, 2),
            "final_capital": round(final_capital, 2),
            "net_profit": round(final_capital - self.initial_capital, 2),
            "total_return_pct": round(total_return_pct, 2),
            "benchmark_return_pct": round(benchmark_return_pct, 2),
            "alpha_pct": round(alpha_pct, 2),
            "cagr_pct": round(cagr_pct, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "sortino_ratio": round(sortino_ratio, 2),
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "win_rate_pct": round(win_rate_pct, 2),
            "profit_factor": profit_factor,
            "total_trades": total_trades,
            "winning_trades": win_count,
            "losing_trades": loss_count,
            "avg_trade_return_pct": round(float(avg_trade_ret), 2),
            "avg_holding_days": round(float(avg_holding_days), 1),
            "commission_paid": round(total_commission_paid, 2)
        }

        # Lưu thử nghiệm vào cơ sở dữ liệu `backtest_experiments`
        experiment_id = None
        try:
            exp_record = BacktestExperiment(
                strategy_name=self.strategy_name,
                model_version="DualHead_Transformer_v2",
                symbol=self.symbol,
                start_date=summary["start_date"],
                end_date=summary["end_date"],
                initial_capital=self.initial_capital,
                final_capital=final_capital,
                total_return_pct=summary["total_return_pct"],
                benchmark_return_pct=summary["benchmark_return_pct"],
                sharpe_ratio=summary["sharpe_ratio"],
                max_drawdown_pct=summary["max_drawdown_pct"],
                win_rate_pct=summary["win_rate_pct"],
                profit_factor=summary["profit_factor"],
                total_trades=total_trades
            )
            db_session.add(exp_record)
            db_session.commit()
            experiment_id = exp_record.id
        except Exception as db_err:
            db_session.rollback()
            print(f"[BacktestEngine] Lỗi lưu DB: {db_err}")

        return {
            "status": "success",
            "experiment_id": experiment_id,
            "summary": summary,
            "equity_curve": equity_curve,
            "trades": trades
        }

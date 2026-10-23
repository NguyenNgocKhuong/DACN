import os
import sys

# Configure UTF-8 stdout for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database.db import Base, engine, db_session, init_db
from models.stock_model import (
    Stock, StockDailyPrice, TechnicalIndicator, 
    MarketNews, AIPrediction, TradeOrder, BacktestExperiment
)
from services.indicator_service import IndicatorService

def seed_stocks():
    print("[1/5] Khởi tạo danh mục mã chứng khoán (VN30 & US Tech)...")
    stocks_meta = [
        # Việt Nam (HOSE / VN30)
        {"symbol": "VIC", "name": "Tập đoàn Vingroup", "exchange": "HOSE", "sector": "Bất động sản"},
        {"symbol": "VHM", "name": "Công ty Cổ phần Vinhomes", "exchange": "HOSE", "sector": "Bất động sản"},
        {"symbol": "VCB", "name": "Ngân hàng Ngoại thương Việt Nam (Vietcombank)", "exchange": "HOSE", "sector": "Ngân hàng"},
        {"symbol": "HPG", "name": "Tập đoàn Hòa Phát", "exchange": "HOSE", "sector": "Sản xuất & Thép"},
        {"symbol": "FPT", "name": "Tập đoàn FPT", "exchange": "HOSE", "sector": "Công nghệ thông tin"},
        {"symbol": "MWG", "name": "Công ty Cổ phần Đầu tư Thế Giới Di Động", "exchange": "HOSE", "sector": "Bán lẻ"},
        {"symbol": "VNM", "name": "Công ty Cổ phần Sữa Việt Nam (Vinamilk)", "exchange": "HOSE", "sector": "Thực phẩm - Tiêu dùng"},
        {"symbol": "MSN", "name": "Tập đoàn Masan", "exchange": "HOSE", "sector": "Hàng tiêu dùng"},
        {"symbol": "SSI", "name": "Công ty Cổ phần Chứng khoán SSI", "exchange": "HOSE", "sector": "Dịch vụ Tài chính"},
        {"symbol": "TCB", "name": "Ngân hàng Kỹ thương Việt Nam (Techcombank)", "exchange": "HOSE", "sector": "Ngân hàng"},
        {"symbol": "VNINDEX", "name": "Chỉ số VN-Index", "exchange": "HOSE", "sector": "Chỉ số thị trường"},
        
        # Quốc tế (US Tech)
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "sector": "Công nghệ tiêu dùng"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "sector": "Phần mềm & Đám mây"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "sector": "Bán dẫn & Trí tuệ nhân tạo"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "sector": "Xe điện & Năng lượng"},
        {"symbol": "GOOGL", "name": "Alphabet Inc. (Google)", "exchange": "NASDAQ", "sector": "Dịch vụ Internet"}
    ]

    stock_map = {}
    for item in stocks_meta:
        stock = Stock.query.filter_by(symbol=item['symbol']).first()
        if not stock:
            stock = Stock(
                symbol=item['symbol'],
                name=item['name'],
                exchange=item['exchange'],
                sector=item['sector']
            )
            db_session.add(stock)
            db_session.flush()
        stock_map[item['symbol']] = stock.id
    
    db_session.commit()
    print(f" -> Đã lưu {len(stock_map)} mã cổ phiếu vào bảng stocks.")
    return stock_map

def seed_prices_and_indicators(stock_map):
    print("[2/5] Đọc dữ liệu giá và tự động tính toán chỉ báo kỹ thuật (Indicator Pipeline)...")
    csv_path = os.path.abspath(os.path.join(backend_dir, '../data/stock_data.csv'))
    
    if not os.path.exists(csv_path):
        print(f" ! Cảnh báo: Không tìm thấy file {csv_path}")
        return

    df = pd.read_csv(csv_path)
    symbols = df['symbol'].unique()
    
    total_prices = 0
    total_indicators = 0
    
    for sym in symbols:
        stock_id = stock_map.get(sym)
        if not stock_id:
            # Tạo mới mã nếu chưa có trong meta
            new_stock = Stock(symbol=sym, name=f"Mã chứng khoán {sym}", exchange="HOSE")
            db_session.add(new_stock)
            db_session.flush()
            stock_id = new_stock.id
            stock_map[sym] = stock_id
            
        df_sym = df[df['symbol'] == sym].copy()
        if len(df_sym) < 3:
            continue
            
        # Tính toán bộ chỉ báo kỹ thuật chuẩn hóa
        df_enriched = IndicatorService.compute_all_indicators(df_sym)
        
        # Lưu vào bảng giá và bảng chỉ báo
        for _, row in df_enriched.iterrows():
            date_str = str(row['date'])
            
            # Check price exist
            price_record = StockDailyPrice.query.filter_by(symbol=sym, date=date_str).first()
            if not price_record:
                price_record = StockDailyPrice(
                    stock_id=stock_id,
                    symbol=sym,
                    date=date_str,
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    volume=float(row['volume']),
                    change=round(float(row['close']) - float(row['open']), 2),
                    change_percent=round(((float(row['close']) - float(row['open'])) / float(row['open'])) * 100, 2)
                )
                db_session.add(price_record)
                total_prices += 1
                
            # Check indicator exist
            ind_record = TechnicalIndicator.query.filter_by(symbol=sym, date=date_str).first()
            if not ind_record:
                ind_record = TechnicalIndicator(
                    stock_id=stock_id,
                    symbol=sym,
                    date=date_str,
                    rsi_14=float(row['rsi_14']) if pd.notna(row['rsi_14']) else None,
                    ema_20=float(row['ema_20']) if pd.notna(row['ema_20']) else None,
                    ema_50=float(row['ema_50']) if pd.notna(row['ema_50']) else None,
                    macd=float(row['macd']) if pd.notna(row['macd']) else None,
                    macd_signal=float(row['macd_signal']) if pd.notna(row['macd_signal']) else None,
                    macd_hist=float(row['macd_hist']) if pd.notna(row['macd_hist']) else None,
                    bb_upper=float(row['bb_upper']) if pd.notna(row['bb_upper']) else None,
                    bb_middle=float(row['bb_middle']) if pd.notna(row['bb_middle']) else None,
                    bb_lower=float(row['bb_lower']) if pd.notna(row['bb_lower']) else None,
                    atr_14=float(row['atr_14']) if pd.notna(row['atr_14']) else None,
                    obv=float(row['obv']) if pd.notna(row['obv']) else None
                )
                db_session.add(ind_record)
                total_indicators += 1
                
    db_session.commit()
    print(f" -> Đã lưu thành công {total_prices} bản ghi giá OHLCV & {total_indicators} bản ghi chỉ báo kỹ thuật.")

def seed_market_news():
    print("[3/5] Khởi tạo dữ liệu tin tức tài chính và phân loại cảm xúc (Sentiment Analysis)...")
    sample_news = [
        {
            "symbol": "FPT",
            "title": "FPT công bố lợi nhuận trước thuế tăng trưởng 22% nhờ mảng xuất khẩu phần mềm và AI",
            "summary": "Doanh thu chuyển đổi số và các hợp đồng AI tại thị trường Nhật Bản và Mỹ tiếp tục ghi nhận tăng trưởng mạnh mẽ trong quý vừa qua.",
            "source": "Vietstock",
            "published_date": "2026-10-15",
            "sentiment_score": 0.85,
            "sentiment_label": "POSITIVE"
        },
        {
            "symbol": "VCB",
            "title": "Vietcombank duy trì tỷ lệ nợ xấu ở mức thấp kỷ lục dưới 1%, CASA tiếp tục dẫn đầu",
            "summary": "Tăng trưởng tín dụng của VCB tiếp tục bám sát định hướng của Ngân hàng Nhà nước với chất lượng tài sản an toàn hàng đầu hệ thống.",
            "source": "Cafef",
            "published_date": "2026-10-16",
            "sentiment_score": 0.72,
            "sentiment_label": "POSITIVE"
        },
        {
            "symbol": "HPG",
            "title": "Hòa Phát tăng công suất lò cao Dung Quất 2, giá thép cuộn cán nóng hồi phục",
            "summary": "Sản lượng thép xây dựng và HRC trong tháng qua đạt mức kỷ lục, giải tỏa bớt áp lực cạnh tranh từ thép nhập khẩu giá rẻ.",
            "source": "VnExpress Kinh Doanh",
            "published_date": "2026-10-14",
            "sentiment_score": 0.65,
            "sentiment_label": "POSITIVE"
        },
        {
            "symbol": "VNINDEX",
            "title": "Khối ngoại quay lại bán ròng hơn 400 tỷ đồng khi tỷ giá USD/VND chịu áp lực",
            "summary": "Áp lực chốt lời ngắn hạn xuất hiện tại nhóm cổ phiếu vốn hóa lớn khiến chỉ số VN-Index rung lắc quanh vùng kháng cự.",
            "source": "Vietstock",
            "published_date": "2026-10-17",
            "sentiment_score": -0.45,
            "sentiment_label": "NEGATIVE"
        },
        {
            "symbol": "NVDA",
            "title": "NVIDIA ra mắt kiến trúc GPU thế hệ mới phục vụ siêu máy tính và trung tâm dữ liệu AI",
            "summary": "Nhu cầu chip huấn luyện mô hình ngôn ngữ lớn tiếp tục vượt quá khả năng cung ứng của các nhà máy đúc bán dẫn toàn cầu.",
            "source": "Reuters Finance",
            "published_date": "2026-10-12",
            "sentiment_score": 0.90,
            "sentiment_label": "POSITIVE"
        }
    ]

    for item in sample_news:
        existing = MarketNews.query.filter_by(title=item['title']).first()
        if not existing:
            news = MarketNews(
                symbol=item['symbol'],
                title=item['title'],
                summary=item['summary'],
                source=item['source'],
                published_date=item['published_date'],
                sentiment_score=item['sentiment_score'],
                sentiment_label=item['sentiment_label']
            )
            db_session.add(news)
            
    db_session.commit()
    print(f" -> Đã lưu {len(sample_news)} tin tức thị trường kèm điểm cảm xúc.")

def seed_ai_prediction_logs(stock_map):
    print("[4/5] Khởi tạo nhật ký dự báo AI (Audit Trail & Tracking)...")
    sample_preds = [
        {"symbol": "FPT", "target_date": "2026-10-16", "trend": "UP", "prob": 0.78, "pred_price": 138.5, "act_price": 139.0, "act_trend": "UP", "correct": True},
        {"symbol": "VCB", "target_date": "2026-10-16", "trend": "UP", "prob": 0.69, "pred_price": 92.0, "act_price": 92.5, "act_trend": "UP", "correct": True},
        {"symbol": "HPG", "target_date": "2026-10-17", "trend": "UP", "prob": 0.62, "pred_price": 29.5, "act_price": 28.8, "act_trend": "DOWN", "correct": False},
        {"symbol": "AAPL", "target_date": "2026-10-17", "trend": "DOWN", "prob": 0.58, "pred_price": 224.0, "act_price": 222.8, "act_trend": "DOWN", "correct": True},
        {"symbol": "NVDA", "target_date": "2026-10-18", "trend": "UP", "prob": 0.84, "pred_price": 142.0, "act_price": None, "act_trend": None, "correct": None}
    ]

    for item in sample_preds:
        stock_id = stock_map.get(item['symbol'])
        if stock_id:
            pred = AIPrediction(
                stock_id=stock_id,
                symbol=item['symbol'],
                model_name="Transformer_Multimodal_v1",
                target_date=item['target_date'],
                predicted_trend=item['trend'],
                trend_probability=item['prob'],
                predicted_price=item['pred_price'],
                actual_price=item['act_price'],
                actual_trend=item['act_trend'],
                is_correct=item['correct']
            )
            db_session.add(pred)
            
    db_session.commit()
    print(f" -> Đã lưu {len(sample_preds)} dự báo AI vào bảng ai_predictions.")

def seed_backtest_experiments():
    print("[5/5] Khởi tạo kết quả kiểm thử chiến lược giao dịch định lượng (Backtesting)...")
    sample_experiments = [
        {
            "strategy_name": "Transformer + Sentiment Signal Momentum Strategy",
            "model_version": "Transformer_v1.0",
            "symbol": "FPT",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "initial_capital": 100000000.0,
            "final_capital": 134500000.0,
            "total_return_pct": 34.5,
            "benchmark_return_pct": 18.2, # VNINDEX return
            "sharpe_ratio": 1.78,
            "max_drawdown_pct": -9.4,
            "win_rate_pct": 63.8,
            "profit_factor": 2.15,
            "total_trades": 42
        },
        {
            "strategy_name": "RSI + MACD Crossover Benchmark Strategy",
            "model_version": "Traditional_TA",
            "symbol": "HPG",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "initial_capital": 100000000.0,
            "final_capital": 112300000.0,
            "total_return_pct": 12.3,
            "benchmark_return_pct": 8.5,
            "sharpe_ratio": 1.12,
            "max_drawdown_pct": -16.2,
            "win_rate_pct": 52.1,
            "profit_factor": 1.45,
            "total_trades": 36
        }
    ]

    for exp in sample_experiments:
        existing = BacktestExperiment.query.filter_by(strategy_name=exp['strategy_name'], symbol=exp['symbol']).first()
        if not existing:
            record = BacktestExperiment(**exp)
            db_session.add(record)
            
    db_session.commit()
    print(f" -> Đã lưu {len(sample_experiments)} thực nghiệm Backtesting.")

if __name__ == '__main__':
    print("=== BẮT ĐẦU SEED DỮ LIỆU ĐỒ ÁN CHUYÊN NGÀNH ===")
    init_db()
    stock_map = seed_stocks()
    seed_prices_and_indicators(stock_map)
    seed_market_news()
    seed_ai_prediction_logs(stock_map)
    seed_backtest_experiments()
    print("=== HOÀN TẤT THIẾT LẬP DỮ LIỆU TUẦN 1 ===")

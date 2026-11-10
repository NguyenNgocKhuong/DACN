import os
import json
from flask import Blueprint, jsonify, request
from services.stock_service import get_all_stocks, get_stock_by_symbol
from services.ai_service import predict_stock, get_ai_explainability
from services.backtest_engine import BacktestEngine
from models.stock_model import (
    Stock, StockDailyPrice, TechnicalIndicator, 
    MarketNews, AIPrediction, BacktestExperiment
)

stock_bp = Blueprint('stock', __name__)

@stock_bp.route('/', methods=['GET'])
def list_stocks():
    stocks = get_all_stocks()
    return jsonify(stocks)

@stock_bp.route('/<symbol>', methods=['GET'])
def stock_detail(symbol):
    stock = get_stock_by_symbol(symbol)
    if not stock:
        return jsonify({"error": "Not found"}), 404
    return jsonify(stock)

@stock_bp.route('/predict', methods=['POST'])
def predict():
    data = request.json or {}
    symbol = data.get('symbol', 'FPT')
    result = predict_stock(symbol)
    if isinstance(result, dict):
        return jsonify({
            "symbol": symbol,
            "prediction": result.get("prediction", "UP"),
            "probability": result.get("probability", 0.5),
            "predicted_price": result.get("predicted_price", 0.0),
            "details": result
        })
    return jsonify({"symbol": symbol, "prediction": result})


@stock_bp.route('/explain/<symbol>', methods=['GET'])
def explain_stock(symbol):
    """
    Trả về thông tin giải thích mô hình AI (Explainability XAI) và quản trị rủi ro ATR
    """
    data = get_ai_explainability(symbol)
    return jsonify(data)

@stock_bp.route('/indicators/<symbol>', methods=['GET'])
def stock_indicators(symbol):
    """
    Trả về dữ liệu giá OHLCV kèm các chỉ báo kỹ thuật (RSI, MACD, BB, EMA, ATR, OBV)
    """
    limit = request.args.get('limit', 100, type=int)
    prices = StockDailyPrice.query.filter_by(symbol=symbol).order_by(StockDailyPrice.date.asc()).limit(limit).all()
    indicators = TechnicalIndicator.query.filter_by(symbol=symbol).order_by(TechnicalIndicator.date.asc()).limit(limit).all()
    
    ind_map = {ind.date: ind.to_dict() for ind in indicators}
    
    result = []
    for p in prices:
        item = p.to_dict()
        ind = ind_map.get(p.date, {})
        item.update({
            "rsi_14": ind.get("rsi_14"),
            "ema_20": ind.get("ema_20"),
            "ema_50": ind.get("ema_50"),
            "macd": ind.get("macd"),
            "macd_signal": ind.get("macd_signal"),
            "macd_hist": ind.get("macd_hist"),
            "bb_upper": ind.get("bb_upper"),
            "bb_middle": ind.get("bb_middle"),
            "bb_lower": ind.get("bb_lower"),
            "atr_14": ind.get("atr_14"),
            "obv": ind.get("obv")
        })
        result.append(item)
        
    return jsonify({
        "symbol": symbol,
        "count": len(result),
        "data": result
    })

@stock_bp.route('/news', methods=['GET'])
def get_news():
    """
    Trả về danh sách tin tức tài chính kèm điểm cảm xúc (Sentiment Analysis)
    """
    symbol = request.args.get('symbol')
    query = MarketNews.query
    if symbol:
        query = query.filter((MarketNews.symbol == symbol) | (MarketNews.symbol == 'VNINDEX'))
    news_items = query.order_by(MarketNews.published_date.desc()).limit(20).all()
    return jsonify([n.to_dict() for n in news_items])


@stock_bp.route('/news/crawl', methods=['POST'])
def trigger_news_crawl():
    """
    Kích hoạt Pipeline cào tin tức tài chính và phân tích cảm xúc tiếng Việt
    """
    from services.news_crawler import crawl_and_sync_news
    limit = request.args.get('limit', 15, type=int)
    result = crawl_and_sync_news(limit_per_source=limit)
    return jsonify(result)


@stock_bp.route('/news/summary', methods=['GET'])
def get_news_summary():
    """
    Trả về thống kê tổng hợp cảm xúc thị trường (Tích cực / Tiêu cực / Trung lập)
    """
    all_news = MarketNews.query.all()
    total = len(all_news)
    pos_count = sum(1 for n in all_news if n.sentiment_label == 'POSITIVE')
    neg_count = sum(1 for n in all_news if n.sentiment_label == 'NEGATIVE')
    neu_count = sum(1 for n in all_news if n.sentiment_label == 'NEUTRAL')
    avg_score = round(sum(n.sentiment_score for n in all_news) / max(1, total), 3) if total > 0 else 0.0

    return jsonify({
        "total_news": total,
        "positive": pos_count,
        "negative": neg_count,
        "neutral": neu_count,
        "average_sentiment_score": avg_score,
        "market_mood": "BULLISH" if avg_score > 0.1 else ("BEARISH" if avg_score < -0.1 else "SIDEWAY")
    })

@stock_bp.route('/predictions/audit', methods=['GET'])
def get_prediction_audit():
    """
    Trả về nhật ký kiểm chứng dự báo AI
    """
    symbol = request.args.get('symbol')
    query = AIPrediction.query
    if symbol:
        query = query.filter_by(symbol=symbol)
    logs = query.order_by(AIPrediction.prediction_time.desc()).limit(50).all()
    return jsonify([l.to_dict() for l in logs])

@stock_bp.route('/backtest/run', methods=['POST'])
def run_backtest_simulation():
    """
    Kích hoạt mô phỏng kiểm thử chiến lược định lượng (Quantitative Backtesting)
    """
    data = request.json or {}
    symbol = data.get('symbol', 'VCB').upper()
    strategy_name = data.get('strategy_name', 'AI_TRANSFORMER_ATR')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    initial_capital = float(data.get('initial_capital', 100000000.0))
    commission_rate = float(data.get('commission_rate', 0.0015))
    stop_loss_pct = float(data.get('stop_loss_pct', 5.0))
    take_profit_pct = float(data.get('take_profit_pct', 10.0))
    ai_confidence_thresh = float(data.get('ai_confidence_thresh', 0.55))
    use_atr_stops = bool(data.get('use_atr_stops', True))

    engine = BacktestEngine(
        symbol=symbol,
        strategy_name=strategy_name,
        start_date=start_date,
        end_date=end_date,
        initial_capital=initial_capital,
        commission_rate=commission_rate,
        stop_loss_pct=stop_loss_pct,
        take_profit_pct=take_profit_pct,
        ai_confidence_thresh=ai_confidence_thresh,
        use_atr_stops=use_atr_stops
    )
    result = engine.execute_simulation()
    status_code = 200 if result.get('status') == 'success' else 400
    return jsonify(result), status_code


@stock_bp.route('/backtest/presets', methods=['GET'])
def get_backtest_presets():
    """
    Trả về danh sách các kịch bản chiến lược mẫu định lượng
    """
    presets = [
        {
            "id": "ai_transformer_atr",
            "name": "AI Transformer + Dynamic ATR Stop",
            "strategy_name": "AI_TRANSFORMER_ATR",
            "description": "Chiến lược nâng cao kết hợp xác suất dự báo xu hướng Transformer với quản trị rủi ro ATR động (Stop Loss 1.5x ATR, Take Profit 2.5x ATR).",
            "recommended_symbols": ["VCB", "FPT", "HPG", "VIC", "AAPL"],
            "stop_loss_pct": 5.0,
            "take_profit_pct": 10.0,
            "ai_confidence_thresh": 0.55,
            "use_atr_stops": True
        },
        {
            "id": "ai_momentum_rsi",
            "name": "AI Multi-factor + MACD/RSI Filter",
            "strategy_name": "AI_MOMENTUM_RSI",
            "description": "Chiến lược động lượng kết hợp lọc tín hiệu phân kỳ MACD Histogram và vùng tích lũy RSI (40 - 68).",
            "recommended_symbols": ["FPT", "NVDA", "TSLA", "MSFT"],
            "stop_loss_pct": 6.0,
            "take_profit_pct": 12.0,
            "ai_confidence_thresh": 0.50,
            "use_atr_stops": False
        },
        {
            "id": "buy_and_hold",
            "name": "Buy & Hold Benchmark",
            "strategy_name": "BUY_AND_HOLD",
            "description": "Chiến lược Mua và Nắm giữ cơ sở đối chuẩn toàn bộ thời gian không dùng tín hiệu AI.",
            "recommended_symbols": ["VNINDEX", "VCB", "AAPL"],
            "stop_loss_pct": 20.0,
            "take_profit_pct": 50.0,
            "ai_confidence_thresh": 0.0,
            "use_atr_stops": False
        }
    ]
    return jsonify(presets)


@stock_bp.route('/backtest/results', methods=['GET'])
def get_backtest_results():
    """
    Trả về kết quả kiểm thử chiến lược định lượng (Backtesting) đã lưu
    """
    symbol = request.args.get('symbol')
    limit = int(request.args.get('limit', 20))
    query = BacktestExperiment.query
    if symbol:
        query = query.filter_by(symbol=symbol.upper())
    results = query.order_by(BacktestExperiment.created_at.desc()).limit(limit).all()
    return jsonify([r.to_dict() for r in results])


@stock_bp.route('/benchmarks', methods=['GET'])
def get_benchmarks():
    """
    Trả về kết quả Thực nghiệm Đối chuẩn (Benchmarks) và Nghiên cứu Cắt giảm (Ablation Study)
    """
    bench_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ai-model/benchmark_results.json'))
    if os.path.exists(bench_file):
        with open(bench_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify({"error": "Benchmark results not found"}), 404

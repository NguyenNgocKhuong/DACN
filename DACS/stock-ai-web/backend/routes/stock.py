from flask import Blueprint, jsonify, request
from services.stock_service import get_all_stocks, get_stock_by_symbol
from services.ai_service import predict_stock
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
    prediction = predict_stock(symbol)
    return jsonify({"symbol": symbol, "prediction": prediction})

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

@stock_bp.route('/backtest/results', methods=['GET'])
def get_backtest_results():
    """
    Trả về kết quả kiểm thử chiến lược định lượng (Backtesting)
    """
    results = BacktestExperiment.query.order_by(BacktestExperiment.created_at.desc()).all()
    return jsonify([{
        "id": r.id,
        "strategy_name": r.strategy_name,
        "model_version": r.model_version,
        "symbol": r.symbol,
        "period": f"{r.start_date} -> {r.end_date}",
        "initial_capital": r.initial_capital,
        "final_capital": r.final_capital,
        "total_return_pct": r.total_return_pct,
        "benchmark_return_pct": r.benchmark_return_pct,
        "sharpe_ratio": r.sharpe_ratio,
        "max_drawdown_pct": r.max_drawdown_pct,
        "win_rate_pct": r.win_rate_pct,
        "profit_factor": r.profit_factor,
        "total_trades": r.total_trades
    } for r in results])

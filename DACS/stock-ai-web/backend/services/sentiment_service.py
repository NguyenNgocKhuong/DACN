import os
import re
from datetime import datetime

# ============================================================
# VIETNAMESE FINANCIAL SENTIMENT ENGINE (HYBRID NLP + LEXICON)
# ============================================================

# Từ điển thuật ngữ tài chính - chứng khoán tiếng Việt chuẩn hóa
VIETNAMESE_FINANCIAL_LEXICON = {
    # Tích cực mạnh (+1.0 đến +0.8)
    "tăng trần": 1.0,
    "vượt đỉnh": 0.95,
    "lợi nhuận kỷ lục": 0.9,
    "lãi kỷ lục": 0.9,
    "doanh thu đột biến": 0.85,
    "khối ngoại mua ròng": 0.85,
    "tự doanh mua ròng": 0.8,
    "cổ tức khủng": 0.85,
    "nới room tín dụng": 0.8,
    "bứt phá": 0.75,
    "khởi sắc": 0.75,
    "hồi phục mạnh": 0.8,
    "sắc xanh lan tỏa": 0.8,
    "dòng tiền cuồn cuộn": 0.85,
    "triển vọng sáng": 0.7,
    "tăng trưởng mạnh": 0.75,
    "định giá hấp dẫn": 0.7,
    "khuyến nghị mua": 0.8,
    "nâng hạng thị trường": 0.9,
    "tích cực": 0.6,
    "tăng": 0.4,
    "lãi": 0.4,
    "khả quan": 0.5,

    # Tiêu cực mạnh (-1.0 đến -0.8)
    "giảm sàn": -1.0,
    "thủng đáy": -0.95,
    "bán tháo": -0.9,
    "lỗ nặng": -0.9,
    "thao túng giá": -0.95,
    "thao túng cổ phiếu": -0.95,
    "bị phạt": -0.75,
    "cấm giao dịch": -0.9,
    "hủy niêm yết": -1.0,
    "khối ngoại bán ròng": -0.85,
    "siết margin": -0.85,
    "call margin": -0.9,
    "cháy tài khoản": -0.95,
    "lao dốc": -0.8,
    "sụt giảm mạnh": -0.8,
    "nợ xấu tăng": -0.85,
    "thanh tra": -0.7,
    "rủi ro cao": -0.75,
    "khuyến nghị bán": -0.8,
    "tiêu cực": -0.6,
    "giảm": -0.4,
    "lỗ": -0.4,
    "thận trọng": -0.3,
    "áp lực bán": -0.5
}

# Các từ phủ định / đảo nghĩa
NEGATION_WORDS = ["không", "chưa", "chẳng", "ít", "hụt"]
INTENSIFIERS = {"rất": 1.3, "cực kỳ": 1.5, "mạnh": 1.2, "đột biến": 1.3, "nhẹ": 0.6}

_sentiment_pipeline = None

def get_deep_learning_pipeline():
    """
    Lazy load mô hình NLP transformer nếu được yêu cầu và đã có cache
    """
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            # Chỉ nạp nếu có local cache hoặc được cấu hình
            os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
            from transformers import pipeline
            _sentiment_pipeline = pipeline(
                "sentiment-analysis", 
                model="nlptown/bert-base-multilingual-uncased-sentiment",
                device=-1
            )
            print("[NLP] Transformers Sentiment pipeline loaded successfully.")
        except Exception as e:
            _sentiment_pipeline = False
    return _sentiment_pipeline if _sentiment_pipeline is not False else None


def analyze_financial_sentiment(text: str, enable_dl: bool = False) -> dict:
    """
    Phân tích cảm xúc tài chính chuyên sâu tiếng Việt
    Trả về: {
        "score": float (-1.0 -> +1.0),
        "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
        "keywords_found": list,
        "confidence": float (0.0 -> 1.0)
    }
    """
    if not text or not isinstance(text, str):
        return {"score": 0.0, "label": "NEUTRAL", "keywords_found": [], "confidence": 0.5}

    text_lower = text.lower()
    
    # 1. Phân tích qua Từ điển Tài chính Tiếng Việt (Domain Lexicon Booster)
    lexicon_score = 0.0
    matched_keywords = []
    
    for phrase, weight in VIETNAMESE_FINANCIAL_LEXICON.items():
        if phrase in text_lower:
            pattern = rf"(\b(?:{'|'.join(NEGATION_WORDS)})\b\s+(?:\w+\s+){{0,2}}{re.escape(phrase)})"
            if re.search(pattern, text_lower):
                lexicon_score += -weight * 0.8
                matched_keywords.append(f"không_{phrase}")
            else:
                lexicon_score += weight
                matched_keywords.append(phrase)

    # 2. Phân tích qua Deep Learning Model (nếu được bật và khả dụng)
    dl_score = 0.0
    has_dl = False
    if enable_dl:
        pipeline_model = get_deep_learning_pipeline()
        if pipeline_model:
            try:
                truncated_text = text[:400]
                res = pipeline_model(truncated_text)[0]
                label = res['label']
                stars = int(label.split()[0])
                dl_score = (stars - 3) / 2.0
                has_dl = True
            except:
                pass

    # 3. Kết hợp Hybrid Score
    if len(matched_keywords) > 0:
        # Nếu có từ khóa tài chính chuyên biệt, ưu tiên Lexicon 70%, DL 30%
        normalized_lexicon = max(-1.0, min(1.0, lexicon_score / max(1, len(matched_keywords) * 0.7)))
        final_score = (0.7 * normalized_lexicon) + (0.3 * dl_score if has_dl else 0.0)
        confidence = min(0.95, 0.65 + 0.1 * len(matched_keywords))
    elif has_dl:
        final_score = dl_score
        confidence = 0.70
    else:
        final_score = 0.0
        confidence = 0.50

    final_score = round(max(-1.0, min(1.0, final_score)), 3)

    # Phân loại nhãn
    if final_score >= 0.15:
        label = "POSITIVE"
    elif final_score <= -0.15:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    return {
        "score": final_score,
        "label": label,
        "keywords_found": matched_keywords,
        "confidence": round(confidence, 2)
    }


def get_sentiment_score(text: str) -> float:
    """
    Hàm tương thích ngược trả về điểm số float
    """
    res = analyze_financial_sentiment(text)
    return res["score"]


def get_daily_symbol_sentiment(symbol: str, target_date: str = None) -> float:
    """
    Tính điểm cảm xúc trung bình trong ngày của một mã cổ phiếu từ bảng market_news
    """
    try:
        from models.stock_model import MarketNews
        if not target_date:
            target_date = datetime.now().strftime("%Y-%m-%d")

        news_items = MarketNews.query.filter(
            (MarketNews.symbol == symbol) | (MarketNews.symbol == 'VNINDEX'),
            MarketNews.published_date == target_date
        ).all()

        if news_items:
            scores = [n.sentiment_score for n in news_items if n.sentiment_score is not None]
            if scores:
                return round(sum(scores) / len(scores), 3)

        # Fallback: Lấy 5 tin gần nhất của mã đó
        recent_news = MarketNews.query.filter(
            (MarketNews.symbol == symbol) | (MarketNews.symbol == 'VNINDEX')
        ).order_by(MarketNews.published_date.desc()).limit(5).all()

        if recent_news:
            scores = [n.sentiment_score for n in recent_news if n.sentiment_score is not None]
            if scores:
                return round(sum(scores) / len(scores), 3)
    except Exception as e:
        print(f"[Sentiment Error] get_daily_symbol_sentiment: {e}")

    return 0.0

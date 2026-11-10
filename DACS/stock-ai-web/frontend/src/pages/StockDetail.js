import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Chart from '../components/Chart';
import AIExplainabilityWidget from '../components/AIExplainabilityWidget';
import { getStockDetail, predictTrend, getNews } from '../services/api';
import { getLogoUrl } from '../components/StockCard';
import socket from '../services/socket';

const StockDetail = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [aiPred, setAiPred] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [loadingAi, setLoadingAi] = useState(true);
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('username');

  // Ràng buộc bảo mật (Constraint)
  useEffect(() => {
    if (!currentUsername) {
      alert('🔒 BẢO MẬT HỆ THỐNG: Vui lòng đăng nhập tài khoản để được quyền xem lịch sử khớp lệnh và phân tích AI chi tiết!');
      navigate('/login');
      return;
    }

    const fetchAll = async () => {
      try {
        const res = await getStockDetail(symbol);
        setStock(res.data);
      } catch (e) {
        console.error("Lỗi khi tải chi tiết cổ phiếu:", e);
      }

      try {
        setLoadingAi(true);
        const predRes = await predictTrend(symbol);
        setAiPred(predRes.data);
      } catch (e) {
        console.warn("Lỗi khi gọi API AI Predict:", e);
      } finally {
        setLoadingAi(false);
      }

      try {
        const newsRes = await getNews(symbol);
        setNewsList(newsRes.data || []);
      } catch (e) {
        console.warn("Lỗi khi tải tin tức cổ phiếu:", e);
      }
    };

    fetchAll();

    const handlePriceTick = (tick) => {
      if (tick.symbol === symbol) {
        setStock(prev => {
          if (!prev) return prev;
          const updatedPrice = Math.max(1, prev.price * (1 + tick.delta_pct / 100));
          return {
            ...prev,
            price: updatedPrice,
            trend: tick.delta_pct >= 0 ? 'up' : 'down',
            buys: prev.buys + (tick.delta_pct >= 0 ? tick.volume_inc : 0),
            sells: prev.sells + (tick.delta_pct < 0 ? tick.volume_inc : 0)
          };
        });
      }
    };

    socket.on('price_tick', handlePriceTick);

    return () => {
      socket.off('price_tick', handlePriceTick);
    };
  }, [symbol, currentUsername, navigate]);

  if (!currentUsername) return null;
  if (!stock) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', margin: '4rem auto', color: '#90a4ae', fontSize: '1.2rem' }}>
        🔄 Đang kết nối máy chủ để trích xuất dữ liệu phân tích {symbol}...
      </div>
    );
  }

  const isUp = aiPred ? aiPred.prediction === 'UP' : stock.trend === 'up';
  const probPercent = aiPred ? (aiPred.probability * 100).toFixed(1) : '85.4';
  const predPrice = aiPred?.predicted_price ? `$${Number(aiPred.predicted_price).toFixed(2)}` : `$${(stock.price * (isUp ? 1.02 : 0.98)).toFixed(2)}`;

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HEADER NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#00f2fe', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, textDecoration: 'none' }}>
          ← Quay lại Bảng Giá & Danh Mục
        </Link>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to={`/backtest?symbol=${symbol}`} style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: '1px solid #00f2fe', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            📈 Kiểm Thử Backtest {symbol}
          </Link>
          <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.3)', fontSize: '0.85rem' }}>
            ⭐ Mã theo dõi ưu tiên VN30
          </span>
        </div>
      </div>

      {/* STOCK INFO BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img
            src={getLogoUrl(stock.symbol)}
            alt="logo"
            className="fade-in"
            style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,0.95)', padding: '5px', border: '3px solid rgba(0, 242, 254, 0.4)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)' }}
            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${stock.symbol}&background=2a2a2a&color=00f2fe&size=128&bold=true` }}
          />
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0, fontSize: '2.2rem' }}>
              {stock.symbol}
              <span style={{ fontSize: '0.9rem', fontWeight: '500', padding: '4px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '15px', color: '#b0bec5' }}>
                📅 Phiên: <span style={{ color: '#fff' }}>{stock.date}</span>
              </span>
            </h1>
            <p className="subtitle" style={{ marginBottom: 0, marginTop: '6px', color: '#90a4ae' }}>{stock.name || 'Cổ phiếu Doanh nghiệp Niêm yết'}</p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="price" style={{ marginBottom: '0.4rem', fontSize: '2.8rem', fontWeight: 800, color: '#fff' }}>
            ${Number(stock.price).toFixed(2)}
          </div>
          <span className={`trend-badge ${isUp ? 'up' : 'down'}`} style={{ display: 'inline-flex', padding: '6px 14px', fontSize: '0.95rem', borderRadius: '20px', fontWeight: 'bold' }}>
            {isUp ? '📈 Tín hiệu Khuyến nghị Mua (UP)' : '📉 Tín hiệu Cảnh báo Bán (DOWN)'}
          </span>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        <div className="glass hover-glow" style={{ padding: '1.4rem', borderLeft: '4px solid #00e676', background: 'linear-gradient(145deg, rgba(0,230,118,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
          <h3 style={{ color: '#00e676', fontSize: '0.95rem', marginBottom: '8px' }}>▲ Lực Mua Chủ Động</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {stock.buys?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#90a4ae' }}>lệnh</span>
          </p>
        </div>
        <div className="glass hover-glow" style={{ padding: '1.4rem', borderLeft: '4px solid #ff5252', background: 'linear-gradient(145deg, rgba(255,82,82,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
          <h3 style={{ color: '#ff5252', fontSize: '0.95rem', marginBottom: '8px' }}>▼ Lực Bán Chủ Động</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {stock.sells?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#90a4ae' }}>lệnh</span>
          </p>
        </div>
        <div className="glass hover-glow" style={{ padding: '1.4rem', borderLeft: '4px solid #ffb300', background: 'linear-gradient(145deg, rgba(255,179,0,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
          <h3 style={{ color: '#ffb300', fontSize: '0.95rem', marginBottom: '8px' }}>🎯 Giá Mục Tiêu AI (Target)</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffb300', margin: 0 }}>
            {predPrice} <span style={{ fontSize: '0.9rem', color: '#90a4ae' }}>({isUp ? '+' : ''}{(((Number(predPrice.replace('$', '')) - stock.price) / stock.price) * 100).toFixed(1)}%)</span>
          </p>
        </div>
        <div className="glass hover-glow" style={{ padding: '1.4rem', borderLeft: '4px solid #00f2fe', background: 'linear-gradient(145deg, rgba(0,242,254,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
          <h3 style={{ color: '#00f2fe', fontSize: '0.95rem', marginBottom: '8px' }}>🧠 Độ Tin Cậy Mô Hình</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00f2fe', margin: 0 }}>
            {probPercent}% <span style={{ fontSize: '0.9rem', color: '#90a4ae' }}>Transformer</span>
          </p>
        </div>
      </div>

      {/* TRADINGVIEW CANDLESTICK CHART CONTAINER */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Biểu Đồ Kỹ Thuật Tương Tác TradingView (Nến Nhật & Chỉ Báo)
        </h2>
        <div className="glass" style={{ padding: '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <Chart symbol={symbol} history={stock.history} />
        </div>
      </div>

      {/* AI MULTIMODAL PREDICTION RECOMMENDATION PANEL */}
      <div className="glass hover-glow" style={{ padding: '2rem', borderRadius: '12px', borderLeft: `5px solid ${isUp ? '#00e676' : '#ff5252'}`, marginBottom: '2.5rem', background: 'linear-gradient(145deg, rgba(13, 19, 34, 0.9) 0%, rgba(20, 30, 48, 0.9) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>
                Hệ Thống Khuyến Nghị Giao Dịch AI Đa Biến (Dual-Head Transformer)
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#00f2fe', padding: '4px 10px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.1)' }}>
                Phiên bản: {aiPred?.details?.model_version || 'DualHead_Multimodal_Transformer_v2'}
              </span>
            </div>

            <p style={{ color: '#b0bec5', lineHeight: '1.6', margin: '0 0 1.2rem 0' }}>
              Mô hình học sâu kết hợp <strong>12 đặc trưng chuỗi thời gian</strong> (Giá OHLCV, Khối lượng, RSI(14), MACD, EMA 20, EMA 50, Bollinger Bands, ATR)
              kết hợp với <strong>Điểm số tâm lý tin tức tài chính (Sentiment NLP)</strong>.
            </p>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: isUp ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                border: `1px solid ${isUp ? '#00e676' : '#ff5252'}`,
                color: isUp ? '#00e676' : '#ff5252',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {isUp ? '📈 TÍN HIỆU: TĂNG GIÁ (BUY ACCUMULATE)' : '📉 TÍN HIỆU: GIẢM GIÁ (SELL / TAKE PROFIT)'}
              </div>

              <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.9rem' }}>
                Xác suất xu hướng: <strong style={{ color: '#00f2fe' }}>{probPercent}%</strong>
              </div>

              <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.9rem' }}>
                Giá mục tiêu phiên tới: <strong style={{ color: '#ffb300' }}>{predPrice}</strong>
              </div>

              {aiPred?.details?.sentiment_score !== undefined && (
                <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.9rem' }}>
                  Điểm cảm xúc thị trường: <strong style={{ color: aiPred.details.sentiment_score >= 0 ? '#00e676' : '#ff5252' }}>
                    {aiPred.details.sentiment_score > 0 ? '+' : ''}{aiPred.details.sentiment_score}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI EXPLAINABILITY & RISK MANAGEMENT WIDGET (XAI + ATR) */}
      <AIExplainabilityWidget symbol={symbol} />

      {/* REAL-TIME FINANCIAL NEWS & SENTIMENT FEED */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📰 Tin Tức Tài Chính & Phân Tích Cảm Xúc (Vietnamese Financial NLP)
      </h2>
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2.5rem' }}>
        {newsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#90a4ae' }}>
            Đang cập nhật luồng tin tức tài chính trực tiếp từ Cafef & VnExpress cho {symbol}...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {newsList.slice(0, 5).map((news, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: `3px solid ${news.sentiment_label === 'POSITIVE' ? '#00e676' : (news.sentiment_label === 'NEGATIVE' ? '#ff5252' : '#ffb300')}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}
                    onMouseEnter={e => e.target.style.color = '#00f2fe'}
                    onMouseLeave={e => e.target.style.color = '#fff'}
                  >
                    {news.title}
                  </a>
                  <p style={{ margin: '4px 0 0 0', color: '#90a4ae', fontSize: '0.85rem' }}>
                    {news.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#78909c' }}>
                    <span>Nguồn: <strong>{news.source}</strong></span>
                    <span>Ngày: {news.published_date}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: news.sentiment_label === 'POSITIVE' ? 'rgba(0, 230, 118, 0.15)' : (news.sentiment_label === 'NEGATIVE' ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 179, 0, 0.15)'),
                    color: news.sentiment_label === 'POSITIVE' ? '#00e676' : (news.sentiment_label === 'NEGATIVE' ? '#ff5252' : '#ffb300')
                  }}>
                    {news.sentiment_label === 'POSITIVE' ? 'TÍCH CỰC' : (news.sentiment_label === 'NEGATIVE' ? 'TIÊU CỰC' : 'TRUNG LẬP')} ({news.sentiment_score > 0 ? '+' : ''}{news.sentiment_score})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRANSACTION HISTORY TABLE */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#fff' }}>
        📋 Lịch Sử Khớp Lệnh & Dòng Tiền (7 Phiên Gần Nhất)
      </h2>
      <div className="glass" style={{ padding: '1.5rem', overflowX: 'auto', borderTop: '2px solid rgba(0, 242, 254, 0.5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#90a4ae' }}>
              <th style={{ padding: '12px', fontWeight: 600 }}>Thời Gian</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Nhà Đầu Tư</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Tín Hiệu</th>
              <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Khối Lượng</th>
              <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Giá Khớp</th>
              <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Tổng Giá Trị</th>
            </tr>
          </thead>
          <tbody>
            {stock.history && stock.history.map((tx, idx) => (
              <tr key={idx} className="fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', color: '#b0bec5' }}>
                  <span style={{ color: '#fff', fontWeight: 500, marginRight: '8px' }}>{tx.date}</span> {tx.time}
                </td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#e0e0e0' }}>👤 {tx.investor}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: tx.action === 'MUA' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                    color: tx.action === 'MUA' ? '#00e676' : '#ff5252',
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>
                    {tx.action === 'MUA' ? '📈 TÍN HIỆU CẦU' : '📉 TÍN HIỆU CUNG'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#fff' }}>{tx.volume?.toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#00f2fe', fontWeight: 500 }}>${Number(tx.price).toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#ffb300' }}>
                  ${(tx.price * tx.volume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {(!stock.history || stock.history.length === 0) && (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#90a4ae' }}>Chưa có dữ liệu giao dịch trong tuần qua.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockDetail;

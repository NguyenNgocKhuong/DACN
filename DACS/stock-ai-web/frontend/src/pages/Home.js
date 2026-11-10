import React, { useState, useEffect } from 'react';
import StockCard from '../components/StockCard';
import { getStocks } from '../services/api';
import socket from '../services/socket';

const Home = () => {
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'up', 'down'
  const [wsConnected, setWsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  const [lastTickTime, setLastTickTime] = useState(null);
  
  useEffect(() => {
    fetchStocks();

    // 1. WebSocket Listeners
    socket.on('connect', () => {
      setWsConnected(true);
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    // Lắng nghe giá nhảy theo thời gian thực (Price Ticks)
    socket.on('price_tick', (tick) => {
      setLastTickTime(tick.timestamp);
      setStocks(prevStocks => prevStocks.map(s => {
        if (s.symbol === tick.symbol) {
          const updatedPrice = Math.max(1, s.price * (1 + tick.delta_pct / 100));
          return {
            ...s,
            price: updatedPrice,
            trend: tick.delta_pct >= 0 ? 'up' : 'down',
            buys: s.buys + (tick.delta_pct >= 0 ? tick.volume_inc : Math.floor(tick.volume_inc * 0.2)),
            sells: s.sells + (tick.delta_pct < 0 ? tick.volume_inc : Math.floor(tick.volume_inc * 0.2))
          };
        }
        return s;
      }));
    });

    // Lắng nghe cảnh báo giao dịch AI theo thời gian thực (AI Alerts)
    socket.on('ai_alert', (alert) => {
      setLiveAlert(alert);
      // Tự động ẩn sau 8 giây
      setTimeout(() => {
        setLiveAlert(prev => (prev?.timestamp === alert.timestamp ? null : prev));
      }, 8000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('price_tick');
      socket.off('ai_alert');
    };
  }, []);

  const fetchStocks = async () => {
    try {
      const res = await getStocks();
      if (res?.data) {
        setStocks(res.data);
      }
    } catch (e) {
      console.log('Error fetching stocks', e);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === 'all' || stock.trend === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fade-in">
      {/* HEADER & LIVE WEBSOCKET STATUS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Nền Tảng Phân Tích & Giả Lập Chứng Khoán</h1>
        
        {/* WEBSOCKET BADGE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: wsConnected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 179, 0, 0.12)',
          border: `1px solid ${wsConnected ? '#00e676' : '#ffb300'}`,
          fontSize: '0.85rem',
          fontWeight: 'bold',
          color: wsConnected ? '#00e676' : '#ffb300'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: wsConnected ? '#00e676' : '#ffb300',
            boxShadow: wsConnected ? '0 0 10px #00e676' : 'none'
          }} />
          {wsConnected ? `🔴 LIVE STREAMING (WS Port 5001)` : `🟡 Đang kết nối Socket...`}
          {lastTickTime && <span style={{ color: '#90a4ae', fontWeight: 'normal', fontSize: '0.75rem' }}>· {lastTickTime}</span>}
        </div>
      </div>

      <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
        Bảng giá tự động cập nhật theo thời gian thực qua WebSocket — Tích hợp mô hình dự báo AI Transformer & Phân tích tâm lý thị trường.
      </p>

      {/* REAL-TIME AI ALERT BANNER (Nếu có) */}
      {liveAlert && (
        <div 
          className="fade-in glass"
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            marginBottom: '1.8rem',
            borderLeft: `4px solid ${liveAlert.type === 'BUY_SIGNAL' ? '#00e676' : '#ff9100'}`,
            background: liveAlert.type === 'BUY_SIGNAL' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 145, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{liveAlert.message}</strong>
              <div style={{ color: '#90a4ae', fontSize: '0.75rem', marginTop: '2px' }}>Thời gian: {liveAlert.timestamp} · Phát sóng tự động từ AI Trading Engine</div>
            </div>
          </div>
          <button 
            onClick={() => setLiveAlert(null)}
            style={{ background: 'transparent', border: 'none', color: '#90a4ae', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Search and Filter Control Panel */}
      <div className="glass" style={{ padding: '1.2rem 1.5rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <input 
            type="text" 
            placeholder="🔍 Tìm kiếm mã cổ phiếu (VD: FPT, VCB, AAPL) hoặc tên công ty..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
            onFocus={(e) => e.target.style.borderColor = '#00f2fe'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s',
                     background: filter === 'all' ? 'linear-gradient(90deg, #00f2fe, #4facfe)' : 'rgba(255,255,255,0.05)',
                     color: filter === 'all' ? '#fff' : '#b0bec5' }}>
            Tất cả
          </button>
          <button 
            onClick={() => setFilter('up')}
            style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s',
                     background: filter === 'up' ? 'linear-gradient(90deg, #00e676, #1de9b6)' : 'rgba(255,255,255,0.05)',
                     color: filter === 'up' ? '#1b5e20' : '#b0bec5', boxShadow: filter === 'up' ? '0 5px 15px rgba(0,230,118,0.2)' : 'none' }}>
            📈 Tăng Giá
          </button>
          <button 
            onClick={() => setFilter('down')}
            style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s',
                     background: filter === 'down' ? 'linear-gradient(90deg, #ff5252, #ff1744)' : 'rgba(255,255,255,0.05)',
                     color: filter === 'down' ? '#fff' : '#b0bec5', boxShadow: filter === 'down' ? '0 5px 15px rgba(255,82,82,0.2)' : 'none' }}>
            📉 Giảm Giá
          </button>
        </div>
      </div>

      <div className="stock-grid" style={{ marginBottom: '4rem' }}>
        {stocks.length === 0 ? (
          <p style={{ color: '#90a4ae', padding: '20px', fontSize: '1.1rem' }}>🔄 Đang kết nối máy chủ để tải bảng giá thời gian thực...</p>
        ) : filteredStocks.length > 0 ? (
          filteredStocks.map(s => (
            <StockCard 
              key={s.symbol} 
              symbol={s.symbol} 
              price={Number(s.price).toFixed(2)} 
              trend={s.trend} 
              date={s.date} 
              buys={s.buys} 
              sells={s.sells} 
            />
          ))
        ) : (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', borderLeft: '4px solid #ffb300' }}>
            <h2 style={{ color: '#ffb300', marginBottom: '10px' }}>⚠️ Không có kết quả trùng khớp</h2>
            <p style={{ color: '#b0bec5', fontSize: '1.1rem' }}>Bộ lọc hoặc từ khóa tìm kiếm "{searchQuery}" không khớp với mã cổ phiếu nào đang lưu hành trên sàn của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

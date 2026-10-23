import React, { useState, useEffect } from 'react';
import StockCard from '../components/StockCard';
import { getStocks } from '../services/api';

const Home = () => {
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'up', 'down'
  
  useEffect(() => {
    fetchStocks();
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
      <h1>Nền Tảng Phân Tích & Giả Lập Chứng Khoán</h1>
      <p className="subtitle" style={{ marginBottom: '2.5rem' }}>Theo dõi biểu đồ, phân tích kỹ thuật và dữ kiện tự động của 20+ mã cổ phiếu.</p>
      
      {/* Search and Filter Control Panel */}
      <div className="glass" style={{ padding: '1.2rem 1.5rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <input 
            type="text" 
            placeholder="🔍 Tìm kiếm mã cổ phiếu (VD: AAPL) hoặc tên công ty..." 
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
          <p style={{ color: '#90a4ae', padding: '20px', fontSize: '1.1rem' }}>🔄 Đang thu thập và phân tích dữ liệu thị trường từ hệ thống AI...</p>
        ) : filteredStocks.length > 0 ? (
          filteredStocks.map(s => (
            <StockCard 
              key={s.symbol} 
              symbol={s.symbol} 
              price={s.price.toFixed(2)} 
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

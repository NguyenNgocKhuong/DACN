import React from 'react';
import { Link } from 'react-router-dom';

export const getLogoUrl = (symbol) => {
  const domainMap = {
    'AAPL': 'apple.com', 'TSLA': 'tesla.com', 'MSFT': 'microsoft.com', 'AMZN': 'amazon.com',
    'GOOGL': 'google.com', 'META': 'meta.com', 'NVDA': 'nvidia.com', 'NFLX': 'netflix.com',
    'AMD': 'amd.com', 'INTC': 'intel.com', 'VNM': 'vinamilk.com.vn', 'VIC': 'vingroup.net',
    'FPT': 'fpt.com.vn', 'HPG': 'hoaphat.com.vn', 'VCB': 'vietcombank.com.vn', 'SSI': 'ssi.com.vn',
    'MWG': 'mwg.vn', 'VPB': 'vpbank.com.vn', 'TCB': 'techcombank.com.vn', 'VNINDEX': 'hsx.vn'
  };
  const domain = domainMap[symbol?.toUpperCase()];
  if (domain) return `https://logo.clearbit.com/${domain}`;
  return `https://ui-avatars.com/api/?name=${symbol}&background=2a2a2a&color=00f2fe&size=128&bold=true`;
};

const StockCard = ({ symbol, price, trend, date, buys, sells }) => {
  const isUp = trend === 'up';
  
  return (
    <Link to={`/stock/${symbol}`} className="stock-card glass">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={getLogoUrl(symbol)} 
            alt={`${symbol} logo`} 
            style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,0.9)', padding: '4px', border: '1px solid rgba(255,255,255,0.2)' }}
            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${symbol}&background=2a2a2a&color=00f2fe&size=128&bold=true` }}
          />
          <span className="symbol-name" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{symbol}</span>
        </div>
        <span className={`trend-badge ${isUp ? 'up' : 'down'}`}>
          {isUp ? '📈 Tăng' : '📉 Giảm'}
        </span>
      </div>
      <div className="price">${price}</div>
      
      {date && (
        <div style={{ fontSize: '0.85rem', color: '#90a4ae', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
          <span title="Cập nhật phiên hôm nay">📅 {date}</span>
          <span style={{ fontSize: '0.8rem', display: 'flex', gap: '10px' }}>
            <span style={{ color: '#00e676', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ▲ {buys?.toLocaleString()}
            </span>
            <span style={{ color: '#ff5252', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ▼ {sells?.toLocaleString()}
            </span>
          </span>
        </div>
      )}
      
      <div className="card-footer">
        <span className="card-link">
          Phân tích chi tiết <span style={{ marginLeft: 8 }}>→</span>
        </span>
      </div>
    </Link>
  );
};

export default StockCard;

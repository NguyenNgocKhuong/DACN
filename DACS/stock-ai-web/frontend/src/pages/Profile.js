import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserWallet } from '../services/api';
import { getLogoUrl } from '../components/StockCard';
import ChatBox from '../components/ChatBox';

const Profile = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  
  const [wallet, setWallet] = useState(null);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [username, navigate]);

  const fetchData = async () => {
    try {
      const res = await getUserWallet(username);
      setWallet(res.data);
    } catch (e) {
      console.log('Error fetching wallet:', e);
    }
  };

  if (!username) return null;

  return (
    <div className="fade-in container">
      {/* Header Profile */}
      <div className="prediction-panel glass" style={{ marginBottom: '2rem', borderLeft: '4px solid #00f2fe', background: 'linear-gradient(145deg, rgba(0,242,254,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem', color: '#fff' }}>Xin chào, <span style={{ color: '#00f2fe' }}>{username}</span>!</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Hệ Thống Mô Phỏng Đầu Tư (Trading Simulation).</p>
        </div>
        <div className="ai-icon" style={{ fontSize: '3rem', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,242,254,0.1)' }}>
          👤
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Ví Tiền (Wallet) */}
        <div className="glass hover-glow" style={{ padding: '2rem', borderTop: '2px solid #00e676' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#00e676', display: 'flex', alignItems: 'center', gap: '10px' }}>
            💳 Ngân Sách Mô Phỏng (Tiền Ảo)
          </h2>
          {wallet ? (
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px rgba(0,230,118,0.4)', marginBottom: '1rem' }}>
              ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          ) : (
            <div style={{ fontSize: '2rem', color: '#b0bec5', marginBottom: '1rem' }}>Đang đồng bộ...</div>
          )}
          <p style={{ color: '#90a4ae', fontSize: '0.9rem' }}>Tiền mặt ảo dành riêng cho chế độ mô phỏng, không có giá trị quy đổi thực tế.</p>
        </div>
      </div>

      {/* Danh Mục Đầu Tư (Portfolio) */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>💼 Danh Mục Giả Lập (Simulation Watchlist)</h2>
      <div style={{ padding: '12px 15px', background: 'rgba(255,179,0,0.1)', color: '#ffb300', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #ffb300', fontSize: '0.95rem' }}>
        ⚠️ <b>Lưu ý An toàn:</b> Mọi dữ liệu tài sản dưới đây hoàn toàn là <b>Mô Phỏng Phương Pháp Đầu Tư</b>. Nền tảng không nhận tiền thật và không liên kết sàn giao dịch.
      </div>
      <div className="glass" style={{ padding: '1.5rem', overflowX: 'auto', borderTop: '2px solid #b0bec5' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#90a4ae' }}>
              <th style={{ padding: '15px', fontWeight: 600 }}>Cổ Phiếu</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Khối Lượng Khớp</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Giá Vốn Trung Bình</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Tổng Tài Sản Tạm Tính</th>
            </tr>
          </thead>
          <tbody>
            {(wallet?.portfolio || []).map((item, idx) => (
              <tr key={idx} className="fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }}>
                <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img 
                    src={getLogoUrl(item.symbol)} 
                    alt="logo" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', padding: '2px' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.symbol}&background=2a2a2a&color=00f2fe&size=128&bold=true` }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{item.symbol}</span>
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600, color: '#00f2fe' }}>{item.volume.toLocaleString()}</td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#b0bec5' }}>${item.avg_price.toFixed(2)}</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#00e676', fontSize: '1.1rem' }}>
                  ${(item.volume * item.avg_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {(!wallet || wallet.portfolio.length === 0) && (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#90a4ae' }}>Danh mục trống. Bạn chưa sở hữu cổ phiếu nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hệ thống Chat Hỗ trợ Trực Tuyến */}
      {username !== 'admin' && (
        <>
          <button 
            onClick={() => setShowChat(true)} 
            style={{ 
              position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', 
              borderRadius: '50%', background: 'linear-gradient(135deg, #00f2fe, #4facfe)', 
              color: '#fff', fontSize: '2rem', border: 'none', cursor: 'pointer', 
              boxShadow: '0 5px 20px rgba(0,242,254,0.5)', zIndex: 999, 
              display: showChat ? 'none' : 'flex', justifyContent: 'center', alignItems: 'center',
              transition: 'transform 0.3s'
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            💬
          </button>
          {showChat && <ChatBox currentUser={username} targetUser="admin" onClose={() => setShowChat(false)} />}
        </>
      )}
    </div>
  );
};

export default Profile;

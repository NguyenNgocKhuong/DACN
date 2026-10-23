import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../services/api';
import ChatBox from './ChatBox';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadDetails, setUnreadDetails] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!username) return;
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount(username);
        // Kiểm tra xem có tin nhắn mới không để hiện Toast
        if (res.data.count > unreadCount) {
          const newMsg = res.data.details[0];
          setToast(newMsg);
          setTimeout(() => setToast(null), 5000); // Tự động ẩn sau 5s
        }
        setUnreadCount(res.data.count);
        setUnreadDetails(res.data.details || []);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => clearInterval(interval);
  }, [username, unreadCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <nav className="navbar glass">
      <Link to="/" className="logo-text">BDTAI</Link>
      <ul className="nav-links" style={{ alignItems: 'center' }}>
        <li><Link to="/" className="nav-link">📊 Phân Tích & Dự Đoán AI</Link></li>
        <li><Link to="/education" className="nav-link">🧠 Học đầu tư</Link></li>
        <li><Link to="/about" className="nav-link">📄 Giới thiệu</Link></li>
        {username === 'admin' && (
          <li><Link to="/admin" className="nav-link" style={{ color: '#ffb300', fontWeight: 600 }}>🛠 Quản trị</Link></li>
        )}
        {username ? (
          <>
            <li style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative', marginRight: '15px' }}>
                <div 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
                  onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'} 
                  onMouseOut={e=>e.currentTarget.style.transform='scale(1)'} 
                  title="Tin nhắn chưa đọc"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span style={{ fontSize: '1.4rem' }}>🔔</span>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#ff5252', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="fade-in" style={{
                    position: 'absolute', top: '40px', right: '-10px', width: '300px', 
                    background: 'rgba(20, 25, 35, 0.95)', border: '1px solid rgba(0, 242, 254, 0.3)', 
                    borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 1000,
                    padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h4 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Thông báo tin nhắn mới</span>
                      <span style={{ color: '#ff5252' }}>{unreadCount > 0 ? `${unreadCount} tin` : ''}</span>
                    </h4>
                    {(!unreadDetails || unreadDetails.length === 0) ? (
                      <div style={{ color: '#90a4ae', fontSize: '0.85rem', padding: '15px 10px', textAlign: 'center' }}>Hộp thư hiện đang trống</div>
                    ) : (
                      <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {unreadDetails.map(msg => (
                          <div 
                            key={msg.id}
                            onClick={() => { setShowDropdown(false); setActiveChatUser(msg.sender); }}
                            style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 'bold', color: '#00f2fe', fontSize: '0.95rem' }}>🗣 {msg.sender}</span>
                              <span style={{ fontSize: '0.75rem', color: '#90a4ae' }}>{msg.timestamp.split(' ')[1] || msg.timestamp}</span>
                            </div>
                            <div style={{ color: '#e0e0e0', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ fontWeight: 'bold', color: '#00e676', marginRight: '5px' }}>Mới:</span> 
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
            <li>
              <Link to="/profile" className="nav-link" style={{ color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                👤 {username}
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout} 
                className="nav-link" 
                style={{ background: 'transparent', border: '1px solid rgba(255,82,82,0.3)', color: '#ff5252', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.3s' }}
                onMouseOver={(e) => { e.target.style.background = 'rgba(255,82,82,0.1)'; e.target.style.borderColor = '#ff5252'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255,82,82,0.3)'; }}
              >
                Đăng xuất
              </button>
            </li>
          </>
        ) : (
          <li><Link to="/login" className="nav-link">Đăng nhập</Link></li>
        )}
      </ul>

      {activeChatUser && (
        <ChatBox currentUser={username} targetUser={activeChatUser} onClose={() => setActiveChatUser(null)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fade-in" style={{
          position: 'fixed', top: '80px', right: '20px', minWidth: '280px', maxWidth: '350px',
          background: 'rgba(20, 25, 35, 0.95)', borderLeft: '4px solid #00f2fe',
          padding: '15px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 10001, cursor: 'pointer', backdropFilter: 'blur(10px)'
        }} onClick={() => { setActiveChatUser(toast.sender); setToast(null); }}>
          <div style={{ fontWeight: 'bold', color: '#00f2fe', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔔 Tin nhắn mới từ: {toast.sender}
          </div>
          <div style={{ color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toast.content}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

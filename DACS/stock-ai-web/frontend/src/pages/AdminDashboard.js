import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../services/api';
import ChatBox from '../components/ChatBox';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('username');

  useEffect(() => {
    if (currentUsername !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [currentUsername, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      setError('Không thể tải danh sách tài khoản.');
    }
  };

  const handleDelete = async (id, name) => {
    if (name === 'admin') {
      setError('Lỗi bảo mật: Không thể xóa quyền quản trị viên cao cấp.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (window.confirm(`Hành động này không thể hoàn tác. Bạn chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${name}"?`)) {
      try {
        const res = await deleteUser(id);
        setSuccess(`✅ ${res.data.message}`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Có lỗi xảy ra khi xóa.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleEditBalance = async (id, currentBalance) => {
    const newBalance = window.prompt(`Nhập số dư mới (VNĐ) cho tài khoản:`, currentBalance);
    if (newBalance !== null && !isNaN(newBalance)) {
      try {
        const res = await updateUserBalance(id, parseFloat(newBalance));
        setSuccess(`✅ ${res.data.message}`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi khi cập nhật số dư.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (currentUsername !== 'admin') return null;

  return (
    <div className="fade-in container">
      <div className="prediction-panel glass" style={{ marginBottom: '3rem', borderLeft: '4px solid #ffb300', background: 'linear-gradient(145deg, rgba(255,179,0,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem', color: '#fff' }}>Hệ Thống Phân Quyền Quản Trị</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Quản lý CSDL Tài khoản, phân quyền và thiết lập bảo mật cấp cao hệ thống BDT AI.</p>
        </div>
        <div className="ai-icon" style={{ fontSize: '3rem', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 179, 0, 0.1)' }}>
          🛠️
        </div>
      </div>

      {error && <div className="fade-in" style={{ color: '#ff5252', padding: '15px', background: 'rgba(255,82,82,0.1)', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(255,82,82,0.3)' }}>{error}</div>}
      {success && <div className="fade-in" style={{ color: '#00e676', padding: '15px', background: 'rgba(0,230,118,0.1)', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(0,230,118,0.3)' }}>{success}</div>}

      <div className="glass" style={{ padding: '2rem', overflowX: 'auto', borderTop: '2px solid rgba(255,179,0,0.5)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#ffb300', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Danh sách Người dùng <span style={{ background: 'rgba(255,179,0,0.2)', padding:'4px 10px', borderRadius:'15px', fontSize:'1rem' }}>{users.length} Tài khoản</span>
        </h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#90a4ae' }}>
              <th style={{ padding: '15px', fontWeight: 600 }}>Cơ sở Dữ liệu ID</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Tên Đăng Nhập</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Số dư (VNĐ)</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Phân Quyền Hệ Thống</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Hành Động Khẩn</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }}>
                <td style={{ padding: '15px', fontFamily: 'monospace', color: '#b0bec5' }}>#USR-{String(u.id).padStart(4, '0')}</td>
                <td style={{ padding: '15px', fontWeight: 600, fontSize: '1.1rem', color: u.username === 'admin' ? '#ffb300' : '#fff' }}>{u.username}</td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#00e676' }}>
                  ${(u.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <button 
                    onClick={() => handleEditBalance(u.id, u.balance)}
                    style={{ marginLeft: '10px', background: 'transparent', border: 'none', color: '#ffb300', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Sửa
                  </button>
                </td>
                <td style={{ padding: '15px' }}>
                  {u.username === 'admin' ? 
                    <span style={{ background: 'rgba(255,179,0,0.15)', color: '#ffb300', border: '1px solid rgba(255,179,0,0.3)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 600 }}>👑 Quản trị tối cao</span> : 
                    <span style={{ background: 'rgba(0,242,254,0.1)', color: '#00f2fe', border: '1px solid rgba(0,242,254,0.3)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>Khách hàng AI</span>
                  }
                </td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  {u.username !== 'admin' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button 
                        onClick={() => setActiveChat(u.username)}
                        style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.5)', color: '#00f2fe', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 600 }}
                        onMouseOver={e => { e.target.style.background = '#00f2fe'; e.target.style.color = '#000'; }}
                        onMouseOut={e => { e.target.style.background = 'rgba(0, 242, 254, 0.1)'; e.target.style.color = '#00f2fe'; }}
                      >
                        💬 Nhắn tin
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.5)', color: '#ff5252', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 600 }}
                        onMouseOver={e => { e.target.style.background = '#ff5252'; e.target.style.color = '#fff'; }}
                        onMouseOut={e => { e.target.style.background = 'rgba(255,82,82,0.1)'; e.target.style.color = '#ff5252'; }}
                      >
                        Bỏ tài khoản
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#90a4ae' }}>🔄 Đang đồng bộ dữ liệu bảo mật...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {activeChat && <ChatBox currentUser="admin" targetUser={activeChat} onClose={() => setActiveChat(null)} />}
    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Quên mật khẩu
  const [resetMethod, setResetMethod] = useState('email');
  const [contactInfo, setContactInfo] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Xử lý luồng Quên mật khẩu (Mock)
    if (isForgot) {
      if (!otpSent) {
        if (!contactInfo) return setError('Vui lòng nhập Email hoặc Số điện thoại.');
        setSuccess(`Mã xác thực OTP đã gửi siêu tốc về ${resetMethod === 'email' ? 'Gmail' : 'SĐT'}: ${contactInfo}`);
        setOtpSent(true);
      } else {
        if (otp === '123456') {
          setSuccess('✅ Cấp lại mật khẩu thành công! Tuyệt vời. Vui lòng đăng nhập.');
          setTimeout(() => { setIsForgot(false); setOtpSent(false); setIsLogin(true); contactInfo(''); otp(''); }, 2000);
        } else {
          setError('Mã OTP không hợp lệ. (Kiểm tra lại OTP mẫu: 123456)');
        }
      }
      return;
    }
    
    // Xử lý Login/Signup
    try {
      if (isLogin) {
        const res = await loginUser({ username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => { window.location.href = res.data.username === 'admin' ? '/admin' : '/profile'; }, 1500);
      } else {
        const res = await registerUser({ username, password });
        setSuccess('Đăng ký thành công! Vui lòng Đăng nhập.');
        setTimeout(() => setIsLogin(true), 1500);
      }
    } catch (err) {
      if (!err.response) {
        setError('🔴 Không thể kết nối tới Máy chủ. Vui lòng kiểm tra xem Backend (cửa sổ Python) đã được bật chưa?');
      } else {
        setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
      console.error('Login error detail:', err);
    }
  };

  return (
    <div className="login-wrapper fade-in">
      <div className="login-box glass">
        {!isForgot && (
          <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" onClick={() => {setIsLogin(true); setError(''); setSuccess('');}}
              style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: isLogin ? '#00f2fe' : '#b0bec5', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', borderBottom: isLogin ? '2px solid #00f2fe' : 'none', transition: 'all 0.3s' }}>
              Đăng nhập
            </button>
            <button type="button" onClick={() => {setIsLogin(false); setError(''); setSuccess('');}}
              style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: !isLogin ? '#00f2fe' : '#b0bec5', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', borderBottom: !isLogin ? '2px solid #00f2fe' : 'none', transition: 'all 0.3s' }}>
              Đăng ký
            </button>
          </div>
        )}
        
        {isForgot ? (
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ cursor:'pointer', fontSize: '1.5rem', color:'#b0bec5' }} onClick={() => setIsForgot(false)}>←</span>
            Khôi phục mật khẩu
          </h2>
        ) : (
          <h2>{isLogin ? 'Đăng nhập Hệ thống' : 'Tạo Tài Khoản Mới'}</h2>
        )}
        
        {error && <div className="fade-in" style={{ color: '#ff5252', marginBottom: '1.5rem', padding: '12px', background: 'rgba(255,82,82,0.1)', borderRadius: '8px', border: '1px solid rgba(255,82,82,0.2)' }}>{error}</div>}
        {success && <div className="fade-in" style={{ color: '#00e676', marginBottom: '1.5rem', padding: '12px', background: 'rgba(0,230,118,0.1)', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.2)' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {isForgot ? (
            <div className="fade-in">
              {!otpSent ? (
                <>
                  <div className="form-group" style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: resetMethod === 'email' ? '#00f2fe' : '#b0bec5' }}>
                      <input type="radio" name="method" checked={resetMethod === 'email'} onChange={() => setResetMethod('email')} /> ✉️ Qua Gmail
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: resetMethod === 'sms' ? '#00f2fe' : '#b0bec5' }}>
                      <input type="radio" name="method" checked={resetMethod === 'sms'} onChange={() => setResetMethod('sms')} /> 📱 Qua SĐT
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Nhập {resetMethod === 'email' ? 'địa chỉ Gmail' : 'Số điên thoại'} của bạn</label>
                    <input type={resetMethod === 'email' ? 'email' : 'tel'} className="form-control" placeholder={resetMethod === 'email' ? 'example@gmail.com' : '0987654321'} value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Gửi mã xác thực (OTP)</button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nhập mã OTP (gồm 6 số) đã gửi đến bạn</label>
                    <input type="text" className="form-control" placeholder="Ví dụ: 123456" value={otp} onChange={e => setOtp(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem', background: 'linear-gradient(90deg, #00e676 0%, #1de9b6 100%)' }}>Xác nhận OTP</button>
                </>
              )}
            </div>
          ) : (
            <div className="fade-in">
              <div className="form-group">
                <label>Tài khoản</label>
                <input type="text" className="form-control" placeholder="Nhập tên đăng nhập..." value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              
              {isLogin && (
                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                  <span onClick={() => {setIsForgot(true); setError(''); setSuccess('');}} style={{ color: '#4facfe', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>Quên mật khẩu?</span>
                </div>
              )}
              
              <button type="submit" className="btn-primary" style={{ marginTop: isLogin ? '0' : '1rem' }}>
                {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;

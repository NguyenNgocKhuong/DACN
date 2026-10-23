import React, { useState, useEffect } from 'react';

const DisclaimerModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeen) {
      setShow(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div className="glass fade-in" style={{ padding: '2.5rem', maxWidth: '500px', width: '90%', textAlign: 'center', borderRadius: '15px', border: '1px solid #ff5252', boxShadow: '0 10px 40px rgba(255,82,82,0.3)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: '#ff5252', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>CẢNH BÁO QUAN TRỌNG</h2>
        <p style={{ color: '#e0e0e0', lineHeight: 1.6, fontSize: '1.05rem', marginBottom: '2rem' }}>
          Đây là nền tảng <b>phân tích, dự đoán và tham khảo thông tin cổ phiếu</b> dựa trên trí tuệ nhân tạo (AI).<br/><br/>
          Hệ thống <b>không hỗ trợ giao dịch mua bán thật</b>, không nhận tiền thật và không liên kết với bất kỳ Broker nào.<br/><br/>
          Tất cả dữ liệu ví/danh mục trên hệ thống chỉ là <b>Mô Phỏng (Simulation)</b> nhằm mục đích Học tập & Nghiên cứu.
        </p>
        <button 
          onClick={handleAcknowledge}
          style={{
            padding: '12px 30px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px',
            background: 'linear-gradient(45deg, #ff5252, #f44336)', color: '#fff', cursor: 'pointer',
            transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(244,67,54,0.4)', width: '100%'
          }}
          onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.target.style.transform = 'translateY(0)'}
        >
          Tôi Đã Hiểu & Chấp Nhận
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;

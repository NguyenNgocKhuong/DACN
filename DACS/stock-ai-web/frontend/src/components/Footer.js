import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      background: 'rgba(10, 15, 25, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '2rem 1rem', textAlign: 'center', color: '#90a4ae', marginTop: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
        <span style={{ color: '#00f2fe' }}>BDT</span>AI
      </div>
      <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '800px', lineHeight: 1.5 }}>
        <b>Thông tin chỉ mang tính tham khảo, không phải lời khuyên đầu tư.</b><br/>
        Nền tảng này là một công cụ Mô Phỏng và Phân Tích (Trading Simulation & Analysis Tool). Chúng tôi không chịu trách nhiệm pháp lý cho bất kỳ quyết định đầu tư hay giao dịch tài chính nào của người sử dụng dựa trên dữ liệu từ hệ thống.
      </p>
      <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '10px' }}>
        © {new Date().getFullYear()} BDT AI. Nền tảng Học Khảo sát Đầu tư Cổ phiếu.
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';

const About = () => {
  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div className="glass fade-in" style={{ padding: '3rem', borderRadius: '15px', borderTop: '4px solid #00f2fe' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Về Chúng Tôi – BDT AI
        </h1>
        
        <div style={{ lineHeight: 1.8, fontSize: '1.1rem', color: '#e0e0e0' }}>
          <p>
            <b>BDT AI</b> là nền tảng phân tích kỹ thuật và dự báo xu hướng thị trường cổ phiếu, được phát triển với mục đích cốt lõi là <b>Học tập, Nghiên cứu và Mô phỏng Quy trình Giao dịch</b>.
          </p>

          <h3 style={{ color: '#00e676', marginTop: '2rem', marginBottom: '1rem' }}>🎯 Mục Đích Hoạt Động</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '10px' }}>Cung cấp công cụ phân tích tự động (AI Analysis) hỗ trợ quá trình nghiên cứu dữ liệu lịch sử thị trường.</li>
            <li style={{ marginBottom: '10px' }}>Mang đến môi trường giả lập danh mục đầu tư (Watchlist / Simulation Portfolio) với dữ liệu ảo, giúp người dùng thực hành phân tích mà không gặp rủi ro tài chính.</li>
            <li>Theo dõi các chỉ báo kỹ thuật (RSI, MA, MACD) theo tiêu chuẩn học thuật.</li>
          </ul>

          <h3 style={{ color: '#ff5252', marginTop: '2rem', marginBottom: '1rem' }}>❌ Những Điều Chúng Tôi KHÔNG Làm</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '10px' }}>Khuyến nghị mua/bán hoặc tư vấn tài chính theo cá nhân.</li>
            <li style={{ marginBottom: '10px' }}>Hỗ trợ giao dịch tài sản thật, nạp hay rút tiền mặt.</li>
            <li>Liên kết hoặc là đại lý của bất kỳ công ty Chứng khoán (Broker) hay Sàn giao dịch nào.</li>
          </ul>

          <div style={{ padding: '1.5rem', background: 'rgba(255,82,82,0.1)', borderLeft: '4px solid #ff5252', borderRadius: '0 8px 8px 0', marginTop: '3rem' }}>
            <h4 style={{ color: '#ff5252', margin: '0 0 10px 0' }}>Miễn Trừ Trách Nhiệm (Disclaimer)</h4>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              Mọi mô hình trí tuệ nhân tạo (AI) và chỉ báo xu hướng chỉ dựa trên dữ liệu quá khứ. Dự đoán sự thay đổi của giá chỉ mang tính chất minh họa tham khảo. 
              <b>Chúng tôi hoàn toàn không chịu trách nhiệm đối với bất kỳ quyết định, thiệt hại hay rủi ro tài chính nào phát sinh từ phía người sử dụng.</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

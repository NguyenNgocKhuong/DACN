import React from 'react';

const Education = () => {
  return (
    <div className="container fade-in" style={{ padding: '3rem 1rem', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: '15px', borderTop: '4px solid #00f2fe' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Tài Liệu Hướng Dẫn & Học Đầu Tư
        </h1>
        
        <p style={{ fontSize: '1.1rem', color: '#b0bec5', textAlign: 'center', marginBottom: '3rem' }}>
          Chào mừng bạn đến với trung tâm kiến thức BDT AI. Nơi đây cung tự động các tài liệu cơ bản về thị trường, kỹ thuật giao dịch và hướng dẫn sử dụng công cụ mô phỏng.
        </p>

        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="glass hover-glow" style={{ padding: '2rem', borderLeft: '4px solid #00e676', background: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ color: '#00e676', marginBottom: '1rem', fontSize: '1.4rem' }}>1. Kiến thức cơ bản về Cổ phiếu</h2>
            <p style={{ lineHeight: 1.6, color: '#e0e0e0', fontSize: '1.05rem' }}>
              <b>Cổ phiếu là gì?</b> Đây là giấy chứng nhận số tiền nhà đầu tư đóng góp vào công ty phát hành. Việc mua cổ phiếu đồng nghĩa với việc bạn trở thành một trong các chủ sở hữu của công ty đó.<br/><br/>
              <b>Quy luật biến động giá:</b> Giá cổ phiếu trên thị trường thay đổi liên tục dựa trên quy luật <b>Cung - Cầu</b>. Khi lượng người muốn mua áp đảo (Cầu cao), giá sẽ được đẩy lên. Ngược lại, khi lượng người muốn bán tháo chạy lớn (Cung cao), giá sẽ rớt thảm.
            </p>
          </div>

          <div className="glass hover-glow" style={{ padding: '2rem', borderLeft: '4px solid #ffb300', background: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ color: '#ffb300', marginBottom: '1rem', fontSize: '1.4rem' }}>2. Giải mã Các Chỉ Báo Phân Tích Kỹ Thuật (TA)</h2>
            <p style={{ lineHeight: 1.6, color: '#e0e0e0', fontSize: '1.05rem' }}>
              <b>• RSI (Relative Strength Index):</b> Chỉ số Sức mạnh Tương đối, dùng để đo lường tốc độ và sự thay đổi của biến động giá.<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;- <i>Chạm vùng RSI {'>'} 70</i>: Báo động vùng "Quá mua" (Overbought). Áp lực mua đã đạt đỉnh, giá có khả năng cao sắp đảo chiều giảm để điều chỉnh.<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;- <i>Chạm vùng RSI {'<'} 30</i>: Báo động vùng "Quá bán" (Oversold). Lực bán tháo đã cạn kiệt, giá chuẩn bị chạm đáy và tạo đà phục hồi tăng vọt.<br/><br/>
              
              <b>• MA (Moving Average):</b> Đường Trung bình Động. Là phương pháp làm mượt dữ liệu giá trong một chu kỳ nhất định, nhằm triệt tiêu các nhiễu sóng ngắn hạn để lộ diện xu hướng cốt lõi rõ ràng.<br/><br/>

              <b>• Tín hiệu Dòng tiền (Volume):</b> Sự gia tăng đột biến cực mạnh về Khối lượng (Volume khớp lệnh) đi cùng với xu hướng giá tăng/giảm sẽ là một khẳng định chắc nịch cho độ uy tín của đà thay đổi đó.
            </p>
          </div>

          <div className="glass hover-glow" style={{ padding: '2rem', borderLeft: '4px solid #00f2fe', background: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ color: '#00f2fe', marginBottom: '1rem', fontSize: '1.4rem' }}>3. Khai thác sức mạnh Nền tảng Mô phỏng BDT AI</h2>
            <ul style={{ lineHeight: 1.8, color: '#e0e0e0', paddingLeft: '20px', fontSize: '1.05rem' }}>
              <li style={{ marginBottom: '8px' }}>Sử dụng trang <b>Phân Tích & Dự Đoán</b> (Trang chủ) để bám sát dòng chảy luân chuyển của tín hiệu Cung/Cầu tiền ảo theo thời gian thực.</li>
              <li style={{ marginBottom: '8px' }}>Thường xuyên đọc phần <b>Nhận Định Thân Tín Từ AI</b> bên trong chi tiết từng mã cổ phiếu. Chúng sẽ giúp bạn tập làm quen với tư duy đọc các dạng tín hiệu thị trường như một nhà phân tích chuyên nghiệp.</li>
              <li style={{ marginBottom: '8px' }}>Quy hoạch tài sản của bạn bằng cách thêm mã quan tâm vào <b>Danh Mục Giả Lập (Watchlist)</b> tại Trang cá nhân. Từ đó theo dõi biến động tài sản ảo tăng giảm mỗi ngày mà không mảy may gánh rủi ro tài chính thật.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Education;

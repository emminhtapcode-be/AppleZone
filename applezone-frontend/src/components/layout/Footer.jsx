import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-columns">
          <div className="footer-col brand-col">
            <div className="footer-logo">Apple<span className="logo-zone">Zone</span></div>
            <p>Không gian công nghệ đỉnh cao dành cho người dùng hệ sinh thái Apple. Trải nghiệm không gian mua sắm đẳng cấp, hiện đại và chuẩn mực.</p>
          </div>
          
          <div className="footer-col">
            <h4>Hỗ trợ khách hàng</h4>
            <ul>
              <li><a href="#">Điều kiện giao dịch chung</a></li>
              <li><a href="#">Hướng dẫn mua hàng online</a></li>
              <li><a href="#">Chính sách giao hàng</a></li>
              <li><a href="#">Hướng dẫn thanh toán</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Chính sách & Bảo hành</h4>
            <ul>
              <li><a href="#">Chính sách bảo hành & đổi trả</a></li>
              <li><a href="#">Chính sách bảo mật thông tin</a></li>
              <li><a href="#">Chính sách xử lý dữ liệu cá nhân</a></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h4>Tổng đài</h4>
            <ul>
              <li>Mua hàng: <strong className="text-highlight">1900.9696.42</strong> (8:00 - 21:30)</li>
              <li>Khiếu nại: <strong className="text-highlight">1900.9868.43</strong> (8:00 - 21:30)</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Công ty Cổ phần MWC. GCNĐKDN: 0303217354 do sở KH & ĐT TP.HCM cấp ngày 02/01/2007.</p>
          <p>Địa chỉ: 128 Trần Quang Khải, P. Tân Định, Q.1, TP.HCM. Địa chỉ liên hệ và gửi chứng từ: Lô T2-1.2, Đường D1, P. Tân Phú, TP. Thủ Đức, TP.HCM.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

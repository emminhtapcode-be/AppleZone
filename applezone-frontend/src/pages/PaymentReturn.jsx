import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentReturn = ({ status }) => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const isSuccess = status === 'success';

  return (
    <div className="container" style={{ padding: '120px 20px', minHeight: '70vh', textAlign: 'center' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
        {isSuccess ? (
          <>
            <div style={{ fontSize: '4rem', color: '#34c759', marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Thanh toán thành công!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Cảm ơn bạn đã mua sắm tại AppleZone. Đơn hàng <strong>#{orderId}</strong> của bạn đã được xác nhận thanh toán.
            </p>
            <Link to="/profile" className="btn-primary inline-block">Xem đơn hàng</Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', color: '#ff453a', marginBottom: '20px' }}>
              <i className="fas fa-times-circle"></i>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Thanh toán thất bại</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Giao dịch của bạn đã bị hủy hoặc xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
            </p>
            <Link to="/cart" className="btn-primary inline-block">Quay lại giỏ hàng</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;

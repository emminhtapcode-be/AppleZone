import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import './PaymentResult.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy toàn bộ query params từ URL (VNPay redirect về)
        const vnpParams = {};
        for (const [key, value] of searchParams.entries()) {
          vnpParams[key] = value;
        }

        // Nếu không có params VNPay → hiển thị lỗi
        if (!vnpParams.vnp_SecureHash) {
          setStatus('failed');
          setErrorMsg('Không tìm thấy thông tin thanh toán.');
          return;
        }

        // Gọi backend verify
        const res = await api.post('/payments/vnpay/verify', vnpParams);

        if (res.success) {
          setStatus('success');
          setData(res);
        } else {
          setStatus('failed');
          setErrorMsg(res.message || 'Thanh toán thất bại');
          setData(res);
        }
      } catch (err) {
        console.error('Payment verify error:', err);
        setStatus('failed');
        setErrorMsg('Không thể xác minh thanh toán. Vui lòng liên hệ hỗ trợ.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card glass-panel">
          <div className="payment-loading">
            <div className="payment-spinner"></div>
            <h2>Đang xác minh thanh toán...</h2>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card glass-panel">
          {/* Success animation */}
          <div className="payment-icon payment-icon--success">
            <svg viewBox="0 0 52 52" className="checkmark-svg">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>

          <h2 className="payment-title">Thanh toán thành công!</h2>
          <p className="payment-subtitle">
            Cảm ơn bạn đã mua sắm tại <strong>AppleZone</strong>
          </p>

          {/* Transaction details */}
          <div className="payment-details">
            <div className="payment-detail-row">
              <span className="detail-label">Mã đơn hàng</span>
              <span className="detail-value highlight">#{data?.orderId}</span>
            </div>
            {data?.amount && (
              <div className="payment-detail-row">
                <span className="detail-label">Số tiền</span>
                <span className="detail-value">{Number(data.amount).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            {data?.bankCode && (
              <div className="payment-detail-row">
                <span className="detail-label">Ngân hàng</span>
                <span className="detail-value">{data.bankCode}</span>
              </div>
            )}
            {data?.transactionNo && (
              <div className="payment-detail-row">
                <span className="detail-label">Mã giao dịch</span>
                <span className="detail-value">{data.transactionNo}</span>
              </div>
            )}
          </div>

          <div className="payment-actions">
            <Link to="/my" className="btn-primary">Xem đơn hàng của tôi</Link>
            <Link to="/products" className="btn-secondary">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </div>
    );
  }

  // Failed
  return (
    <div className="payment-result-page">
      <div className="payment-result-card glass-panel">
        {/* Fail animation */}
        <div className="payment-icon payment-icon--failed">
          <svg viewBox="0 0 52 52" className="crossmark-svg">
            <circle className="crossmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="crossmark-x" fill="none" d="M16 16 36 36 M36 16 16 36"/>
          </svg>
        </div>

        <h2 className="payment-title">Thanh toán thất bại</h2>
        <p className="payment-subtitle">{errorMsg || 'Giao dịch không thành công'}</p>

        {data?.orderId && (
          <div className="payment-details">
            <div className="payment-detail-row">
              <span className="detail-label">Mã đơn hàng</span>
              <span className="detail-value">#{data.orderId}</span>
            </div>
            {data?.responseCode && (
              <div className="payment-detail-row">
                <span className="detail-label">Mã lỗi</span>
                <span className="detail-value error-code">{data.responseCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="payment-actions">
          <Link to="/cart" className="btn-primary">Quay lại giỏ hàng</Link>
          <Link to="/" className="btn-secondary">Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;

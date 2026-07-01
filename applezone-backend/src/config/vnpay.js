module.exports = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || 'VEX0T46B',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || 'Z285ZXXN8HBR3P38N71U0Y6M203ZJOTG',
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_Api: process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:8000/api/v1/payments/vnpay_return',
};

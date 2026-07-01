module.exports = {
  vnp_TmnCode:    process.env.VNP_TMN_CODE    || 'PD3XL9PH',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || 'T01GKYW4WRSVFBDQPO5Z1D4KLKNBMYH8',
  vnp_Url:        process.env.VNP_URL          || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl:  process.env.VNP_RETURN_URL   || 'http://localhost:5173/payment/result',
};

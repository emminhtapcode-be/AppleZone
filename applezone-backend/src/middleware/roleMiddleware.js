/**
 * Kiểm tra role người dùng sau khi đã authenticate
 * Dùng: router.get('/route', authenticate, requireRole('Admin', 'Staff'), handler)
 * @param {...string} roles - Danh sách roles được phép
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `Yêu cầu quyền: ${roles.join(' hoặc ')}. Quyền hiện tại: ${req.user.role}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };

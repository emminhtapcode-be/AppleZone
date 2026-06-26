from sqlalchemy import Column, Integer, String, Numeric, DateTime
from app.db.database import Base

class Coupon(Base):
    __tablename__ = "coupons"
    coupon_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(String(20))
    discount_value = Column(Numeric(18, 2))
    min_order_amount = Column(Numeric(18, 2))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    usage_limit = Column(Integer)
    used_count = Column(Integer, default=0)

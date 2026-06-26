from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from app.db.database import Base

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    payment_method = Column(String(50))
    amount = Column(Numeric(18, 2))
    payment_status = Column(String(50), default="Pending")
    paid_at = Column(DateTime)

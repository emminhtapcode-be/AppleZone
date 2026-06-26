from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.database import Base

class Warranty(Base):
    __tablename__ = "warranties"
    warranty_id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.order_item_id"))
    serial_number = Column(String(100), unique=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String(50), default="Active")

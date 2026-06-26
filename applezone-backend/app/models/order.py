from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    shipping_address_id = Column(Integer, ForeignKey("user_addresses.address_id"))
    coupon_id = Column(Integer, ForeignKey("coupons.coupon_id"), nullable=True)
    total_amount = Column(Numeric(18, 2), nullable=False)
    shipping_fee = Column(Numeric(18, 2), default=0)
    discount_amount = Column(Numeric(18, 2), default=0)
    final_amount = Column(Numeric(18, 2), nullable=False)
    order_status = Column(String(50), default="Pending")
    payment_status = Column(String(50), default="Unpaid")
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    tracking = relationship("OrderTracking", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(18, 2), nullable=False)
    discount_amount = Column(Numeric(18, 2), default=0)
    order = relationship("Order", back_populates="items")

class OrderTracking(Base):
    __tablename__ = "order_tracking"
    tracking_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    status = Column(String(50))
    note = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    order = relationship("Order", back_populates="tracking")

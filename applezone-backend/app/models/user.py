from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(255))
    role = Column(String(20), default="Customer")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    addresses = relationship("UserAddress", back_populates="user")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")

class UserAddress(Base):
    __tablename__ = "user_addresses"
    address_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    receiver_name = Column(String(100))
    phone = Column(String(20))
    address_line = Column(String(255))
    city = Column(String(100))
    district = Column(String(100))
    ward = Column(String(100))
    is_default = Column(Boolean, default=False)
    user = relationship("User", back_populates="addresses")

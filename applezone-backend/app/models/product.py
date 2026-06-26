from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, Boolean, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True)
    status = Column(Boolean, default=True)
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    product_name = Column(String(200), nullable=False)
    thumbnail_url = Column(String(255))
    description = Column(Text)
    base_price = Column(Numeric(18, 2))
    status = Column(Boolean, default=True)
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product")
    reviews = relationship("Review", back_populates="product")

class ProductVariant(Base):
    __tablename__ = "product_variants"
    variant_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    color = Column(String(50))
    storage = Column(String(50))
    sku = Column(String(100), unique=True)
    price = Column(Numeric(18, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    status = Column(Boolean, default=True)
    product = relationship("Product", back_populates="variants")
    images = relationship("ProductImage", back_populates="variant")

class ProductImage(Base):
    __tablename__ = "product_images"
    image_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id"))
    image_url = Column(String(255))
    is_primary = Column(Boolean, default=False)
    variant = relationship("ProductVariant", back_populates="images")

class Review(Base):
    __tablename__ = "reviews"
    review_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    rating = Column(Integer, CheckConstraint("rating BETWEEN 1 AND 5"))
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

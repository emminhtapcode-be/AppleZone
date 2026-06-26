from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

class ProductVariantResponse(BaseModel):
    variant_id: int
    color: Optional[str]
    storage: Optional[str]
    sku: str
    price: Decimal
    stock_quantity: int
    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    product_id: int
    product_name: str
    thumbnail_url: Optional[str]
    description: Optional[str]
    base_price: Optional[Decimal]
    variants: List[ProductVariantResponse] = []
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: int
    product_name: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    base_price: Decimal

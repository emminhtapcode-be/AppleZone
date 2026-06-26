from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class OrderItemCreate(BaseModel):
    variant_id: int
    quantity: int

class OrderCreate(BaseModel):
    shipping_address_id: int
    coupon_code: Optional[str] = None
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    order_id: int
    total_amount: Decimal
    final_amount: Decimal
    order_status: str
    payment_status: str
    created_at: datetime
    class Config:
        from_attributes = True

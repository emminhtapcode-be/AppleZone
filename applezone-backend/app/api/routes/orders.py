from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.order import OrderCreate, OrderResponse
from app.models.order import Order, OrderItem, OrderTracking
from app.models.product import ProductVariant
from app.models.coupon import Coupon
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = 0
    items_data = []
    for item in payload.items:
        variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
        if not variant or variant.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Variant {item.variant_id} unavailable")
        total += float(variant.price) * item.quantity
        items_data.append((variant, item.quantity))

    discount = 0
    coupon_id = None
    if payload.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == payload.coupon_code).first()
        if coupon and coupon.end_date > datetime.utcnow():
            if coupon.discount_type == "Percentage":
                discount = total * float(coupon.discount_value) / 100
            else:
                discount = float(coupon.discount_value)
            coupon_id = coupon.coupon_id
            coupon.used_count += 1

    order = Order(
        user_id=current_user.user_id,
        shipping_address_id=payload.shipping_address_id,
        coupon_id=coupon_id,
        total_amount=total,
        discount_amount=discount,
        final_amount=total - discount
    )
    db.add(order)
    db.flush()

    for variant, qty in items_data:
        db.add(OrderItem(order_id=order.order_id, variant_id=variant.variant_id, quantity=qty, unit_price=variant.price))
        variant.stock_quantity -= qty

    db.add(OrderTracking(order_id=order.order_id, status="Pending", note="Order created"))
    db.commit()
    db.refresh(order)
    return order

@router.get("/", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Order).filter(Order.user_id == current_user.user_id).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.order_id == order_id, Order.user_id == current_user.user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

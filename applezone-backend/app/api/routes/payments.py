from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.payment import Payment
from app.models.order import Order
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/{order_id}")
def process_payment(order_id: int, method: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.order_id == order_id, Order.user_id == current_user.user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payment = Payment(
        order_id=order_id,
        payment_method=method,
        amount=order.final_amount,
        payment_status="Paid",
        paid_at=datetime.utcnow()
    )
    order.payment_status = "Paid"
    db.add(payment)
    db.commit()
    return {"message": "Payment successful", "payment_id": payment.payment_id}

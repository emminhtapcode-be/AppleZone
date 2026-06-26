from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.middleware.auth_middleware import require_role
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/orders")
def admin_get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin", "Staff"))
):
    return db.query(Order).all()

@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int, status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin", "Staff"))
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.order_status = status
    db.commit()
    return {"message": f"Order status updated to {status}"}

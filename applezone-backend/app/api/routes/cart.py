from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.cart import Cart, CartItem
from app.models.user import User

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("/")
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.user_id).first()
    if not cart:
        return {"cart_id": None, "items": []}
    return cart

@router.post("/items")
def add_to_cart(variant_id: int, quantity: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.user_id).first()
    if not cart:
        cart = Cart(user_id=current_user.user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    existing = db.query(CartItem).filter(CartItem.cart_id == cart.cart_id, CartItem.variant_id == variant_id).first()
    if existing:
        existing.quantity += quantity
    else:
        db.add(CartItem(cart_id=cart.cart_id, variant_id=variant_id, quantity=quantity))
    db.commit()
    return {"message": "Added to cart"}

@router.delete("/items/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(CartItem).filter(CartItem.cart_item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed"}

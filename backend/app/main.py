import cloudinary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, categories, forecasts, transactions,receipts
from app.core.config import settings


cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)


app=FastAPI(title="Expense Tracker API")
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials=True,
  allow_headers=["*"],
  allow_methods=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
  
  
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])
app.include_router(forecasts.router, prefix="/api/forecasts", tags=["forecasts"])
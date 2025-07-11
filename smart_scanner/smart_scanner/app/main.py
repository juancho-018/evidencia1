from fastapi import FastAPI
from app.routes.document_routes import router as document_router

app = FastAPI(title="Smart Document Scanner")

app.include_router(document_router, prefix="/api/documents")

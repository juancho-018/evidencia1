from fastapi import APIRouter, UploadFile, File
from app.controllers.document_controller import process_document

router = APIRouter()

@router.post("/upload/")
async def upload_document(file: UploadFile = File(...)):
    result = await process_document(file)
    return {"path": result}

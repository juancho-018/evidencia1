import os
from app.services.ocr_service import extract_text
from app.services.classifier_service import classify_document
from app.services.entity_service import extract_entities
from app.services.file_service import save_and_organize_file
from fastapi import UploadFile

async def process_document(file: UploadFile):
    # Guardar archivo temporal
    contents = await file.read()
    temp_path = f"uploads/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(contents)

    # OCR
    text = extract_text(temp_path)

    # Clasificación (IA)
    doc_type = classify_document(text)

    # Entidades relevantes
    entities = extract_entities(text)

    # Organizar y guardar archivo
    final_path = save_and_organize_file(temp_path, doc_type, entities)
    return final_path

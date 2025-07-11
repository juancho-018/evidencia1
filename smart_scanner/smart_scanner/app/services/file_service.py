import os
import shutil
from datetime import datetime

def save_and_organize_file(temp_path, doc_type, entities):
    # Jerarquía basada en entidades
    user = entities.get("PERSON", "Desconocido")
    year = datetime.now().year

    # Ruta ejemplo: processed_documents/Desconocido/factura/2025/
    base_dir = f"processed_documents/{user}/{doc_type}/{year}"
    os.makedirs(base_dir, exist_ok=True)

    # Renombrar archivo
    keywords = "_".join(entities.values())[:50]
    ext = os.path.splitext(temp_path)[1]
    new_name = f"{doc_type}_{keywords}{ext}".replace(" ", "_")

    final_path = os.path.join(base_dir, new_name)
    shutil.move(temp_path, final_path)
    return final_path

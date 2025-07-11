import pytesseract
from pdf2image import convert_from_path
from PIL import Image

def extract_text(path):
    if path.endswith(".pdf"):
        images = convert_from_path(path)
        text = " ".join(pytesseract.image_to_string(img) for img in images)
    else:
        text = pytesseract.image_to_string(Image.open(path))
    return text

from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def classify_document(text):
    labels = ["factura", "trabajo académico", "currículum", "contrato", "carta"]
    result = classifier(text, candidate_labels=labels)
    return result["labels"][0]

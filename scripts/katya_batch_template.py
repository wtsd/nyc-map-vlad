"""Template for recurring Katya place batches.

1) Copy this file to a dated filename, e.g. scripts/katya_batch_2026_04_19.py
2) Paste records from chat into INCOMING_PLACES
3) Run ingestion in dry-run mode first:
   python scripts/ingest_places_batch.py . --batch-file scripts/katya_batch_2026_04_19.py
4) If summary looks good, persist:
   python scripts/ingest_places_batch.py . --batch-file scripts/katya_batch_2026_04_19.py --write
"""

INCOMING_PLACES = [
    {
        "title": "Example Place",
        "title_ru": "Пример места",
        "category": "food",
        "address": "123 Example St, New York, NY",
        "transit": "14 St / Union Sq",
        "price": "$$",
        "external_link": "https://example.com",
        "description_en": "Optional EN description. Will not overwrite by default.",
        "description_ru": "Опциональное описание на русском. По умолчанию не перезаписывается.",
    },
]

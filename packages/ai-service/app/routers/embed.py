from fastapi import APIRouter, HTTPException
from app.models.listing import EmbedListingRequest, EmbedListingResponse
from app.services import cohere_service, opensearch_service

router = APIRouter()


@router.post("/listing", response_model=EmbedListingResponse)
def embed_listing(req: EmbedListingRequest) -> EmbedListingResponse:
    opensearch_service.ensure_index()
    try:
        embeddings = cohere_service.embed_documents([req.text])
        vector = embeddings[0]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cohere embedding failed: {e}") from e

    metadata = {
        "title": req.text[:200],
        "category_l1": req.categoryL1,
        "category_l2": req.categoryL2,
        "status": "active",
    }
    embedding_id = opensearch_service.upsert_listing(req.listingId, vector, metadata)
    return EmbedListingResponse(embeddingId=embedding_id, listingId=req.listingId)

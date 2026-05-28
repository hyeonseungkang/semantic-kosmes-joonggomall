from fastapi import APIRouter, HTTPException
from app.models.listing import ExtractSpecRequest, ExtractedSpec
from app.services import claude_service

router = APIRouter()


@router.post("/spec", response_model=ExtractedSpec)
def extract_spec(req: ExtractSpecRequest) -> ExtractedSpec:
    try:
        return claude_service.extract_spec(req.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

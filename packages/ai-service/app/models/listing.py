from pydantic import BaseModel
from typing import Optional


class EmbedListingRequest(BaseModel):
    listingId: str
    text: str
    categoryL1: Optional[str] = None
    categoryL2: Optional[str] = None


class EmbedListingResponse(BaseModel):
    embeddingId: str
    listingId: str


class ExtractSpecRequest(BaseModel):
    text: str
    context: str = "listing"  # "listing" | "demand"


class ExtractedSpec(BaseModel):
    category_l1: Optional[str] = None
    category_l2: Optional[str] = None
    keywords: list[str] = []
    voltage_v: Optional[float] = None
    power_kw: Optional[float] = None
    dimensions: Optional[dict] = None
    weight_kg: Optional[float] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None

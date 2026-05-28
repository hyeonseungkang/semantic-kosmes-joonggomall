from pydantic import BaseModel
from typing import Optional, Any


class GeoPoint(BaseModel):
    lat: float
    lng: float


class HardFilter(BaseModel):
    voltage: Optional[int] = None
    category_l1: Optional[str] = None
    category_l2: Optional[str] = None
    condition: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None


class SemanticSearchRequest(BaseModel):
    query: str
    location: GeoPoint
    radiusKm: int = 50
    filters: Optional[HardFilter] = None
    topK: int = 50
    demandId: Optional[str] = None


class SearchResultItem(BaseModel):
    listing: dict[str, Any]
    scoreTotal: float
    scoreVector: float
    scoreGeo: float
    distanceKm: float


class SemanticSearchResponse(BaseModel):
    results: list[SearchResultItem]
    total: int
    demandId: Optional[str] = None


class ReverseMatchRequest(BaseModel):
    listingId: str

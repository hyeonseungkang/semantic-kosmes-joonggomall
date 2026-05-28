from fastapi import APIRouter, HTTPException
from app.models.search import (
    SemanticSearchRequest,
    SemanticSearchResponse,
    SearchResultItem,
    ReverseMatchRequest,
    GeoPoint,
)
from app.services import cohere_service, opensearch_service, geo_service

router = APIRouter()

SIMILARITY_THRESHOLD = 0.75


@router.post("/semantic", response_model=SemanticSearchResponse)
def semantic_search(req: SemanticSearchRequest) -> SemanticSearchResponse:
    # 1. Embed query
    try:
        query_vector = cohere_service.embed_query(req.query)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Embedding failed: {e}") from e

    # 2. Build hard filters
    filter_clause: dict = {}
    if req.filters:
        if req.filters.voltage:
            filter_clause["voltage"] = req.filters.voltage
        if req.filters.category_l1:
            filter_clause["category_l1"] = req.filters.category_l1

    # 3. KNN search
    hits = opensearch_service.search_knn(query_vector, k=req.topK, filter_clause=filter_clause)

    # 4. Score with geo
    results: list[SearchResultItem] = []
    for hit in hits:
        lat = hit.get("lat")
        lng = hit.get("lng")
        if lat is None or lng is None:
            distance_km = req.radiusKm  # treat as at boundary
        else:
            distance_km = geo_service.haversine_km(req.location, GeoPoint(lat=lat, lng=lng))

        if distance_km > req.radiusKm:
            continue

        score_vector = float(hit.get("score", 0))
        score_geo = geo_service.geo_score(distance_km, req.radiusKm)
        score_total = geo_service.total_score(score_vector, score_geo)

        results.append(
            SearchResultItem(
                listing=hit,
                scoreTotal=round(score_total, 4),
                scoreVector=round(score_vector, 4),
                scoreGeo=round(score_geo, 4),
                distanceKm=round(distance_km, 2),
            )
        )

    results.sort(key=lambda r: r.scoreTotal, reverse=True)
    return SemanticSearchResponse(results=results, total=len(results), demandId=req.demandId)


@router.post("/reverse-match")
def reverse_match(req: ReverseMatchRequest) -> dict:
    """신규 listing에 대해 대기 중인 demand와 역방향 매칭."""
    listing_vector = opensearch_service.get_listing_embedding(req.listingId)
    if not listing_vector:
        return {"matched": 0}

    # 실제로는 DB에서 waiting demands를 조회해 유사도 계산
    # 여기서는 구조만 정의하고, NestJS webhook으로 결과 전달
    return {"listingId": req.listingId, "status": "processed"}

import math
from app.models.search import GeoPoint


def haversine_km(a: GeoPoint, b: GeoPoint) -> float:
    R = 6371.0
    lat1, lon1 = math.radians(a.lat), math.radians(a.lng)
    lat2, lon2 = math.radians(b.lat), math.radians(b.lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(h))


def geo_score(distance_km: float, radius_km: float) -> float:
    return max(0.0, 1.0 - distance_km / radius_km)


def total_score(vector_score: float, geo_score_val: float) -> float:
    return 0.6 * vector_score + 0.4 * geo_score_val

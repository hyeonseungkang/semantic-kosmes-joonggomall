from opensearchpy import OpenSearch
from app.config import settings

INDEX = settings.opensearch_index_name
VECTOR_DIM = 1024

_client: OpenSearch | None = None

INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "listing_id": {"type": "keyword"},
            "title": {"type": "text"},
            "description": {"type": "text"},
            "category_l1": {"type": "keyword"},
            "category_l2": {"type": "keyword"},
            "voltage": {"type": "integer"},
            "power_kw": {"type": "float"},
            "status": {"type": "keyword"},
            "embedding": {
                "type": "knn_vector",
                "dimension": VECTOR_DIM,
                "method": {
                    "name": "hnsw",
                    "engine": "nmslib",
                    "parameters": {"m": 16, "ef_construction": 512},
                },
            },
        }
    },
    "settings": {"index": {"knn": True, "knn.algo_param.ef_search": 256}},
}


def get_client() -> OpenSearch:
    global _client
    if _client is None:
        _client = OpenSearch(hosts=[settings.opensearch_endpoint], use_ssl=False, verify_certs=False)
    return _client


def ensure_index():
    client = get_client()
    if not client.indices.exists(index=INDEX):
        client.indices.create(index=INDEX, body=INDEX_MAPPING)


def upsert_listing(listing_id: str, embedding: list[float], metadata: dict) -> str:
    client = get_client()
    doc = {**metadata, "listing_id": listing_id, "embedding": embedding}
    client.index(index=INDEX, id=listing_id, body=doc)
    return listing_id


def search_knn(
    query_vector: list[float],
    k: int = 50,
    filter_clause: dict | None = None,
) -> list[dict]:
    client = get_client()
    must_clauses: list[dict] = [{"knn": {"embedding": {"vector": query_vector, "k": k}}}]
    filter_list: list[dict] = [{"term": {"status": "active"}}]
    if filter_clause:
        for field, value in filter_clause.items():
            if value is not None:
                filter_list.append({"term": {field: value}})

    query = {"query": {"bool": {"must": must_clauses, "filter": filter_list}}, "size": k}
    response = client.search(index=INDEX, body=query)
    hits = response["hits"]["hits"]
    return [{"id": h["_id"], "score": h["_score"], **h["_source"]} for h in hits]


def get_listing_embedding(listing_id: str) -> list[float] | None:
    client = get_client()
    try:
        doc = client.get(index=INDEX, id=listing_id)
        return doc["_source"].get("embedding")
    except Exception:
        return None

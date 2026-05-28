import cohere
from app.config import settings

_client: cohere.Client | None = None


def get_client() -> cohere.Client:
    global _client
    if _client is None:
        _client = cohere.Client(api_key=settings.cohere_api_key)
    return _client


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed a batch of listing documents."""
    client = get_client()
    response = client.embed(
        texts=texts,
        model="embed-multilingual-v3.0",
        input_type="search_document",
    )
    return response.embeddings  # type: ignore[return-value]


def embed_query(text: str) -> list[float]:
    """Embed a single search query."""
    client = get_client()
    response = client.embed(
        texts=[text],
        model="embed-multilingual-v3.0",
        input_type="search_query",
    )
    return response.embeddings[0]  # type: ignore[return-value]

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Anthropic
    anthropic_api_key: str

    # Cohere
    cohere_api_key: str

    # OpenSearch
    opensearch_endpoint: str = "http://localhost:9200"
    opensearch_index_name: str = "listings_semantic"

    # PostgreSQL
    database_url: str

    # Kakao Geocoding
    kakao_map_rest_api_key: str = ""

    # App
    port: int = 8001
    node_env: str = "development"


settings = Settings()

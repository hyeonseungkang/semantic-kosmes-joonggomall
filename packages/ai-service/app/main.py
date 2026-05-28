from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import embed, extract, search, crawler

app = FastAPI(
    title="K-자원순환 브릿지 AI Service",
    description="시맨틱 임베딩 / 스펙 추출 / 검색 마이크로서비스",
    version="0.0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embed.router, prefix="/embed", tags=["embed"])
app.include_router(extract.router, prefix="/extract", tags=["extract"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(crawler.router, prefix="/crawler", tags=["crawler"])


@app.get("/health")
def health():
    return {"status": "ok"}

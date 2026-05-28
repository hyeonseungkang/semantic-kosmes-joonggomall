import asyncio
import logging
from fastapi import APIRouter, BackgroundTasks

from app.services import crawler_service, cohere_service, opensearch_service

router = APIRouter()
logger = logging.getLogger(__name__)


async def _run_crawl_and_embed():
    opensearch_service.ensure_index()
    count = 0
    async for item in crawler_service.crawl_incremental(max_pages=5):
        text = f"[제목] {item['title']}\n[설명] {item['description']}"
        try:
            vectors = cohere_service.embed_documents([text])
            opensearch_service.upsert_listing(
                item["external_id"],
                vectors[0],
                {
                    "title": item["title"][:200],
                    "description": item["description"][:1000],
                    "status": "active",
                },
            )
            count += 1
        except Exception as e:
            logger.warning(f"Embed failed for {item['external_id']}: {e}")
    logger.info(f"Crawl complete: {count} listings indexed")


@router.post("/run")
def run_crawler(background_tasks: BackgroundTasks) -> dict:
    background_tasks.add_task(asyncio.run, _run_crawl_and_embed())
    return {"status": "started"}

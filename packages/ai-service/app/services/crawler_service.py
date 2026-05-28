import asyncio
import logging
from typing import AsyncGenerator

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://www.smes.go.kr/joonggomall"


async def fetch_listing_urls(session: httpx.AsyncClient, page: int = 1) -> list[str]:
    """목록 페이지에서 개별 게시글 URL 수집."""
    try:
        resp = await session.get(f"{BASE_URL}/list", params={"page": page}, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        links = soup.select("a.list-item-link")
        return [BASE_URL + a["href"] for a in links if a.get("href")]
    except Exception as e:
        logger.warning(f"Failed to fetch listing list page {page}: {e}")
        return []


async def parse_listing(session: httpx.AsyncClient, url: str) -> dict | None:
    """개별 매물 페이지 파싱."""
    try:
        resp = await session.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        title = soup.select_one("h2.detail-title")
        desc = soup.select_one("div.detail-desc")
        price = soup.select_one("span.price")
        location = soup.select_one("span.location")
        category = soup.select_one("span.category")

        return {
            "external_id": url.split("/")[-1],
            "url": url,
            "title": title.get_text(strip=True) if title else "",
            "description": desc.get_text(strip=True) if desc else "",
            "price_text": price.get_text(strip=True) if price else "",
            "location_text": location.get_text(strip=True) if location else "",
            "category_text": category.get_text(strip=True) if category else "",
        }
    except Exception as e:
        logger.warning(f"Failed to parse listing {url}: {e}")
        return None


async def crawl_incremental(max_pages: int = 10) -> AsyncGenerator[dict, None]:
    """증분 크롤링 — 최대 max_pages 페이지까지 순회."""
    async with httpx.AsyncClient(
        headers={"User-Agent": "KosmesBot/1.0 (+https://kosmes.joonggomall)"},
        follow_redirects=True,
    ) as session:
        for page in range(1, max_pages + 1):
            urls = await fetch_listing_urls(session, page)
            if not urls:
                break
            for url in urls:
                await asyncio.sleep(1.5)  # Rate limit
                item = await parse_listing(session, url)
                if item:
                    yield item

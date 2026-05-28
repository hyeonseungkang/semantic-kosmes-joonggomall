import json
import anthropic
from app.config import settings
from app.models.listing import ExtractedSpec

_client: anthropic.Anthropic | None = None

SYSTEM_PROMPT = """당신은 한국 B2B 산업 기계 설비 전문가입니다.
주어진 매물 설명 또는 구매 요구사항 텍스트에서 아래 JSON 스키마에 맞춰 정보를 추출하세요.
확실하지 않은 필드는 null로 반환하세요. 절대 추측하지 마세요.

출력 JSON 스키마:
{
  "category_l1": "대분류명 또는 null",
  "category_l2": "중분류명 또는 null",
  "keywords": ["핵심 키워드 배열"],
  "voltage_v": "전압(숫자, 단위V) 또는 null",
  "power_kw": "출력(kW 환산, 1HP=0.746kW) 또는 null",
  "dimensions": {"l": 숫자, "w": 숫자, "h": 숫자, "unit": "mm|cm|m"} 또는 null,
  "weight_kg": "무게(kg) 또는 null",
  "condition": "new|used|refurbished 또는 null",
  "quantity": "수량(정수) 또는 null"
}"""


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def extract_spec(text: str) -> ExtractedSpec:
    client = get_client()
    for attempt in range(3):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": text}],
            )
            raw = message.content[0].text  # type: ignore[index]
            # Extract JSON from potential markdown code block
            if "```" in raw:
                raw = raw.split("```")[1].lstrip("json").strip()
            data = json.loads(raw)
            return ExtractedSpec(**data)
        except Exception as e:
            if attempt == 2:
                raise RuntimeError(f"Spec extraction failed after 3 attempts: {e}") from e
    return ExtractedSpec()

# GENERATE.md — K-자원순환 브릿지 구현 작업 명세서

> PROPOSAL.md 기반 전체 구현 태스크 목록. 각 섹션은 담당 레이어별로 구분되며, 세부 항목은 단일 PR 단위로 분해 가능한 수준으로 작성됨.

---

## 목차

1. [프로젝트 초기 설정](#1-프로젝트-초기-설정)
2. [데이터베이스 스키마 설계](#2-데이터베이스-스키마-설계)
3. [데이터 수집 및 전처리 파이프라인](#3-데이터-수집-및-전처리-파이프라인)
4. [AI Microservice — FastAPI](#4-ai-microservice--fastapi)
5. [백엔드 서버 — NestJS](#5-백엔드-서버--nestjs)
6. [프론트엔드 — React/TypeScript](#6-프론트엔드--reacttypescript)
7. [인프라 및 배포](#7-인프라-및-배포)
8. [테스트 및 품질 보증](#8-테스트-및-품질-보증)

---

## 1. 프로젝트 초기 설정

### 1-1. 모노레포 구조 초기화

- **작업:** pnpm workspace 기반 모노레포 구성 (`packages/frontend`, `packages/backend`, `packages/ai-service`, `packages/shared`)
- **산출물:** `pnpm-workspace.yaml`, 루트 `package.json`, `.npmrc`
- **세부 내용:**
  - `packages/shared`에 TypeScript 공통 타입 정의 패키지 생성 (Listing, Demand, GeoPoint 등 DTO 인터페이스)
  - ESLint + Prettier 공통 설정 루트에 배치 (`eslint.config.mjs`, `.prettierrc`)
  - commitlint + husky pre-commit 훅 설정

### 1-2. 환경변수 관리

- **작업:** 전체 서비스에 걸친 `.env` 스키마 정의 및 검증 로직 구성
- **세부 내용:**
  - `.env.example` 파일에 필수 키 목록 명시:
    - `ANTHROPIC_API_KEY` (Claude 3.5 Sonnet)
    - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
    - `OPENSEARCH_ENDPOINT`, `OPENSEARCH_INDEX_NAME`
    - `COHERE_API_KEY` (Cohere Embed v4)
    - `DATABASE_URL` (PostgreSQL + PostGIS)
    - `KAKAO_MAP_API_KEY` 또는 `NAVER_MAP_CLIENT_ID`
    - `REDIS_URL` (알림 큐)
    - `KAKAO_ALERT_REST_API_KEY`, `KAKAO_ALERT_TEMPLATE_ID`
  - NestJS: `@nestjs/config` + `joi` 스키마 검증
  - FastAPI: `pydantic-settings` 기반 `Settings` 클래스

### 1-3. Docker Compose 로컬 개발 환경

- **작업:** 로컬 개발용 `docker-compose.yml` 작성
- **서비스 구성:**
  - `postgres`: PostGIS 확장 포함 (`postgis/postgis:16-3.4`)
  - `opensearch`: OpenSearch 2.x 단일 노드 (`opensearch-project/opensearch:2.x`)
  - `opensearch-dashboards`: 인덱스 및 매핑 확인용
  - `redis`: 알림 큐 (BullMQ 백엔드)
- **세부 내용:**
  - 각 서비스 healthcheck 정의
  - 볼륨 마운트로 데이터 영속성 확보
  - `.env.local` 파일로 자동 주입

---

## 2. 데이터베이스 스키마 설계

### 2-1. PostgreSQL 스키마 (메타데이터 + PostGIS)

**테이블: `listings` (판매 매물)**
```sql
CREATE TABLE listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   VARCHAR(64) UNIQUE,           -- 원본 장터 게시글 ID
  title         TEXT NOT NULL,
  description   TEXT,
  category_l1   VARCHAR(64),                  -- 대분류 (예: 일반산업)
  category_l2   VARCHAR(64),                  -- 중분류 (예: 공기청정/환기)
  price         NUMERIC(15, 0),
  price_type    VARCHAR(16),                  -- 'fixed' | 'negotiable' | 'unknown'
  voltage       INTEGER,                      -- 단위: V
  power_kw      NUMERIC(6, 2),               -- 단위: kW (마력 → kW 변환 포함)
  weight_kg     NUMERIC(10, 2),
  dimensions    JSONB,                        -- { l: number, w: number, h: number, unit: 'mm'|'cm' }
  condition     VARCHAR(16),                  -- 'new' | 'used' | 'refurbished'
  location_text TEXT,                         -- 원본 텍스트 ("충청북도 음성군")
  location      GEOMETRY(Point, 4326),        -- PostGIS 좌표 (WGS84)
  seller_id     UUID REFERENCES users(id),
  status        VARCHAR(16) DEFAULT 'active', -- 'active' | 'sold' | 'expired'
  embedding_id  VARCHAR(128),                 -- OpenSearch 문서 ID
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX listings_location_gist ON listings USING GIST(location);
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_category_idx ON listings(category_l1, category_l2);
```

**테이블: `demands` (구매 수요 등록)**
```sql
CREATE TABLE demands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID REFERENCES users(id),
  query_text      TEXT NOT NULL,              -- 원본 자연어 입력
  extracted_spec  JSONB,                      -- LLM 추출 결과 { category, voltage, size, keywords[] }
  location        GEOMETRY(Point, 4326),      -- 구매자 공장 위치
  radius_km       INTEGER DEFAULT 50,
  status          VARCHAR(16) DEFAULT 'waiting', -- 'waiting' | 'matched' | 'expired'
  notify_channel  VARCHAR(16) DEFAULT 'push',   -- 'push' | 'kakao' | 'email'
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX demands_location_gist ON demands USING GIST(location);
CREATE INDEX demands_status_idx ON demands(status);
```

**테이블: `matches` (매칭 결과 이력)**
```sql
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id     UUID REFERENCES demands(id),
  listing_id    UUID REFERENCES listings(id),
  score_vector  NUMERIC(5, 4),   -- 코사인 유사도 (0~1)
  score_geo     NUMERIC(5, 4),   -- 근접성 점수 (0~1)
  score_total   NUMERIC(5, 4),   -- 가중 합산 점수
  distance_km   NUMERIC(8, 2),
  notified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**테이블: `users`**
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  role          VARCHAR(16) NOT NULL,         -- 'buyer' | 'seller' | 'admin'
  phone         VARCHAR(20),
  kakao_user_id VARCHAR(64),
  push_token    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### 2-2. OpenSearch 인덱스 매핑 (Vector DB)

- **인덱스명:** `listings_semantic`
- **세부 내용:**
  - `knn_vector` 필드로 Cohere Embed v4 출력 차원(1024)에 맞는 벡터 저장
  - `hnsw` 알고리즘 파라미터 설정 (`m: 16`, `ef_construction: 512`)
  - 필터링용 keyword 필드 병행 저장: `voltage`, `power_kw`, `category_l1`, `status`, `listing_id`

```json
{
  "mappings": {
    "properties": {
      "listing_id":   { "type": "keyword" },
      "title":        { "type": "text", "analyzer": "korean" },
      "description":  { "type": "text", "analyzer": "korean" },
      "category_l1":  { "type": "keyword" },
      "category_l2":  { "type": "keyword" },
      "voltage":      { "type": "integer" },
      "power_kw":     { "type": "float" },
      "status":       { "type": "keyword" },
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "engine": "nmslib",
          "parameters": { "m": 16, "ef_construction": 512 }
        }
      }
    }
  },
  "settings": {
    "index": { "knn": true, "knn.algo_param.ef_search": 256 }
  }
}
```

### 2-3. 마이그레이션 관리

- **도구:** TypeORM Migrations (NestJS) + `db-migrate` CLI
- **세부 내용:**
  - `migrations/` 디렉토리에 버전별 up/down SQL 관리
  - CI 파이프라인에서 `migrate:latest` 자동 실행
  - PostGIS 확장 활성화 (`CREATE EXTENSION IF NOT EXISTS postgis`) 초기 마이그레이션에 포함

---

## 3. 데이터 수집 및 전처리 파이프라인

### 3-1. 자산거래중개장터 크롤러

- **작업:** 중진공 자산거래중개장터(joonggomall) 판매글 수집 스크립트 작성
- **언어/도구:** Python, `httpx` + `BeautifulSoup4` 또는 `playwright` (JS 렌더링 필요 시)
- **세부 내용:**
  - 목록 페이지 페이지네이션 순회 → 개별 상세 페이지 크롤링
  - 수집 필드: 제목, 본문(상세 스펙), 가격, 위치 텍스트, 카테고리, 게시 일자, 판매자 연락처(마스킹 보존)
  - 크롤링 주기: BullMQ 스케줄러를 통해 매 6시간 증분(incremental) 크롤링
  - `external_id` 기준 중복 처리: upsert 방식 (변경 시 `updated_at` 갱신)
  - Rate limiting: 요청 간 1~3초 랜덤 지연, `robots.txt` 준수 확인

### 3-2. 위치 텍스트 → 좌표 변환 (지오코딩)

- **작업:** 판매글의 `location_text` → WGS84 좌표 변환
- **세부 내용:**
  - 1차: Kakao 지도 REST API `/v2/local/search/address.json` 호출
  - 2차 폴백: Naver Geocoding API
  - 3차 폴백: 행정구역 테이블 기반 시/군/구 중심점 매핑 (오프라인 fallback)
  - 변환 결과를 `listings.location` (PostGIS Point)에 저장
  - 변환 실패 시 `location_text`만 보존하고 `location IS NULL` 플래그 처리
  - 캐싱: Redis에 주소 문자열 → 좌표 1주일 TTL 캐시

### 3-3. KS 표준 용어 코퍼스 처리

- **작업:** e-나라표준인증 KS 인증 고시 데이터 정제 및 유의어 사전 구축
- **세부 내용:**
  - KS 표준 코드와 기계 명칭 대응 테이블 CSV 파싱
  - 유의어 그룹 구성 (예: `에어샤워 = 클린룸 에어커튼 = 에어샤워 부스 = Air Shower`)
  - `synonym_map` 테이블에 저장: `(standard_term, synonyms[], ks_code, category)`
  - 이 유의어 맵을 임베딩 시 컨텍스트 프롬프트에 주입하여 도메인 특화 벡터 품질 향상

### 3-4. 스펙 정형화 배치 파이프라인

- **작업:** 비정형 판매글 텍스트에서 구조화된 스펙 추출 (Claude 3.5 Sonnet 활용)
- **처리 흐름:**
  1. DB에서 `extracted_spec IS NULL` 인 listing 배치 조회 (100건 단위)
  2. Claude API 호출: 시스템 프롬프트에 추출 스키마 정의, 사용자 메시지에 판매글 원문 전달
  3. 구조화 응답: `{ category, voltage_v, power_kw, dimensions, weight_kg, condition, keywords[] }`
  4. 결과를 `listings.extracted_spec` JSONB 컬럼에 저장 및 개별 컬럼 업데이트
- **Claude 프롬프트 설계:**
  - System: 산업 기계 스펙 추출 전문가 역할 부여, 출력 JSON 스키마 명시
  - 전압 표기 정규화: `220V/3상/380V` → `{ voltage: 380, phase: 3 }`
  - 마력 → kW 변환: `1HP = 0.746kW`
  - 불확실 필드는 `null` 반환 (할루시네이션 억제)
- **비용 최적화:** 프롬프트 캐싱(`cache_control: ephemeral`) 활용으로 시스템 프롬프트 재사용

---

## 4. AI Microservice — FastAPI

### 4-1. 프로젝트 구조

```
packages/ai-service/
├── app/
│   ├── main.py
│   ├── config.py              # pydantic-settings
│   ├── routers/
│   │   ├── embed.py           # POST /embed/listing, POST /embed/demand
│   │   ├── search.py          # POST /search/semantic
│   │   └── extract.py         # POST /extract/spec
│   ├── services/
│   │   ├── cohere_service.py  # Cohere Embed v4 래퍼
│   │   ├── claude_service.py  # Claude 3.5 Sonnet 래퍼
│   │   ├── opensearch_service.py
│   │   └── geo_service.py     # 거리 계산
│   └── models/
│       ├── listing.py
│       ├── demand.py
│       └── search_result.py
├── tests/
├── Dockerfile
└── requirements.txt
```

### 4-2. 임베딩 서비스 (Cohere Embed v4)

- **엔드포인트:** `POST /embed/listing`, `POST /embed/demand`
- **세부 내용:**
  - Cohere Embed v4 `embed-multilingual-v3.0` 모델 사용 (한국어 지원)
  - 임베딩 입력 텍스트 구성:
    ```
    [제목] {title}
    [카테고리] {category_l1} > {category_l2}
    [상세설명] {description}
    [유의어 컨텍스트] {synonym_context}  ← KS 유의어 사전에서 주입
    ```
  - `input_type: "search_document"` (판매글) / `"search_query"` (수요 쿼리) 구분
  - 배치 처리: 최대 96개 텍스트 동시 임베딩
  - 결과를 OpenSearch에 upsert

### 4-3. 스펙 추출 서비스 (Claude 3.5 Sonnet)

- **엔드포인트:** `POST /extract/spec`
- **세부 내용:**
  - 입력: `{ text: string, context: "listing" | "demand" }`
  - Claude API 호출 with `prompt_caching` (시스템 프롬프트 캐시)
  - 출력 JSON 스키마:
    ```json
    {
      "category_l1": "string | null",
      "category_l2": "string | null",
      "keywords": ["string"],
      "voltage_v": "number | null",
      "power_kw": "number | null",
      "dimensions": { "l": "number", "w": "number", "h": "number", "unit": "string" } | null,
      "weight_kg": "number | null",
      "condition": "new | used | refurbished | null",
      "quantity": "number | null"
    }
    ```
  - 구조화 출력: `response_format: { type: "json_object" }` 활용
  - 실패 시 재시도 3회, 최종 실패 시 `{}` 반환 + 에러 로깅

### 4-4. 시맨틱 검색 서비스

- **엔드포인트:** `POST /search/semantic`
- **요청 스키마:**
  ```json
  {
    "demand_id": "uuid",
    "query_text": "string",
    "extracted_spec": { ... },
    "buyer_location": { "lat": 37.1, "lng": 127.0 },
    "radius_km": 50,
    "hard_filters": {
      "voltage": 220,
      "category_l1": "일반산업"
    },
    "top_k": 50
  }
  ```
- **처리 로직:**
  1. `query_text` → Cohere 임베딩 (쿼리 벡터 생성)
  2. OpenSearch k-NN 쿼리 실행 (pre-filter: `status=active`, hard_filter 조건 적용)
  3. 상위 `top_k`개 결과에 대해 PostGIS ST_Distance 계산 (Python에서 haversine 또는 DB 쿼리)
  4. 최종 점수 계산:
     - `score_total = 0.6 * score_vector + 0.4 * score_geo`
     - `score_geo = max(0, 1 - distance_km / radius_km)`
  5. 정렬 후 반환

- **OpenSearch 쿼리 예시:**
  ```json
  {
    "query": {
      "bool": {
        "filter": [
          { "term": { "status": "active" } },
          { "term": { "voltage": 220 } }
        ],
        "must": [{
          "knn": {
            "embedding": { "vector": [...], "k": 50 }
          }
        }]
      }
    }
  }
  ```

### 4-5. 역방향 매칭 트리거 서비스

- **엔드포인트:** `POST /search/reverse-match`
- **역할:** 신규 listing 등록 시 호출 → 대기 중인 demands 중 매칭 후보 탐색
- **처리 로직:**
  1. 신규 listing 임베딩 생성
  2. DB에서 `status='waiting'` demands 조회 (만료일 필터 포함)
  3. 각 demand의 쿼리 벡터와 신규 listing 벡터 간 코사인 유사도 계산
  4. 유사도 임계값(0.75 이상) + 반경 조건 동시 만족 시 매칭으로 판정
  5. `matches` 테이블에 기록
  6. NestJS 알림 서비스로 Webhook 전송

---

## 5. 백엔드 서버 — NestJS

### 5-1. 프로젝트 구조

```
packages/backend/
├── src/
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/           # GlobalExceptionFilter
│   │   ├── interceptors/      # LoggingInterceptor, TransformInterceptor
│   │   └── guards/            # JwtAuthGuard
│   ├── modules/
│   │   ├── auth/              # JWT 인증
│   │   ├── users/
│   │   ├── listings/          # 판매 매물 CRUD
│   │   ├── demands/           # 구매 수요 등록
│   │   ├── search/            # AI Microservice 연동 프록시
│   │   ├── notifications/     # 알림 발송 (Kakao/Push)
│   │   ├── geo/               # 지오코딩 서비스
│   │   └── crawler/           # 크롤링 스케줄 관리
│   ├── database/
│   │   ├── entities/
│   │   └── migrations/
│   └── main.ts
├── test/
└── Dockerfile
```

### 5-2. 인증 모듈 (AuthModule)

- **작업:** JWT 기반 인증 구현
- **세부 내용:**
  - `POST /auth/register`: 이메일/비밀번호 회원가입 (bcrypt 해싱)
  - `POST /auth/login`: JWT Access Token (15m) + Refresh Token (7d) 발급
  - `POST /auth/refresh`: Refresh Token으로 Access Token 재발급
  - `POST /auth/kakao`: 카카오 OAuth2.0 소셜 로그인 (추후 알림 연동 동의 포함)
  - `@CurrentUser()` 커스텀 데코레이터로 요청 컨텍스트에서 사용자 정보 주입

### 5-3. 판매 매물 모듈 (ListingsModule)

- **엔드포인트:**
  - `GET /listings`: 목록 조회 (커서 기반 페이지네이션, 필터: category/status/voltage)
  - `GET /listings/:id`: 상세 조회
  - `POST /listings`: 신규 등록 (인증 필요)
    - 등록 후 AI Microservice에 임베딩 요청 비동기 발행 (BullMQ Job)
    - 역방향 매칭 트리거 Job 발행
  - `PATCH /listings/:id`: 수정 (본인 또는 admin)
  - `DELETE /listings/:id`: 삭제 (소프트 딜리트 → `status: 'expired'`)
  - `GET /listings/map`: 지도 뷰용 핀 데이터 (`{ id, lat, lng, title, price, score }` 경량 응답)
- **세부 내용:**
  - 등록 시 `location_text` → 지오코딩 자동 처리 (GeoModule 의존)
  - 이미지 업로드: `POST /listings/:id/images` → S3 presigned URL 반환 방식

### 5-4. 구매 수요 모듈 (DemandsModule)

- **엔드포인트:**
  - `POST /demands`: 수요 등록
    - 자연어 `query_text` + `location` + `radius_km` + `notify_channel` 수신
    - AI Microservice `POST /extract/spec` 호출하여 `extracted_spec` 저장
    - 즉시 시맨틱 검색 실행 (AI Microservice `POST /search/semantic`) 후 결과 반환
    - 결과 없을 시 `status: 'waiting'`으로 수요 대기열 등록
  - `GET /demands`: 내 수요 목록 조회
  - `DELETE /demands/:id`: 수요 취소
  - `GET /demands/:id/matches`: 매칭된 매물 목록 조회

### 5-5. 검색 모듈 (SearchModule)

- **엔드포인트:**
  - `POST /search`: 시맨틱 검색 메인 엔드포인트
    - Body: `{ query: string, location: GeoPoint, radius_km: number, filters: HardFilter }`
    - AI Microservice `POST /search/semantic` 프록시 + 결과 DB 조인하여 풍부한 응답 구성
  - `GET /search/suggestions`: 검색어 자동완성 (KS 유의어 사전 기반)
- **응답 구조:**
  ```json
  {
    "results": [{
      "listing": { ...ListingDetail },
      "score_total": 0.87,
      "score_vector": 0.91,
      "score_geo": 0.80,
      "distance_km": 23.4
    }],
    "total": 12,
    "demand_id": "uuid"
  }
  ```

### 5-6. 알림 모듈 (NotificationsModule)

- **작업:** 실시간 알림 발송 파이프라인 구현
- **세부 내용:**
  - **카카오 알림톡:**
    - `kakao-node-sdk` 또는 직접 REST 호출
    - 템플릿: "고객님이 등록하신 '[{{category}}] {{keywords}}' 수요에 맞는 새 매물이 등록되었습니다."
    - 발송 실패 시 SMS 폴백 (선택)
  - **웹 푸시 알림:**
    - `web-push` 라이브러리, VAPID 키 기반
    - `users.push_token` 필드에 구독 정보 저장
  - **BullMQ 큐:** `notification-queue`
    - Job: `{ type: 'kakao' | 'push', userId, matchId, listingId }`
    - Worker: 재시도 3회, 실패 시 Dead Letter Queue 이동
  - **알림 이력:** `notifications` 테이블에 발송 결과 기록 (sent_at, channel, status)

### 5-7. 지오코딩 모듈 (GeoModule)

- **작업:** 주소 텍스트 → 좌표 변환 서비스
- **세부 내용:**
  - `GeocodingService.geocode(address: string): Promise<GeoPoint | null>`
  - 카카오 REST API → Naver → 오프라인 fallback 순서 시도
  - Redis 캐시 (`GEOREF:{hash(address)}`, TTL 7d)
  - 역지오코딩: `GeocodingService.reverseGeocode(lat, lng): Promise<string>` (지도 팝업용)

### 5-8. 크롤러 스케줄 모듈 (CrawlerModule)

- **작업:** 크롤링 작업 스케줄 및 상태 관리
- **세부 내용:**
  - `@nestjs/schedule` `@Cron('0 */6 * * *')` 으로 6시간 주기 실행
  - 크롤러는 Python 스크립트를 `child_process.spawn`으로 실행하거나, 별도 Python 마이크로서비스 `POST /crawler/run` 호출
  - 크롤링 완료 후 신규 매물에 대해 임베딩 Job 일괄 발행
  - 크롤링 상태 (`crawler_jobs` 테이블): started_at, finished_at, new_count, error_count

---

## 6. 프론트엔드 — React/TypeScript

### 6-1. 프로젝트 구조

```
packages/frontend/
├── src/
│   ├── app/                   # React Router 라우트 레이아웃
│   ├── features/
│   │   ├── search/            # 검색 기능
│   │   ├── listings/          # 매물 상세 / 등록
│   │   ├── demands/           # 수요 등록 / 내 수요 관리
│   │   ├── map/               # 지도 컴포넌트
│   │   ├── auth/              # 로그인 / 회원가입
│   │   └── notifications/     # 알림 센터
│   ├── shared/
│   │   ├── components/        # 공통 UI 컴포넌트
│   │   ├── hooks/
│   │   ├── api/               # axios 인스턴스, 쿼리 훅 (TanStack Query)
│   │   └── types/             # 공유 타입 (packages/shared에서 import)
│   └── main.tsx
├── index.html
└── vite.config.ts
```

### 6-2. 기술 스택

- **빌드:** Vite + React 18 + TypeScript strict mode
- **상태 관리:** TanStack Query v5 (서버 상태) + Zustand (클라이언트 상태)
- **UI 라이브러리:** shadcn/ui + Tailwind CSS v4
- **지도:** 카카오 지도 SDK (react-kakao-maps-sdk) 또는 naver-maps-react
- **폼:** react-hook-form + zod
- **알림:** react-hot-toast + Web Push API

### 6-3. 메인 검색 화면 (SearchPage)

- **레이아웃:** 좌측 패널(검색 + 결과 목록) + 우측 패널(지도)
- **기능:**
  - **자연어 검색창:** 텍스트에리어 형태, 예시 플레이스홀더 ("소형 에어샤워 220V, 1~2인용 원합니다")
  - **내 위치 설정:** 현재 위치 자동 감지(Geolocation API) 또는 주소 직접 입력 → 지도 마커 표시
  - **반경 슬라이더:** 10 / 30 / 50 / 100 / 전체 km 선택
  - **하드 필터 패널 (접힘/펼침):** 전압(220V/380V/선택없음), 카테고리 대분류, 상태(중고/신품), 가격 범위
  - **검색 실행 후 결과:**
    - 좌측: 매물 카드 목록 (점수 순, 스크롤), 카드에 유사도 배지 및 거리 표시
    - 우측: 지도 위 핀 마커, 마커 클릭 시 매물 요약 팝업(InfoWindow)
  - **결과 없음 상태:** "수요 등록" 유도 배너 → 원클릭으로 현재 검색 조건으로 수요 등록

### 6-4. 지도 컴포넌트 (MapView)

- **기능 세부:**
  - 매물 핀: 가격대별 색상 구분 (저: 초록, 중: 주황, 고: 빨강)
  - 구매자 위치 마커: 별도 아이콘 (사람/공장 아이콘)
  - 반경 원: 설정된 radius_km를 지도 위 반투명 원으로 시각화
  - 클러스터링: 줌아웃 시 `MarkerClusterer` 적용 (50개 이상 핀 처리)
  - InfoWindow: 핀 클릭 시 `{ 제목, 가격, 거리, 유사도 점수, 상세보기 링크 }` 팝업
  - 지도 이동 시 현재 뷰포트 내 매물 재조회 옵션 (선택적 활성화)

### 6-5. 수요 등록 화면 (DemandRegisterPage)

- **UI 흐름:**
  1. **Step 1 - 요구사항 입력:** 자연어 텍스트 입력, AI 스펙 추출 결과 미리보기 (추출된 카테고리/전압/키워드 뱃지 표시, 사용자가 수정 가능)
  2. **Step 2 - 위치 설정:** 지도에서 클릭하거나 주소 검색으로 공장 위치 핀 설정, 반경 슬라이더
  3. **Step 3 - 알림 설정:** 알림 채널 선택 (카카오알림톡 / 웹푸시), 만료 기간 설정
  4. **최종 확인:** 등록 전 요약 뷰 → 등록 완료 후 즉시 검색 결과 또는 "대기 등록 완료" 화면
- **AI 미리보기:** 텍스트 입력 후 1.5초 디바운스 → `POST /extract/spec` 호출 → 추출 결과를 인라인 칩으로 표시

### 6-6. 매물 상세 화면 (ListingDetailPage)

- **표시 내용:**
  - 이미지 갤러리 (슬라이드)
  - 정형화된 스펙 테이블 (전압, 마력/kW, 크기, 무게, 상태)
  - 원본 상세 설명 (접기/펼치기)
  - 지도 미니 뷰 (판매자 위치 핀, 내 위치 기준 거리 표시)
  - 판매자 연락 버튼 (전화 / 문의하기)
  - 유사 매물 추천 섹션 (시맨틱 유사 상위 5개)

### 6-7. 매물 등록 화면 (ListingCreatePage)

- **폼 필드:**
  - 제목, 카테고리 선택 (드롭다운 2단계)
  - 상세 설명 (자유 텍스트)
  - 스펙 직접 입력: 전압, 마력, 크기(L×W×H), 무게
  - 가격 (협의 가능 체크박스)
  - 위치 (지도 클릭 또는 주소 검색)
  - 이미지 업로드 (드래그앤드롭, 최대 10장)
  - AI 스펙 자동 추출 버튼: 상세 설명 입력 후 클릭 → 스펙 필드 자동 채우기

### 6-8. 내 수요 관리 화면 (MyDemandsPage)

- **기능:**
  - 등록된 수요 목록 (상태별 탭: 대기중/매칭완료/만료)
  - 수요별 매칭된 매물 목록 확인
  - 수요 삭제 / 조건 수정
  - 알림 채널 변경

### 6-9. 알림 센터 (NotificationCenter)

- **기능:**
  - 헤더 벨 아이콘 + 미확인 알림 뱃지
  - 드롭다운으로 최근 알림 목록 표시
  - 알림 클릭 시 해당 매물 상세로 이동
  - 웹 푸시 알림 권한 요청 UI

---

## 7. 인프라 및 배포

### 7-1. AWS 아키텍처

- **컴퓨팅:**
  - ECS Fargate: NestJS 백엔드, FastAPI AI 서비스 (별도 태스크)
  - 각 서비스 ALB(Application Load Balancer) 뒤에 배치
- **데이터:**
  - RDS for PostgreSQL (PostGIS 확장): `db.t3.medium` 이상
  - OpenSearch Managed Service: `r6g.large.search` (kNN 워크로드 최적화)
  - ElastiCache for Redis: `cache.t3.micro` (캐싱 + BullMQ)
  - S3: 매물 이미지 저장 + CloudFront CDN
- **정적 웹 호스팅:** S3 + CloudFront (React 앱 배포)
- **네트워킹:** VPC 내 Private Subnet에 DB/Cache 배치, Security Group으로 서비스 간 포트 제한

### 7-2. CI/CD 파이프라인 (GitHub Actions)

- **Workflows:**
  - `ci.yml`: PR 시 lint, type-check, unit test 실행 (pnpm turbo)
  - `deploy-staging.yml`: `develop` 브랜치 머지 시 staging 자동 배포
  - `deploy-prod.yml`: `main` 브랜치 태그(`v*.*.*`) 푸시 시 prod 배포
- **배포 단계:**
  1. Docker 이미지 빌드 → ECR 푸시
  2. DB 마이그레이션 실행 (`migrate:latest`)
  3. ECS 서비스 업데이트 (롤링 배포)
  4. 헬스체크 통과 확인

### 7-3. 모니터링 및 로깅

- **로깅:** Winston (NestJS) + structlog (FastAPI) → CloudWatch Logs
- **APM:** AWS X-Ray 트레이싱 (서비스 간 레이턴시 추적)
- **알림:** CloudWatch Alarm → SNS → 슬랙 채널 (에러율, 레이턴시 임계값)
- **비용 모니터링:** AWS Cost Explorer + 월 예산 알림 ($100 초과 시 경보)

---

## 8. 테스트 및 품질 보증

### 8-1. 단위 테스트

- **NestJS:** Jest + `@nestjs/testing`
  - `SearchService`: 시맨틱 검색 점수 계산 로직 (mock AI service)
  - `GeoService`: 지오코딩 캐싱 로직, 폴백 체인
  - `NotificationService`: 알림 발송 큐 Job 생성 로직
- **FastAPI:** pytest + `httpx.AsyncClient`
  - `/extract/spec`: 다양한 판매글 포맷에 대한 추출 정확도 테스트
  - `/search/semantic`: 점수 계산 로직 단위 테스트

### 8-2. 통합 테스트

- **E2E 흐름 테스트:**
  1. 수요 등록 → 스펙 추출 → 시맨틱 검색 → 매칭 결과 반환
  2. 판매글 등록 → 임베딩 생성 → 역방향 매칭 → 알림 Job 발행 확인
- **DB 통합:** testcontainers-node로 PostgreSQL/OpenSearch 실제 인스턴스 사용

### 8-3. 매칭 품질 평가 (Offline Evaluation)

- **데이터셋 구성:**
  - 실제 자산거래중개장터 데이터 중 실제 거래 성사 사례 수집 (레이블)
  - 구매 수요 텍스트 샘플 20~50건 수작업 작성
- **지표:**
  - Precision@5, Recall@10: 상위 결과 내 관련 매물 비율
  - MRR (Mean Reciprocal Rank): 첫 번째 관련 매물 순위
  - 거리 필터 정확도: 설정 반경 초과 매물 노출 건수 (0이어야 함)
- **주기:** 모델/프롬프트 변경 시마다 평가 스크립트 실행

### 8-4. 성능 테스트

- **도구:** k6
- **시나리오:**
  - 동시 사용자 50명 검색 요청 → p99 레이턴시 3초 이내 목표
  - 크롤링 배치 100건 임베딩 처리 → 5분 이내 완료 목표
- **병목 예상 지점:** OpenSearch k-NN 쿼리 레이턴시, Cohere API 호출 레이턴시

---

## 구현 우선순위 로드맵

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| **Phase 1 — 기반** | 1~2주 | 모노레포 설정, DB 스키마, Docker Compose, 크롤러 기본형 |
| **Phase 2 — AI 코어** | 3~4주 | FastAPI 임베딩/추출/검색 서비스, OpenSearch 인덱스, 스펙 추출 배치 |
| **Phase 3 — 백엔드** | 5~6주 | NestJS 전 모듈 구현, 알림 큐, 역방향 매칭 파이프라인 |
| **Phase 4 — 프론트** | 7~8주 | React 검색/지도/수요등록 화면, 카카오 지도 연동 |
| **Phase 5 — 통합·배포** | 9~10주 | AWS 인프라, CI/CD, 성능 테스트, 품질 평가 |

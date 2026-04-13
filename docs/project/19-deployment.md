# 배포 인프라

## 목적
Cloudflare Pages와 Workers로 배포할 때 어떤 경로와 바인딩을 써야 하는지 한곳에 모은다.

## 배포 경로
- 프론트엔드는 Cloudflare Pages로 배포한다.
- 백엔드는 Cloudflare Workers로 배포한다.
- 프론트 빌드 결과는 `frontend/dist`를 사용한다.
- 백엔드는 `backend/wrangler.jsonc`를 기준으로 배포한다.

## 환경 구분
- `development`
  - 로컬 개발
  - `frontend`는 Vite dev 서버를 사용한다.
  - `backend`는 `wrangler dev`를 사용한다.
- `dev`
  - Cloudflare Workers의 top-level 설정과 같은 기준이다.
  - 로컬 개발과 같은 `API_ORIGIN` 및 OLLAMA 주소를 사용한다.
- `staging`
  - 배포 전 검증용
  - Pages와 Workers를 운영과 분리된 도메인으로 둔다.
- `production`
  - 실제 사용자 트래픽
  - Pages와 Workers를 운영 도메인으로 연결한다.

## 바인딩 규칙
- D1 바인딩 이름은 `DB`를 사용한다.
- R2 바인딩 이름은 `ASSETS`를 사용한다.
- `Ollama` 연결 값은 `MYWAY_OLLAMA_BASE_URL`, `MYWAY_OLLAMA_MODEL`로 둔다.
- `dev` 환경만 `Ollama`를 사용하고, `staging`/`production`은 `Gemini`와 `Cloudflare AI`를 우선 사용한다.
- `MYWAY_GEMINI_API_KEY`는 vars가 아니라 secret으로 둔다.
- 외부 오디오 추출 서비스 값은 `MYWAY_MEDIA_PROCESSOR_URL`만 vars로 두고, `MYWAY_MEDIA_PROCESSOR_TOKEN`, `MYWAY_MEDIA_CALLBACK_SECRET`는 secret으로 둔다.
- 프론트가 API를 호출해야 하면 `API_ORIGIN`을 환경별로 맞춘다.
- 프론트 Pages에는 `VITE_API_BASE_URL`을 두고 Workers API 주소를 주입한다.
- 로컬 개발에서는 `npm run dev:media-processor`로 TypeScript 기반 media processor를 같이 띄운다.
- 로컬 개발에서는 backend dev server가 파일 기반 `ASSETS` 폴백을 사용해서 media processor가 같은 파일을 다시 내려받을 수 있게 한다.
- media processor는 `ffmpeg-static` 번들을 우선 사용하고, `FFMPEG_PATH`가 있으면 그 경로를 우선한다.
- 운영/배포 환경에서는 media processor 실행 환경에 실제 `ffmpeg`가 있거나 `ffmpeg-static`으로 해결되어야 한다.

## Secret 설정
배포 전에 민감정보는 모두 `wrangler secret put`으로 넣는다.

- `MYWAY_GEMINI_API_KEY`
- `MYWAY_MEDIA_PROCESSOR_TOKEN`
- `MYWAY_MEDIA_CALLBACK_SECRET`
- `FFMPEG_PATH`는 필요 시 media processor 호스트에서만 조정한다.

## 배포 순서
1. Cloudflare에서 D1과 R2를 만든다.
2. 백엔드 워커에 `DB`와 `ASSETS`를 바인딩한다.
3. `wrangler secret put`으로 `MYWAY_GEMINI_API_KEY`, `MYWAY_MEDIA_PROCESSOR_TOKEN`, `MYWAY_MEDIA_CALLBACK_SECRET`를 넣는다.
4. `backend/wrangler.jsonc`의 `dev`, `staging`, `production` 환경 변수 값을 확인하고 채운다.
5. 외부 media processor에 callback URL과 `MYWAY_MEDIA_CALLBACK_SECRET`을 같은 값으로 맞춘다.
6. Pages 프로젝트에 `VITE_API_BASE_URL`을 Workers API 주소로 넣는다.
7. `npm run build:frontend`와 `npm run build:backend`를 확인한다.
8. Pages에 `frontend/dist`를 연결한다.
9. Workers에 `backend/src/index.ts`를 연결한다.

## 로컬 실행 기준
1. `npm run dev:media-processor`
2. 별도 터미널에서 `npm run dev:backend`
3. 별도 터미널에서 `npm run dev:frontend`
4. `ffmpeg -version` 또는 `npm run dev:media-processor`의 헬스 체크에서 ffmpeg 사용 가능 여부를 확인한다.

## 검증 기준
- Pages와 Workers의 배포 경로가 문서와 일치한다.
- 개발, 스테이징, 운영 환경에서 바인딩 이름이 흔들리지 않는다.
- 실제 엔진 URL과 모델 이름은 환경 변수로만 바꿀 수 있다.
- 공개 테스트 환경에서는 provider 진단 API가 실제 runtime policy를 보여준다.

## 변경 시 함께 볼 파일
- `backend/wrangler.jsonc`
- `docs/project/00-index.md`
- `docs/project/01-tech-stack.md`
- `docs/project/02-architecture.md`

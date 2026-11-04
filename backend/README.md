# 정옥순 할매 AI 상담 백엔드 설치 안내

현재 GitHub Pages에는 상담 입력 화면이 준비됐어. 여기에는 실제 OpenAI API를 호출하는 Worker 서버 소스가 있어. 단, 아직 서버를 배포하지 않았고 API 비밀키도 연결하지 않았으므로 사이트의 질문 제출 버튼은 비활성화돼 있어. 실제 AI인 척 미리 작성된 답을 보여주지 않아.

## 3가지 상품 종류 (가격 전부 미정)
1. 추가 상담권 — 무료 질문 1회 후 대화 이어가기
2. 2027년 전체 사주풀이 — 별도 종합 상품
3. 분야별 풀이 — 재물, 직업/사업, 연애/결혼, 가족/관계, 월별 운세, 전생 이야기 각각 별도 상품

## Cloudflare 설정 순서
1. Cloudflare 계정에서 D1 데이터베이스 oksoon-chat 생성.
2. backend/schema.sql 파일을 D1에 적용. 명령 예: npx wrangler d1 execute oksoon-chat --remote --file=backend/schema.sql
3. backend/src/index.js를 Cloudflare Worker로 배포. D1 바인딩 이름은 반드시 DB.
4. Worker의 비밀 변수 OPENAI_API_KEY를 설정. 깃허브 또는 config.js에는 절대 적지 말 것.
5. 일반 환경 변수 OPENAI_MODEL은 모델 접근 권한에 맞춰 설정. 미설정 시 gpt-5-mini 사용.
6. GitHub Pages의 config.js에서 window.OKSOON_CHAT_API에 Worker HTTPS 주소 입력.
7. 실제 휴대폰에서 생년월일 입력, 무료 질문 1회, 재질문 차단, 새로고침 뒤 횟수 유지까지 검증.

## 현재 무료 회수 제한의 범위
D1에서 익명 세션당 1회 차감하도록 구현했어. 방문자 한 명당 평생 1회가 아냐. 브라우저 저장소를 삭제하거나 다른 기기를 쓰면 새 세션을 얻을 수 있어. 상용화 전에 회원 인증 또는 전화 인증, Cloudflare Turnstile, 서버 측 rate limit과 결제 검증이 필요해.

## 개인정보 및 응답 정확성
D1에서 익명 세션 ID, 질문과 답변을 저장한다. 출시 전에 적절한 개인정보 처리방침, 보유기간, 데이터 삭제 체계, API 예산 상한, 남용 방지가 필요하다. 자동 만세력 간지는 현재 브라우저 계산 값이며 서버에서 추가 검증하지 않는다. 명리 해석은 상징적인 관점이지 미래의 사건이나 건강 진단을 입증하지 않는다.

## API
POST /api/session — JSON body {sessionId?: string}; 응답 {sessionId, remaining}.
POST /api/chat — JSON body {sessionId, question, chart, clientContext, confirmedPreference}; 응답 {answer, remaining:0} 또는 402 FREE_LIMIT.
현재는 무료 1회 외 유료 상담권 발급이나 PG 웹훅이 없다. 가격이 정해지기 전까지 결제는 비활성화한다.

공식 API 문서: https://developers.openai.com/api/reference/resources/responses/methods/create
Cloudflare D1 문서: https://developers.cloudflare.com/d1/get-started/

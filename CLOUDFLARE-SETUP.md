# 정옥순 할매 실제 AI 상담 연결하기

## 현재 상태
GitHub Pages의 상담 화면 및 Cloudflare Worker + D1 백엔드 코드는 준비됐지만 **Cloudflare 계정에 아직 배포되지 않았습니다.** 다음 설정을 끝내야 고객이 실제 AI 답변을 받습니다.

## Cloudflare 무료 플랜으로 설정하기

1. Cloudflare 계정 만들기 또는 로그인: https://dash.cloudflare.com/
2. Workers & Pages → D1에서 **oksoon-chat** 데이터베이스 생성. 생성된 데이터베이스 ID 복사.
3. Cloudflare → My Profile → API Tokens → Create Token에서 Workers/D1 배포에 필요한 최소 권한의 API 토큰 만들기. 별도로 Account ID도 확인.
4. GitHub 저장소 https://github.com/nohseongeun/unmyeongseo-2027/settings/secrets/actions 에서 아래 3개를 **Repository secrets**로 등록:
   - CLOUDFLARE_API_TOKEN — Cloudflare API 토큰
   - CLOUDFLARE_ACCOUNT_ID — Cloudflare Account ID
   - OPENAI_API_KEY — OpenAI API 비밀키
5. GitHub 저장소 Settings → Secrets and variables → Actions → **Variables** 탭에서 CF_DATABASE_ID에 D1 데이터베이스 ID 등록.
6. GitHub → Actions → **Deploy Oksoon AI chat server** → Run workflow 버튼으로 배포. D1 테이블 생성과 Worker 배포를 자동으로 실행합니다.
7. Cloudflare에서 발급된 https://...workers.dev Worker URL을 확인한 후 GitHub의 `config.js`에서 `window.OKSOON_API_ORIGIN`에 해당 URL 입력. 이 주소는 공개 URL이며 비밀키가 아닙니다.
8. 실제 GitHub Pages 사이트에서 생년월일 입력 → 할매에게 1회 질문 → AI 답변 수신 → 두 번째 질문 차단 확인.

## 필수 주의사항
- **비밀키를 채팅이나 사이트 index.html/config.js에 절대 적지 마세요.** GitHub Repository secrets 또는 Cloudflare Worker secrets에만 저장하세요.
- Cloudflare 무료 할당량과 별개로 OpenAI API 사용료는 발생할 수 있습니다.
- 이 테스트 서버는 익명 **세션당 1회**만 제한합니다. 사용자가 다른 기기에서 새 세션을 만들 수 있기 때문에, 실제 인스타 광고로 트래픽을 받기 전에는 로그인/휴대폰 인증, Cloudflare Turnstile, 서버측 요청 제한, AI 예산 보호, 개인정보 보관기간 정책 및 결제 권한 검증이 필요합니다.
- 추가 상담권, 전체 사주풀이, 분야별 상품은 아직 결제되지 않으며, AI 무료 1회를 초과하면 준비 중 안내가 나옵니다.
- 만세력 계산은 아직 프런트엔드에서 하므로 실제 유료 서비스 전에는 계산 정확도와 서버 검증을 보완해야 합니다.

고객에게 제공하는 정옥순 할매는 창작 캐릭터이고, 사주풀이는 전통 명리의 상징적 해석이며 미래 사건을 보증하지 않습니다.

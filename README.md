# 2026 경제 모의주식투자 게임 (KSE)

## 📌 프로젝트 소개

미국-이란 전쟁을 배경으로 한 **5라운드 경제 모의주식투자 게임**입니다. 토스증권 스타일의 UI로 제작되었으며, 10개 기업의 주가 변동을 예측하고 매수/매도하여 최대 수익을 목표로 하는 게임입니다.

---

## 🎮 게임 특징

### 핵심 기능
- **10개 기업**: 에너지, 항공, 방산, 물류, IT, 금융, 바이오, 전기차, 건설, 식품
- **5라운드 시나리오**: 미국-이란 전쟁의 전개 과정에 따른 주가 변동
- **실시간 차트**: Chart.js를 이용한 라운드별 주가 흐름 시각화
- **매수/매도**: 원하는 수량으로 주식 거래 가능
- **자산 관리**: 보유 현금, 총 자산, 수익률 실시간 계산
- **포트폴리오**: 보유 중인 주식 현황 확인
- **랭킹 시스템**: 게임 종료 후 최종 자산 순위 저장
- **관리자 페이지**: 라운드 제어, 주가 조정, 뉴스 커스터마이징

### 기술 스택
- **HTML5**: 시맨틱 마크업
- **CSS3**: 토스증권 스타일 반응형 디자인
- **JavaScript (Vanilla)**: 게임 로직 및 상태 관리
- **Chart.js**: 주가 차트 시각화
- **LocalStorage**: 게임 데이터 자동 저장

---

## 📂 파일 구조

```
stock-game/
├── index.html          # 메인 게임 페이지
├── admin.html          # 관리자 페이지
├── style.css           # 게임 스타일
├── script.js           # 게임 로직
├── admin.js            # 관리자 로직
├── data.js             # 게임 데이터 (기업, 시나리오)
└── README.md           # 이 파일
```

---

## 🚀 배포 방법

### 방법 1: GitHub Pages (무료, 권장)

#### 1단계: GitHub 저장소 생성
1. [GitHub](https://github.com)에 로그인
2. 새 저장소 생성 (이름: `stock-game`)
3. Public으로 설정

#### 2단계: 파일 업로드
```bash
git clone https://github.com/[YOUR_USERNAME]/stock-game.git
cd stock-game
# 모든 파일 복사
git add .
git commit -m "Initial commit: Stock game project"
git push origin main
```

#### 3단계: GitHub Pages 활성화
1. 저장소 Settings → Pages
2. Source: `main` 브랜치 선택
3. 저장

#### 4단계: 사이트 접속
```
https://[YOUR_USERNAME].github.io/stock-game/
```

---

### 방법 2: Netlify (무료, 매우 간편)

#### 1단계: Netlify 가입
1. [Netlify](https://www.netlify.com)에 접속
2. GitHub 계정으로 로그인

#### 2단계: 사이트 배포
1. "New site from Git" 클릭
2. GitHub 저장소 선택 (`stock-game`)
3. 배포 시작

#### 3단계: 사이트 접속
```
https://[YOUR_SITE_NAME].netlify.app/
```

---

### 방법 3: Vercel (무료, 매우 빠름)

#### 1단계: Vercel 가입
1. [Vercel](https://vercel.com)에 접속
2. GitHub 계정으로 로그인

#### 2단계: 프로젝트 임포트
1. "Import Project" 클릭
2. GitHub 저장소 선택
3. 배포

#### 3단계: 사이트 접속
```
https://stock-game-[RANDOM].vercel.app/
```

---

### 방법 4: 로컬 호스팅 (학교 서버 등)

#### Python 사용
```bash
cd stock-game
python3 -m http.server 8000
```

#### Node.js 사용
```bash
npm install -g http-server
cd stock-game
http-server
```

---

## 🎮 게임 플레이 방법

### 메인 게임 (`index.html`)

1. **게임 시작**: 초기 자본 1억 원으로 시작
2. **주식 선택**: 10개 기업 중 원하는 종목 클릭
3. **매수/매도**:
   - 수량 입력
   - "매수" 또는 "매도" 버튼 클릭
4. **라운드 진행**: 각 라운드마다 시나리오에 따라 주가 변동
5. **포트폴리오**: "내 주식" 탭에서 보유 종목 확인
6. **게임 종료**: 5라운드 완료 후 최종 자산 저장

### 관리자 페이지 (`admin.html`)

- **라운드 제어**: 다음 라운드 진행 또는 특정 라운드로 이동
- **주가 조정**: 특정 기업의 주가 수동 조정
- **자산 조정**: 플레이어 현금 조정
- **뉴스 커스터마이징**: 각 라운드 뉴스 변경
- **랭킹 조회**: 모든 플레이어의 최종 자산 확인

---

## 📊 5라운드 시나리오

| 라운드 | 제목 | 주요 뉴스 | 영향 받는 주식 |
|--------|------|---------|--------------|
| 1 | 전운이 감도는 호르무즈 | 미국-이란 외교 결렬 | 유가 상승, 방산주 강세 |
| 2 | 국지전 발발 | 미군 핵시설 타격 | 유가 폭등, 항공주 폭락 |
| 3 | 호르무즈 해협 봉쇄 | 이란 기뢰 부설 | 물류 마비, 식품주 강세 |
| 4 | 휴전 협상 시작 | UN 중재 개시 | 시장 급반등, 성장주 회복 |
| 5 | 전쟁 종결 및 재건 | 공식 휴전 협정 | 건설주 폭등 |

---

## 💾 데이터 저장

모든 게임 데이터는 **브라우저 LocalStorage**에 자동 저장됩니다:
- `gameState`: 현재 게임 상태 (자산, 주식 보유, 라운드 등)
- `gameRanking`: 완료된 게임 랭킹

페이지를 새로고침해도 진행 상황이 유지됩니다.

---

## 🔧 커스터마이징

### 초기 자본 변경
`data.js`에서:
```javascript
const initialData = {
    balance: 100000000, // 이 값 변경
    ...
};
```

### 기업 추가/변경
`data.js`의 `stocks` 배열 수정:
```javascript
{ 
    id: 11, 
    name: "새로운기업", 
    code: "999999", 
    category: "카테고리", 
    basePrice: 50000, 
    description: "설명" 
}
```

### 시나리오 변경
`data.js`의 `scenarios` 배열 수정:
```javascript
{
    round: 1,
    title: "새로운 제목",
    news: "새로운 뉴스",
    changes: { /* 주가 변동 */ }
}
```

---

## 🐛 트러블슈팅

### 게임 데이터가 초기화되는 경우
- 브라우저 캐시 삭제
- 개발자 도구 → Application → LocalStorage 확인

### 주가 차트가 표시되지 않는 경우
- Chart.js CDN 연결 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 관리자 페이지에 접속할 수 없는 경우
- `admin.html` 파일이 같은 디렉토리에 있는지 확인
- 서버 재시작

---

## 📝 라이선스

이 프로젝트는 교육 목적으로 자유롭게 사용, 수정, 배포할 수 있습니다.

---

## 📧 문의

게임 개선 사항이나 버그 리포트는 이슈로 등록해 주세요.

---

**Happy Trading! 🚀📈**

/* 실시간 멀티플레이어 주식 게임 데이터 - 100% 완성본 */

// Firebase 설정 (무료 테스트용 프로젝트 설정)
const firebaseConfig = {
    databaseURL: "https://stock-game-2026-default-rtdb.firebaseio.com"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const initialData = {
    balance: 100000000,
    stocks: [
        { id: 1, name: "페트로맥스", code: "001230", basePrice: 100000 },
        { id: 2, name: "스카이항공", code: "005670", basePrice: 80000 },
        { id: 3, name: "K-디펜스", code: "010220", basePrice: 150000 },
        { id: 4, name: "글로벌해운", code: "023450", basePrice: 50000 },
        { id: 5, name: "미래반도체", code: "000660", basePrice: 120000 },
        { id: 6, name: "골드뱅크", code: "055550", basePrice: 45000 },
        { id: 7, name: "바이오넥스트", code: "207940", basePrice: 300000 },
        { id: 8, name: "에코배터리", code: "373220", basePrice: 250000 },
        { id: 9, name: "안전자산건설", code: "000720", basePrice: 30000 },
        { id: 10, name: "푸드월드", code: "097950", basePrice: 20000 }
    ],
    scenarios: [
        { round: 1, news: "미국-이란 외교 결렬, 호르무즈 해협 긴장 고조" },
        { round: 2, news: "미군, 이란 핵시설 정밀 타격 발표. 유가 폭등" },
        { round: 3, news: "이란, 호르무즈 해협 전면 봉쇄 선언" },
        { round: 4, news: "UN 중재 및 휴전 협상 시작 소식" },
        { round: 5, news: "공식 휴전 협정 체결 및 중동 재건 사업 발표" }
    ]
};

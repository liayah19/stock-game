/* ============================================================
   전쟁과 주식 - 모의 투자 게임
   app.js  (순수 Vanilla JS, localStorage 기반)
   ============================================================ */

'use strict';

// ── 상수 ──────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'kdh1304!';
const INITIAL_CASH   = 1_000_000;
const TOTAL_ROUNDS   = 5;
const STORAGE_KEY    = 'war_stock_game_v1';

// ── 기본 데이터 ────────────────────────────────────────────────
const DEFAULT_COMPANIES = [
  { id:1,  name:'록히드 마틴 (방산)',    price:100000, description:'미국의 대표적인 방위산업체로, 전쟁 특수를 직접적으로 받는 기업입니다.' },
  { id:2,  name:'레이시온 (방산)',       price: 80000, description:'미사일 및 방공 시스템 전문 기업. 분쟁 시 수혜가 기대됩니다.' },
  { id:3,  name:'엑슨모빌 (에너지)',     price:120000, description:'글로벌 에너지 및 석유 기업. 중동 분쟁 시 유가 상승 수혜주.' },
  { id:4,  name:'셰브론 (에너지)',       price:110000, description:'다국적 에너지 기업. 호르무즈 해협 긴장 시 주목받는 종목.' },
  { id:5,  name:'테슬라 (전기차)',       price:200000, description:'전기차 및 청정에너지 기업. 유가 상승 시 반사이익 가능.' },
  { id:6,  name:'애플 (IT)',            price:150000, description:'글로벌 IT 기업. 전쟁 불확실성에 따른 소비 위축 영향을 받습니다.' },
  { id:7,  name:'마이크로소프트 (IT)',   price:250000, description:'소프트웨어·클라우드 서비스 기업. 사이버전 수요 증가 가능성.' },
  { id:8,  name:'보잉 (항공/방산)',      price:180000, description:'항공기 제조 및 방산 기업. 군용기 수요 증가 시 수혜 기대.' },
  { id:9,  name:'JP모건 (금융)',         price:130000, description:'글로벌 금융 서비스 기업. 지정학적 불안 시 금융시장 변동성 확대.' },
  { id:10, name:'화이자 (제약)',         price: 50000, description:'글로벌 제약 회사. 전쟁 부상자 증가 시 의약품 수요 상승 가능.' }
];

const DEFAULT_ROUNDS = [
  {
    round: 1,
    news: '🚨 [속보] 호르무즈 해협에서 이란 혁명수비대가 미국 유조선을 나포했습니다. 미국은 즉각 항의하며 군사적 대응을 검토 중이라고 밝혔습니다. 국제 유가가 배럴당 5달러 급등했습니다.',
    effects: { 1:1.10, 2:1.10, 3:1.15, 4:1.15, 5:0.95, 6:0.97, 7:0.98, 8:1.05, 9:0.90, 10:1.02 }
  },
  {
    round: 2,
    news: '⚡ [긴급] 미국 정부가 이란에 대한 2차 경제 제재를 발동했습니다. 이란산 원유 수출이 전면 금지되며 국제 유가가 추가 상승했습니다. 중동 지역 긴장이 최고조에 달하고 있습니다.',
    effects: { 1:1.05, 2:1.08, 3:1.20, 4:1.18, 5:0.90, 6:0.93, 7:0.95, 8:1.03, 9:0.85, 10:1.00 }
  },
  {
    round: 3,
    news: '💥 [전쟁 발발] 이란이 이라크 내 미군 기지에 탄도미사일 공격을 감행했습니다! 미국은 즉각 반격을 선언하며 전면전 상태에 돌입했습니다. 글로벌 금융시장이 패닉 상태에 빠졌습니다.',
    effects: { 1:1.30, 2:1.28, 3:1.25, 4:1.22, 5:0.80, 6:0.82, 7:0.85, 8:1.20, 9:0.70, 10:1.08 }
  },
  {
    round: 4,
    news: '🕊️ [평화 신호] UN 안전보장이사회가 긴급 회의를 소집하고 양국에 즉각 교전 중단을 촉구했습니다. 미국과 이란이 스위스 제네바에서 비밀 협상을 시작했다는 소식이 전해졌습니다.',
    effects: { 1:0.82, 2:0.80, 3:0.87, 4:0.88, 5:1.18, 6:1.15, 7:1.12, 8:0.90, 9:1.20, 10:0.98 }
  },
  {
    round: 5,
    news: '🌐 [평화 협정] 미국과 이란이 카타르 도하에서 역사적인 평화 협정에 서명했습니다! 국제 유가가 급락하고 글로벌 증시가 일제히 반등하며 세계 경제 회복에 대한 기대감이 높아지고 있습니다.',
    effects: { 1:0.72, 2:0.70, 3:0.80, 4:0.82, 5:1.28, 6:1.25, 7:1.22, 8:0.78, 9:1.30, 10:1.00 }
  }
];

// ── 상태 ───────────────────────────────────────────────────────
let state = loadState();

function defaultState() {
  return {
    currentRound: 0,          // 0 = 게임 시작 전(대기)
    roundStarted: false,      // 관리자가 현재 라운드를 시작했는지
    companies: JSON.parse(JSON.stringify(DEFAULT_COMPANIES)),
    rounds: JSON.parse(JSON.stringify(DEFAULT_ROUNDS)),
    users: [],                // [{ name, cash, holdings:{id:qty}, trades:[...], joinedRound }]
    priceHistory: {}          // { companyId: [price_r0, price_r1, ...] }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── 현재 유저 (세션) ───────────────────────────────────────────
let currentUser = null; // 인덱스 (state.users 배열 내)
let modalMode   = 'buy';
let modalCompanyId = null;

// ── 화면 전환 ──────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── 가격 계산 ──────────────────────────────────────────────────
function getCompanyPrice(companyId, round) {
  // round 0 = 초기가
  const company = state.companies.find(c => c.id === companyId);
  if (!company) return 0;
  if (round === 0) return company.price;
  let price = company.price;
  for (let r = 1; r <= round; r++) {
    const roundData = state.rounds[r - 1];
    if (roundData && roundData.effects && roundData.effects[companyId]) {
      price = Math.round(price * roundData.effects[companyId]);
    }
  }
  return price;
}

function getCurrentPrice(companyId) {
  return getCompanyPrice(companyId, state.currentRound);
}

function getPrevPrice(companyId) {
  if (state.currentRound <= 0) return getCompanyPrice(companyId, 0);
  return getCompanyPrice(companyId, state.currentRound - 1);
}

// ── 숫자 포맷 ──────────────────────────────────────────────────
function fmt(n) {
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

function fmtRate(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(1) + '%';
}

// ── 초기화 ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // 로딩 화면 → 이름 입력 화면
  setTimeout(() => {
    showScreen('screen-name');
  }, 1800);

  bindEvents();
});

function bindEvents() {
  // 이름 입력 → 게임 시작
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('player-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') startGame();
  });

  // 관리자 패널 이동
  document.getElementById('goto-admin-btn').addEventListener('click', () => showScreen('screen-admin-login'));

  // 관리자 로그인
  document.getElementById('admin-login-btn').addEventListener('click', adminLogin);
  document.getElementById('admin-pw-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });
  document.getElementById('admin-back-btn').addEventListener('click', () => {
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-pw-error').style.display = 'none';
    showScreen('screen-name');
  });

  // 관리자 로그아웃
  document.getElementById('admin-logout-btn').addEventListener('click', () => showScreen('screen-name'));

  // 관리자 탭
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-companies') renderAdminCompanies();
      if (btn.dataset.tab === 'tab-users') renderAdminUsers();
    });
  });

  // 관리자 라운드 버튼
  document.getElementById('admin-start-round-btn').addEventListener('click', adminStartRound);
  document.getElementById('admin-next-round-btn').addEventListener('click', adminNextRound);
  document.getElementById('admin-reset-game-btn').addEventListener('click', adminResetGame);
  document.getElementById('admin-save-news-btn').addEventListener('click', adminSaveNews);

  // 다음 라운드 (유저)
  document.getElementById('next-round-btn').addEventListener('click', userNextRound);

  // 재시작
  document.getElementById('restart-btn').addEventListener('click', () => {
    currentUser = null;
    showScreen('screen-name');
    document.getElementById('player-name-input').value = '';
  });

  // 모달 취소
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-btn').addEventListener('click', confirmTrade);
  document.getElementById('modal-qty').addEventListener('input', updateModalCost);
  document.getElementById('trade-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('trade-modal')) closeModal();
  });
}

// ── 게임 시작 ──────────────────────────────────────────────────
function startGame() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--red)';
    setTimeout(() => nameInput.style.borderColor = '', 1500);
    return;
  }

  // 기존 유저 찾기 (같은 이름)
  let userIdx = state.users.findIndex(u => u.name === name);
  if (userIdx === -1) {
    state.users.push({
      name,
      cash: INITIAL_CASH,
      holdings: {},
      trades: [],
      joinedRound: state.currentRound
    });
    userIdx = state.users.length - 1;
    saveState();
  }
  currentUser = userIdx;

  renderGame();
  showScreen('screen-game');
}

// ── 게임 화면 렌더 ─────────────────────────────────────────────
function renderGame() {
  if (currentUser === null) return;
  const user = state.users[currentUser];

  // 헤더
  document.getElementById('player-display').textContent = user.name + ' 님';
  document.getElementById('cash-display').textContent = fmt(user.cash);
  document.getElementById('round-badge').textContent = `라운드 ${state.currentRound} / ${TOTAL_ROUNDS}`;

  // 대기 중 vs 게임 진행 중
  const waiting = document.getElementById('waiting-msg');
  const stockGrid = document.getElementById('stock-grid');
  const nextBtn = document.getElementById('next-round-btn');
  const portfolioSection = document.querySelector('.portfolio-section');

  if (state.currentRound === 0 || !state.roundStarted) {
    // 대기 중
    waiting.style.display = 'flex';
    stockGrid.style.display = 'none';
    portfolioSection.style.display = 'none';
    nextBtn.style.display = 'none';
    document.getElementById('news-banner').style.display = 'none';
  } else {
    waiting.style.display = 'none';
    stockGrid.style.display = 'grid';
    portfolioSection.style.display = 'block';
    nextBtn.style.display = 'block';
    document.getElementById('news-banner').style.display = 'flex';

    // 뉴스
    const roundData = state.rounds[state.currentRound - 1];
    document.getElementById('news-text').textContent = roundData ? roundData.news : '';

    // 주식 그리드
    renderStockGrid();

    // 포트폴리오
    renderPortfolio();

    // 마지막 라운드 완료 후
    if (state.currentRound >= TOTAL_ROUNDS && !state.roundStarted) {
      nextBtn.textContent = '결과 보기';
    } else {
      nextBtn.textContent = '다음 라운드로 →';
    }
  }

  // 폴링: 상태 변경 감지 (1.5초마다)
  clearInterval(window._pollInterval);
  window._pollInterval = setInterval(() => {
    const fresh = loadState();
    if (
      fresh.currentRound !== state.currentRound ||
      fresh.roundStarted !== state.roundStarted
    ) {
      state = fresh;
      // 유저 데이터 동기화
      renderGame();
    }
  }, 1500);
}

function renderStockGrid() {
  if (currentUser === null) return;
  const user = state.users[currentUser];
  const grid = document.getElementById('stock-grid');
  grid.innerHTML = '';

  state.companies.forEach(company => {
    const curPrice = getCurrentPrice(company.id);
    const prevPrice = getPrevPrice(company.id);
    const change = ((curPrice - prevPrice) / prevPrice * 100);
    const held = user.holdings[company.id] || 0;

    const card = document.createElement('div');
    card.className = 'stock-card';
    card.innerHTML = `
      <div class="stock-name">${company.name}</div>
      <div class="stock-desc">${company.description}</div>
      <div class="stock-price">${fmt(curPrice)}</div>
      <div class="stock-change ${change >= 0 ? 'up' : 'down'}">
        ${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%
        ${state.currentRound > 1 ? `(전 라운드 대비)` : '(기준가)'}
      </div>
      ${held > 0 ? `<div class="stock-held">보유: ${held}주</div>` : ''}
      <div class="trade-btns">
        <button class="btn-buy" onclick="openModal(${company.id}, 'buy')">매수</button>
        <button class="btn-sell" onclick="openModal(${company.id}, 'sell')">매도</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderPortfolio() {
  if (currentUser === null) return;
  const user = state.users[currentUser];
  const list = document.getElementById('portfolio-list');
  const entries = Object.entries(user.holdings).filter(([,qty]) => qty > 0);

  if (entries.length === 0) {
    list.innerHTML = '<p class="empty-msg">보유 주식이 없습니다.</p>';
    return;
  }

  list.innerHTML = '';
  entries.forEach(([idStr, qty]) => {
    const id = parseInt(idStr);
    const company = state.companies.find(c => c.id === id);
    if (!company) return;
    const curPrice = getCurrentPrice(id);
    const avgBuy = getAvgBuyPrice(user, id);
    const curValue = curPrice * qty;
    const profit = avgBuy > 0 ? ((curPrice - avgBuy) / avgBuy * 100) : 0;

    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.innerHTML = `
      <div class="portfolio-item-left">
        <div class="p-name">${company.name}</div>
        <div class="p-qty">${qty}주 · 평균매수 ${fmt(avgBuy)}</div>
      </div>
      <div class="portfolio-item-right">
        <div class="p-value">${fmt(curValue)}</div>
        <div class="p-profit ${profit >= 0 ? 'profit-up' : 'profit-down'}">${fmtRate(profit)}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function getAvgBuyPrice(user, companyId) {
  const buyTrades = user.trades.filter(t => t.type === 'buy' && t.companyId === companyId);
  if (buyTrades.length === 0) return 0;
  const totalCost = buyTrades.reduce((s, t) => s + t.price * t.qty, 0);
  const totalQty  = buyTrades.reduce((s, t) => s + t.qty, 0);
  return totalQty > 0 ? totalCost / totalQty : 0;
}

// ── 유저 다음 라운드 ───────────────────────────────────────────
function userNextRound() {
  if (state.currentRound >= TOTAL_ROUNDS) {
    showResult();
    return;
  }
  // 관리자가 다음 라운드를 시작할 때까지 대기
  state.roundStarted = false;
  renderGame();
}

// ── 결과 화면 ──────────────────────────────────────────────────
function showResult() {
  if (currentUser === null) return;
  clearInterval(window._pollInterval);
  const user = state.users[currentUser];

  // 보유 주식 청산 가치
  let stockValue = 0;
  Object.entries(user.holdings).forEach(([idStr, qty]) => {
    stockValue += getCurrentPrice(parseInt(idStr)) * qty;
  });
  const total = user.cash + stockValue;
  const rate  = ((total - INITIAL_CASH) / INITIAL_CASH * 100);

  document.getElementById('result-player-name').textContent = user.name + ' 님의 최종 결과';
  document.getElementById('result-total').textContent = fmt(total);
  const rateEl = document.getElementById('result-rate');
  rateEl.textContent = fmtRate(rate);
  rateEl.style.color = rate >= 0 ? 'var(--green)' : 'var(--red)';

  // 포트폴리오 요약
  const pfDiv = document.getElementById('result-portfolio');
  const entries = Object.entries(user.holdings).filter(([,qty]) => qty > 0);
  if (entries.length > 0) {
    let html = '<h4>보유 주식 (청산 기준)</h4>';
    entries.forEach(([idStr, qty]) => {
      const id = parseInt(idStr);
      const company = state.companies.find(c => c.id === id);
      const val = getCurrentPrice(id) * qty;
      html += `<div class="portfolio-item" style="margin-bottom:0.4rem;">
        <div class="portfolio-item-left"><div class="p-name">${company ? company.name : id}</div><div class="p-qty">${qty}주</div></div>
        <div class="portfolio-item-right"><div class="p-value">${fmt(val)}</div></div>
      </div>`;
    });
    pfDiv.innerHTML = html;
  } else {
    pfDiv.innerHTML = '';
  }

  showScreen('screen-result');
}

// ── 거래 모달 ──────────────────────────────────────────────────
window.openModal = function(companyId, mode) {
  if (currentUser === null) return;
  const user = state.users[currentUser];
  const company = state.companies.find(c => c.id === companyId);
  if (!company) return;

  modalMode = mode;
  modalCompanyId = companyId;

  const price = getCurrentPrice(companyId);
  const held  = user.holdings[companyId] || 0;

  document.getElementById('modal-company-name').textContent = company.name;
  document.getElementById('modal-price').textContent = fmt(price);
  document.getElementById('modal-cash').textContent  = fmt(user.cash);
  document.getElementById('modal-held').textContent  = held;
  document.getElementById('modal-qty').value = '';
  document.getElementById('modal-total-cost').textContent = '';
  document.getElementById('modal-error').style.display = 'none';

  switchModalTab(mode);
  document.getElementById('trade-modal').style.display = 'flex';
  document.getElementById('modal-qty').focus();
};

window.switchModalTab = function(mode) {
  modalMode = mode;
  document.getElementById('modal-buy-tab').classList.toggle('active', mode === 'buy');
  document.getElementById('modal-sell-tab').classList.toggle('active', mode === 'sell');
  document.getElementById('modal-confirm-btn').textContent = mode === 'buy' ? '매수하기' : '매도하기';
  document.getElementById('modal-confirm-btn').style.background = mode === 'buy' ? 'var(--green)' : 'var(--red)';
  updateModalCost();
};

function updateModalCost() {
  const qty = parseInt(document.getElementById('modal-qty').value) || 0;
  if (qty <= 0 || !modalCompanyId) {
    document.getElementById('modal-total-cost').textContent = '';
    return;
  }
  const price = getCurrentPrice(modalCompanyId);
  const total = price * qty;
  document.getElementById('modal-total-cost').textContent =
    (modalMode === 'buy' ? '총 매수금액: ' : '총 매도금액: ') + fmt(total);
}

function closeModal() {
  document.getElementById('trade-modal').style.display = 'none';
  modalCompanyId = null;
}

function confirmTrade() {
  if (currentUser === null || !modalCompanyId) return;
  const user = state.users[currentUser];
  const qty  = parseInt(document.getElementById('modal-qty').value);
  const errEl = document.getElementById('modal-error');
  errEl.style.display = 'none';

  if (!qty || qty <= 0) {
    errEl.textContent = '수량을 올바르게 입력하세요.';
    errEl.style.display = 'block';
    return;
  }

  const price = getCurrentPrice(modalCompanyId);
  const company = state.companies.find(c => c.id === modalCompanyId);

  if (modalMode === 'buy') {
    const cost = price * qty;
    if (cost > user.cash) {
      errEl.textContent = `잔액이 부족합니다. (필요: ${fmt(cost)}, 보유: ${fmt(user.cash)})`;
      errEl.style.display = 'block';
      return;
    }
    user.cash -= cost;
    user.holdings[modalCompanyId] = (user.holdings[modalCompanyId] || 0) + qty;
    user.trades.push({ type:'buy', companyId: modalCompanyId, companyName: company.name, qty, price, round: state.currentRound, time: Date.now() });
  } else {
    const held = user.holdings[modalCompanyId] || 0;
    if (qty > held) {
      errEl.textContent = `보유 주식이 부족합니다. (보유: ${held}주)`;
      errEl.style.display = 'block';
      return;
    }
    user.cash += price * qty;
    user.holdings[modalCompanyId] = held - qty;
    if (user.holdings[modalCompanyId] === 0) delete user.holdings[modalCompanyId];
    user.trades.push({ type:'sell', companyId: modalCompanyId, companyName: company.name, qty, price, round: state.currentRound, time: Date.now() });
  }

  saveState();
  closeModal();
  renderGame();
}

// ── 관리자 로그인 ──────────────────────────────────────────────
function adminLogin() {
  const pw = document.getElementById('admin-pw-input').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-pw-error').style.display = 'none';
    renderAdminPanel();
    showScreen('screen-admin');
  } else {
    document.getElementById('admin-pw-error').style.display = 'block';
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-pw-input').focus();
  }
}

// ── 관리자 패널 렌더 ───────────────────────────────────────────
function renderAdminPanel() {
  state = loadState();
  const round = state.currentRound;
  document.getElementById('admin-round-display').textContent = `라운드 ${round} / ${TOTAL_ROUNDS}`;
  document.getElementById('admin-cur-round').textContent = round;
  document.getElementById('admin-game-status').textContent =
    round === 0 ? '게임 시작 전' :
    state.roundStarted ? `라운드 ${round} 진행 중` :
    round >= TOTAL_ROUNDS ? '게임 종료' : `라운드 ${round} 완료 (다음 대기 중)`;

  const roundData = state.rounds[Math.max(0, round - 1)];
  document.getElementById('admin-news-edit').value = roundData ? roundData.news : '';

  // 활성 탭 재렌더
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (activeTab === 'tab-companies') renderAdminCompanies();
  if (activeTab === 'tab-users') renderAdminUsers();
}

function adminStartRound() {
  if (state.currentRound === 0) {
    state.currentRound = 1;
  }
  state.roundStarted = true;
  saveState();
  renderAdminPanel();
  alert(`라운드 ${state.currentRound}이 시작되었습니다!`);
}

function adminNextRound() {
  if (state.currentRound >= TOTAL_ROUNDS) {
    alert('이미 마지막 라운드입니다.');
    return;
  }
  if (!state.roundStarted && state.currentRound > 0) {
    alert('현재 라운드를 먼저 시작해주세요.');
    return;
  }
  state.roundStarted = false;
  state.currentRound = Math.min(state.currentRound + 1, TOTAL_ROUNDS);
  saveState();
  renderAdminPanel();
  alert(`라운드 ${state.currentRound}(으)로 이동했습니다. "라운드 시작" 버튼을 눌러 시작하세요.`);
}

function adminResetGame() {
  if (!confirm('정말로 게임을 초기화하시겠습니까? 모든 유저 데이터가 삭제됩니다.')) return;
  state = defaultState();
  saveState();
  renderAdminPanel();
  alert('게임이 초기화되었습니다.');
}

function adminSaveNews() {
  const news = document.getElementById('admin-news-edit').value.trim();
  if (!news) return;
  const idx = state.currentRound > 0 ? state.currentRound - 1 : 0;
  if (state.rounds[idx]) {
    state.rounds[idx].news = news;
    saveState();
    alert('뉴스가 저장되었습니다.');
  }
}

// ── 관리자 기업 설정 ───────────────────────────────────────────
function renderAdminCompanies() {
  const container = document.getElementById('admin-company-list');
  container.innerHTML = '';
  state.companies.forEach(company => {
    const div = document.createElement('div');
    div.className = 'admin-company-item';
    div.innerHTML = `
      <div class="company-row">
        <label>기업명</label>
        <input type="text" id="co-name-${company.id}" value="${company.name}" />
        <label>기준가</label>
        <input type="number" id="co-price-${company.id}" value="${company.price}" min="1000" step="1000" />
        <button class="btn btn-sm btn-primary" onclick="saveCompany(${company.id})">저장</button>
      </div>
      <div class="company-row" style="margin-top:0.5rem;">
        <label>설명</label>
        <input type="text" id="co-desc-${company.id}" value="${company.description}" style="flex:1;" />
      </div>
      <div class="company-row" style="margin-top:0.5rem; color: var(--text2); font-size:0.82rem;">
        현재가: <strong style="color:var(--text)">${fmt(getCurrentPrice(company.id))}</strong>
        &nbsp;|&nbsp; 라운드별 배율:
        ${state.rounds.map((r, i) => {
          const eff = r.effects[company.id] || 1;
          const cls = eff >= 1 ? 'color:var(--green)' : 'color:var(--red)';
          return `<span style="${cls}">R${i+1}:×${eff.toFixed(2)}</span>`;
        }).join(' ')}
      </div>
    `;
    container.appendChild(div);
  });
}

window.saveCompany = function(id) {
  const name  = document.getElementById(`co-name-${id}`).value.trim();
  const price = parseInt(document.getElementById(`co-price-${id}`).value);
  const desc  = document.getElementById(`co-desc-${id}`).value.trim();
  if (!name || !price || price < 1000) {
    alert('기업명과 가격(최소 1,000원)을 올바르게 입력하세요.');
    return;
  }
  const company = state.companies.find(c => c.id === id);
  if (company) {
    company.name = name;
    company.price = price;
    company.description = desc;
    saveState();
    renderAdminCompanies();
    alert(`${name} 정보가 저장되었습니다.`);
  }
};

// ── 관리자 유저 거래 내역 ──────────────────────────────────────
function renderAdminUsers() {
  const container = document.getElementById('admin-user-list');
  if (state.users.length === 0) {
    container.innerHTML = '<p class="empty-msg">아직 참여한 유저가 없습니다.</p>';
    return;
  }
  container.innerHTML = '';
  state.users.forEach(user => {
    let stockValue = 0;
    Object.entries(user.holdings).forEach(([idStr, qty]) => {
      stockValue += getCurrentPrice(parseInt(idStr)) * qty;
    });
    const total = user.cash + stockValue;
    const rate  = ((total - INITIAL_CASH) / INITIAL_CASH * 100);

    const card = document.createElement('div');
    card.className = 'admin-user-card';

    let tradesHtml = '';
    if (user.trades.length === 0) {
      tradesHtml = '<div class="trade-item">거래 내역 없음</div>';
    } else {
      // 최신 거래 먼저
      [...user.trades].reverse().forEach(t => {
        const tag = t.type === 'buy'
          ? `<span class="buy-tag">매수</span>`
          : `<span class="sell-tag">매도</span>`;
        tradesHtml += `<div class="trade-item">${tag} R${t.round} | ${t.companyName} | ${t.qty}주 × ${fmt(t.price)} = ${fmt(t.qty * t.price)}</div>`;
      });
    }

    // 보유 주식 현황
    let holdingsHtml = '';
    const hEntries = Object.entries(user.holdings).filter(([,qty]) => qty > 0);
    if (hEntries.length > 0) {
      holdingsHtml = '<div style="margin-top:0.5rem; font-size:0.82rem; color:var(--text2);">보유 주식: ';
      holdingsHtml += hEntries.map(([idStr, qty]) => {
        const co = state.companies.find(c => c.id === parseInt(idStr));
        return `${co ? co.name : idStr} ${qty}주`;
      }).join(' / ');
      holdingsHtml += '</div>';
    }

    card.innerHTML = `
      <div class="user-header">
        <span class="user-name">👤 ${user.name}</span>
        <span class="user-cash">총자산 ${fmt(total)} (${fmtRate(rate)})</span>
      </div>
      <div style="font-size:0.82rem; color:var(--text2); margin-bottom:0.5rem;">
        현금: ${fmt(user.cash)} | 주식평가: ${fmt(stockValue)}
      </div>
      ${holdingsHtml}
      <div class="trade-history" style="margin-top:0.75rem;">${tradesHtml}</div>
    `;
    container.appendChild(card);
  });
}

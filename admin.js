/* 관리자 페이지 로직 - 비밀번호 보안 강화 완성본 */

const ADMIN_PASSWORD = "kdh1304!";

let adminGameState = JSON.parse(localStorage.getItem('gameState')) || {
    balance: initialData.balance,
    currentRound: 1,
    stocks: initialData.stocks.map(s => ({
        ...s,
        currentPrice: s.basePrice,
        priceHistory: [s.basePrice],
        changePercent: 0,
        owned: 0
    })),
    totalAssets: initialData.balance,
    history: []
};

let adminRanking = JSON.parse(localStorage.getItem('gameRanking')) || [];

// 비밀번호 확인 함수
function checkAdminPassword() {
    const input = document.getElementById('admin-password');
    if (input.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        showAdminTools();
    } else {
        alert('비밀번호가 틀렸습니다!');
        input.value = '';
    }
}

// 관리자 도구 표시
function showAdminTools() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('admin-tools').style.display = 'block';
    document.body.style.alignItems = 'flex-start';
    
    updateAdminDisplay();
    renderStockAdjustmentTable();
    renderRankingTable();
    loadNewsInput();
}

// 페이지 로드 시 인증 상태 확인
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showAdminTools();
    }
});

function updateAdminDisplay() {
    document.getElementById('current-round-display').innerText = adminGameState.currentRound;
    document.getElementById('balance-display').innerText = formatNumber(adminGameState.balance) + '원';
    document.getElementById('total-assets-display').innerText = formatNumber(adminGameState.totalAssets) + '원';
}

function adminNextRound() {
    if (adminGameState.currentRound < 5) {
        adminGameState.currentRound++;
        applyRoundChanges();
        updateAdminDisplay();
        saveGameState();
        showAlert('다음 라운드로 진행했습니다.', 'success');
    } else {
        showAlert('이미 마지막 라운드입니다.', 'error');
    }
}

function applyRoundChanges() {
    const scenario = initialData.scenarios.find(s => s.round === adminGameState.currentRound);
    if (scenario) {
        adminGameState.stocks.forEach(stock => {
            const change = scenario.changes[stock.id] || 0;
            const prevPrice = stock.currentPrice;
            stock.currentPrice = Math.floor(prevPrice * (1 + change / 100));
            stock.changePercent = change;
            stock.priceHistory.push(stock.currentPrice);
        });
        calculateTotalAssets();
    }
}

function adminResetGame() {
    if (confirm('게임을 초기화하시겠습니까?')) {
        adminGameState = {
            balance: initialData.balance,
            currentRound: 1,
            stocks: initialData.stocks.map(s => ({
                ...s,
                currentPrice: s.basePrice,
                priceHistory: [s.basePrice],
                changePercent: 0,
                owned: 0
            })),
            totalAssets: initialData.balance,
            history: []
        };
        saveGameState();
        location.reload();
    }
}

function renderStockAdjustmentTable() {
    const tableBody = document.getElementById('stock-adjustment-table');
    tableBody.innerHTML = '';
    adminGameState.stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.name}</td>
            <td>${formatNumber(stock.currentPrice)}원</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <input type="number" id="price-${stock.id}" placeholder="새 가격" style="padding: 5px; margin: 0; font-size: 12px;">
                    <button class="btn-primary" onclick="adminSetStockPrice(${stock.id})" style="padding: 5px 10px; width: auto; font-size: 12px;">설정</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function adminSetStockPrice(stockId) {
    const input = document.getElementById(`price-${stockId}`);
    const newPrice = parseInt(input.value);
    if (isNaN(newPrice) || newPrice <= 0) return;
    
    const stock = adminGameState.stocks.find(s => s.id === stockId);
    stock.currentPrice = newPrice;
    stock.priceHistory.push(newPrice);
    calculateTotalAssets();
    saveGameState();
    renderStockAdjustmentTable();
    showAlert(`${stock.name} 가격 수정 완료`, 'success');
}

function loadNewsInput() {
    const scenario = initialData.scenarios.find(s => s.round === adminGameState.currentRound);
    if (scenario) document.getElementById('news-input').value = scenario.news;
}

function adminUpdateNews() {
    const newNews = document.getElementById('news-input').value.trim();
    if (!newNews) return;
    const scenario = initialData.scenarios.find(s => s.round === adminGameState.currentRound);
    if (scenario) scenario.news = newNews;
    showAlert('뉴스 업데이트 완료', 'success');
}

function renderRankingTable() {
    const tableBody = document.getElementById('ranking-table');
    tableBody.innerHTML = '';
    const sortedRanking = [...adminRanking].sort((a, b) => b.finalAssets - a.finalAssets);
    sortedRanking.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${index + 1}</td><td>${entry.playerName}</td><td>${formatNumber(entry.finalAssets)}원</td>`;
        tableBody.appendChild(row);
    });
}

function adminClearRanking() {
    if (confirm('랭킹을 초기화하시겠습니까?')) {
        adminRanking = [];
        localStorage.setItem('gameRanking', JSON.stringify(adminRanking));
        renderRankingTable();
        showAlert('랭킹 초기화 완료', 'success');
    }
}

function calculateTotalAssets() {
    let stockValue = 0;
    adminGameState.stocks.forEach(stock => { stockValue += stock.currentPrice * stock.owned; });
    adminGameState.totalAssets = adminGameState.balance + stockValue;
}

function saveGameState() { localStorage.setItem('gameState', JSON.stringify(adminGameState)); }
function formatNumber(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerText = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

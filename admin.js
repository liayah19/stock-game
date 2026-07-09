/* 관리자 페이지 로직 - 100% 완성본 */

// 로컬스토리지에서 게임 상태 불러오기
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    updateAdminDisplay();
    renderStockAdjustmentTable();
    renderRankingTable();
    loadNewsInput();
});

// 관리자 디스플레이 업데이트
function updateAdminDisplay() {
    document.getElementById('current-round-display').innerText = adminGameState.currentRound;
    document.getElementById('balance-display').innerText = formatNumber(adminGameState.balance) + '원';
    document.getElementById('total-assets-display').innerText = formatNumber(adminGameState.totalAssets) + '원';
    
    const profitRate = ((adminGameState.totalAssets - initialData.balance) / initialData.balance * 100).toFixed(2);
    document.getElementById('profit-rate-display').innerText = `${profitRate > 0 ? '+' : ''}${profitRate}%`;
}

// 다음 라운드로 진행
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

// 특정 라운드로 이동
function adminJumpToRound() {
    const roundSelect = document.getElementById('round-select');
    const targetRound = parseInt(roundSelect.value);
    
    if (isNaN(targetRound) || targetRound < 1 || targetRound > 5) {
        showAlert('유효한 라운드를 선택해주세요.', 'error');
        return;
    }
    
    adminGameState.currentRound = targetRound;
    applyRoundChanges();
    updateAdminDisplay();
    saveGameState();
    showAlert(`라운드 ${targetRound}로 이동했습니다.`, 'success');
    roundSelect.value = '';
}

// 라운드 변경 적용
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

// 게임 초기화
function adminResetGame() {
    if (confirm('게임을 초기화하시겠습니까? 모든 진행 상황이 삭제됩니다.')) {
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
        updateAdminDisplay();
        renderStockAdjustmentTable();
        showAlert('게임이 초기화되었습니다.', 'success');
    }
}

// 주식 가격 조정 테이블 렌더링
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
                    <input type="number" id="price-${stock.id}" placeholder="새 가격" style="flex: 1; margin: 0;">
                    <button class="btn-primary" onclick="adminSetStockPrice(${stock.id})" style="padding: 5px 10px; margin: 0;">설정</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 주식 가격 설정
function adminSetStockPrice(stockId) {
    const input = document.getElementById(`price-${stockId}`);
    const newPrice = parseInt(input.value);
    
    if (isNaN(newPrice) || newPrice <= 0) {
        showAlert('유효한 가격을 입력해주세요.', 'error');
        return;
    }
    
    const stock = adminGameState.stocks.find(s => s.id === stockId);
    stock.currentPrice = newPrice;
    stock.priceHistory.push(newPrice);
    calculateTotalAssets();
    saveGameState();
    input.value = '';
    renderStockAdjustmentTable();
    showAlert(`${stock.name} 가격이 ${formatNumber(newPrice)}원으로 설정되었습니다.`, 'success');
}

// 자산 설정
function adminSetBalance() {
    const input = document.getElementById('balance-input');
    const newBalance = parseInt(input.value);
    
    if (isNaN(newBalance) || newBalance < 0) {
        showAlert('유효한 금액을 입력해주세요.', 'error');
        return;
    }
    
    adminGameState.balance = newBalance;
    calculateTotalAssets();
    saveGameState();
    updateAdminDisplay();
    input.value = '';
    showAlert(`현금이 ${formatNumber(newBalance)}원으로 설정되었습니다.`, 'success');
}

// 뉴스 입력 로드
function loadNewsInput() {
    const scenario = initialData.scenarios.find(s => s.round === adminGameState.currentRound);
    if (scenario) {
        document.getElementById('news-input').value = scenario.news;
    }
}

// 뉴스 업데이트
function adminUpdateNews() {
    const newsInput = document.getElementById('news-input');
    const newNews = newsInput.value.trim();
    
    if (!newNews) {
        showAlert('뉴스 내용을 입력해주세요.', 'error');
        return;
    }
    
    const scenario = initialData.scenarios.find(s => s.round === adminGameState.currentRound);
    if (scenario) {
        scenario.news = newNews;
    }
    
    showAlert('뉴스가 업데이트되었습니다.', 'success');
}

// 랭킹 테이블 렌더링
function renderRankingTable() {
    const tableBody = document.getElementById('ranking-table');
    tableBody.innerHTML = '';
    
    if (adminRanking.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">등록된 랭킹이 없습니다.</td></tr>';
        return;
    }
    
    const sortedRanking = [...adminRanking].sort((a, b) => b.finalAssets - a.finalAssets);
    
    sortedRanking.forEach((entry, index) => {
        const profitRate = ((entry.finalAssets - initialData.balance) / initialData.balance * 100).toFixed(2);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.playerName}</td>
            <td>${formatNumber(entry.finalAssets)}원</td>
            <td style="color: ${profitRate > 0 ? '#f04452' : (profitRate < 0 ? '#3182f6' : '#999')}">${profitRate > 0 ? '+' : ''}${profitRate}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// 랭킹 초기화
function adminClearRanking() {
    if (confirm('모든 랭킹 데이터를 삭제하시겠습니까?')) {
        adminRanking = [];
        localStorage.setItem('gameRanking', JSON.stringify(adminRanking));
        renderRankingTable();
        showAlert('랭킹이 초기화되었습니다.', 'success');
    }
}

// 총 자산 계산
function calculateTotalAssets() {
    let stockValue = 0;
    adminGameState.stocks.forEach(stock => {
        stockValue += stock.currentPrice * stock.owned;
    });
    adminGameState.totalAssets = adminGameState.balance + stockValue;
}

// 게임 상태 저장
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(adminGameState));
}

// 유틸리티: 숫자 포맷팅
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 알림 표시
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerText = message;
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

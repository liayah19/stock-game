/* 2026 경제 모의주식투자 게임 로직 - 닉네임 시스템 포함 완성본 */

// 게임 상태 관리
let gameState = JSON.parse(localStorage.getItem('gameState')) || {
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
    history: [],
    nickname: ''
};

let gameRanking = JSON.parse(localStorage.getItem('gameRanking')) || [];
let currentSelectedStockId = null;
let stockChart = null;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (gameState.nickname) {
        showGame();
    }
});

// 게임 시작 (닉네임 입력 후)
function startGame() {
    const input = document.getElementById('nickname-input');
    const nickname = input.value.trim();
    
    if (!nickname) {
        alert('닉네임을 입력해주세요!');
        return;
    }
    
    gameState.nickname = nickname;
    saveGameState();
    showGame();
}

// 게임 화면 표시
function showGame() {
    document.getElementById('intro-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-nickname').innerText = `${gameState.nickname}님`;
    
    updateUI();
    renderStockList();
    initRound();
}

// 라운드 초기화 및 업데이트
function initRound() {
    const scenario = initialData.scenarios.find(s => s.round === gameState.currentRound);
    if (scenario) {
        document.getElementById('current-round').innerText = `ROUND ${gameState.currentRound}`;
        document.getElementById('news-text').innerText = scenario.news;
        
        // 주가 변동 적용 (라운드 진행 시에만)
        if (gameState.stocks[0].priceHistory.length < gameState.currentRound + 1) {
            gameState.stocks.forEach(stock => {
                const change = scenario.changes[stock.id] || 0;
                const prevPrice = stock.currentPrice;
                stock.currentPrice = Math.floor(prevPrice * (1 + change / 100));
                stock.changePercent = change;
                stock.priceHistory.push(stock.currentPrice);
            });
        }
        
        calculateTotalAssets();
        renderStockList();
        updateUI();
    }
}

// 다음 라운드로 진행
function nextRound() {
    if (gameState.currentRound < 5) {
        gameState.currentRound++;
        initRound();
        saveGameState();
        alert(`${gameState.currentRound}라운드가 시작되었습니다!`);
    } else {
        alert(`게임이 종료되었습니다! 최종 자산: ${formatNumber(gameState.totalAssets)}원`);
        saveGameState();
        showView('ranking');
    }
}

// UI 업데이트
function updateUI() {
    document.getElementById('balance').innerText = `${formatNumber(gameState.balance)}원`;
    document.getElementById('total-assets').innerText = `${formatNumber(gameState.totalAssets)}원`;
    
    const profitRate = ((gameState.totalAssets - initialData.balance) / initialData.balance * 100).toFixed(2);
    const rateElem = document.getElementById('total-profit-rate');
    rateElem.innerText = `${profitRate > 0 ? '+' : ''}${profitRate}%`;
    rateElem.className = 'value ' + (profitRate > 0 ? 'percent-plus' : (profitRate < 0 ? 'percent-minus' : 'percent-zero'));
}

// 주식 리스트 렌더링
function renderStockList() {
    const listContainer = document.getElementById('stock-list');
    listContainer.innerHTML = '';
    
    gameState.stocks.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'stock-item';
        item.onclick = () => openTradeModal(stock.id);
        
        const changeClass = stock.changePercent > 0 ? 'percent-plus' : (stock.changePercent < 0 ? 'percent-minus' : 'percent-zero');
        const changeSign = stock.changePercent > 0 ? '▲' : (stock.changePercent < 0 ? '▼' : '');
        
        item.innerHTML = `
            <div class="stock-info">
                <span class="stock-name">${stock.name}</span>
                <span class="stock-code">${stock.code}</span>
            </div>
            <div class="stock-price-area">
                <span class="stock-price">${formatNumber(stock.currentPrice)}원</span>
                <span class="stock-change ${changeClass}">${changeSign}${Math.abs(stock.changePercent)}%</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// 매수/매도 모달 열기
function openTradeModal(stockId) {
    currentSelectedStockId = stockId;
    const stock = gameState.stocks.find(s => s.id === stockId);
    
    document.getElementById('modal-stock-name').innerText = stock.name;
    document.getElementById('modal-stock-price').innerText = `${formatNumber(stock.currentPrice)}원`;
    document.getElementById('trade-quantity').value = 1;
    updateExpectedPrice();
    
    document.getElementById('trade-modal').style.display = 'block';
    renderChart(stock);
}

function closeModal() {
    document.getElementById('trade-modal').style.display = 'none';
}

function updateExpectedPrice() {
    const stock = gameState.stocks.find(s => s.id === currentSelectedStockId);
    const quantity = document.getElementById('trade-quantity').value;
    const total = stock.currentPrice * quantity;
    document.getElementById('expected-price').innerText = `${formatNumber(total)}원`;
}

document.getElementById('trade-quantity').oninput = updateExpectedPrice;

// 거래 실행
function executeTrade(type) {
    const stock = gameState.stocks.find(s => s.id === currentSelectedStockId);
    const quantity = parseInt(document.getElementById('trade-quantity').value);
    const totalPrice = stock.currentPrice * quantity;
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('올바른 수량을 입력해주세요.');
        return;
    }
    
    if (type === 'buy') {
        if (gameState.balance >= totalPrice) {
            gameState.balance -= totalPrice;
            stock.owned += quantity;
            alert(`${stock.name} ${quantity}주 매수 완료!`);
        } else {
            alert('잔액이 부족합니다.');
            return;
        }
    } else {
        if (stock.owned >= quantity) {
            gameState.balance += totalPrice;
            stock.owned -= quantity;
            alert(`${stock.name} ${quantity}주 매도 완료!`);
        } else {
            alert('보유 수량이 부족합니다.');
            return;
        }
    }
    
    calculateTotalAssets();
    updateUI();
    saveGameState();
    closeModal();
}

function calculateTotalAssets() {
    let stockValue = 0;
    gameState.stocks.forEach(stock => {
        stockValue += stock.currentPrice * stock.owned;
    });
    gameState.totalAssets = gameState.balance + stockValue;
}

function renderChart(stock) {
    const ctx = document.getElementById('stock-chart').getContext('2d');
    if (stockChart) stockChart.destroy();
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stock.priceHistory.map((_, i) => `${i}R`),
            datasets: [{
                label: '주가',
                data: stock.priceHistory,
                borderColor: '#3182f6',
                backgroundColor: 'rgba(49, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false },
                x: { grid: { display: false } }
            }
        }
    });
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showView(view) {
    if (view === 'home') {
        renderStockList();
    } else if (view === 'portfolio') {
        renderPortfolio();
    } else if (view === 'ranking') {
        renderRankingView();
    }
}

function renderPortfolio() {
    const listContainer = document.getElementById('stock-list');
    listContainer.innerHTML = '<h2 class="section-title">보유 종목</h2>';
    
    const ownedStocks = gameState.stocks.filter(s => s.owned > 0);
    
    if (ownedStocks.length === 0) {
        listContainer.innerHTML += '<div class="loading">보유 중인 주식이 없습니다.</div>';
    } else {
        ownedStocks.forEach(stock => {
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.onclick = () => openTradeModal(stock.id);
            item.innerHTML = `
                <div class="stock-info">
                    <span class="stock-name">${stock.name}</span>
                    <span class="stock-code">${stock.owned}주 보유</span>
                </div>
                <div class="stock-price-area">
                    <span class="stock-price">${formatNumber(stock.currentPrice * stock.owned)}원</span>
                    <span class="stock-change">현재가: ${formatNumber(stock.currentPrice)}원</span>
                </div>
            `;
            listContainer.appendChild(item);
        });
    }
    
    if (gameState.currentRound === 5) {
        const endGameBtn = document.createElement('button');
        endGameBtn.className = 'btn-buy';
        endGameBtn.style.cssText = 'width: 100%; padding: 16px; margin-top: 20px; border: none; border-radius: 12px; color: white; font-weight: 700; cursor: pointer;';
        endGameBtn.innerText = '게임 종료 및 랭킹 저장';
        endGameBtn.onclick = () => {
            saveToRanking(gameState.nickname);
            alert('게임이 종료되었습니다! 랭킹에 저장되었습니다.');
            renderRankingView();
        };
        listContainer.appendChild(endGameBtn);
    }
}

function renderRankingView() {
    const listContainer = document.getElementById('stock-list');
    listContainer.innerHTML = '<h2 class="section-title">게임 랭킹</h2>';
    
    if (gameRanking.length === 0) {
        listContainer.innerHTML += '<div class="loading">아직 완료된 게임이 없습니다.</div>';
        return;
    }
    
    const sortedRanking = [...gameRanking].sort((a, b) => b.finalAssets - a.finalAssets);
    sortedRanking.forEach((entry, index) => {
        const profitRate = ((entry.finalAssets - initialData.balance) / initialData.balance * 100).toFixed(2);
        const item = document.createElement('div');
        item.className = 'stock-item';
        item.innerHTML = `
            <div class="stock-info">
                <span class="stock-name">#${index + 1} ${entry.playerName}</span>
                <span class="stock-code">${entry.timestamp}</span>
            </div>
            <div class="stock-price-area">
                <span class="stock-price">${formatNumber(entry.finalAssets)}원</span>
                <span class="stock-change" style="color: ${profitRate > 0 ? '#f04452' : (profitRate < 0 ? '#3182f6' : '#999')}">${profitRate > 0 ? '+' : ''}${profitRate}%</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function saveToRanking(playerName) {
    const entry = {
        playerName: playerName || '플레이어',
        finalAssets: gameState.totalAssets,
        round: gameState.currentRound,
        timestamp: new Date().toLocaleDateString('ko-KR')
    };
    gameRanking.push(entry);
    localStorage.setItem('gameRanking', JSON.stringify(gameRanking));
}

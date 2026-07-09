/* 실시간 멀티플레이어 주식 게임 로직 - 100% 완성본 */

let gameState = {
    balance: initialData.balance,
    totalAssets: initialData.balance,
    nickname: localStorage.getItem('nickname') || '',
    stocks: initialData.stocks.map(s => ({ ...s, owned: 0 }))
};

let serverState = {
    currentRound: 0,
    stocks: [],
    news: ''
};

let currentSelectedStockId = null;
let stockChart = null;

// 서버 데이터 실시간 감시 (Firebase Listen)
db.ref('gameState').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        serverState = data;
        updateUI();
        renderStockList();
        checkMarketStatus();
    }
});

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (gameState.nickname) {
        showGame();
    } else {
        document.getElementById('connection-status').innerText = '닉네임을 입력하고 시작하세요';
    }
});

function startGame() {
    const nickname = document.getElementById('nickname-input').value.trim();
    if (!nickname) return alert('닉네임을 입력해주세요!');
    
    gameState.nickname = nickname;
    localStorage.setItem('nickname', nickname);
    
    // 서버에 참가자 등록
    db.ref('users/' + nickname).set({
        nickname: nickname,
        totalAssets: gameState.totalAssets,
        lastUpdate: Date.now()
    });
    
    showGame();
}

function showGame() {
    document.getElementById('intro-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-nickname').innerText = `${gameState.nickname}님`;
    updateUI();
}

function updateUI() {
    if (!serverState.currentRound) return;
    
    document.getElementById('current-round').innerText = `ROUND ${serverState.currentRound}`;
    document.getElementById('news-text').innerText = serverState.news;
    document.getElementById('balance').innerText = `${formatNumber(gameState.balance)}원`;
    
    // 총 자산 계산 (서버 주가 기준)
    let stockValue = 0;
    gameState.stocks.forEach(s => {
        const serverStock = serverState.stocks.find(ss => ss.id === s.id);
        if (serverStock) stockValue += serverStock.currentPrice * s.owned;
    });
    gameState.totalAssets = gameState.balance + stockValue;
    document.getElementById('total-assets').innerText = `${formatNumber(gameState.totalAssets)}원`;
    
    const profitRate = ((gameState.totalAssets - initialData.balance) / initialData.balance * 100).toFixed(2);
    const rateElem = document.getElementById('total-profit-rate');
    rateElem.innerText = `${profitRate > 0 ? '+' : ''}${profitRate}%`;
    rateElem.className = 'value ' + (profitRate > 0 ? 'percent-plus' : (profitRate < 0 ? 'percent-minus' : 'percent-zero'));
    
    // 서버에 내 자산 업데이트
    db.ref('users/' + gameState.nickname).update({
        totalAssets: gameState.totalAssets,
        lastUpdate: Date.now()
    });
}

function renderStockList() {
    const listContainer = document.getElementById('stock-list');
    listContainer.innerHTML = '';
    
    serverState.stocks.forEach(stock => {
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

function executeTrade(type) {
    const stock = gameState.stocks.find(s => s.id === currentSelectedStockId);
    const serverStock = serverState.stocks.find(s => s.id === currentSelectedStockId);
    const quantity = parseInt(document.getElementById('trade-quantity').value);
    const totalPrice = serverStock.currentPrice * quantity;
    
    if (type === 'buy') {
        if (gameState.balance >= totalPrice) {
            gameState.balance -= totalPrice;
            stock.owned += quantity;
            logTrade(type, serverStock.name, quantity, serverStock.currentPrice);
        } else return alert('잔액 부족');
    } else {
        if (stock.owned >= quantity) {
            gameState.balance += totalPrice;
            stock.owned -= quantity;
            logTrade(type, serverStock.name, quantity, serverStock.currentPrice);
        } else return alert('보유 수량 부족');
    }
    
    updateUI();
    closeModal();
}

// 거래 로그 전송 (관리자 확인용)
function logTrade(type, name, quantity, price) {
    db.ref('logs').push({
        nickname: gameState.nickname,
        type: type === 'buy' ? '매수' : '매도',
        stockName: name,
        quantity: quantity,
        price: price,
        round: serverState.currentRound,
        timestamp: new Date().toLocaleTimeString()
    });
}

function openTradeModal(stockId) {
    currentSelectedStockId = stockId;
    const stock = serverState.stocks.find(s => s.id === stockId);
    document.getElementById('modal-stock-name').innerText = stock.name;
    document.getElementById('modal-stock-price').innerText = `${formatNumber(stock.currentPrice)}원`;
    document.getElementById('trade-modal').style.display = 'block';
}

function closeModal() { document.getElementById('trade-modal').style.display = 'none'; }
function formatNumber(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function showView(view) {
    if (view === 'ranking') renderRanking();
    else if (view === 'portfolio') renderPortfolio();
    else renderStockList();
}

function renderRanking() {
    const listContainer = document.getElementById('stock-list');
    listContainer.innerHTML = '<h2 class="section-title">실시간 참가자 순위</h2>';
    
    db.ref('users').orderByChild('totalAssets').limitToLast(10).once('value', (snapshot) => {
        const users = [];
        snapshot.forEach(child => { users.push(child.val()); });
        users.reverse().forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.innerHTML = `
                <div class="stock-info"><span class="stock-name">#${index + 1} ${user.nickname}</span></div>
                <div class="stock-price-area"><span class="stock-price">${formatNumber(user.totalAssets)}원</span></div>
            `;
            listContainer.appendChild(item);
        });
    });
}

/* 초고속 로딩 최적화 버전 script.js */

let gameState = {
    balance: 100000000,
    totalAssets: 100000000,
    nickname: localStorage.getItem('nickname') || '',
    stocks: []
};

let serverState = { currentRound: 0, stocks: [], news: '데이터 동기화 중...' };
let currentSelectedStockId = null;
let stockChart = null;

// 초기화 함수
function init() {
    // 로컬 데이터 즉시 설정
    gameState.stocks = initialData.stocks.map(s => ({ ...s, owned: 0, currentPrice: s.basePrice }));
    serverState.stocks = initialData.stocks.map(s => ({ ...s, currentPrice: s.basePrice, changePercent: 0 }));
    
    // 로딩 화면 제거 및 인트로/앱 표시
    document.getElementById('loading-screen').style.display = 'none';
    if (gameState.nickname) {
        document.getElementById('app').style.display = 'block';
        document.getElementById('user-nickname').innerText = `${gameState.nickname}님`;
        renderStockList();
        updateUI();
    } else {
        document.getElementById('intro-overlay').style.display = 'flex';
    }

    // Firebase 연결 (비동기)
    connectFirebase();
}

function connectFirebase() {
    if (typeof db === 'undefined') {
        setTimeout(connectFirebase, 500); // 라이브러리 로드 대기
        return;
    }

    db.ref('gameState').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            serverState = data;
            updateUI();
            renderStockList();
        }
    });
}

function startGame() {
    const nickname = document.getElementById('nickname-input').value.trim();
    if (!nickname) return alert('닉네임을 입력해주세요!');
    
    gameState.nickname = nickname;
    localStorage.setItem('nickname', nickname);
    
    if (typeof db !== 'undefined') {
        db.ref('users/' + nickname).set({
            nickname: nickname,
            totalAssets: gameState.totalAssets,
            lastUpdate: Date.now()
        });
    }
    
    document.getElementById('intro-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-nickname').innerText = `${nickname}님`;
    updateUI();
}

function updateUI() {
    document.getElementById('current-round').innerText = serverState.currentRound ? `ROUND ${serverState.currentRound}` : '대기 중';
    document.getElementById('news-text').innerText = serverState.news;
    document.getElementById('balance').innerText = `${formatNumber(gameState.balance)}원`;
    
    let stockValue = 0;
    gameState.stocks.forEach(s => {
        const serverStock = serverState.stocks.find(ss => ss.id === s.id);
        if (serverStock) stockValue += serverStock.currentPrice * s.owned;
    });
    gameState.totalAssets = gameState.balance + stockValue;
    document.getElementById('total-assets').innerText = `${formatNumber(gameState.totalAssets)}원`;
    
    const profitRate = ((gameState.totalAssets - 100000000) / 100000000 * 100).toFixed(2);
    const rateElem = document.getElementById('total-profit-rate');
    rateElem.innerText = `${profitRate > 0 ? '+' : ''}${profitRate}%`;
    rateElem.className = 'value ' + (profitRate > 0 ? 'percent-plus' : (profitRate < 0 ? 'percent-minus' : 'percent-zero'));
    
    if (typeof db !== 'undefined' && gameState.nickname) {
        db.ref('users/' + gameState.nickname).update({
            totalAssets: gameState.totalAssets,
            lastUpdate: Date.now()
        });
    }
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

function logTrade(type, name, quantity, price) {
    if (typeof db !== 'undefined') {
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
    if (typeof db !== 'undefined') {
        db.ref('users').orderByChild('totalAssets').limitToLast(10).once('value', (snapshot) => {
            const users = [];
            snapshot.forEach(child => { users.push(child.val()); });
            users.reverse().forEach((user, index) => {
                const item = document.createElement('div');
                item.className = 'stock-item';
                item.innerHTML = `<div class="stock-info">#${index + 1} ${user.nickname}</div><div class="stock-price-area">${formatNumber(user.totalAssets)}원</div>`;
                listContainer.appendChild(item);
            });
        });
    }
}

// 스크립트 로드 완료 시 실행
window.onload = init;

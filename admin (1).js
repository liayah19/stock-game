/* 초고속 로딩 최적화 버전 admin.js */

const ADMIN_PASSWORD = "kdh1304!";
let serverStocks = [];

function checkAdminPassword() {
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        initAdmin();
    } else alert('비밀번호 불일치');
}

function initAdmin() {
    serverStocks = [...initialData.stocks].map(s => ({ ...s, currentPrice: s.basePrice, changePercent: 0 }));
    renderStockAdmin();

    if (typeof db !== 'undefined') {
        db.ref('logs').limitToLast(50).on('child_added', (snapshot) => {
            const log = snapshot.val();
            const entry = document.createElement('div');
            entry.innerHTML = `[${log.timestamp}] ${log.nickname}: ${log.stockName} ${log.quantity}주 ${log.type}`;
            document.getElementById('trade-logs').prepend(entry);
        });

        db.ref('users').on('value', (snapshot) => {
            const container = document.getElementById('user-list');
            container.innerHTML = '';
            snapshot.forEach(child => {
                const user = child.val();
                container.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee;">${user.nickname}: <strong>${user.totalAssets.toLocaleString()}원</strong></div>`;
            });
        });
    }
}

function renderStockAdmin() {
    const tbody = document.getElementById('stock-admin-list');
    tbody.innerHTML = '';
    serverStocks.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td style="padding:10px;">${s.name}</td>
                <td><input type="number" value="${s.currentPrice}" onchange="updatePrice(${s.id}, this.value)" style="width:80px;"></td>
                <td><input type="number" value="${s.changePercent}" onchange="updateChange(${s.id}, this.value)" style="width:50px;">%</td>
                <td><button onclick="syncServerState()">반영</button></td>
            </tr>`;
    });
}

function updatePrice(id, val) { serverStocks.find(s => s.id === id).currentPrice = parseInt(val); }
function updateChange(id, val) { serverStocks.find(s => s.id === id).changePercent = parseFloat(val); }

function syncServerState() {
    const round = parseInt(document.getElementById('round-select').value);
    const news = document.getElementById('news-input').value || "라운드 " + round + " 진행 중";
    if (typeof db !== 'undefined') {
        db.ref('gameState').set({ currentRound: round, stocks: serverStocks, news: news, lastSync: Date.now() })
        .then(() => alert('동기화 완료!'));
    }
}

/* 실시간 관리자 센터 로직 - 100% 완성본 */

const ADMIN_PASSWORD = "kdh1304!";
let serverStocks = [...initialData.stocks].map(s => ({ ...s, currentPrice: s.basePrice, changePercent: 0 }));

function checkAdminPassword() {
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        initAdmin();
    } else alert('비밀번호 불일치');
}

function initAdmin() {
    // 실시간 로그 감시
    db.ref('logs').limitToLast(50).on('child_added', (snapshot) => {
        const log = snapshot.val();
        const container = document.getElementById('trade-logs');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `[${log.timestamp}] ${log.nickname}: ${log.stockName} ${log.quantity}주 ${log.type} (${log.price}원)`;
        container.prepend(entry);
    });

    // 실시간 참가자 감시
    db.ref('users').on('value', (snapshot) => {
        const container = document.getElementById('user-list');
        container.innerHTML = '';
        snapshot.forEach(child => {
            const user = child.val();
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `<span>${user.nickname}</span> <strong>${user.totalAssets.toLocaleString()}원</strong>`;
            container.appendChild(row);
        });
    });

    renderStockAdmin();
}

function renderStockAdmin() {
    const tbody = document.getElementById('stock-admin-list');
    tbody.innerHTML = '';
    serverStocks.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px;"><input type="text" value="${s.name}" onchange="updateStockName(${s.id}, this.value)" class="input-mini" style="width: 120px;"></td>
            <td><input type="number" value="${s.currentPrice}" onchange="updateStockPrice(${s.id}, this.value)" class="input-mini">원</td>
            <td><input type="number" value="${s.changePercent}" onchange="updateStockChange(${s.id}, this.value)" class="input-mini">%</td>
            <td><button onclick="syncServerState()" class="btn-primary" style="padding: 5px 10px; font-size: 12px;">즉시 반영</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStockName(id, val) { serverStocks.find(s => s.id === id).name = val; }
function updateStockPrice(id, val) { serverStocks.find(s => s.id === id).currentPrice = parseInt(val); }
function updateStockChange(id, val) { serverStocks.find(s => s.id === id).changePercent = parseFloat(val); }

function syncServerState() {
    const round = parseInt(document.getElementById('round-select').value);
    const news = document.getElementById('news-input').value || initialData.scenarios.find(s => s.round === round).news;
    
    db.ref('gameState').set({
        currentRound: round,
        stocks: serverStocks,
        news: news,
        lastSync: Date.now()
    }).then(() => alert('모든 클라이언트에 실시간 동기화되었습니다!'));
}

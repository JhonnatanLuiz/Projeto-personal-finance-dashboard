// dashboard_script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const balanceEl = document.getElementById('balance');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const transactionListEl = document.getElementById('transaction-list');
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('date');

    const addTransactionModalEl = document.getElementById('addTransactionModal');
    const addTransactionModal = addTransactionModalEl ? new bootstrap.Modal(addTransactionModalEl) : null;
    
    // --- GRÁFICO ---
    const ctx = document.getElementById('expense-chart').getContext('2d');
    let expenseChart; // Variável para guardar a instância do gráfico
    let monthlyTrendChart; // gráfico de evolução mensal
    // selects de tipo de gráfico
    const expenseChartTypeSelect = document.getElementById('expense-chart-type');
    const trendChartTypeSelect = document.getElementById('trend-chart-type');
    const expensePaletteSelect = document.getElementById('expense-palette-select');
    const expenseChartDownloadBtn = document.getElementById('expense-chart-download');
    const trendChartDownloadBtn = document.getElementById('trend-chart-download');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');

    // carrega preferências de tipos
    const prefs = JSON.parse(localStorage.getItem('chartPrefs') || '{}');
    if (expenseChartTypeSelect && prefs.expenseType) expenseChartTypeSelect.value = prefs.expenseType;
    if (trendChartTypeSelect && prefs.trendType) trendChartTypeSelect.value = prefs.trendType;
    if (expensePaletteSelect && prefs.expensePalette) expensePaletteSelect.value = prefs.expensePalette;
    if (prefs.theme === 'dark') document.body.dataset.theme = 'dark';
    updateThemeIcon();
    function saveChartPrefs() {
        localStorage.setItem('chartPrefs', JSON.stringify({
            expenseType: expenseChartTypeSelect ? expenseChartTypeSelect.value : 'doughnut',
            trendType: trendChartTypeSelect ? trendChartTypeSelect.value : 'line'
        }));
    }
    function saveAllPrefs() {
        const existing = JSON.parse(localStorage.getItem('chartPrefs') || '{}');
        localStorage.setItem('chartPrefs', JSON.stringify({
            ...existing,
            expenseType: expenseChartTypeSelect ? expenseChartTypeSelect.value : 'doughnut',
            trendType: trendChartTypeSelect ? trendChartTypeSelect.value : 'line',
            expensePalette: expensePaletteSelect ? expensePaletteSelect.value : 'default',
            theme: document.body.dataset.theme === 'dark' ? 'dark' : 'light'
        }));
    }
    function updateThemeIcon() {
        if (!themeToggleIcon) return;
    const dark = document.body.dataset.theme === 'dark';
        themeToggleIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
        themeToggleBtn && themeToggleBtn.setAttribute('title', dark ? 'Modo claro' : 'Modo escuro');
    }

    // --- ESTADO DA APLICAÇÃO ---
    // Carrega transações do localStorage ou inicializa um array vazio
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    // Estado de filtro
    let activeFilter = { month: 'all', year: 'all' };

    // --- FUNÇÕES ---

    // Escapa texto para evitar injeção de HTML (proteção simples contra XSS)
    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função para salvar transações no localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Função para adicionar uma nova transação
    function addTransaction(e) {
        e.preventDefault();
        // Validação bootstrap
        if (!transactionForm.checkValidity()) {
            transactionForm.classList.add('was-validated');
            return;
        }

        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value ? new Date(dateInput.value).toISOString() : new Date().toISOString();

        if (description === '' || isNaN(amount) || amount <= 0) {
            alert('Por favor, preencha a descrição e um valor válido.');
            return;
        }

        const editingId = document.getElementById('transaction-id').value;
        if (editingId) {
            // Edit existing
            const idNum = Number(editingId);
            const idx = transactions.findIndex(t => t.id === idNum);
            if (idx !== -1) {
                transactions[idx].description = description;
                transactions[idx].amount = amount;
                transactions[idx].type = type;
                transactions[idx].category = category;
                transactions[idx].date = date;
                saveTransactions();
                updateUI();
                transactionForm.reset();
                document.getElementById('transaction-id').value = '';
                addTransactionModal.hide();
                showToast('Transação atualizada.', 'success');
                return;
            }
        }

        const transaction = {
            id: Date.now(), // ID único
            description,
            amount,
            type,
            category,
            date
        };

        transactions.push(transaction);
        saveTransactions();
        updateUI();
        
        transactionForm.reset();
        if (addTransactionModal) addTransactionModal.hide();
    }

    // Função para remover uma transação
    function removeTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        updateUI();
    }
    
    // Função para renderizar as transações na tabela
    function renderTransactionList() {
        transactionListEl.innerHTML = ''; // Limpa a lista
        if (transactions.length === 0) {
            transactionListEl.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma transação registrada.</td></tr>';
            return;
        }

        // Aplica filtro ativo
        const toRender = transactions.filter(transaction => {
            if (activeFilter.month !== 'all') {
                const m = `${new Date(transaction.date).getFullYear()}-${String(new Date(transaction.date).getMonth()+1).padStart(2,'0')}`;
                if (m !== activeFilter.month) return false;
            }
            if (activeFilter.year !== 'all') {
                const y = String(new Date(transaction.date).getFullYear());
                if (y !== activeFilter.year) return false;
            }
            return true;
        });

        toRender.forEach(transaction => {
            const isIncome = transaction.type === 'income';
            const sign = isIncome ? '+' : '-';
            const row = document.createElement('tr');

            // Usa escapeHTML para campos de texto
            const desc = escapeHTML(transaction.description);
            const cat = escapeHTML(transaction.category);

            const dateStr = new Date(transaction.date).toLocaleDateString('pt-BR');
        row.innerHTML = `
                <td>${desc}</td>
                <td>${dateStr}</td>
                <td class="${isIncome ? 'text-success' : 'text-danger'}">${sign} ${formatCurrency(transaction.amount)}</td>
                <td>${isIncome ? 'Receita' : 'Despesa'}</td>
                <td>${cat}</td>
                <td>
            <button class="btn btn-sm btn-outline-secondary btn-edit me-1" data-bs-toggle="modal" data-bs-target="#editTransactionModal" data-id="${transaction.id}" aria-label="Editar transação">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-remove" data-id="${transaction.id}" aria-label="Remover transação">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            transactionListEl.appendChild(row);
        });
    // Atualiza controles de filtro caso algo tenha mudado
    populateFilterControls();
    }

    // Inicia edição: abre modal com dados preenchidos
    function startEditTransaction(id) {
        currentEditingId = Number(id);
    }

    // Estado de edição atual
    let currentEditingId = null;

    // Preenche modal de edição quando vai ser mostrado
    const editModalEl = document.getElementById('editTransactionModal');
    if (editModalEl) {
        editModalEl.addEventListener('show.bs.modal', (event) => {
            const trigger = event.relatedTarget; // botão que abriu
            if (trigger && trigger.dataset && trigger.dataset.id) {
                currentEditingId = Number(trigger.dataset.id);
            }
            if (currentEditingId == null || isNaN(currentEditingId)) return;
            const tx = transactions.find(t => Number(t.id) === currentEditingId);
            if (!tx) return;
            const editForm = document.getElementById('edit-transaction-form');
            if (editForm) editForm.classList.remove('was-validated');
            document.getElementById('edit-transaction-id').value = tx.id;
            document.getElementById('edit-description').value = tx.description;
            document.getElementById('edit-amount').value = tx.amount;
            document.getElementById('edit-type').value = tx.type;
            document.getElementById('edit-category').value = tx.category;
            document.getElementById('edit-date').value = new Date(tx.date).toISOString().slice(0,10);
        });
        editModalEl.addEventListener('hidden.bs.modal', () => {
            currentEditingId = null;
        });
    }

    // Handler para salvar edição do modal separado
    const editFormEl = document.getElementById('edit-transaction-form');
    if (editFormEl) {
        editFormEl.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!editFormEl.checkValidity()) {
                editFormEl.classList.add('was-validated');
                return;
            }
            const id = Number(document.getElementById('edit-transaction-id').value);
            const idx = transactions.findIndex(t => Number(t.id) === id);
            if (idx === -1) {
                showToast('Transação não encontrada.', 'danger');
                return;
            }
            const updated = {
                ...transactions[idx],
                description: document.getElementById('edit-description').value.trim(),
                amount: parseFloat(document.getElementById('edit-amount').value),
                type: document.getElementById('edit-type').value,
                category: document.getElementById('edit-category').value,
                date: new Date(document.getElementById('edit-date').value).toISOString()
            };
            transactions[idx] = updated;
            saveTransactions();
            updateUI();
            const editModalEl = document.getElementById('editTransactionModal');
            const editModal = bootstrap.Modal.getOrCreateInstance(editModalEl);
            editModal.hide();
            showToast('Transação atualizada.', 'success');
        });
    }

    // Função para atualizar os cards de resumo
    function updateSummary() {
        const amounts = transactions.map(t => t.amount);
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
            
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
            
    const balance = income - expense;

    // Formatação localizada (BRL)
    balanceEl.textContent = formatCurrency(balance);
    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
        
        // Atualiza a cor do balanço
        balanceEl.classList.remove('text-success', 'text-danger');
        if (balance > 0) {
            balanceEl.classList.add('text-success');
        } else if (balance < 0) {
            balanceEl.classList.add('text-danger');
        }
    }
    
    // Função para atualizar o gráfico de despesas
    function updateChart() {
        const expenseData = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        // Se o gráfico já existe, atualiza os dados. Senão, cria um novo.
        const chartType = (expenseChartTypeSelect && expenseChartTypeSelect.value) || 'doughnut';
        const palette = (expensePaletteSelect && expensePaletteSelect.value) || 'default';
        const paletteColors = {
            default: [
                'rgba(255, 99, 132, 0.8)','rgba(54, 162, 235, 0.8)','rgba(255, 206, 86, 0.8)','rgba(75, 192, 192, 0.8)','rgba(153, 102, 255, 0.8)','rgba(255, 159, 64, 0.8)'
            ],
            pastel: [
                'rgba(255,179,186,0.85)','rgba(255,223,186,0.85)','rgba(255,255,186,0.85)','rgba(186,255,201,0.85)','rgba(186,225,255,0.85)','rgba(215,186,255,0.85)'
            ],
            vibrant: [
                'rgba(231,76,60,0.85)','rgba(46,204,113,0.85)','rgba(52,152,219,0.85)','rgba(241,196,15,0.85)','rgba(155,89,182,0.85)','rgba(230,126,34,0.85)'
            ],
            mono: [
                'rgba(33,37,41,0.9)','rgba(33,37,41,0.75)','rgba(33,37,41,0.6)','rgba(33,37,41,0.45)','rgba(33,37,41,0.3)','rgba(33,37,41,0.15)'
            ]
        };
        const bgColors = paletteColors[palette];
        // Garante que a lista de cores tenha ao menos o número de categorias (cicla se necessário)
        const colors = [];
        for (let i = 0; i < labels.length; i++) {
            colors.push(bgColors[i % bgColors.length]);
        }

        if (expenseChart && expenseChart.config.type !== chartType) {
            expenseChart.destroy();
            expenseChart = null;
        }
        if (expenseChart) {
            expenseChart.data.labels = labels;
            const ds = expenseChart.data.datasets[0];
            ds.data = data;
            ds.backgroundColor = colors;
            // Para tipos radar/bar podemos ajustar borda se quiser um contraste melhor
            if (chartType === 'radar') {
                ds.borderColor = '#fff';
                ds.borderWidth = 1;
            }
            expenseChart.update();
        } else {
            expenseChart = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Despesas por Categoria',
                        data: data,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: false }
                    }
                }
            });
        }
    }

    // Gráfico de tendência mensal (receitas x despesas x saldo)
    function updateMonthlyTrendChart() {
        const ctxTrend = document.getElementById('monthly-trend-chart');
        if (!ctxTrend) return;

        const buckets = {};
        transactions.forEach(t => {
            const d = new Date(t.date);
            if (isNaN(d)) return;
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if (!buckets[ym]) buckets[ym] = { income: 0, expense: 0 };
            if (t.type === 'income') buckets[ym].income += t.amount; else if (t.type === 'expense') buckets[ym].expense += t.amount;
        });
        const labelsRaw = Object.keys(buckets).sort();
        const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const incomeData = labelsRaw.map(l => buckets[l].income);
        const expenseData = labelsRaw.map(l => buckets[l].expense);
        const balanceData = labelsRaw.map((_, i) => incomeData[i] - expenseData[i]);
        const labels = labelsRaw.map(l => { const [y,m] = l.split('-'); return monthNames[Number(m)-1] + '/' + y; });

        const rangeEl = document.getElementById('monthly-trend-range');
        if (rangeEl) {
            if (labelsRaw.length) {
                const first = labelsRaw[0].split('-');
                const last = labelsRaw[labelsRaw.length - 1].split('-');
                rangeEl.textContent = `${first[1]}/${first[0]} - ${last[1]}/${last[0]}`;
            } else {
                rangeEl.textContent = 'Sem dados';
            }
        }

        const data = {
            labels,
            datasets: [
                { label: 'Receitas', data: incomeData, borderColor: 'rgba(25,135,84,0.9)', backgroundColor: 'rgba(25,135,84,0.15)', tension: 0.25, fill: true },
                { label: 'Despesas', data: expenseData, borderColor: 'rgba(220,53,69,0.9)', backgroundColor: 'rgba(220,53,69,0.15)', tension: 0.25, fill: true },
                { label: 'Saldo', data: balanceData, borderColor: 'rgba(13,110,253,0.9)', backgroundColor: 'rgba(13,110,253,0.10)', tension: 0.25, fill: false, borderDash: [5,5] }
            ]
        };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            stacked: false,
            plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        };

        let desiredType = (trendChartTypeSelect && trendChartTypeSelect.value) || 'line';
        let actualType = desiredType;
        if (desiredType === 'stackedBar') actualType = 'bar';
        if (desiredType === 'stackedArea') actualType = 'line';

        // Ajustes de empilhamento
        if (desiredType === 'stackedBar' || desiredType === 'stackedArea') {
            options.scales = options.scales || {}; 
            options.scales.x = options.scales.x || {}; 
            options.scales.y = options.scales.y || {}; 
            options.scales.x.stacked = true;
            options.scales.y.stacked = true;
            if (desiredType === 'stackedArea') {
                data.datasets.forEach(ds => ds.fill = true);
            }
        } else {
            // garantir não empilhado
            if (options.scales && options.scales.x) options.scales.x.stacked = false;
            if (options.scales && options.scales.y) options.scales.y.stacked = false;
        }

        if (monthlyTrendChart && monthlyTrendChart.config.type !== actualType) {
            monthlyTrendChart.destroy();
            monthlyTrendChart = null;
        }
        if (monthlyTrendChart) { monthlyTrendChart.data = data; monthlyTrendChart.options = options; monthlyTrendChart.update(); }
        else { monthlyTrendChart = new Chart(ctxTrend.getContext('2d'), { type: actualType, data, options }); }
    }

    // Função principal para atualizar toda a UI
    function updateUI() {
        renderTransactionList();
        updateSummary();
        updateChart();
        updateMonthlyTrendChart();
        adaptResponsive();
    }

    function adaptResponsive() {
        // Reduz fonte da tabela se muitas colunas e viewport estreita
        const w = window.innerWidth;
        const table = document.querySelector('.transaction-table');
        if (!table) return;
        if (w < 576) {
            table.classList.add('table-sm');
        } else {
            table.classList.remove('table-sm');
        }
    }
    window.addEventListener('resize', adaptResponsive);

    // Filtragem por mês/ano
    const filterMonthEl = document.getElementById('filter-month');
    const filterYearEl = document.getElementById('filter-year');
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');

    function populateFilterControls() {
        // Extrai meses/anos existentes nas transações
        const months = new Set();
        const years = new Set();
        transactions.forEach(t => {
            const d = new Date(t.date);
            months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
            years.add(d.getFullYear());
        });

        // Limpa e re-popula
        filterMonthEl.innerHTML = '<option value="all">Todos os meses</option>';
        Array.from(months).sort().forEach(m => {
            const [y, mm] = m.split('-');
            const opt = document.createElement('option');
            opt.value = m;
            opt.text = `${mm}/${y}`;
            filterMonthEl.appendChild(opt);
        });

        filterYearEl.innerHTML = '<option value="all">Todos os anos</option>';
        Array.from(years).sort().forEach(y => {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.text = String(y);
            filterYearEl.appendChild(opt);
        });
    }

    function applyFilter() {
        activeFilter.month = filterMonthEl.value;
        activeFilter.year = filterYearEl.value;
        renderTransactionList();
        updateSummary();
        updateChart();
    }

    function resetFilter() {
        activeFilter = { month: 'all', year: 'all' };
        filterMonthEl.value = 'all';
        filterYearEl.value = 'all';
        renderTransactionList();
        updateSummary();
        updateChart();
    }

    // Exporta transações para JSON e inicia download
    function exportTransactions() {
        const dataStr = JSON.stringify(transactions, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Exportação concluída', 'success');
    }

    // Exportação CSV (delimitador ;) com BOM para Excel
    function exportTransactionsCSV() {
        if (!transactions.length) return showToast('Sem transações para exportar.', 'warning');
        const header = ['id','descricao','valor','tipo','categoria','dataISO'];
        const rows = transactions.map(t => [
            t.id,
            '"' + (t.description || '').replace(/"/g,'""') + '"',
            t.amount,
            t.type,
            '"' + (t.category || '').replace(/"/g,'""') + '"',
            t.date
        ]);
        const csv = [header.join(';')].concat(rows.map(r => r.join(';'))).join('\r\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('CSV exportado', 'success');
    }

    // Importa transações a partir de um arquivo JSON
    function importTransactionsFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error('Formato inválido');
                transactions = data.map(t => ({
                    id: t.id || Date.now() + Math.random(),
                    description: String(t.description || ''),
                    amount: Number(t.amount) || 0,
                    type: t.type === 'income' ? 'income' : 'expense',
                    category: String(t.category || ''),
                    date: t.date ? new Date(t.date).toISOString() : new Date().toISOString()
                })).filter(t => t.description && t.amount > 0);
                saveTransactions();
                updateUI();
                showToast('Importação concluída.', 'success');
            } catch(err) {
                showToast('Falha ao importar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
    }

    // --- TOASTS & UNDO (escopo global do DOMContentLoaded) ---
    const toastContainer = document.getElementById('toast-container');
    function showToast(message, type = 'info', ms = 4000, actionsHtml = '') {
        if (!toastContainer) return console.log(`[TOAST:${type}]`, message);
        const el = document.createElement('div');
        el.className = `toast align-items-center text-bg-${type} border-0`;
        el.setAttribute('role','alert');
        el.setAttribute('aria-live','assertive');
        el.setAttribute('aria-atomic','true');
        el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div>${actionsHtml}<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
        toastContainer.appendChild(el);
        const inst = new bootstrap.Toast(el, { delay: ms });
        inst.show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
        return inst;
    }
    const pendingRemovals = new Map();
    const UNDO_TIMEOUT = 6000;

    function scheduleRemoveTransaction(id) {
        const tx = transactions.find(t => Number(t.id) === Number(id));
        if (!tx) return;
        transactions = transactions.filter(t => Number(t.id) !== Number(id));
        updateUI();
        const undoHtml = `<div class="mx-2"><button class="btn btn-sm btn-light me-2" id="undo-${id}">Desfazer</button></div>`;
        showToast(`Transação removida: ${escapeHTML(tx.description)}`, 'warning', UNDO_TIMEOUT, undoHtml);
        const timeout = setTimeout(() => {
            pendingRemovals.delete(id);
            saveTransactions();
            showToast('Remoção confirmada', 'secondary', 2000);
        }, UNDO_TIMEOUT);
        pendingRemovals.set(id, { tx, timeout });
        setTimeout(() => {
            const undoBtn = document.getElementById(`undo-${id}`);
            if (undoBtn) {
                undoBtn.addEventListener('click', () => {
                    const entry = pendingRemovals.get(id);
                    if (!entry) return;
                    clearTimeout(entry.timeout);
                    transactions.push(entry.tx);
                    pendingRemovals.delete(id);
                    saveTransactions();
                    updateUI();
                    showToast('Remoção desfeita', 'success', 2000);
                });
            }
        }, 50);
    }

    // --- INICIALIZAÇÃO E EVENT LISTENERS ---
    
    // Delegação: editar ou remover transação ao clicar nos botões da linha
    transactionListEl.addEventListener('click', function (e) {
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = Number(editBtn.dataset.id || editBtn.getAttribute('data-id'));
            if (!isNaN(id)) startEditTransaction(id);
            return;
        }
        const btn = e.target.closest('.btn-remove');
        if (!btn) return;
        const id = Number(btn.dataset.id || btn.getAttribute('data-id'));
        if (!isNaN(id)) scheduleRemoveTransaction(id);
    });

    if (transactionForm) transactionForm.addEventListener('submit', addTransaction);

    // Foco no primeiro campo ao abrir modal
    if (addTransactionModalEl) {
        addTransactionModalEl.addEventListener('shown.bs.modal', () => {
            descriptionInput.focus();
        });
    }

    // Botões de export/import/clear
    const exportBtn = document.getElementById('export-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const importBtn = document.getElementById('import-btn');
    const clearBtn = document.getElementById('clear-btn');
    const importFileInput = document.getElementById('import-file');

    if (exportBtn) exportBtn.addEventListener('click', exportTransactions);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportTransactionsCSV);
    // clearBtn tratado abaixo via modal de confirmação
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (f) importTransactionsFromFile(f);
            importFileInput.value = '';
        });
    }

    // Confirmação via modal para limpar
    const confirmClearModalEl = document.getElementById('confirmClearModal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const confirmClearModal = confirmClearModalEl ? new bootstrap.Modal(confirmClearModalEl) : null;
    if (clearBtn && confirmClearModal) {
        clearBtn.addEventListener('click', () => confirmClearModal.show());
    }
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', () => {
            transactions = [];
            saveTransactions();
            updateUI();
            confirmClearModal.hide();
            showToast('Todos os dados foram apagados.', 'warning');
        });
    }

    if (applyFilterBtn) applyFilterBtn.addEventListener('click', applyFilter);
    if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetFilter);

    // listeners para mudança de tipo dos gráficos
    if (expenseChartTypeSelect) expenseChartTypeSelect.addEventListener('change', () => { saveAllPrefs(); updateChart(); });
    if (trendChartTypeSelect) trendChartTypeSelect.addEventListener('change', () => { saveAllPrefs(); updateMonthlyTrendChart(); });
    if (expensePaletteSelect) expensePaletteSelect.addEventListener('change', () => { saveAllPrefs(); updateChart(); });
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
        const dark = document.body.dataset.theme === 'dark';
        if (dark) delete document.body.dataset.theme; else document.body.dataset.theme = 'dark';
        updateThemeIcon();
        saveAllPrefs();
    });
    if (expenseChartDownloadBtn) expenseChartDownloadBtn.addEventListener('click', () => downloadChart(expenseChart, 'despesas'));
    if (trendChartDownloadBtn) trendChartDownloadBtn.addEventListener('click', () => downloadChart(monthlyTrendChart, 'tendencia'));

    function downloadChart(chartInstance, baseName) {
        if (!chartInstance) return showToast('Gráfico não disponível', 'warning');
        const link = document.createElement('a');
        link.href = chartInstance.toBase64Image('image/png', 1);
        link.download = `${baseName}-${new Date().toISOString().slice(0,10)}.png`;
        link.click();
    }

    // Popula os controles iniciais
    populateFilterControls();

    // Inicializa a UI
    updateUI();
});
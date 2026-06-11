// ---------------- STATE VARIABLES ----------------
let currentUserId = null;
let currentTab = 'overview';
let activeTheme = 'theme-blue';

// Global data stores
let globalAccounts = [];
let globalTransactions = [];
let globalGoals = [];
let globalSubscriptions = [];
let globalBudgets = [];

// Global currency formatter using Dollar symbol
const formatCurrency = (val, decimals = 2) => "$" + val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ---------------- TAB ROUTING & LOADING ----------------

function showTab(tabName) {
    // Update sidebar active classes
    const buttons = document.querySelectorAll('.sidebar-btn');
    buttons.forEach(btn => {
        const onClickStr = btn.getAttribute('onclick') || '';
        if (onClickStr.includes(tabName)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update title
    const titles = {
        'overview': 'Dashboard',
        'transactions': 'Transactions',
        'accounts': 'Microsoft Wallets & Ledgers',
        'goals': 'Savings Goals',
        'subscriptions': 'Microsoft Subscriptions',
        'budgets': 'Category Budgets',
        'agent': 'Sora AI Agent',
        'settings': 'System Settings'
    };
    document.getElementById('current-tab-title').innerText = titles[tabName] || 'Dashboard';

    // Switch tab views
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        if (tab.id === `tab-${tabName}`) {
            tab.classList.add('active');
            tab.style.display = 'flex';
        } else {
            tab.classList.remove('active');
            tab.style.display = 'none';
        }
    });

    currentTab = tabName;
    refreshTabData();
}

async function refreshTabData() {
    if (!currentUserId) return;

    try {
        // Fetch all datasets from Flask API
        const authHeader = { 'Authorization': currentUserId };
        
        const [accRes, txnRes, goalRes, subRes, budRes] = await Promise.all([
            fetch(`/api/data/accounts?userId=${currentUserId}`, { headers: authHeader }),
            fetch(`/api/data/transactions?userId=${currentUserId}`, { headers: authHeader }),
            fetch(`/api/data/goals?userId=${currentUserId}`, { headers: authHeader }),
            fetch(`/api/data/subscriptions?userId=${currentUserId}`, { headers: authHeader }),
            fetch(`/api/data/budgets?userId=${currentUserId}`, { headers: authHeader })
        ]);

        globalAccounts = await accRes.json();
        globalTransactions = await txnRes.json();
        globalGoals = await goalRes.json();
        globalSubscriptions = await subRes.json();
        globalBudgets = await budRes.json();

        // Render based on active tab
        renderCommonHeaders();
        
        if (currentTab === 'overview') {
            renderOverviewTab();
        } else if (currentTab === 'transactions') {
            renderTransactionsTab();
        } else if (currentTab === 'accounts') {
            renderAccountsTab();
        } else if (currentTab === 'goals') {
            renderGoalsTab();
        } else if (currentTab === 'subscriptions') {
            renderSubscriptionsTab();
        } else if (currentTab === 'budgets') {
            renderBudgetsTab();
        } else if (currentTab === 'agent') {
            updateAgentIndicator();
        }

    } catch (e) {
        console.error("Error refreshing dashboard data:", e);
    }
}

function renderCommonHeaders() {
    // Calculate total balance (all accounts summed)
    const totalBalance = globalAccounts.reduce((sum, a) => sum + a.balance, 0);
    
    // Total income and spent
    const totalIncome = globalTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = globalTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    // Update all overview and header numbers
    document.getElementById('overview-total-balance').innerText = formatCurrency(totalBalance);
    document.getElementById('overview-total-income').innerText = formatCurrency(totalIncome);
    document.getElementById('overview-total-spent').innerText = formatCurrency(totalSpent);
    document.getElementById('overview-net-balance').innerText = formatCurrency(totalBalance - totalSpent);

    // Find and update Personal Wallet balance
    const wallet = globalAccounts.find(a => a.accountName === 'Personal Wallet');
    if (wallet) {
        document.getElementById('overview-wallet-balance').innerText = formatCurrency(wallet.balance);
    } else {
        document.getElementById('overview-wallet-balance').innerText = "$0.00";
    }
}

// ---------------- OVERVIEW TAB RENDERING ----------------

function renderOverviewTab() {

    
    // 1. Accounts list (excluding Personal Wallet)
    const accountsList = document.getElementById('overview-accounts-list');
    accountsList.innerHTML = '';
    const displayAccounts = globalAccounts.filter(a => a.accountName !== 'Personal Wallet');
    
    if (displayAccounts.length === 0) {
        accountsList.innerHTML = '<p class="account-row-type" style="padding: 10px; text-align: center;">No accounts added yet.</p>';
    } else {
        displayAccounts.forEach(acc => {
            const row = document.createElement('div');
            row.className = 'account-row-item';
            
            // Choose icon based on name
            let iconClass = 'fa-solid fa-building-columns';
            if (acc.accountName.includes('Azure')) iconClass = 'fa-solid fa-cloud';
            else if (acc.accountName.includes('Fabric')) iconClass = 'fa-solid fa-network-wired';
            else if (acc.accountName.includes('Work')) iconClass = 'fa-solid fa-briefcase';
            else if (acc.accountName.includes('Pay')) iconClass = 'fa-solid fa-credit-card';

            row.innerHTML = `
                <i class="${iconClass} account-row-icon"></i>
                <div class="account-row-info">
                    <span class="account-row-name">${acc.accountName}</span>
                    <span class="account-row-type">${acc.accountType}</span>
                </div>
                <span class="account-row-amount">${formatCurrency(acc.balance)}</span>
            `;
            accountsList.appendChild(row);
        });
    }

    // 2. Savings Goals list
    const goalsList = document.getElementById('overview-goals-list');
    goalsList.innerHTML = '';
    
    if (globalGoals.length === 0) {
        goalsList.innerHTML = '<p class="account-row-type" style="padding: 10px; text-align: center;">No goals set yet.</p>';
    } else {
        globalGoals.forEach(goal => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
            const row = document.createElement('div');
            row.className = 'account-row-item' + (pct >= 100 ? ' success-goal' : '');
            row.style.flexDirection = 'column';
            row.style.alignItems = 'flex-start';
            row.style.gap = '8px';

            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%; font-size:13px; font-weight:700;">
                    <span class="account-row-name">${goal.goalName}</span>
                    <span class="account-row-amount" style="font-size:12px;">${formatCurrency(goal.savedAmount)} / ${formatCurrency(goal.targetAmount)}</span>
                </div>
                <div class="goal-progress-box">
                    <div class="goal-progress-bar-wrapper">
                        <div class="goal-progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
            goalsList.appendChild(row);
        });
    }

    // 3. Budgets summary row
    const budgetsList = document.getElementById('overview-budgets-list');
    budgetsList.innerHTML = '';
    
    if (globalBudgets.length === 0) {
        budgetsList.innerHTML = '<p class="account-row-type" style="padding: 10px; text-align: center; width: 100%;">No budgets configured.</p>';
    } else {
        // Take at most 3
        globalBudgets.slice(0, 3).forEach(b => {
            const spent = globalTransactions
                .filter(t => t.type === 'Expense' && t.category.toLowerCase() === b.budgetName.toLowerCase())
                .reduce((sum, t) => sum + t.amount, 0);

            const row = document.createElement('div');
            row.className = 'budget-summary-item';
            row.innerHTML = `
                <div class="goal-progress-box">
                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; margin-bottom:4px;">
                        <span class="account-row-name">${b.budgetName}</span>
                        <span class="account-row-type">${formatCurrency(spent)} / ${formatCurrency(b.monthlyLimit)}</span>
                    </div>
                    <div class="goal-progress-bar-wrapper">
                        <div class="goal-progress-bar-fill" style="width: ${Math.min((spent/b.monthlyLimit)*100, 100)}%; background-color: ${spent > b.monthlyLimit ? 'var(--danger-color)' : ''}"></div>
                    </div>
                </div>
            `;
            budgetsList.appendChild(row);
        });
    }

    // 4. Spending Breakdown Pie Chart (HTML5 Canvas)
    renderCanvasSpendingBreakdown();
}

function renderCanvasSpendingBreakdown() {
    const canvas = document.getElementById('spending-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const chartTotalLabel = document.getElementById('chart-total-spent');
    const breakdownList = document.getElementById('overview-breakdown-list');
    breakdownList.innerHTML = '';

    // Calculate spent per category
    const categorySpending = {};
    let totalSpent = 0;

    globalTransactions.forEach(t => {
        if (t.type === 'Expense') {
            const cat = t.category || 'Uncategorized';
            categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
            totalSpent += t.amount;
        }
    });

    chartTotalLabel.innerText = formatCurrency(totalSpent, 0);

    const categories = Object.keys(categorySpending).map(name => ({
        name,
        amount: categorySpending[name]
    })).sort((a,b) => b.amount - a.amount);

    if (categories.length === 0) {
        // Clear canvas and draw single gray circle
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(100, 100, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = activeTheme === 'theme-dark' ? '#1e293b' : '#ffffff';
        ctx.beginPath();
        ctx.arc(100, 100, 55, 0, Math.PI * 2);
        ctx.fill();
        
        breakdownList.innerHTML = '<p class="account-row-type" style="padding: 10px; text-align: center;">No expenses recorded.</p>';
        return;
    }

    // Draw segment arcs
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = -Math.PI / 2;
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#64748b', '#06b6d4'];

    categories.forEach((cat, idx) => {
        const percentage = cat.amount / totalSpent;
        const angle = percentage * Math.PI * 2;
        const color = colors[idx % colors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.arc(100, 100, 85, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();

        startAngle += angle;

        // Render List item row
        const pctText = (percentage * 100).toFixed(0) + '%';
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-name" style="display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${color}"></span>
                ${cat.name}
            </span>
            <span class="breakdown-value">${formatCurrency(cat.amount)} (${pctText})</span>
        `;
        breakdownList.appendChild(row);
    });

    // Draw center cutout (Donut hole)
    ctx.fillStyle = activeTheme === 'theme-dark' ? '#1e293b' : '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 100, 58, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

// ---------------- TRANSACTIONS TAB RENDERING ----------------

function renderTransactionsTab() {
    const tableBody = document.getElementById('transactions-table-body');
    tableBody.innerHTML = '';

    if (globalTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No transactions logged yet. Click "+ Add Transaction" to begin.</td></tr>';
        return;
    }



    // Render list (newest first)
    [...globalTransactions].reverse().forEach(t => {
        const tr = document.createElement('tr');
        tr.onclick = () => showReceipt(t);

        const amtClass = t.type === 'Income' ? 'text-income' : 'text-expense';
        const amtPrefix = t.type === 'Income' ? '+' : '-';

        tr.innerHTML = `
            <td><strong>${t.description}</strong></td>
            <td><span class="acc-card-type-tag" style="background:rgba(100,116,139,0.08); color:var(--text-secondary);">${t.category}</span></td>
            <td><span class="${t.type === 'Income' ? 'text-income' : 'text-expense'}" style="font-weight:700;">${t.type}</span></td>
            <td><strong class="${amtClass}">${amtPrefix} ${formatCurrency(t.amount)}</strong></td>
            <td>${t.accountName}</td>
            <td>${t.date}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function showReceipt(t) {

    
    document.getElementById('receipt-id').innerText = t.transactionId;
    document.getElementById('receipt-date').innerText = t.date;
    document.getElementById('receipt-desc').innerText = t.description;
    document.getElementById('receipt-account').innerText = t.accountName;
    document.getElementById('receipt-category').innerText = t.category;
    document.getElementById('receipt-type').innerText = t.type;
    
    const amtEl = document.getElementById('receipt-amount');
    amtEl.innerText = (t.type === 'Income' ? '+' : '-') + " " + formatCurrency(t.amount);
    amtEl.className = t.type === 'Income' ? 'text-income' : 'text-expense';

    openModal('modal-receipt');
}

// ---------------- ACCOUNTS TAB RENDERING ----------------

function renderAccountsTab() {
    const container = document.getElementById('accounts-cards-container');
    container.innerHTML = '';



    globalAccounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = 'account-card-box';
        
        // Hide delete option for "Personal Wallet" tracker
        const deleteButton = acc.accountName === 'Personal Wallet' ? '' : `
            <button class="acc-action-btn acc-btn-del" onclick="confirmDeleteAccount('${acc.accountName}')" title="Remove account">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        card.innerHTML = `
            <div class="acc-card-header">
                <div>
                    <h4 class="acc-card-name">${acc.accountName}</h4>
                    <span class="acc-card-num">${acc.accountNumber || 'No Account Number'}</span>
                </div>
                <span class="acc-card-type-tag">${acc.accountType}</span>
            </div>
            <div class="acc-card-balance">${formatCurrency(acc.balance)}</div>
            <div class="acc-card-actions">
                <button class="acc-action-btn acc-btn-dep" onclick="openAccountActionModal('${acc.accountName}', 'Deposit')">Deposit</button>
                <button class="acc-action-btn acc-btn-wit" onclick="openAccountActionModal('${acc.accountName}', 'Withdraw')">Withdraw</button>
                ${deleteButton}
            </div>
        `;
        container.appendChild(card);
    });
}

function openAccountActionModal(name, action) {
    document.getElementById('acc-action-name').value = name;
    document.getElementById('acc-action-type').value = action;
    document.getElementById('acc-action-title').innerText = `${action} funds`;
    document.getElementById('acc-action-label').innerText = `${action} amount ($) from/to ${name}`;
    document.getElementById('acc-action-amount').value = "0.00";
    document.getElementById('acc-action-submit-btn').innerText = action;
    
    openModal('modal-account-action');
}

function confirmDeleteAccount(name) {
    if (confirm(`Are you sure you want to delete the account "${name}"? all funds associated with it will be cleared.`)) {
        executeAccountDelete(name);
    }
}

async function executeAccountDelete(name) {
    try {
        const res = await fetch(`/api/data/accounts/delete?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': currentUserId },
            body: JSON.stringify({ accountName: name })
        });
        if (res.ok) {
            refreshTabData();
        }
    } catch (e) {
        console.error("Delete account error:", e);
    }
}

// ---------------- GOALS TAB RENDERING ----------------

function renderGoalsTab() {
    const container = document.getElementById('goals-list-container');
    container.innerHTML = '';

    if (globalGoals.length === 0) {
        container.innerHTML = '<div class="goal-card-box" style="justify-content: center;"><p class="account-row-type">No savings goals set. Click "+ Add Goal" to create one.</p></div>';
        return;
    }



    globalGoals.forEach(goal => {
        const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
        const card = document.createElement('div');
        card.className = 'goal-card-box';

        card.innerHTML = `
            <div class="goal-info-pane">
                <div class="goal-meta-row">
                    <span class="goal-title">${goal.goalName}</span>
                    <span class="goal-amounts">
                        Saved: <span>${formatCurrency(goal.savedAmount)}</span> / Target: <strong>${formatCurrency(goal.targetAmount)}</strong>
                    </span>
                </div>
                <div class="goal-progress-box">
                    <div class="goal-progress-bar-wrapper">
                        <div class="goal-progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
            <div class="acc-card-actions" style="margin-top: 0; width: auto; flex-shrink: 0; gap: 8px;">
                <button class="acc-action-btn acc-btn-dep" style="padding: 0 16px;" onclick="openGoalActionModal('${goal.goalId}', 'Deposit', '${goal.goalName}')">Save</button>
                <button class="acc-action-btn acc-btn-wit" style="padding: 0 16px;" onclick="openGoalActionModal('${goal.goalId}', 'Withdraw', '${goal.goalName}')">Withdraw</button>
                <button class="acc-action-btn acc-btn-del" onclick="confirmDeleteGoal('${goal.goalId}', '${goal.goalName}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openGoalActionModal(goalId, action, goalName) {
    document.getElementById('goal-action-id').value = goalId;
    document.getElementById('goal-action-type').value = action;
    document.getElementById('goal-action-title').innerText = `${action} savings for goal: ${goalName}`;
    document.getElementById('goal-action-amount').value = "0.00";
    document.getElementById('goal-action-submit-btn').innerText = action;
    
    // Set account label
    document.getElementById('goal-action-account-label').innerText = action === 'Deposit' ? 'Source Account' : 'Destination Account';

    // Populate accounts dropdown
    const select = document.getElementById('goal-action-account-select');
    select.innerHTML = '';
    globalAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.accountName;
        opt.innerText = `${acc.accountName} (Balance: $${acc.balance.toLocaleString()})`;
        select.appendChild(opt);
    });

    openModal('modal-goal-action');
}

function confirmDeleteGoal(id, name) {
    if (confirm(`Delete savings goal "${name}"? any saved money listed on this goal will not be auto-refunded to your accounts.`)) {
        executeGoalDelete(id);
    }
}

async function executeGoalDelete(goalId) {
    try {
        const res = await fetch(`/api/data/goals/delete?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': currentUserId },
            body: JSON.stringify({ goalId })
        });
        if (res.ok) {
            refreshTabData();
        }
    } catch (e) {
        console.error("Delete goal error:", e);
    }
}

// ---------------- SUBSCRIPTIONS TAB RENDERING ----------------

function renderSubscriptionsTab() {
    const container = document.getElementById('subscriptions-list-container');
    container.innerHTML = '';

    if (globalSubscriptions.length === 0) {
        container.innerHTML = '<div class="goal-card-box" style="justify-content: center;"><p class="account-row-type">No active Microsoft subscriptions listed. Click "+ Add Subscription" to track one.</p></div>';
        return;
    }



    globalSubscriptions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'goal-card-box';

        card.innerHTML = `
            <div class="goal-info-pane">
                <div class="goal-meta-row" style="align-items: center;">
                    <div style="display:flex; flex-direction:column;">
                        <span class="goal-title">${sub.subscriptionName}</span>
                        <span class="account-row-type" style="margin-top:2px;">Billing cycle: every ${sub.billingDate}</span>
                    </div>
                    <span class="goal-amounts">
                        Monthly Cost: <span>${formatCurrency(sub.monthlyCost)}</span>
                    </span>
                </div>
            </div>
            <div class="acc-card-actions" style="margin-top: 0; width: auto; flex-shrink: 0; gap: 8px;">
                <button class="acc-action-btn acc-btn-dep" style="padding: 0 16px;" onclick="openSubActionModal('${sub.subscriptionId}', 'Pay', ${sub.monthlyCost}, '${sub.subscriptionName}')">Pay</button>
                <button class="acc-action-btn acc-btn-wit" style="padding: 0 16px;" onclick="openSubActionModal('${sub.subscriptionId}', 'Refund', ${sub.monthlyCost}, '${sub.subscriptionName}')">Refund</button>
                <button class="acc-action-btn acc-btn-del" onclick="confirmDeleteSubscription('${sub.subscriptionId}', '${sub.subscriptionName}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openSubActionModal(subId, action, cost, subName) {
    document.getElementById('sub-action-id').value = subId;
    document.getElementById('sub-action-type').value = action;
    document.getElementById('sub-action-title').innerText = `${action} Subscription: ${subName}`;
    document.getElementById('sub-action-cost-label').innerText = `Amount: $${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('sub-action-submit-btn').innerText = action === 'Pay' ? 'Confirm Payment' : 'Confirm Refund';

    // Populate accounts select dropdown
    const select = document.getElementById('sub-action-account-select');
    select.innerHTML = '';
    globalAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.accountName;
        opt.innerText = `${acc.accountName} (Balance: $${acc.balance.toLocaleString()})`;
        select.appendChild(opt);
    });

    openModal('modal-sub-action');
}

function confirmDeleteSubscription(id, name) {
    if (confirm(`Remove subscription "${name}"?`)) {
        executeSubscriptionDelete(id);
    }
}

async function executeSubscriptionDelete(subscriptionId) {
    try {
        const res = await fetch(`/api/data/subscriptions/delete?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': currentUserId },
            body: JSON.stringify({ subscriptionId })
        });
        if (res.ok) {
            refreshTabData();
        }
    } catch (e) {
        console.error("Delete subscription error:", e);
    }
}

// ---------------- BUDGETS TAB RENDERING ----------------

function renderBudgetsTab() {
    const container = document.getElementById('budgets-list-container');
    container.innerHTML = '';

    if (globalBudgets.length === 0) {
        container.innerHTML = '<div class="budget-card-box" style="grid-column: 1 / -1; align-items: center;"><p class="account-row-type">No budgets configured yet. Click "Set Budget" to define category limits.</p></div>';
        return;
    }



    globalBudgets.forEach(b => {
        const spent = globalTransactions
            .filter(t => t.type === 'Expense' && t.category.toLowerCase() === b.budgetName.toLowerCase())
            .reduce((sum, t) => sum + t.amount, 0);

        const pct = b.monthlyLimit > 0 ? Math.min((spent / b.monthlyLimit) * 100, 100) : 0;
        const card = document.createElement('div');
        card.className = 'budget-card-box';

        const barColorStyle = spent > b.monthlyLimit ? 'background-color: var(--danger-color);' : '';
        const limitReachedAlert = spent > b.monthlyLimit ? '<span class="acc-card-type-tag" style="background:rgba(239,68,68,0.1); color:var(--danger-color); margin-top:2px;">Limit Exceeded</span>' : '';

        card.innerHTML = `
            <div class="budget-card-meta">
                <div>
                    <span class="budget-card-category">${b.budgetName}</span>
                    <div class="budget-card-amounts">
                        Spent: <strong>${formatCurrency(spent)}</strong> / Limit: <span>${formatCurrency(b.monthlyLimit)}</span>
                    </div>
                </div>
                ${limitReachedAlert}
            </div>
            
            <div class="goal-progress-box" style="margin-top: 10px;">
                <div class="goal-progress-bar-wrapper">
                    <div class="goal-progress-bar-fill" style="width: ${pct}%; ${barColorStyle}"></div>
                </div>
            </div>
            
            <div class="budget-btn-row">
                <button class="acc-action-btn acc-btn-wit" style="border-radius:6px; height:34px;" onclick="confirmDeleteBudget('${b.budgetName}')">Remove</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function confirmDeleteBudget(category) {
    if (confirm(`Remove budget limits for category "${category}"?`)) {
        executeBudgetDelete(category);
    }
}

async function executeBudgetDelete(category) {
    try {
        const res = await fetch(`/api/data/budgets/delete?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': currentUserId },
            body: JSON.stringify({ budgetName: category })
        });
        if (res.ok) {
            refreshTabData();
        }
    } catch (e) {
        console.error("Delete budget error:", e);
    }
}

// ---------------- MODAL MANAGEMENT UTILITIES ----------------

function openModal(modalId) {
    document.getElementById('modal-backdrop').style.display = 'block';
    document.getElementById(modalId).style.display = 'flex';
}

function closeAllModals() {
    document.getElementById('modal-backdrop').style.display = 'none';
    const modals = document.querySelectorAll('.modal-box');
    modals.forEach(m => m.style.display = 'none');
}

// Check custom name triggers in options selects
function checkCustomAccountName(selectEl) {
    const input = document.getElementById('acc-name-custom');
    if (selectEl.value === 'custom') {
        input.style.display = 'block';
        input.required = true;
    } else {
        input.style.display = 'none';
        input.required = false;
    }
}

function checkCustomSubscriptionName(selectEl) {
    const input = document.getElementById('sub-name-custom');
    if (selectEl.value === 'custom') {
        input.style.display = 'block';
        input.required = true;
    } else {
        input.style.display = 'none';
        input.required = false;
    }
}

// Specific open triggers
function openAddAccountModal() {
    document.getElementById('form-add-account').reset();
    document.getElementById('acc-name-custom').style.display = 'none';
    openModal('modal-add-account');
}

function openAddTransactionModal() {
    document.getElementById('form-add-transaction').reset();
    
    // Populate account selector
    const select = document.getElementById('txn-account-select');
    select.innerHTML = '';
    
    globalAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.accountName;
        opt.innerText = `${acc.accountName} (Balance: $${acc.balance.toLocaleString()})`;
        select.appendChild(opt);
    });

    openModal('modal-add-transaction');
}

function openAddGoalModal() {
    document.getElementById('form-add-goal').reset();
    openModal('modal-add-goal');
}

function openAddSubscriptionModal() {
    document.getElementById('form-add-subscription').reset();
    document.getElementById('sub-name-custom').style.display = 'none';
    openModal('modal-add-subscription');
}

function openSetBudgetModal() {
    document.getElementById('form-set-budget').reset();
    openModal('modal-set-budget');
}

function openWalletDialog(action) {
    // Treat wallet action as normal account action on "Personal Wallet"
    openAccountActionModal("Personal Wallet", action);
}

// ---------------- THEMES CONFIGURATION ----------------

function changeTheme(themeName) {
    const body = document.body;
    body.className = ''; // remove current theme
    body.classList.add(themeName);
    
    // Save selection locally
    localStorage.setItem('sora_theme', themeName);
    activeTheme = themeName;

    // Update active circle in Settings
    const circles = document.querySelectorAll('.theme-circle');
    circles.forEach(c => {
        if (c.classList.contains(`color-${themeName.split('-')[1]}`)) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });

    // Refresh chart canvas background
    if (currentTab === 'overview') {
        renderCanvasSpendingBreakdown();
    }
}

// Load pre-selected theme
if (localStorage.getItem('sora_theme')) {
    activeTheme = localStorage.getItem('sora_theme');
    document.body.className = activeTheme;
}

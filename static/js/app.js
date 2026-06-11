// ---------------- APPLICATION LIFE CYCLE & COORDINATION ----------------

document.addEventListener('DOMContentLoaded', () => {
    // Reveal Welcome Animation
    setTimeout(() => {
        const overlay = document.getElementById('welcome-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }, 2000); // Fades out after 2 seconds

    // Automatically load default judge profile to bypass login screens
    const defaultUser = {
        userId: "USR-GUEST",
        firstName: "Hackathon",
        lastName: "Judge",
        email: "judge@agentsleague.com"
    };
    
    // Initialize session and load dashboard
    enterDashboard(defaultUser);
    bindFormSubmissions();
});

function enterDashboard(user) {
    currentUserId = user.userId;
    
    // Display names
    document.getElementById('user-display-name').innerText = user.firstName;
    
    // Pre-fill profile settings
    document.getElementById('settings-firstname').value = user.firstName;
    document.getElementById('settings-lastname').value = user.lastName;

    // Load active theme
    const savedTheme = localStorage.getItem('sora_theme') || 'theme-blue';
    changeTheme(savedTheme);

    // Load Overview tab by default
    showTab('overview');
}

// RESTORE DEFAULT DATABASE MOCK RECORDS
async function resetMockData() {
    if (confirm("Reset all financial accounts and log details back to the default mock database values?")) {
        try {
            const res = await fetch('/api/data/reset', {
                method: 'POST',
                headers: { 'Authorization': currentUserId }
            });
            const data = await res.json();
            alert(data.message || "Database reset successful!");
            refreshTabData();
        } catch (e) {
            console.error("Failed to reset mock data:", e);
            alert("Error communicating with server to reset database.");
        }
    }
}

// ---------------- FORM SUBMISSION POST REQUESTS ----------------

function bindFormSubmissions() {
    const formatAuthHeader = () => ({ 'Authorization': currentUserId, 'Content-Type': 'application/json' });

    // 1. Add Account
    document.getElementById('form-add-account').addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectName = document.getElementById('acc-name-select').value;
        const customName = document.getElementById('acc-name-custom').value.trim();
        const accountName = selectName === 'custom' ? customName : selectName;

        const accountType = document.getElementById('acc-type').value;
        const balance = parseFloat(document.getElementById('acc-balance').value) || 0;
        const accountNumber = document.getElementById('acc-number').value.trim();

        try {
            const res = await fetch(`/api/data/accounts?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ accountName, accountType, balance, accountNumber })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to add account.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Account creation failed:", err);
        }
    });

    // 2. Account Action (Deposit / Withdraw)
    document.getElementById('form-account-action').addEventListener('submit', async (e) => {
        e.preventDefault();
        const accountName = document.getElementById('acc-action-name').value;
        const action = document.getElementById('acc-action-type').value;
        const amount = parseFloat(document.getElementById('acc-action-amount').value) || 0;

        try {
            const res = await fetch(`/api/data/accounts/action?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ accountName, action, amount })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to execute account transaction.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Account action failed:", err);
        }
    });

    // 3. Add Transaction
    document.getElementById('form-add-transaction').addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = document.getElementById('txn-desc').value.trim();
        const category = document.getElementById('txn-category').value.trim();
        const type = document.getElementById('txn-type').value;
        const amount = parseFloat(document.getElementById('txn-amount').value) || 0;
        const accountName = document.getElementById('txn-account-select').value;

        try {
            const res = await fetch(`/api/data/transactions?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ description, category, type, amount, accountName })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to log transaction.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Transaction logger failed:", err);
        }
    });

    // 4. Add Savings Goal
    document.getElementById('form-add-goal').addEventListener('submit', async (e) => {
        e.preventDefault();
        const goalName = document.getElementById('goal-name').value.trim();
        const targetAmount = parseFloat(document.getElementById('goal-target').value) || 0;
        const savedAmount = parseFloat(document.getElementById('goal-saved').value) || 0;

        try {
            const res = await fetch(`/api/data/goals?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ goalName, targetAmount, savedAmount })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to set goal.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Goal logger failed:", err);
        }
    });

    // 5. Goal Action (Deposit / Withdraw)
    document.getElementById('form-goal-action').addEventListener('submit', async (e) => {
        e.preventDefault();
        const goalId = document.getElementById('goal-action-id').value;
        const action = document.getElementById('goal-action-type').value;
        const amount = parseFloat(document.getElementById('goal-action-amount').value) || 0;
        const accountName = document.getElementById('goal-action-account-select').value;

        const endpoint = action === 'Deposit' ? '/api/data/goals/deposit' : '/api/data/goals/withdraw';

        try {
            const res = await fetch(`${endpoint}?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ goalId, accountName, amount })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to modify savings goal balance.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Goal action failed:", err);
        }
    });

    // 6. Add Subscription
    document.getElementById('form-add-subscription').addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectName = document.getElementById('sub-name-select').value;
        const customName = document.getElementById('sub-name-custom').value.trim();
        const subscriptionName = selectName === 'custom' ? customName : selectName;

        const monthlyCost = parseFloat(document.getElementById('sub-cost').value) || 0;
        const billingDate = document.getElementById('sub-billing-date').value.trim();

        try {
            const res = await fetch(`/api/data/subscriptions?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ subscriptionName, monthlyCost, billingDate })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to add subscription.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Subscription logger failed:", err);
        }
    });

    // 7. Subscription Actions (Pay / Refund)
    document.getElementById('form-sub-action').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subscriptionId = document.getElementById('sub-action-id').value;
        const action = document.getElementById('sub-action-type').value;
        const accountName = document.getElementById('sub-action-account-select').value;

        const endpoint = action === 'Pay' ? '/api/data/subscriptions/pay' : '/api/data/subscriptions/refund';

        try {
            const res = await fetch(`${endpoint}?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ subscriptionId, accountName })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to complete subscription transaction.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Subscription action failed:", err);
        }
    });

    // 8. Set Budget Limits
    document.getElementById('form-set-budget').addEventListener('submit', async (e) => {
        e.preventDefault();
        const budgetName = document.getElementById('budget-category').value.trim();
        const monthlyLimit = parseFloat(document.getElementById('budget-limit').value) || 0;

        try {
            const res = await fetch(`/api/data/budgets?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ budgetName, monthlyLimit })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to save budget limit.");
                return;
            }

            closeAllModals();
            refreshTabData();
        } catch (err) {
            console.error("Budget logger failed:", err);
        }
    });

    // 9. Profile Settings Update
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('settings-firstname').value.trim();
        const lastName = document.getElementById('settings-lastname').value.trim();

        try {
            const res = await fetch(`/api/data/profile?userId=${currentUserId}`, {
                method: 'POST',
                headers: formatAuthHeader(),
                body: JSON.stringify({ firstName, lastName })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to update profile.");
                return;
            }

            // Update user display header
            document.getElementById('user-display-name').innerText = data.firstName;
            alert("Profile settings saved successfully!");
            refreshTabData();

        } catch (err) {
            console.error("Profile update failed:", err);
        }
    });
}

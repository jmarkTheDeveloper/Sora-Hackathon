import os
import json
import re
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load optional Azure credentials if they exist
load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DOCS_DIR = os.path.join(os.path.dirname(__file__), 'foundry_iq_docs')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

# Helper: Load files
def load_json_file(filename, default_val):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default_val

# Helper: Save files
def save_json_file(filename, data):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# Helper: Pre-fill guest data
def init_guest_data(user_id="USR-GUEST"):
    acc_file = f'accounts_{user_id}.json'
    txn_file = f'transactions_{user_id}.json'
    goal_file = f'goals_{user_id}.json'
    sub_file = f'subscriptions_{user_id}.json'
    bud_file = f'budgets_{user_id}.json'

    # Pre-populate Accounts
    if not os.path.exists(os.path.join(DATA_DIR, acc_file)):
        accounts = [
            {"accountName": "Azure Credits Wallet", "accountType": "Credit Card", "balance": 450.00, "accountNumber": "AZ-CREDS-500"},
            {"accountName": "Work IQ Ledger", "accountType": "Savings Account", "balance": 12450.00, "accountNumber": "WORK-IQ-778"},
            {"accountName": "Microsoft Fabric Capacity Credits", "accountType": "Credit Card", "balance": 5500.00, "accountNumber": "FAB-CAP-64"},
            {"accountName": "Microsoft Pay (Corporate)", "accountType": "Checking Account", "balance": 1500.00, "accountNumber": "MS-PAY-009"},
            {"accountName": "Personal Wallet", "accountType": "Tracker", "balance": 2000.00, "accountNumber": "TRACKER-001"}
        ]
        save_json_file(acc_file, accounts)

    # Pre-populate Transactions
    if not os.path.exists(os.path.join(DATA_DIR, txn_file)):
        txns = [
            {"transactionId": "TXN-1", "description": "Work IQ Performance Allowance", "category": "Salary", "amount": 5000.00, "date": "2026-06-01", "type": "Income", "accountName": "Work IQ Ledger"},
            {"transactionId": "TXN-2", "description": "M365 Copilot Licensing", "category": "Subscriptions", "amount": 30.00, "date": "2026-06-02", "type": "Expense", "accountName": "Microsoft Pay (Corporate)"},
            {"transactionId": "TXN-3", "description": "Azure GPU VM Allocation", "category": "Azure", "amount": 50.00, "date": "2026-06-05", "type": "Expense", "accountName": "Azure Credits Wallet"},
            {"transactionId": "TXN-4", "description": "GitHub Copilot Pro+ Plan", "category": "Subscriptions", "amount": 39.00, "date": "2026-06-08", "type": "Expense", "accountName": "Work IQ Ledger"},
            {"transactionId": "TXN-5", "description": "Deposited Savings", "category": "Goals", "amount": 200.00, "date": "2026-06-10", "type": "Expense", "accountName": "Work IQ Ledger"}
        ]
        save_json_file(txn_file, txns)

    # Pre-populate Goals
    if not os.path.exists(os.path.join(DATA_DIR, goal_file)):
        goals = [
            {"goalId": "GOAL-1", "goalName": "Annual Copilot Bundle", "targetAmount": 2000.00, "savedAmount": 800.00},
            {"goalId": "GOAL-2", "goalName": "Team Wellness Retreat", "targetAmount": 1500.00, "savedAmount": 1500.00}
        ]
        save_json_file(goal_file, goals)

    # Pre-populate Subscriptions
    if not os.path.exists(os.path.join(DATA_DIR, sub_file)):
        subs = [
            {"subscriptionId": "SUB-1", "subscriptionName": "Microsoft 365 Copilot (Enterprise)", "monthlyCost": 30.00, "billingDate": "1st", "status": "Active"},
            {"subscriptionId": "SUB-2", "subscriptionName": "GitHub Copilot Pro+", "monthlyCost": 39.00, "billingDate": "12th", "status": "Active"},
            {"subscriptionId": "SUB-3", "subscriptionName": "Xbox Game Pass Ultimate", "monthlyCost": 19.99, "billingDate": "20th", "status": "Active"}
        ]
        save_json_file(sub_file, subs)

    # Pre-populate Budgets
    if not os.path.exists(os.path.join(DATA_DIR, bud_file)):
        budgets = [
            {"budgetName": "Azure", "monthlyLimit": 500.00},
            {"budgetName": "Subscriptions", "monthlyLimit": 150.00},
            {"budgetName": "Office", "monthlyLimit": 200.00}
        ]
        save_json_file(bud_file, budgets)

# Initialize Guest Database at boot
init_guest_data()

# ---------------- STATIC FILE ROUTES ----------------

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# ---------------- ADMIN / RESET API ----------------

@app.route('/api/data/reset', methods=['POST'])
def reset_data():
    user_id = "USR-GUEST"
    for f in [f'accounts_{user_id}.json', f'transactions_{user_id}.json', f'goals_{user_id}.json', f'subscriptions_{user_id}.json', f'budgets_{user_id}.json']:
        filepath = os.path.join(DATA_DIR, f)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass
    init_guest_data(user_id)
    return jsonify({"success": True, "message": "Database reset to mock defaults!"})

# ---------------- DASHBOARD API ENDPOINTS ----------------

# ACCOUNTS CRUD
@app.route('/api/data/accounts', methods=['GET', 'POST'])
def handle_accounts():
    user_id = "USR-GUEST" # Always fallback to default guest user
    filename = f'accounts_{user_id}.json'
    accounts = load_json_file(filename, [])

    if request.method == 'GET':
        return jsonify(accounts)

    # POST - Add Account
    data = request.json or {}
    name = data.get('accountName', '').strip()
    acc_type = data.get('accountType', '').strip()
    balance = float(data.get('balance', 0))
    acc_num = data.get('accountNumber', '').strip()

    if not name or not acc_type:
        return jsonify({"error": "Account Name and Type are required"}), 400

    # Avoid duplicate account names
    for a in accounts:
        if a['accountName'].lower() == name.lower():
            return jsonify({"error": "Account name already exists"}), 400

    new_acc = {
        "accountName": name,
        "accountType": acc_type,
        "balance": balance,
        "accountNumber": acc_num
    }
    accounts.append(new_acc)
    save_json_file(filename, accounts)
    return jsonify(new_acc), 201

@app.route('/api/data/accounts/delete', methods=['POST'])
def delete_account():
    user_id = "USR-GUEST"
    data = request.json or {}
    name = data.get('accountName', '')

    filename = f'accounts_{user_id}.json'
    accounts = load_json_file(filename, [])
    accounts = [a for a in accounts if a['accountName'] != name or name == "Personal Wallet"]

    save_json_file(filename, accounts)
    return jsonify({"success": True})

@app.route('/api/data/accounts/action', methods=['POST'])
def account_action():
    user_id = "USR-GUEST"
    data = request.json or {}
    name = data.get('accountName')
    action = data.get('action') # 'Deposit' or 'Withdraw'
    amount = float(data.get('amount', 0))

    if amount <= 0 or not name:
        return jsonify({"error": "Invalid fields"}), 400

    filename = f'accounts_{user_id}.json'
    accounts = load_json_file(filename, [])

    target_acc = None
    for a in accounts:
        if a['accountName'] == name:
            target_acc = a
            break

    if not target_acc:
        return jsonify({"error": "Account not found"}), 404

    txn_id = "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000))
    date_str = datetime.date.today().isoformat()

    if action == "Withdraw":
        if target_acc['balance'] < amount:
            return jsonify({"error": "Insufficient funds"}), 400
        target_acc['balance'] -= amount
        # Record transaction
        txns = load_json_file(f'transactions_{user_id}.json', [])
        txns.append({
            "transactionId": txn_id,
            "description": f"Withdrawal from {name}",
            "category": "Withdrawal",
            "amount": amount,
            "date": date_str,
            "type": "Expense",
            "accountName": name
        })
        save_json_file(f'transactions_{user_id}.json', txns)
    elif action == "Deposit":
        target_acc['balance'] += amount
        # Record transaction
        txns = load_json_file(f'transactions_{user_id}.json', [])
        txns.append({
            "transactionId": txn_id,
            "description": f"Deposit to {name}",
            "category": "Income",
            "amount": amount,
            "date": date_str,
            "type": "Income",
            "accountName": name
        })
        save_json_file(f'transactions_{user_id}.json', txns)
    else:
        return jsonify({"error": "Invalid action"}), 400

    save_json_file(filename, accounts)
    return jsonify(target_acc)

# TRANSACTIONS CRUD
@app.route('/api/data/transactions', methods=['GET', 'POST'])
def handle_transactions():
    user_id = "USR-GUEST"
    filename = f'transactions_{user_id}.json'
    txns = load_json_file(filename, [])

    if request.method == 'GET':
        return jsonify(txns)

    # POST - Add Transaction
    data = request.json or {}
    desc = data.get('description', '').strip()
    category = data.get('category', '').strip()
    txn_type = data.get('type') # 'Income' or 'Expense'
    amount = float(data.get('amount', 0))
    account_name = data.get('accountName')

    if not desc or not category or not txn_type or amount <= 0 or not account_name:
        return jsonify({"error": "Invalid transaction fields"}), 400

    # Modify associated account balance
    acc_filename = f'accounts_{user_id}.json'
    accounts = load_json_file(acc_filename, [])
    target_acc = None
    for a in accounts:
        if a['accountName'] == account_name:
            target_acc = a
            break

    if not target_acc:
        return jsonify({"error": "Selected account does not exist"}), 400

    if txn_type == "Expense":
        if target_acc['balance'] < amount:
            return jsonify({"error": "Insufficient funds in account"}), 400
        target_acc['balance'] -= amount
    else:
        target_acc['balance'] += amount

    # Save account modifications
    save_json_file(acc_filename, accounts)

    new_txn = {
        "transactionId": "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "description": desc,
        "category": category,
        "amount": amount,
        "date": datetime.date.today().isoformat(),
        "type": txn_type,
        "accountName": account_name
    }
    txns.append(new_txn)
    save_json_file(filename, txns)
    return jsonify(new_txn), 201

# GOALS CRUD & SAVINGS MANIPULATIONS
@app.route('/api/data/goals', methods=['GET', 'POST'])
def handle_goals():
    user_id = "USR-GUEST"
    filename = f'goals_{user_id}.json'
    goals = load_json_file(filename, [])

    if request.method == 'GET':
        return jsonify(goals)

    # POST - Add Goal
    data = request.json or {}
    name = data.get('goalName', '').strip()
    target_amount = float(data.get('targetAmount', 0))
    saved_amount = float(data.get('savedAmount', 0))

    if not name or target_amount <= 0:
        return jsonify({"error": "Goal name and positive target amount are required"}), 400

    new_goal = {
        "goalId": "GOAL-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "goalName": name,
        "targetAmount": target_amount,
        "savedAmount": saved_amount
    }
    goals.append(new_goal)
    save_json_file(filename, goals)
    return jsonify(new_goal), 201

@app.route('/api/data/goals/delete', methods=['POST'])
def delete_goal():
    user_id = "USR-GUEST"
    data = request.json or {}
    goal_id = data.get('goalId')

    filename = f'goals_{user_id}.json'
    goals = load_json_file(filename, [])
    goals = [g for g in goals if g['goalId'] != goal_id]

    save_json_file(filename, goals)
    return jsonify({"success": True})

@app.route('/api/data/goals/deposit', methods=['POST'])
def goal_deposit():
    user_id = "USR-GUEST"
    data = request.json or {}
    goal_id = data.get('goalId')
    account_name = data.get('accountName')
    amount = float(data.get('amount', 0))

    if not goal_id or not account_name or amount <= 0:
        return jsonify({"error": "Missing fields"}), 400

    acc_filename = f'accounts_{user_id}.json'
    accounts = load_json_file(acc_filename, [])
    target_acc = None
    for a in accounts:
        if a['accountName'] == account_name:
            target_acc = a
            break

    if not target_acc or target_acc['balance'] < amount:
        return jsonify({"error": "Insufficient funds in chosen account"}), 400

    goals_filename = f'goals_{user_id}.json'
    goals = load_json_file(goals_filename, [])
    target_goal = None
    for g in goals:
        if g['goalId'] == goal_id:
            target_goal = g
            break

    if not target_goal:
        return jsonify({"error": "Goal not found"}), 404

    # Perform deposit
    target_acc['balance'] -= amount
    target_goal['savedAmount'] += amount

    # Record Transaction
    txns = load_json_file(f'transactions_{user_id}.json', [])
    txns.append({
        "transactionId": "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "description": f"Savings Goal Deposit: {target_goal['goalName']}",
        "category": "Goals",
        "amount": amount,
        "date": datetime.date.today().isoformat(),
        "type": "Expense",
        "accountName": account_name
    })

    save_json_file(acc_filename, accounts)
    save_json_file(goals_filename, goals)
    save_json_file(f'transactions_{user_id}.json', txns)

    return jsonify({"success": True, "goal": target_goal, "account": target_acc})

@app.route('/api/data/goals/withdraw', methods=['POST'])
def goal_withdraw():
    user_id = "USR-GUEST"
    data = request.json or {}
    goal_id = data.get('goalId')
    account_name = data.get('accountName')
    amount = float(data.get('amount', 0))

    if not goal_id or not account_name or amount <= 0:
        return jsonify({"error": "Missing fields"}), 400

    goals_filename = f'goals_{user_id}.json'
    goals = load_json_file(goals_filename, [])
    target_goal = None
    for g in goals:
        if g['goalId'] == goal_id:
            target_goal = g
            break

    if not target_goal or target_goal['savedAmount'] < amount:
        return jsonify({"error": "Insufficient funds in chosen goal"}), 400

    acc_filename = f'accounts_{user_id}.json'
    accounts = load_json_file(acc_filename, [])
    target_acc = None
    for a in accounts:
        if a['accountName'] == account_name:
            target_acc = a
            break

    if not target_acc:
        return jsonify({"error": "Account not found"}), 404

    # Perform withdrawal
    target_goal['savedAmount'] -= amount
    target_acc['balance'] += amount

    # Record Transaction
    txns = load_json_file(f'transactions_{user_id}.json', [])
    txns.append({
        "transactionId": "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "description": f"Savings Goal Withdrawal: {target_goal['goalName']}",
        "category": "Goals",
        "amount": amount,
        "date": datetime.date.today().isoformat(),
        "type": "Income",
        "accountName": account_name
    })

    save_json_file(acc_filename, accounts)
    save_json_file(goals_filename, goals)
    save_json_file(f'transactions_{user_id}.json', txns)

    return jsonify({"success": True, "goal": target_goal, "account": target_acc})

# SUBSCRIPTIONS CRUD & ACTIONS
@app.route('/api/data/subscriptions', methods=['GET', 'POST'])
def handle_subscriptions():
    user_id = "USR-GUEST"
    filename = f'subscriptions_{user_id}.json'
    subs = load_json_file(filename, [])

    if request.method == 'GET':
        return jsonify(subs)

    # POST - Add Subscription
    data = request.json or {}
    name = data.get('subscriptionName', '').strip()
    cost = float(data.get('monthlyCost', 0))
    billing_date = data.get('billingDate', '1st').strip()

    if not name or cost <= 0:
        return jsonify({"error": "Subscription name and cost are required"}), 400

    new_sub = {
        "subscriptionId": "SUB-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "subscriptionName": name,
        "monthlyCost": cost,
        "billingDate": billing_date,
        "status": "Active"
    }
    subs.append(new_sub)
    save_json_file(filename, subs)
    return jsonify(new_sub), 201

@app.route('/api/data/subscriptions/delete', methods=['POST'])
def delete_subscription():
    user_id = "USR-GUEST"
    data = request.json or {}
    sub_id = data.get('subscriptionId')

    filename = f'subscriptions_{user_id}.json'
    subs = load_json_file(filename, [])
    subs = [s for s in subs if s['subscriptionId'] != sub_id]

    save_json_file(filename, subs)
    return jsonify({"success": True})

@app.route('/api/data/subscriptions/pay', methods=['POST'])
def pay_subscription():
    user_id = "USR-GUEST"
    data = request.json or {}
    sub_id = data.get('subscriptionId')
    account_name = data.get('accountName')

    if not sub_id or not account_name:
        return jsonify({"error": "Missing fields"}), 400

    subs_filename = f'subscriptions_{user_id}.json'
    subs = load_json_file(subs_filename, [])
    target_sub = None
    for s in subs:
        if s['subscriptionId'] == sub_id:
            target_sub = s
            break

    if not target_sub:
        return jsonify({"error": "Subscription not found"}), 404

    acc_filename = f'accounts_{user_id}.json'
    accounts = load_json_file(acc_filename, [])
    target_acc = None
    for a in accounts:
        if a['accountName'] == account_name:
            target_acc = a
            break

    cost = target_sub['monthlyCost']
    if not target_acc or target_acc['balance'] < cost:
        return jsonify({"error": "Insufficient funds in chosen account"}), 400

    # Perform pay
    target_acc['balance'] -= cost

    # Record transaction
    txns = load_json_file(f'transactions_{user_id}.json', [])
    txns.append({
        "transactionId": "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "description": f"Subscription Payment: {target_sub['subscriptionName']}",
        "category": "Subscriptions",
        "amount": cost,
        "date": datetime.date.today().isoformat(),
        "type": "Expense",
        "accountName": account_name
    })

    save_json_file(acc_filename, accounts)
    save_json_file(f'transactions_{user_id}.json', txns)
    return jsonify({"success": True, "account": target_acc})

@app.route('/api/data/subscriptions/refund', methods=['POST'])
def refund_subscription():
    user_id = "USR-GUEST"
    data = request.json or {}
    sub_id = data.get('subscriptionId')
    account_name = data.get('accountName')

    if not sub_id or not account_name:
        return jsonify({"error": "Missing fields"}), 400

    subs_filename = f'subscriptions_{user_id}.json'
    subs = load_json_file(subs_filename, [])
    target_sub = None
    for s in subs:
        if s['subscriptionId'] == sub_id:
            target_sub = s
            break

    if not target_sub:
        return jsonify({"error": "Subscription not found"}), 404

    acc_filename = f'accounts_{user_id}.json'
    accounts = load_json_file(acc_filename, [])
    target_acc = None
    for a in accounts:
        if a['accountName'] == account_name:
            target_acc = a
            break

    if not target_acc:
        return jsonify({"error": "Account not found"}), 404

    cost = target_sub['monthlyCost']

    # Perform refund
    target_acc['balance'] += cost

    # Record transaction
    txns = load_json_file(f'transactions_{user_id}.json', [])
    txns.append({
        "transactionId": "TXN-" + str(int(datetime.datetime.now().timestamp() * 1000)),
        "description": f"Subscription Refund: {target_sub['subscriptionName']}",
        "category": "Subscriptions",
        "amount": cost,
        "date": datetime.date.today().isoformat(),
        "type": "Income",
        "accountName": account_name
    })

    save_json_file(acc_filename, accounts)
    save_json_file(f'transactions_{user_id}.json', txns)
    return jsonify({"success": True, "account": target_acc})

# BUDGETS CRUD
@app.route('/api/data/budgets', methods=['GET', 'POST'])
def handle_budgets():
    user_id = "USR-GUEST"
    filename = f'budgets_{user_id}.json'
    budgets = load_json_file(filename, [])

    if request.method == 'GET':
        return jsonify(budgets)

    # POST - Add/Set Budget
    data = request.json or {}
    name = data.get('budgetName', '').strip()
    limit = float(data.get('monthlyLimit', 0))

    if not name or limit <= 0:
        return jsonify({"error": "Budget category and limit are required"}), 400

    # Overwrite if exists, otherwise append
    exists = False
    for b in budgets:
        if b['budgetName'].lower() == name.lower():
            b['monthlyLimit'] = limit
            exists = True
            break

    if not exists:
        budgets.append({
            "budgetName": name,
            "monthlyLimit": limit
        })

    save_json_file(filename, budgets)
    return jsonify({"budgetName": name, "monthlyLimit": limit}), 201

@app.route('/api/data/budgets/delete', methods=['POST'])
def delete_budget():
    user_id = "USR-GUEST"
    data = request.json or {}
    name = data.get('budgetName')

    filename = f'budgets_{user_id}.json'
    budgets = load_json_file(filename, [])
    budgets = [b for b in budgets if b['budgetName'] != name]

    save_json_file(filename, budgets)
    return jsonify({"success": True})

# PROFILE UPDATE
@app.route('/api/data/profile', methods=['POST'])
def update_profile():
    # Allow local mock updating
    data = request.json or {}
    first_name = data.get('firstName', 'Hackathon').strip()
    last_name = data.get('lastName', 'Judge').strip()
    return jsonify({
        "userId": "USR-GUEST",
        "firstName": first_name,
        "lastName": last_name,
        "email": "judge@agentsleague.com"
    }), 200

# ---------------- SORA AI AGENT (FOUNDRY IQ ENGINE) ----------------

# Simple keyword matching search over local foundry_iq_docs folder
def search_foundry_iq_docs(query):
    query_words = set(re.findall(r'\w+', query.lower()))
    matches = []
    
    if not os.path.exists(DOCS_DIR):
        return matches

    for file_name in os.listdir(DOCS_DIR):
        if not file_name.endswith('.txt'):
            continue
        filepath = os.path.join(DOCS_DIR, file_name)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
                for idx, p in enumerate(paragraphs):
                    p_words = set(re.findall(r'\w+', p.lower()))
                    intersection = query_words.intersection(p_words)
                    score = len(intersection)
                    if score > 0:
                        matches.append({
                            "source": f"foundry_iq_docs/{file_name}",
                            "passage": p,
                            "score": score
                        })
        except Exception as e:
            print(f"Error reading doc {file_name}: {e}")

    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches[:2]

@app.route('/api/agent/advise', methods=['POST'])
def agent_advise():
    user_id = "USR-GUEST"
    data = request.json or {}
    user_prompt = data.get('user_prompt', 'Give me general financial advice.').strip()

    # Load current user financial context
    accounts = load_json_file(f'accounts_{user_id}.json', [])
    txns = load_json_file(f'transactions_{user_id}.json', [])
    
    total_balance = sum(a['balance'] for a in accounts)
    total_income = sum(t['amount'] for t in txns if t['type'] == 'Income')
    total_spent = sum(t['amount'] for t in txns if t['type'] == 'Expense')
    user_name = "Hackathon Judge"

    # Build search steps for Foundry IQ visualization
    search_steps = [
        "Foundry IQ: Initializing agentic search workflow...",
        "Foundry IQ: Connecting local document databases...",
        f"Foundry IQ: Enforcing permissions for user '{user_name}'..."
    ]

    matches = search_foundry_iq_docs(user_prompt)
    citations = []
    retrieved_passages = []

    if matches:
        search_steps.append(f"Foundry IQ: Scanning files in folder 'foundry_iq_docs/'...")
        for m in matches:
            source = m['source']
            search_steps.append(f"Foundry IQ: Found matching passage in '{os.path.basename(source)}' with score {m['score']}.")
            citations.append(source)
            retrieved_passages.append(m['passage'])
        search_steps.append("Foundry IQ: Grounding answer with matching citations.")
    else:
        search_steps.append("Foundry IQ: Scanning documents completed. No direct matches found.")
        search_steps.append("Foundry IQ: Defaulting to user financial context.")

    # Try calling Azure OpenAI if configured
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4")

    if api_key and endpoint:
        try:
            from openai import AzureOpenAI
            client = AzureOpenAI(
                api_key=api_key,
                api_version="2023-05-15",
                azure_endpoint=endpoint
            )
            
            system_prompt = f"""
            You are the 'Sora Agent', a friendly and protective AI financial assistant for {user_name}.
            Current Financial State:
            - Total Balance: ${total_balance:,.2f}
            - Total Income: ${total_income:,.2f}
            - Total Spent: ${total_spent:,.2f}
            """
            
            if retrieved_passages:
                system_prompt += "\nHere is grounded information retrieved from your files:\n"
                for idx, passg in enumerate(retrieved_passages):
                    system_prompt += f"Context {idx+1}: {passg}\n"
                system_prompt += "\nRespond to the user's question directly, strictly grounding your advice in the provided contexts. Mention details from the context."
            else:
                system_prompt += "\nNo context found. Give generic helpful personal finance advice."

            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            advice = response.choices[0].message.content.strip()
            return jsonify({
                "advice": advice,
                "citations": list(set(citations)),
                "retrieved_passages": retrieved_passages,
                "search_steps": search_steps,
                "using_azure_openai": True
            })
        except Exception as ex:
            search_steps.append(f"Azure OpenAI Error: {str(ex)}. Falling back to local offline response composer.")

    # Local Offline Response Composer (Determinstic fallback)
    search_steps.append("Foundry IQ: Compiling response locally.")
    
    prompt_lower = user_prompt.lower()
    advice = ""

    if "azure" in prompt_lower or "credit" in prompt_lower or "limit" in prompt_lower:
        azure_bal = 0.0
        for a in accounts:
            if "azure" in a['accountName'].lower():
                azure_bal = a['balance']
                break
        
        advice = f"Hello! According to the Azure Credits Policy, we receive $500 monthly. Your current Azure Wallet balance is ${azure_bal:,.2f}. "
        if azure_bal < 50:
            advice += "WARNING: Your balance is below the critical $50 limit! You should immediately suspend high-compute deployments to avoid service suspension. Let's submit a request to top up!"
        else:
            advice += "Your balance is currently healthy, but remember to request a replenishment 48 hours before any scheduled heavy builds!"
            
    elif "copilot" in prompt_lower or "m365" in prompt_lower or "pricing" in prompt_lower or "cost" in prompt_lower:
        advice = f"Hello. Based on the Microsoft Tools Guide, M365 Copilot is $30/month and GitHub Copilot Pro+ is $39/month. "
        active_copilot = any("copilot" in s['subscriptionName'].lower() or "365" in s['subscriptionName'].lower() for s in load_json_file(f'subscriptions_{user_id}.json', []))
        
        if active_copilot:
            advice += "I see you have active Copilot subscriptions. Remember that M365 licenses can be reassigned dynamically to active users to reduce team expenses!"
        else:
            advice += "I recommend adding GitHub Copilot Pro (only $10/month) to your Subscriptions to boost your development speed!"
 
    elif "save" in prompt_lower or "saving" in prompt_lower or "budget" in prompt_lower or "spent" in prompt_lower or "ratio" in prompt_lower:
        savings_ratio = (total_spent / total_income * 100) if total_income > 0 else 0
        advice = f"Under our Corporate Savings Policy, the golden standard is to allocate 20% of income to your Personal Savings Wallet. "
        
        if savings_ratio > 70:
            advice += f"ALERT: Your monthly spending ratio is currently {savings_ratio:.1f}%, which exceeds the 70% threshold! You should consolidate active subscriptions and check for unused paid tools."
        else:
            advice += f"Your current spending is at {savings_ratio:.1f}% of your income. You are in a safe zone! Keep putting away at least 20% regularly."
            
    else:
        advice = f"Hi there! I am Sora, your AI financial advisor grounded in Microsoft Foundry IQ! Currently, your total balance is ${total_balance:,.2f}. "
        if total_balance < 5000:
            advice += "Your cash reserves are a bit low. I suggest putting a hold on new subscriptions and focusing on depositing into your savings goals."
        else:
            advice += "You are maintaining a strong combined balance. Consider setting up a new Savings Goal or setting budget limits for your categories!"

    return jsonify({
        "advice": advice,
        "citations": list(set(citations)),
        "retrieved_passages": retrieved_passages,
        "search_steps": search_steps,
        "using_azure_openai": False
    })

if __name__ == '__main__':
    print("--------------------------------------------------")
    print("Sora Web Backend Server starting up...")
    print("Serving frontend from static/ folder")
    print("Endpoint: http://localhost:5000")
    print("--------------------------------------------------")
    app.run(port=5000, debug=True)

Here is the complete Markdown text for your `README.md` that you can copy and paste directly into GitHub:

```markdown
# Sora - Microsoft Foundry IQ Grounded Personal Finance Agent

> [!NOTE]
> **Disclaimer**: This project is built solely as an educational submission for the **Agents League Hackathon @ AI Skills Fest 2026**. It is not affiliated with, sponsored by, or endorsed by Microsoft Corporation.

Sora is an intelligent, premium personal finance and budget tracking web application built for the **Agents League Hackathon @ AI Skills Fest 2026** under the **Creative Apps** track. 

Sora port is translated from a legacy JavaFX desktop application into a modern, web-based single-page application. To align with Microsoft's ecosystem, all bank account options and subscriptions have been adapted into Microsoft products and service models (such as Azure Credits and M365 Copilot).

It integrates the **Microsoft Foundry IQ** intelligence retrieval layer as a local grounded knowledge assistant to answer user budgeting questions with precise citations.

---

## 🎨 Creative App Key Features

- **Zero-Friction Launch**: Instantly loads the populated dashboard for the judge, bypassing registration and login friction.
- **Reset Mock Data**: A sidebar option allowing judges to restore all balances and transactions to their pristine defaults after editing/deleting items.
- **Interactive Balance Summary**: Real-time display of total balance, income, expenses, and net cash flow.
- **Personal Savings Wallet**: A dedicated tracker for deposit/withdrawal of personal savings, separated from credit accounts.
- **Microsoft Credits & Ledgers**: Add and manage Microsoft-themed accounts:
  - *Azure Credits Wallet* (Baseline monthly credits)
  - *Microsoft Fabric Capacity Credits* (Capacity allocation)
  - *Work IQ Ledger* (Employee performance/allowance balance)
  - *Microsoft Pay (Corporate)*
- **Microsoft Subscriptions Manager**: Monthly cost logging for Microsoft recurring services:
  - *Microsoft 365 Copilot (Enterprise)*
  - *GitHub Copilot Pro+*
  - *Xbox Game Pass Ultimate*
  - *Azure Pay-As-You-Go*
  - *Power BI Premium Capacity*
- **Savings Goals & Category Budgets**: Set targets, track progress bars, and warn users in real-time if category spending exceeds limits.
- **Spending Breakdown Donut Chart**: A beautiful, responsive donut chart drawn dynamically on an HTML5 `<canvas>` using custom CSS colors.
- **Theme Color Customizer**: Switch workspace styles on the fly with 5 premium palettes: Midnight Dark, Deep Purple, Forest Green, Rose Red, and Default Blue.

---

## 🧠 Microsoft IQ Integration: Foundry IQ

The **Sora Agent** acts as a **Foundry IQ Knowledge Hub** to demonstrate grounded, hallucination-free retrieval-augmented generation (RAG):

1. **Document Storage**: Local text files under the `foundry_iq_docs/` folder serve as the enterprise database. It includes corporate savings guidelines, Azure credit replenishment procedures, and Microsoft 365 pricing terms.
2. **Local Permission-Aware Retrieval**: The search matches keywords in user prompts to relevant file blocks and checks active user parameters.
3. **Azure OpenAI SDK Integration**: The backend uses the **official Microsoft Azure OpenAI Python SDK** (`openai` package configured for Azure endpoint) to ground and formulate responses using retrieved segments.
4. **Resilient Local Fallback**: If Azure credentials are not configured in `.env`, the system automatically falls back to a **local rule-based text composer**. This local engine extracts matched snippets and details (such as current Azure credits) to output cited, deterministic financial advice offline.
5. **Visual Tracer Log**: The Chat UI features a terminal-style animation detailing the Foundry IQ steps:
   `Foundry IQ: Connecting data sources...` &rarr; `Foundry IQ: Enforcing document ACLs...` &rarr; `Foundry IQ: Scanning azure_credits_policy.txt...` &rarr; `Foundry IQ: Found matching passage.`

---

## 📂 Project Directory Structure

```
Sora/
├── app.py                 # Flask server (Serves APIs & frontend assets)
├── requirements.txt       # Python library dependencies
├── .gitignore             # Configured to ignore data/ and .env
├── README.md              # Project documentation
├── foundry_iq_docs/       # Foundry IQ text files (Grounding context)
│   ├── azure_credits_policy.txt
│   ├── corporate_savings_policy.txt
│   └── m365_pricing_guide.txt
└── static/                # Frontend Web root
    ├── index.html         # Main semantic structure and forms
    ├── css/               # stylesheets
    │   ├── loginStyle.css
    │   └── DashboardStyle.css
    └── js/                # Scripts
        ├── app.js         # Core coordinator & API bindings
        ├── auth.js        # Registration & login view controller
        ├── dashboard.js   # Calculations, modals, canvas chart drawing
        └── agent.js       # Chat messaging & Foundry IQ tracer animation
```

---

## 🚀 How to Run Locally

### 1. Prerequisite Installations
Ensure you have **Python 3** installed on your system. 

Navigate to the `Sora` folder in your terminal and install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Configure Azure OpenAI (Optional)
To use real Azure OpenAI models, create a `.env` file in the `Sora` folder:
```ini
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```
*Note: If these variables are not found, the agent automatically falls back to local grounding mode (no keys required).*

### 3. Launch the Server
Start the Flask application:
```bash
python app.py
```

### 4. Open in Browser
Open your browser and navigate to:
```
http://localhost:5000
```
The dashboard loads immediately for the **Hackathon Judge**, fully pre-populated with realistic Microsoft wallets, transactions, goals, and budgets! If you edit or delete items during testing, simply click **"Reset Data"** at the bottom of the sidebar to restore the default database values.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

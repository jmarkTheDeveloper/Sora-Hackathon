// ---------------- SORA AI AGENT CHAT & RETRIEVAL LOGGING ----------------

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('agent-chat-form');
    const userPromptInput = document.getElementById('agent-user-prompt');
    
    if (!chatForm) return;

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const promptText = userPromptInput.value.trim();
        if (!promptText) return;
        
        // 1. Append User Message
        appendChatMessage(promptText, 'user');
        userPromptInput.value = '';
        
        // 2. Setup Loading Animation
        const typingIndicator = appendTypingIndicator();
        scrollToBottom();

        // 3. Trigger Retrieval Trace view
        const tracerPanel = document.getElementById('retrieval-tracer');
        const tracerList = document.getElementById('tracer-steps-list');
        
        tracerPanel.style.display = 'block';
        tracerList.innerHTML = '<li>Connecting to Microsoft Foundry IQ...</li>';
        
        try {
            const res = await fetch('/api/agent/advise', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': currentUserId
                },
                body: JSON.stringify({
                    user_prompt: promptText,
                    userId: currentUserId
                })
            });
            
            const data = await res.json();
            
            // Remove typing indicator
            typingIndicator.remove();
            
            if (!res.ok) {
                appendChatMessage("I encountered an error connecting to my Foundry IQ index. Please make sure the backend is active.", 'agent');
                tracerList.innerHTML += '<li style="color:var(--danger-color)">Error: Search execution failed.</li>';
                return;
            }

            // 4. Animate the Foundry IQ retrieval steps
            await animateTracerSteps(data.search_steps, tracerList);
            
            // 5. Update Azure OpenAI connectivity badge
            const azureIndicator = document.getElementById('azure-openai-indicator');
            if (data.using_azure_openai) {
                azureIndicator.innerHTML = '<span class="dot online"></span> Online (Azure OpenAI)';
            } else {
                azureIndicator.innerHTML = '<span class="dot offline" style="background-color:orange;"></span> Local Grounding (Foundry IQ)';
            }

            // 6. Append Sora Agent cited response
            appendAgentResponse(data.advice, data.citations);
            scrollToBottom();

        } catch (err) {
            console.error("Agent consultation failed:", err);
            typingIndicator.remove();
            appendChatMessage("Offline: Please run 'python app.py' in the Sora folder to wake me up!", 'agent');
            tracerList.innerHTML += '<li style="color:var(--danger-color)">Offline: Connection to Flask API refused.</li>';
        }
    });
});

function appendChatMessage(text, sender) {
    const chatArea = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.innerHTML = `<p>${escapeHTML(text)}</p>`;
    chatArea.appendChild(msg);
}

function appendTypingIndicator() {
    const chatArea = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message agent typing-indicator-message';
    msg.innerHTML = `<p><i class="fa-solid fa-circle-notch fa-spin"></i> Sora is thinking...</p>`;
    chatArea.appendChild(msg);
    return msg;
}

function appendAgentResponse(text, citations) {
    const chatArea = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message agent';
    
    let citationHTML = '';
    if (citations && citations.length > 0) {
        citationHTML = `
            <div class="citations-box">
                <span class="citation-title">Foundry IQ Grounding Citations:</span>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
                    ${citations.map(c => `
                        <a href="/${c}" target="_blank" class="citation-badge">
                            <i class="fa-solid fa-file-invoice"></i> ${c.split('/').pop()}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    msg.innerHTML = `
        <p>${escapeHTML(text).replace(/\n/g, '<br>')}</p>
        ${citationHTML}
    `;
    chatArea.appendChild(msg);
}

// Visual delay simulation for logging search steps
async function animateTracerSteps(steps, listEl) {
    listEl.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
        const li = document.createElement('li');
        li.innerText = steps[i];
        listEl.appendChild(li);
        // Small 400ms delay to make it feel like a live scan
        await new Promise(resolve => setTimeout(resolve, 400));
    }
}

function updateAgentIndicator() {
    // Simply check connection status on tab loading
    const azureIndicator = document.getElementById('azure-openai-indicator');
    azureIndicator.innerHTML = '<span class="dot offline" style="background-color:orange;"></span> Local Grounding (Foundry IQ)';
}

function scrollToBottom() {
    const chatArea = document.getElementById('chat-messages');
    chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

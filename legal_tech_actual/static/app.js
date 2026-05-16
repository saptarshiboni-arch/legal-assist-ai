/* ═══════════════════════════════════════════
   LegalAssist-AI — app.js
   Full frontend logic: upload, analysis, dual-chatbot
═══════════════════════════════════════════ */

// ─── State ───────────────────────────────
let currentDocumentId = null;
let docChatHistory = [];
let generalChatHistory = [];
let isAnalyzing = false;

// ─── DOM References ───────────────────────
const uploadSection      = document.getElementById('uploadSection');
const dashboardSection   = document.getElementById('dashboardSection');
const dropZone           = document.getElementById('dropZone');
const fileInput          = document.getElementById('fileInput');
const dzIdle             = document.getElementById('dzIdle');
const dzLoading          = document.getElementById('dzLoading');
const loadingText        = document.getElementById('loadingText');
const analyzeBtn         = document.getElementById('analyzeBtn');
const fileNameDisplay    = document.getElementById('fileName');

// Theme Toggle
const themeBtn = document.getElementById('themeBtn');
const html = document.documentElement;
themeBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    themeBtn.innerHTML = newTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
});

// ─── Drag & Drop ──────────────────────────
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
    dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); })
);
['dragenter', 'dragover'].forEach(evt =>
    dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'))
);
['dragleave', 'drop'].forEach(evt =>
    dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'))
);

dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    fileNameDisplay.classList.add('fade-in');
}

// ─── Analysis Logic ───────────────────────
analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a file first.");
        return;
    }
    await processFile(file);
});

async function processFile(file) {
    if (isAnalyzing) return;
    isAnalyzing = true;
    setLoading(true, 'Uploading and extracting text...');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed.');
        
        currentDocumentId = uploadData.document_id;

        setLoading(true, 'Analyzing contract details...');
        const analyzeRes = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: currentDocumentId })
        });
        const analysisData = await analyzeRes.json();
        if (!analyzeRes.ok) throw new Error(analysisData.error || 'Analysis failed.');

        populateDashboard(analysisData);

        uploadSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        dashboardSection.classList.add('fade-in');

    } catch (err) {
        console.error(err);
        alert(err.message || 'Something went wrong.');
    } finally {
        isAnalyzing = false;
        setLoading(false);
    }
}

function setLoading(show, message) {
    if (show) {
        dzIdle.classList.add('d-none');
        dzLoading.classList.remove('d-none');
        loadingText.textContent = message;
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = '0.5';
    } else {
        dzIdle.classList.remove('d-none');
        dzLoading.classList.add('d-none');
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
    }
}

function populateDashboard(data) {
    document.getElementById('riskScore').textContent = `${data.risk_score}/10`;
    document.getElementById('statClauses').textContent = (data.risky_clauses || []).length;
    document.getElementById('statDeadlines').textContent = (data.deadlines || []).length;
    document.getElementById('summaryText').textContent = data.summary || 'No summary available.';

    renderRiskyClauses(data.risky_clauses || []);
    renderRecommendations(data.recommendations || []);
}

function renderRiskyClauses(clauses) {
    const container = document.getElementById('riskyClausesContainer');
    container.innerHTML = clauses.map(c => {
        const sev = (c.severity || 'High').toLowerCase();
        return `
        <div class="risk-item ${sev}">
            <div style="flex:1">
                <h6 class="fw-bold mb-1">${c.title}</h6>
                <p class="small text-secondary mb-0">${c.reason}</p>
                ${c.clause ? `<div class="mt-2 p-2 bg-dark rounded small text-muted">"${c.clause}"</div>` : ''}
            </div>
            <span class="severity-tag ${sev}">${c.severity}</span>
        </div>`;
    }).join('');
}

function renderRecommendations(recs) {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = recs.map(r => `
        <div class="suggestion-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>${r}</span>
        </div>
    `).join('');
}

// ─── Chatbot 1: Document Assistant ────────
const docChatForm = document.getElementById('chatForm');
const docChatInput = document.getElementById('chatInput');
const docChatMessages = document.getElementById('chatMessages');

docChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = docChatInput.value.trim();
    if (!question || !currentDocumentId) return;

    appendMessage(docChatMessages, question, 'user');
    docChatInput.value = '';

    const typingId = appendTyping(docChatMessages);

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                document_id: currentDocumentId,
                question,
                history: docChatHistory
            })
        });
        const data = await res.json();
        removeTyping(typingId);

        if (!res.ok) throw new Error(data.error);

        appendMessage(docChatMessages, data.response, 'bot');
        docChatHistory.push({ role: 'user', content: question });
        docChatHistory.push({ role: 'assistant', content: data.response });

    } catch (err) {
        removeTyping(typingId);
        appendMessage(docChatMessages, "Error: " + err.message, 'bot');
    }
});

// ─── Chatbot 2: Floating General AI ───────
const generalChatBtn      = document.getElementById('generalChatBtn');
const generalChatWindow   = document.getElementById('generalChatWindow');
const closeGeneralChat    = document.getElementById('closeGeneralChat');
const generalChatForm     = document.getElementById('generalChatForm');
const generalChatInput    = document.getElementById('generalChatInput');
const generalChatMessages = document.getElementById('generalChatMessages');

generalChatBtn.addEventListener('click', () => {
    generalChatWindow.classList.toggle('d-none');
});

closeGeneralChat.addEventListener('click', () => {
    generalChatWindow.classList.add('d-none');
});

generalChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = generalChatInput.value.trim();
    if (!question) return;

    appendMessage(generalChatMessages, question, 'user');
    generalChatInput.value = '';

    const typingId = appendTyping(generalChatMessages);

    try {
        const res = await fetch('/general-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                history: generalChatHistory
            })
        });
        const data = await res.json();
        removeTyping(typingId);

        if (!res.ok) throw new Error(data.error);

        appendMessage(generalChatMessages, data.response, 'bot');
        generalChatHistory.push({ role: 'user', content: question });
        generalChatHistory.push({ role: 'assistant', content: data.response });

    } catch (err) {
        removeTyping(typingId);
        appendMessage(generalChatMessages, "Error: " + err.message, 'bot');
    }
});

// Auto-resize textarea for general chat
generalChatInput.addEventListener('input', () => {
    generalChatInput.style.height = 'auto';
    generalChatInput.style.height = (generalChatInput.scrollHeight) + 'px';
});

// ─── Shared Chat Helpers ──────────────────
function appendMessage(container, text, role) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role} fade-in`;
    msgDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function appendTyping(container) {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = `chat-msg bot fade-in`;
    typingDiv.innerHTML = `<div class="chat-bubble">Typing...</div>`;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

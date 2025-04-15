document.addEventListener("DOMContentLoaded", () => {
    // Load models
    fetch("/api/models")
        .then(response => response.json())
        .then(data => {
            const modelSelect = document.getElementById("model");
            data.models.forEach(model => {
                const option = document.createElement("option");
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading models:", error));
});

function sendMessage() {
    const model = document.getElementById("model").value;
    const message = document.getElementById("message").value.trim();
    const chatWindow = document.getElementById("chat-window");
    const convType = document.getElementById("conv-type").value;
    const fileInput = document.getElementById("file-input");

    if (!model) {
        alert("Please select a model");
        return;
    }

    if (!message && !fileInput.files.length) {
        alert("Please enter a message or attach a file");
        return;
    }

    // Display user message
    const userDiv = document.createElement("div");
    userDiv.className = "message user";
    userDiv.textContent = `You (${convType}): ` + (message || "File attached");
    chatWindow.appendChild(userDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Handle file upload and chat request
    let formData = new FormData();
    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    }
    if (message) {
        formData.append("message", message);
    }
    formData.append("model", model);

    fetch("/api/chat", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    })
    .then(data => {
        const botDiv = document.createElement("div");
        botDiv.className = "message bot";

        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
        let response = data.response;
        let lastIndex = 0;
        let htmlContent = '';

        response.replace(codeBlockRegex, (match, language, code, index) => {
            htmlContent += escapeHtml(response.slice(lastIndex, index));
            const langClass = language ? `language-${language}` : 'language-text';
            htmlContent += `<pre><code class="${langClass}">${escapeHtml(code)}</code><button class="copy-btn" onclick="copyCode(this)">Copy</button></pre>`;
            lastIndex = index + match.length;
            return match;
        });

        htmlContent += escapeHtml(response.slice(lastIndex));
        htmlContent = htmlContent.replace(/\b(Running the Server|Important)\b/g, '<span class="highlight">$&</span>');
        botDiv.innerHTML = "Bot: " + htmlContent;
        chatWindow.appendChild(botDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        Prism.highlightAllUnder(botDiv);
    })
    .catch(error => {
        console.error("Error:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot";
        errorDiv.textContent = "Bot: " + error.message;
        chatWindow.appendChild(errorDiv);
    });

    document.getElementById("message").value = "";
    fileInput.value = ""; // Clear file input
}

function copyCode(button) {
    const code = button.previousSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = "Copied!";
        setTimeout(() => { button.textContent = "Copy"; }, 2000);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

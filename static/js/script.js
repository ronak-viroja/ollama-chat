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

    if (!model) {
        alert("Please select a model");
        return;
    }

    if (!message) {
        alert("Please enter a message");
        return;
    }

    // Display user message
    const userDiv = document.createElement("div");
    userDiv.className = "message user";
    userDiv.textContent = "You: " + message;
    chatWindow.appendChild(userDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Send message to server
    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, message })
    })
        .then(response => response.json())
        .then(data => {
            // Process bot response
            const botDiv = document.createElement("div");
            botDiv.className = "message bot";

            // Detect code blocks (e.g., ```language\ncode\n```)
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
            let response = data.response;
            let lastIndex = 0;
            let htmlContent = '';

            response.replace(codeBlockRegex, (match, language, code, index) => {
                // Add text before code block
                htmlContent += escapeHtml(response.slice(lastIndex, index));
                // Add formatted code block
                const langClass = language ? `language-${language}` : 'language-text';
                htmlContent += `<pre><code class="${langClass}">${escapeHtml(code)}</code></pre>`;
                lastIndex = index + match.length;
                return match;
            });

            // Add remaining text
            htmlContent += escapeHtml(response.slice(lastIndex));

            botDiv.innerHTML = "Bot: " + htmlContent;
            chatWindow.appendChild(botDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            // Apply Prism.js highlighting
            Prism.highlightAllUnder(botDiv);
        })
        .catch(error => {
            console.error("Error sending message:", error);
            const errorDiv = document.createElement("div");
            errorDiv.className = "message bot";
            errorDiv.textContent = "Bot: Error communicating with server";
            chatWindow.appendChild(errorDiv);
        });

    // Clear input
    document.getElementById("message").value = "";
}

// Escape HTML to prevent XSS and preserve code formatting
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

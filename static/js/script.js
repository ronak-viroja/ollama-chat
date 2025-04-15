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
            // Display bot response
            const botDiv = document.createElement("div");
            botDiv.className = "message bot";
            botDiv.textContent = "Bot: " + data.response;
            chatWindow.appendChild(botDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
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

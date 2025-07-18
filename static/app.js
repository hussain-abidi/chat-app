"use strict";
function register() {
    const username = document.getElementById("usernameRegister").value;
    const password = document.getElementById("passwordRegister").value;
    fetch("/reg", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    }).then((response) => {
        if (response.status === 200) {
            window.location.pathname = "/login";
        }
        else {
            document.getElementById("registerError").hidden = false;
        }
    });
}
function login() {
    const username = document.getElementById("usernameLogin").value;
    const password = document.getElementById("passwordLogin").value;
    fetch("/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    }).then((response) => {
        if (response.status === 200) {
            response.json().then((data) => {
                window.sessionStorage.setItem("token", data.token);
                window.location.pathname = "/chat";
            });
        }
        else {
            document.getElementById("loginError").hidden =
                false;
        }
    });
}
let socket;
function connectSocket(token) {
    socket = new WebSocket(`http://localhost:3000/ws?token=${token}`);
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "conversations") {
            const conversations = data.conversations;
            conversations.forEach((conversation) => {
                const conversationElement = document.createElement("p");
                conversationElement.innerText = conversation;
                document
                    .getElementById("conversations")
                    .appendChild(conversationElement);
            });
        }
        else {
            for (let message of data) {
                const messageElement = document.createElement("p");
                messageElement.innerText = `${message.from_username}: ${message.message}`;
                document.getElementById("messages").appendChild(messageElement);
            }
        }
    });
}
function sendMessage(socket, toUsername, message) {
    const messageElement = document.createElement("p");
    messageElement.innerText = `You: ${message}`;
    document.getElementById("messages").appendChild(messageElement);
    socket.send(JSON.stringify({ type: 1, to: toUsername, message: message }));
}

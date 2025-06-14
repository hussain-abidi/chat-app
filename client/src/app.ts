function register() {
  const username = (document.getElementById("usernameRegister") as HTMLInputElement).value;
  const password = (document.getElementById("passwordRegister") as HTMLInputElement).value;

  fetch("/reg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      window.location.pathname = "/login";
    } else {
      (document.getElementById("registerError") as HTMLParagraphElement).hidden = false;
    }
  });
}

function login() {
  const username = (document.getElementById("usernameLogin") as HTMLInputElement).value;
  const password = (document.getElementById("passwordLogin") as HTMLInputElement).value;

  fetch("/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      response.json().then(data => {
        window.sessionStorage.setItem("token", data.token);
        window.location.pathname = "/chat";
      });
    } else {
      (document.getElementById("loginError") as HTMLParagraphElement).hidden = false;
    }
  });
}

let socket: WebSocket;

function connectSocket(token: string) {
  socket = new WebSocket(`http://localhost:3000/ws?token=${token}`);
  socket.addEventListener("message", event => {
    const data = JSON.parse(event.data);
    if (data.type === "conversations") {
      const conversations = data.conversations;
      conversations.forEach((conversation: string) => {
        const conversationElement = document.createElement("p");
        conversationElement.innerText = conversation;
        document.getElementById("conversations")!.appendChild(conversationElement);
      });

    } else {
      const messageElement = document.createElement("p");
      messageElement.innerText = `${data.from}: ${data.message}`;
      document.getElementById("messages")!.appendChild(messageElement);
    }
  });
}

function sendMessage(socket: WebSocket, toUsername: string, message: string) {
  const messageElement = document.createElement("p");
  messageElement.innerText = `You: ${message}`;
  document.getElementById("messages")!.appendChild(messageElement);
  socket.send(JSON.stringify({ to: toUsername, message: message }));
}

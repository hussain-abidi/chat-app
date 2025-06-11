function register() {
  const username = (document.getElementById("usernameRegister") as HTMLInputElement).value;
  const password = (document.getElementById("passwordRegister") as HTMLInputElement).value;

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      (document.getElementById("registerScreen") as HTMLDivElement).hidden = true;
      (document.getElementById("loginScreen") as HTMLDivElement).hidden = false;
    } else {
      (document.getElementById("registerError") as HTMLParagraphElement).hidden = false;
    }
  });
}

let socket: WebSocket;

function login() {
  const username = (document.getElementById("usernameLogin") as HTMLInputElement).value;
  const password = (document.getElementById("passwordLogin") as HTMLInputElement).value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      (document.getElementById("loginScreen") as HTMLDivElement).hidden = true;
      (document.getElementById("chatScreen") as HTMLDivElement).hidden = false;
      response.json().then(data => { connectSocket(data.token) });
    } else {
      (document.getElementById("loginError") as HTMLParagraphElement).hidden = false;
    }
  });
}

document.getElementById("registerButton")!.addEventListener("click", register);
document.getElementById("loginButton")!.addEventListener("click", login);
document.getElementById("gotoLogin")!.addEventListener("click", () => {
  (document.getElementById("registerScreen") as HTMLDivElement).hidden = true;
  (document.getElementById("loginScreen") as HTMLDivElement).hidden = false;
});

function connectSocket(token: string) {
  socket = new WebSocket(`http://localhost:3000/ws?token=${token}`);
  socket.addEventListener("message", event => {
    const messageElement = document.createElement("p");
    const data = JSON.parse(event.data);
    messageElement.innerText = `${data.from}: ${data.message}`;
    document.getElementById("messages")!.appendChild(messageElement);
  });
}

function sendMessage(socket: WebSocket, toUsername: string, message: string) {
  const messageElement = document.createElement("p");
  messageElement.innerText = `You: ${message}`;
  document.getElementById("messages")!.appendChild(messageElement);
  socket.send(JSON.stringify({ to: toUsername, message: message }));
}

document.getElementById("sendButton")!.addEventListener("click", () => {
  const toUsername = (document.getElementById("targetInput") as HTMLInputElement).value;
  const message = (document.getElementById("messageInput") as HTMLInputElement).value;
  sendMessage(socket, toUsername, message);
})

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
    }
  });
}

function login() {
  const username = (document.getElementById("usernameLogin") as HTMLInputElement).value;
  const password = (document.getElementById("passwordLogin") as HTMLInputElement).value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => response.text())
    .then((text) => console.log(text));
}

document.getElementById("registerButton")!.addEventListener("click", register);
document.getElementById("loginButton")!.addEventListener("click", login);

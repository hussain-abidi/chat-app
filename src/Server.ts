import { type ServerWebSocket } from "bun";
import { DB } from "./Database"
import { randomUUID } from "crypto";

interface WsData {
  username: string,
  token: string
};

type SocketType = ServerWebSocket<WsData>;

interface MessageType {
  to: string,
  message: string
}

export class Server {
  port: number;

  sockets = new Map<string, SocketType>()

  tokens = new Map<string, string>();

  db: DB;

  constructor(port: number) {
    this.port = port;

    this.db = new DB();
  }

  run() {
    Bun.serve({
      port: this.port,
      fetch: this.serverFetch,
      websocket: {
        open: (ws: SocketType) => this.socketOpen(ws),
        message: (ws: SocketType, message: string) => this.socketMessage(ws, message),
        close: (ws: SocketType) => this.socketClose(ws)
      },
    });

    console.log(`Server listening on port ${this.port}.`);
  }

  serverFetch = async (req: Request, server: any) => {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/register": return this.getPage("/register.html");
      case "/login": return this.getPage("/login.html");
      case "/chat": return this.getPage("/chat.html");
      case "/reg": return this.handleRegister(req);
      case "/log": return this.handleLogin(req);
      case "/ws": return this.handleWS(req, server);
      case "/logout": return this.handleLogout(req);

      default: return this.handleStatic(req);
    }
  }

  async getPage(path: string) {
    console.log(path);
    const file = Bun.file(`static${path}`);

    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(file);
  }

  async handleStatic(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;

    return this.getPage(path);
  }

  async handleRegister(req: Request) {
    if (req.method !== "POST") { return; }

    let reqJson;
    try {
      reqJson = await req.json();
    } catch (err) {
      return Response.json({ message: "Malformed request" }, { status: 400 });
    }

    const username = reqJson.username;
    const password = reqJson.password;

    if (!username || !password) {
      return Response.json({ message: "Empty credentials are not allowed" }, { status: 400 });
    }

    if (this.db.getHashedPassword(username)) {
      return Response.json({ message: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await Bun.password.hash(password);

    this.db.insertUser(username, hashedPassword);

    return Response.json({ message: "Registered successfully" });
  }

  async handleLogin(req: Request) {
    if (req.method !== "POST") { return; }

    let reqJson;
    try {
      reqJson = await req.json();
    } catch (err) {
      return Response.json({ message: "Malformed request" }, { status: 400 });
    }

    const username = reqJson.username;
    const password = reqJson.password;

    const hashedPassword = this.db.getHashedPassword(username);

    if (!hashedPassword || !await Bun.password.verify(password, hashedPassword)) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    for (const [token, user] of this.tokens) {
      if (user === username) {
        return Response.json({ token });
      }
    }

    const token = randomUUID();
    this.tokens.set(token, username);

    return Response.json({ token });
  }

  async handleWS(req: Request, server: any) {
    const token = new URL(req.url).searchParams.get("token");
    const username = token ? this.tokens.get(token) : undefined;

    if (!token || !username) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data: WsData = { username, token };

    if (server.upgrade(req, { data })) {
      return;
    }

    return Response.json({ message: "Upgrade failed" }, { status: 500 });
  }

  async handleLogout(req: Request) {
    if (req.method !== "POST") { return; }

    let reqJson;
    try {
      reqJson = await req.json();
    } catch (err) {
      return Response.json({ message: "Malformed request" }, { status: 400 });
    }

    const username = reqJson.username;

    for (const [token, user] of this.tokens) {
      if (user === username) {
        this.tokens.delete(token);
      }
    }
    
    return Response.json({ message: "Logged out successfully" });
  }



  socketOpen(ws: SocketType) {
    const username = ws.data.username;

    this.sockets.set(username, ws);

    console.log(`${username} connected from ${ws.remoteAddress}.`);

    const conversations = this.db.getConversations(username).map((conversation: any) => conversation.to_username);

    ws.send(JSON.stringify({ type: "conversations", conversations }));
  }

  socketMessage(ws: SocketType, message: string) {
    const username = ws.data.username;

    let data: MessageType;
    try {
      data = JSON.parse(message);
      if (!data.to || typeof data.message !== 'string') return;
    } catch (err) {
      return;
    }

    const targetUser = this.sockets.get(data.to);

    const trimmedMessage = data.message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (targetUser) {
      targetUser.send(JSON.stringify({ from: username, message: trimmedMessage }));

      this.db.insertMessage(username, data.to, trimmedMessage);

      console.log(`Message from ${username} to ${data.to}: ${data.message} `);
    }
  }

  socketClose(ws: SocketType) {
    const username = ws.data.username;

    this.sockets.delete(username);

    console.log(`${username} disconnected.`);
  }
};

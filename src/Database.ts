import { Database } from "bun:sqlite";

type userRow = {
  username: string;
  password_hash: string;
}

export class DB {
  db = new Database("db.sqlite");

  constructor() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_hashes (
        username VARCHAR(255) PRIMARY KEY,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY,
        user1 TEXT NOT NULL,
        user2 TEXT NOT NULL,
        user_pair TEXT GENERATED ALWAYS AS (
          CASE 
            WHEN user1 < user2 THEN user1 || ':' || user2
            ELSE user2 || ':' || user1
          END
        ) STORED UNIQUE
      ); 
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        from_username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      );
    `);
  }

  insertUser(username: string, hashedPassword: string) {
    const query = this.db.prepare("INSERT INTO user_hashes (username, password_hash) VALUES (?, ?)");
    query.run(username, hashedPassword);
  }

  getHashedPassword(username: string) {
    const query = this.db.prepare("SELECT password_hash FROM user_hashes WHERE username = ? LIMIT 1");
    return (query.get(username) as userRow)?.password_hash;
  }

  insertConversation(user1: string, user2: string) {
    const pair = user1 < user2 ? `${user1}:${user2}` : `${user2}:${user1}`;

    const query = this.db.prepare(`
      INSERT INTO conversations (user1, user2)
      VALUES (?, ?)
      RETURNING id
    `);
    const result: any = query.get(user1, user2);
    return result?.id;
  }

  getConversations(user: string) {
    const query = this.db.prepare(`
      SELECT id, user1, user2 FROM conversations
      WHERE user1 = ? OR user2 = ?
    `);
    return query.all(user, user);
  }

  insertMessage(fromUsername: string, toUsername: string, message: string) {
    const conversationId = this.insertConversation(fromUsername, toUsername);
    const query = this.db.prepare("INSERT INTO messages (conversation_id, from_username, message) VALUES (?, ?, ?)");
    query.run(conversationId, fromUsername, message);
  }

  getMessages(user1: string, user2: string) {
    const pair = user1 < user2 ? `${user1}:${user2}` : `${user2}:${user1}`;
    const conversation: any = this.db
      .prepare("SELECT id FROM conversations WHERE user_pair = ?")
      .get(pair);
    if (!conversation) return [];

    const query = this.db.prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC"
    );
    return query.all(conversation.id);
  }
};

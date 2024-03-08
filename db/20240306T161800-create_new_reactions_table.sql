create table reactions (
  emoji VARCHAR(100),
  message_id INTEGER,
  user_id INTEGER,
  PRIMARY KEY(emoji, message_id, user_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(message_id) REFERENCES messages(id)
);

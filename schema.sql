CREATE TABLE IF NOT EXISTS likes (
  post TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post, client_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post);

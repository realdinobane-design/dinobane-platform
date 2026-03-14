-- DinoBane Platform — initial schema
-- Runs once on first deploy via auto-migrate in server/index.ts

CREATE TABLE IF NOT EXISTS users (
  id                serial PRIMARY KEY,
  username          text NOT NULL UNIQUE,
  email             text NOT NULL UNIQUE,
  password          text NOT NULL,
  display_name      text NOT NULL,
  avatar_initials   text NOT NULL,
  avatar_color      text NOT NULL DEFAULT '#cc2a2a',
  avatar_url        text,
  is_member         boolean NOT NULL DEFAULT false,
  member_since      timestamp,
  stripe_customer_id text,
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id         serial PRIMARY KEY,
  user_id    integer NOT NULL,
  channel    text NOT NULL DEFAULT 'general',
  content    text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id           serial PRIMARY KEY,
  title        text NOT NULL,
  content      text NOT NULL,
  summary      text NOT NULL,
  youtube_url  text,
  video_id     text,
  thumbnail    text,
  published_at timestamp NOT NULL DEFAULT now(),
  is_public    boolean NOT NULL DEFAULT true
);

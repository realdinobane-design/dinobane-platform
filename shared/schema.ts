import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
  avatarColor: text("avatar_color").notNull().default("#cc2a2a"),
  avatarUrl: text("avatar_url"),
  isMember: boolean("is_member").notNull().default(false),
  memberSince: timestamp("member_since"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, memberSince: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── COMMUNITY MESSAGES ───────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  channel: text("channel").notNull().default("general"),
  content: text("content").notNull(),
  parentId: integer("parent_id"),   // null = top-level post; set = reply
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ─── ARTICLES ────────────────────────────────────────────────────────────────
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  youtubeUrl: text("youtube_url"),
  videoId: text("video_id"),
  thumbnail: text("thumbnail"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  isPublic: boolean("is_public").notNull().default(true),
});

export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, publishedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// ─── MEDIA VAULT ─────────────────────────────────────────────────────────────
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "image" | "video"
  dataUrl: text("data_url").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertMediaSchema = createInsertSchema(media).omit({ id: true, uploadedAt: true });
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

// ─── MEDIA LIKES ─────────────────────────────────────────────────────────────
export const mediaLikes = pgTable("media_likes", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MediaLike = typeof mediaLikes.$inferSelect;

// ─── MEDIA COMMENTS ──────────────────────────────────────────────────────────
export const mediaComments = pgTable("media_comments", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMediaCommentSchema = createInsertSchema(mediaComments).omit({ id: true, createdAt: true });
export type InsertMediaComment = z.infer<typeof insertMediaCommentSchema>;
export type MediaComment = typeof mediaComments.$inferSelect;

// ─── PRIVATE MESSAGES (DMs) ────────────────────────────────────────────────
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull(),
  toId: integer("to_id").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("read_at"),          // null = unread
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PrivateMessage = typeof privateMessages.$inferSelect;

// ─── DM EMAIL NOTIFICATION THROTTLE ─────────────────────────────────────
export const dmNotifications = pgTable("dm_notifications", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull(),   // sender
  toId: integer("to_id").notNull(),       // recipient
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export type DmNotification = typeof dmNotifications.$inferSelect;

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
// Generic key-value store for admin-configurable settings
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;

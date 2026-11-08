import { pgTable, text, timestamp, boolean, serial, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  isPro: boolean('is_pro').default(false).notNull(),
  planId: text('plan_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chats conversations table
export const chats = pgTable('chats', {
  id: text('id').primaryKey(), // Session ID
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  modelId: text('model_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  sender: text('sender').notNull(), // 'user' | 'ai'
  text: text('text').notNull(),
  modelName: text('model_name'),
  timestampText: text('timestamp_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Google Chat Spaces table for syncing or publishing to Google Chat
export const googleChatSpaces = pgTable('google_chat_spaces', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  spaceName: text('space_name').notNull(), // e.g. spaces/AAAA...
  displayName: text('display_name').notNull(),
  spaceType: text('space_type'), // 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE'
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  googleChatSpaces: many(googleChatSpaces),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  author: one(users, {
    fields: [chats.userId],
    references: [users.uid],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

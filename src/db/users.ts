import { db } from './index.ts';
import { users, chats, messages, googleChatSpaces } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface UserUpsertData {
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  isPro?: boolean;
  planId?: string | null;
}

export async function getOrCreateUser(data: UserUpsertData) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || null,
        photoUrl: data.photoUrl || null,
        isPro: data.isPro ?? false,
        planId: data.planId || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          displayName: data.displayName || null,
          photoUrl: data.photoUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database operation failed for user record.', { cause: error });
  }
}

export async function updateUserProStatus(uid: string, isPro: boolean, planId?: string) {
  try {
    const result = await db
      .update(users)
      .set({
        isPro,
        planId: planId || null,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in updateUserProStatus:', error);
    throw new Error('Failed to update subscription status.', { cause: error });
  }
}

export async function getUserSessions(userId: string) {
  try {
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    const chatIds = userChats.map((c) => c.id);
    if (chatIds.length === 0) return [];

    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(messages.createdAt);

    return userChats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      modelId: chat.modelId,
      createdAt: chat.createdAt.getTime(),
      updatedAt: chat.updatedAt.getTime(),
      messages: allMessages
        .filter((m) => m.chatId === chat.id)
        .map((m) => ({
          id: m.id,
          text: m.text,
          sender: m.sender as 'user' | 'ai',
          modelName: m.modelName || undefined,
          timestamp: m.timestampText || undefined,
        })),
    }));
  } catch (error) {
    console.error('Database query failed in getUserSessions:', error);
    throw new Error('Failed to retrieve user chat sessions.', { cause: error });
  }
}

export async function saveUserChatSession(
  userId: string,
  chatData: {
    id: string;
    title: string;
    modelId: string;
    messages: Array<{
      text: string;
      sender: 'user' | 'ai';
      modelName?: string;
      timestamp?: string;
    }>;
  }
) {
  try {
    // 1. Upsert chat
    await db
      .insert(chats)
      .values({
        id: chatData.id,
        userId,
        title: chatData.title,
        modelId: chatData.modelId,
      })
      .onConflictDoUpdate({
        target: chats.id,
        set: {
          title: chatData.title,
          modelId: chatData.modelId,
          updatedAt: new Date(),
        },
      });

    // 2. Delete existing messages and re-insert for state sync
    await db.delete(messages).where(eq(messages.chatId, chatData.id));

    if (chatData.messages.length > 0) {
      await db.insert(messages).values(
        chatData.messages.map((m) => ({
          chatId: chatData.id,
          sender: m.sender,
          text: m.text,
          modelName: m.modelName || null,
          timestampText: m.timestamp || null,
        }))
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Database query failed in saveUserChatSession:', error);
    throw new Error('Failed to persist chat session.', { cause: error });
  }
}

export async function deleteUserChatSession(userId: string, chatId: string) {
  try {
    await db.delete(chats).where(eq(chats.id, chatId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteUserChatSession:', error);
    throw new Error('Failed to delete chat session.', { cause: error });
  }
}

export async function syncGoogleChatSpaceRecord(
  userId: string,
  spaceName: string,
  displayName: string,
  spaceType?: string
) {
  try {
    const existing = await db
      .select()
      .from(googleChatSpaces)
      .where(eq(googleChatSpaces.spaceName, spaceName));

    if (existing.length === 0) {
      await db.insert(googleChatSpaces).values({
        userId,
        spaceName,
        displayName,
        spaceType: spaceType || 'SPACE',
      });
    } else {
      await db
        .update(googleChatSpaces)
        .set({
          displayName,
          spaceType: spaceType || 'SPACE',
          syncedAt: new Date(),
        })
        .where(eq(googleChatSpaces.spaceName, spaceName));
    }
  } catch (error) {
    console.warn('Notice saving Google Chat space record:', error);
  }
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client instance
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Critical: Initialize Firestore with firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Error handler conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase configuration notice:', error.message);
    }
  }
}

// Configure Google Auth Provider with Google Chat scopes
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('openid');
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces.create');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.memberships');

// In-memory token cache (NEVER in localStorage)
let inMemoryAccessToken: string | null = null;

export function setGoogleAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getGoogleAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Sign-in helper extracting both ID token & Google Chat OAuth access token
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || null;
  if (accessToken) {
    setGoogleAccessToken(accessToken);
  }
  return {
    user: result.user,
    accessToken,
  };
}

export async function signOutUser() {
  setGoogleAccessToken(null);
  await signOut(auth);
}

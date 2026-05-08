'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';

/** 
 * Initiate anonymous sign-in (non-blocking).
 * This is "fire-and-forget" and relies on the global onAuthStateChanged listener.
 */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(err => {
    // Catch potential errors to prevent unhandled promise rejections.
    console.error("Anonymous sign-in failed:", err);
  });
}

/** 
 * Signs up a user with email and password.
 * Returns a promise that should be awaited to handle success or failure.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** 
 * Signs in a user with email and password.
 * Returns a promise that should be awaited to handle success or failure.
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

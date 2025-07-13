
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserToSupabase, updateUserLastSignIn } from "./supabaseService";

export async function signUp(email: string, password: string, name?: string, phone?: string): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  if (result.user) {
    await saveUserToSupabase({
      id: result.user.uid,
      email: result.user.email || '',
      name,
      phone,
    });
  }
  
  return result;
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  
  if (result.user) {
    await updateUserLastSignIn(result.user.uid);
  }
  
  return result;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

import { signInWithPopup, GoogleAuthProvider, signOut} from 'firebase/auth';
import { auth } from '@/firebase-client';

export const loginWithGoogle = async () => {
    
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Llamamos a la API protegida desde el cliente
  const res = await fetch("/api/check-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: user.email }),
  });

  const data = await res.json();

  if (!data.authorized) {
    await signOut(auth);
    throw new Error("Tu correo no está autorizado para acceder.");
  }

  return user;
};

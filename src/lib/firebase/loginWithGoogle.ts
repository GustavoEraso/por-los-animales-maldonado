import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * Authenticates a user with Google using Firebase and checks if the user's email is authorized.
 *
 * @returns {Promise<User>} A promise that resolves to the authenticated Firebase user if authorized.
 * @throws {Error} If the user's email is not authorized, the user is signed out and an error is thrown.
 *
 * @example
 * // Log in with Google and get the user object
 * try {
 *   const user = await loginWithGoogle();
 *   console.log('Logged in user:', user);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export const loginWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Llamamos a la API protegida desde el cliente
  const res = await fetch('/api/check-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email }),
  });

  const data = await res.json();

  if (!data.authorized) {
    await signOut(auth);
    throw new Error('Tu correo no está autorizado para acceder.');
  }

  return user;
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Log in with Google and get the user object
   try {
     const user = await loginWithGoogle();
     console.log('Logged in user:', user);
   } catch (error) {
     console.error(error.message);
   }

2) Handle unauthorized email error
   try {
     const user = await loginWithGoogle();
     // Proceed with authorized user
   } catch (error) {
     if (error.message === 'Email not authorized') {
       alert('Your email is not authorized to access this application.');
     }
   }

──────────────────────────────────────────────────────────────────────────── */

import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';
import { handleToast } from '../handleToast';

/**
 * Authenticates a user with Google using Firebase and checks if the user's email is authorized.
 *
 * Shows a toast notification with error.webp icon if the user's email is not authorized.
 * The user is automatically signed out and an error toast is displayed before throwing the error.
 *
 * @returns {Promise<User>} A promise that resolves to the authenticated Firebase user if authorized.
 * @throws {Error} If the user's email is not authorized, displays an error toast, signs out the user, and throws an error.
 *
 * @example
 * // Log in with Google and get the user object
 * try {
 *   const user = await loginWithGoogle();
 *   console.log('Logged in user:', user);
 *   // User is authorized, proceed with app logic
 * } catch (error) {
 *   console.error(error.message);
 *   // Error toast is already displayed automatically
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
    handleToast({
      type: 'error',
      title: 'Acceso denegado',
      text: 'Tu correo no está autorizado para acceder.',
    });
    throw new Error('Tu correo no está autorizado para acceder.');
  }

  return user;
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Basic login with automatic error handling
   try {
     const user = await loginWithGoogle();
     console.log('Logged in user:', user);
     // User is authorized, proceed with app logic
   } catch (error) {
     console.error(error.message);
     // Error toast is already displayed automatically if email not authorized
   }

2) Login in a React component with loading state
   const [isLoading, setIsLoading] = useState(false);
   
   const handleLogin = async () => {
     setIsLoading(true);
     try {
       const user = await loginWithGoogle();
       // User authenticated and authorized
       router.push('/plam-admin');
     } catch (error) {
       // Error toast already displayed, just handle the error state
       console.error('Authentication failed');
     } finally {
       setIsLoading(false);
     }
   };

3) Login with additional success handling
   try {
     const user = await loginWithGoogle();
     
     // Optional: Add your own success logic/toast
     console.log('Welcome:', user.displayName);
     // Navigate or update state as needed
     
   } catch (error) {
     // Unauthorized error toast is automatically shown by loginWithGoogle
     // Just handle any additional error logic here
   }

──────────────────────────────────────────────────────────────────────────── */

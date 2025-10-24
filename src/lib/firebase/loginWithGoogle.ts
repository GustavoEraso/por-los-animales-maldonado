import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * Authenticates a user with Google using Firebase.
 *
 * Authorization is handled automatically by AuthContext after login.
 * If the user is not authorized, they will be signed out automatically
 * and a toast notification will be displayed.
 *
 * @returns {Promise<User>} A promise that resolves to the authenticated Firebase user.
 * @throws {Error} If the Google sign-in popup fails or is cancelled.
 *
 * @example
 * // Log in with Google
 * try {
 *   const user = await loginWithGoogle();
 *   console.log('Logged in user:', user);
 *   // AuthContext will verify authorization automatically
 * } catch (error) {
 *   console.error('Login failed:', error);
 * }
 */
export const loginWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Authorization check is now handled by AuthContext
  // No need to check here - just return the user
  return user;
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Basic login - Authorization handled automatically by AuthContext
   try {
     const user = await loginWithGoogle();
     console.log('Logged in user:', user);
     // AuthContext will check authorization in background
     // If not authorized, user will be signed out automatically
   } catch (error) {
     console.error('Login popup failed:', error);
   }

2) Login in a React component with loading state
   const [isLoading, setIsLoading] = useState(false);
   
   const handleLogin = async () => {
     setIsLoading(true);
     try {
       const user = await loginWithGoogle();
       // User authenticated
       // Wait for AuthContext to verify authorization
       router.push('/plam-admin');
     } catch (error) {
       console.error('Authentication failed:', error);
     } finally {
       setIsLoading(false);
     }
   };

3) Using with AuthContext to check authorization status
   const { isAuthorized, currentUser } = useAuth();
   
   const handleLogin = async () => {
     try {
       await loginWithGoogle();
       // Wait a moment for AuthContext to update
       // Then check isAuthorized or currentUser to confirm access
     } catch (error) {
       console.error('Login failed:', error);
     }
   };

──────────────────────────────────────────────────────────────────────────── */

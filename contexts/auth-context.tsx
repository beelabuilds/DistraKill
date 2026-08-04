import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth } from '@/config/firebase';

export type AuthUser = {
  uid: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function convertFirebaseUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    name:
      firebaseUser.displayName ??
      firebaseUser.email?.split('@')[0] ??
      'Student',
    email: firebaseUser.email ?? '',
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(
          firebaseUser ? convertFirebaseUser(firebaseUser) : null
        );
        setIsLoading(false);
      },
      (error) => {
        console.error('Authentication state error:', error);
        setUser(null);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: user !== null,
      isLoading,

      login: async (email, password) => {
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password
        );
      },

      register: async (name, email, password) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            cleanEmail,
            password
          );

        await updateProfile(userCredential.user, {
          displayName: cleanName,
        });

        setUser({
          uid: userCredential.user.uid,
          name: cleanName || 'Student',
          email: userCredential.user.email ?? cleanEmail,
        });
      },

      requestPasswordReset: async (email) => {
        await sendPasswordResetEmail(
          auth,
          email.trim().toLowerCase()
        );
      },

      logout: async () => {
        await signOut(auth);
      },
    };
  }, [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider.'
    );
  }

  return context;
}
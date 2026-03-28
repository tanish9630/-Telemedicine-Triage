import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'patient' | 'doctor';
  registrationNumber?: string;
  specialization?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Read the stored user synchronously to avoid any flash/redirect on refresh */
function getStoredAuth(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('authUser');
    if (token && userRaw) {
      const user = JSON.parse(userRaw) as User;
      return { user, token };
    }
  } catch {
    // corrupted data — ignore
  }
  return { user: null, token: null };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialise synchronously from localStorage as optimistic state
  const stored = getStoredAuth();
  const [user, setUser] = useState<User | null>(stored.user);
  const [token, setToken] = useState<string | null>(stored.token);
  // Always start loading=true so RoleProtectedRoute waits for server validation
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      // No token at all — clear any stale user and stop loading
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    // Always validate token against server — server is source of truth for role
    const validate = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.ok) {
          const userData = await response.json();
          // Server confirmed role — overwrite any cached/stale data
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem('authUser', JSON.stringify(userData));
        } else if (response.status === 401) {
          // Truly expired/invalid token — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('authUser');
          setUser(null);
          setToken(null);
        }
        // Any other error (500, network down) — keep the existing state
      } catch {
        // Network error — keep current cached state so app still works offline
        console.warn('Background auth validation failed (network issue). Keeping session.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    if (userData.role === 'patient') {
      localStorage.setItem('patientName', userData.fullName);
    } else {
      localStorage.setItem('doctorName', userData.fullName);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    localStorage.removeItem('patientName');
    localStorage.removeItem('doctorName');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

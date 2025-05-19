// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expired, setExpired] = useState(false); // 🔥 to show notification

    useEffect(() => {
        const stored = localStorage.getItem("user");

        if (stored) {
            const parsed = JSON.parse(stored);
            const now = Date.now();
            const timePassed = now - parsed.createdAt;
            const timeLeft = TOKEN_EXPIRY_MS - timePassed;

            if (timeLeft > 0) {
                setUser(parsed);
                setLoading(false);
                // 🔥 Auto logout after expiry
                const timeout = setTimeout(() => {
                    setUser(null);
                    localStorage.removeItem("user");
                    setExpired(true); // set flag to show re-login message
                }, timeLeft);

                return () => clearTimeout(timeout);
            } else {
                localStorage.removeItem("user");
                setExpired(true);
            }
        }

        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, expired }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useEffect, useState } from "react";
import { getme } from "./services/auth.api";

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{
    const [user,setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreUser = async () => {
            try {
                const data = await getme();
                setUser(data.user);
            } catch (err) {
                setUser(null);
                console.log("Failed to restore the authenticated user:", err);
            } finally {
                setLoading(false);
            }
        };

        restoreUser();
    }, []);

    return(
        <AuthContext.Provider value={[user, setUser, loading , setLoading]}>
            {children}
        </AuthContext.Provider>
    )
}


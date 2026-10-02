import { AuthContext } from "./auth.context";
import { useContext } from "react";
import {register, login , logout} from "./services/auth.api"


export const useAuth = ()=>{
    const context = useContext(AuthContext);
    const [user, setUser, loading , setLoading] = context;
    const handleRegister = async (username , email, password)=>{
        setLoading(true);
        try{
            const response = await register(username , email , password);
            setUser(response.user);
            return response;
        }catch(err){
            console.log(err)
            throw err
        }
        finally{
            setLoading(false);
        }
    }
    const handleLogin = async (email, password)=>{
        setLoading(true)
        try{
            const response = await login(email,password)
            setUser(response.user);
            return response;
        }catch(err){
            console.log(err)
        }
        finally{
            setLoading(false)
        }
    }
    const handleLogout = async ()=>{
        setLoading(true)
        try{
            await logout()
            setUser(null)
        }catch(err){
            console.log(err)
        }
        finally{
            setLoading(false)
        }
        
    }
    return {handleRegister, handleLogin, handleLogout, user, loading}
}
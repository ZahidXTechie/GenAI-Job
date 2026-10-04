import React, {useState} from 'react'
import "../form.scss"
import { Link, useNavigate } from "react-router";
import { useAuth } from '../useauth.js';

const Login = () => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const {handleLogin, loading} = useAuth();
     const [error, seterror] = useState('');
    const handleSubmit = async (e)=>{
       

        e.preventDefault();
        seterror('');
        try{
            await handleLogin(email, password);
        navigate("/");
        console.log("Login successful");
        }
        catch(error){
            seterror('Invalid email or password');
        }
        
        
    }
    
    if(loading){
        return <p>Loading...</p>
    }
  return (
    <main className="main" >
       <form className="form" onSubmit={handleSubmit}>

            <h2>Login</h2>
           
            <div className="input-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="Enter your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Enter your Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" >Login</button>
        
        </form> 
        <p>Don't have an account? <Link to="/register">Register</Link></p>

    </main>
  )
}

export default Login 

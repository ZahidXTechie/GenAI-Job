import "../form.scss"
import { Link } from "react-router";
import {useNavigate} from "react-router";
import { useState } from "react";
import { useAuth } from "../useauth.js";

const Register = () => {

        const navigate = useNavigate();
        const [username, setUsername] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const {handleRegister, loading} = useAuth();
        const handleSubmit = async (e)=>{
            e.preventDefault();
            setError('');

            try {
                await handleRegister(username, email, password);
                navigate("/");
            } catch (err) {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        }
        
        if(loading){
            return <p>Loading...</p>
        }
  return (
     <main className="main" >
       <form className="form" onSubmit={handleSubmit}>

            <h2>Register</h2>
            <div className="input-group">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" required placeholder="Enter your Username"  onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="input-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="Enter your Email"  onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Enter your Password"  onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        
        </form> 
        <p>Already have an account? <Link to="/login">Login</Link></p>

    </main>
  )
}

export default Register

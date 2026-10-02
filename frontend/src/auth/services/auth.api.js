import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true,
})

export async function register(username, email , password){
    try{
        const response = await api.post('/register', {username, email, password});
        return response.data;
    }catch(err){
        console.error('Registration failed:', err.response?.data || err.message);
        throw err;
    }
}

export async function login(email , password){
    try{
        const response = await api.post('/login', {email , password});
        return response.data
    }catch(err){
        console.log(err);
        throw err;
    }
}

export async function logout(){
    try{
        const response = await api.get('/logout')
        return response.data
    }catch(err){
        console.log(err)
        throw err;
    }
}

export async function getme(){
    try{
        const response = await api.get('/get-me', {
            headers: { 'Cache-Control': 'no-store' }
        })
        return response.data
    }catch(err){
        console.log(err)
        throw err;
    }
}
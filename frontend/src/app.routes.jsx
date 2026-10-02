import {createBrowserRouter} from "react-router";
import Register from "./auth/pages/Register.jsx";
import Login from "./auth/pages/login.jsx";
import Protected from "./hooks/protected.jsx";
import InterviewHome from "./interview/pages/InterviewHome.jsx";

const router = createBrowserRouter([
   
    {
        path: "/register",
        element: <Register />
    },
    {
        path:"/login",
        element: <Login />
    },
    {
        path: "/",
        element: <Protected><InterviewHome /></Protected>
    }
    
])

export default router;
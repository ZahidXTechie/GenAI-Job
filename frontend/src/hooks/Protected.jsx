import {useAuth} from "../auth/useauth"
import { Navigate } from "react-router";


const Protected = ({children}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (<main><p>Loading...</p></main>);
  }
  if(!user){
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default Protected ;

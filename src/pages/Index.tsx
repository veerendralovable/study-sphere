import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import Dashboard from "./Dashboard";

export default function Index() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Dashboard />;
}

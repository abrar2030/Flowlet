import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return _jsx(LoadingScreen, {});
  }
  if (!isAuthenticated) {
    return _jsx(Navigate, { to: "/login", replace: true });
  }
  if (requiredRole && user?.role !== requiredRole) {
    return _jsx(Navigate, { to: "/dashboard", replace: true });
  }
  return _jsx(_Fragment, { children: children });
};
export default ProtectedRoute;

import { Navigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function AdminGuard({ children }) {
  if (!api.isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

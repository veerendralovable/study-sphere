import { Navigate, useSearchParams } from "react-router-dom";

// Back-compat: /auth → /login (preserving returnTo)
export default function Auth() {
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo");
  const to = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
  return <Navigate to={to} replace />;
}

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export function AppHeader({ onProfile }: { onProfile?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await authService.signOut();
      toast.success("Signed out");
      navigate("/auth");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur transition-all">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-lg bg-gradient-primary p-1.5 shadow-glow transition-transform group-hover:scale-105">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold transition-colors group-hover:text-primary">StudySphere</span>
        </Link>
        {user && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onProfile} className="transition-all">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="transition-all">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

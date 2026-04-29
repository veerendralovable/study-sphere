import { GraduationCap } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/50 p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-xl bg-gradient-primary p-3 shadow-glow animate-in fade-in zoom-in duration-500">
          <GraduationCap className="h-8 w-8 text-primary-foreground animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold">StudySphere</h1>
          <p className="text-sm text-muted-foreground">Loading your study space...</p>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[v0] App crashed:", error, info);
    console.error("[v0] Error message:", error.message);
    console.error("[v0] Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "Unexpected error";
      const isMissingEnv = errorMsg.includes("Missing") && errorMsg.includes("environment variable");

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <div className="rounded-lg bg-destructive/10 p-4">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold">Application Error</h1>
          <p className="max-w-md text-muted-foreground">
            {errorMsg}
          </p>
          {isMissingEnv && (
            <div className="mt-4 max-w-md rounded-lg bg-muted p-4 text-left">
              <p className="text-sm font-semibold mb-2">Configuration Required:</p>
              <p className="text-xs text-muted-foreground mb-3">
                Please ensure the following environment variables are set in your Vercel project settings:
              </p>
              <ul className="text-xs space-y-1 font-mono">
                <li>✓ NEXT_PUBLIC_SUPABASE_URL</li>
                <li>✓ NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

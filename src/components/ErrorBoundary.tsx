import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-muted-foreground">
            {this.state.error?.message ?? "Unexpected error"}
          </p>
          <Button onClick={() => (window.location.href = "/")}>Go home</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

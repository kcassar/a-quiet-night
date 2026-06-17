import { Component, type ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error boundary catches JavaScript errors anywhere in the child component
// tree and displays a fallback UI instead of crashing the whole app.
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    // In production, you could send to an error reporting service here:
    // reportError({ error, componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="app-content" style={{ paddingTop: "var(--space-10)" }}>
          <Card>
            <div style={{ textAlign: "center", padding: "var(--space-6)" }}>
              <h2 style={{ marginBottom: "var(--space-3)" }}>Something went wrong</h2>
              <p className="muted" style={{ marginBottom: "var(--space-5)" }}>
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details style={{ marginBottom: "var(--space-5)", textAlign: "left" }}>
                  <summary style={{ cursor: "pointer", color: "var(--text-muted)" }}>
                    Error details (development only)
                  </summary>
                  <pre
                    style={{
                      marginTop: "var(--space-3)",
                      padding: "var(--space-4)",
                      background: "var(--bg-soft)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--fs-13)",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {this.state.error.message}
                    {"\n\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="btn-row" style={{ justifyContent: "center" }}>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Refresh page
                </Button>
                <Button variant="secondary" onClick={this.handleReset}>
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

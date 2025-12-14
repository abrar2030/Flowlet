import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    Object.defineProperty(this, "handleReset", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: () => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
        });
      },
    });
    Object.defineProperty(this, "handleReload", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: () => {
        window.location.reload();
      },
    });
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // In production, send error to monitoring service
    if (import.meta.env.PROD) {
      // Send to error reporting service
      console.error("Error reported to monitoring service:", {
        error,
        errorInfo,
      });
    }
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return _jsx("div", {
        className:
          "min-h-screen flex items-center justify-center p-4 bg-background",
        children: _jsxs(Card, {
          className: "w-full max-w-md",
          children: [
            _jsxs(CardHeader, {
              className: "text-center",
              children: [
                _jsx("div", {
                  className:
                    "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10",
                  children: _jsx(AlertTriangle, {
                    className: "h-6 w-6 text-destructive",
                  }),
                }),
                _jsx(CardTitle, {
                  className: "text-xl",
                  children: "Something went wrong",
                }),
                _jsx(CardDescription, {
                  children:
                    "We're sorry, but something unexpected happened. Please try refreshing the page.",
                }),
              ],
            }),
            _jsxs(CardContent, {
              className: "space-y-4",
              children: [
                import.meta.env.DEV &&
                  this.state.error &&
                  _jsxs("div", {
                    className: "rounded-md bg-muted p-3",
                    children: [
                      _jsx("p", {
                        className: "text-sm font-medium text-destructive",
                        children: this.state.error.message,
                      }),
                      this.state.errorInfo &&
                        _jsx("pre", {
                          className:
                            "mt-2 text-xs text-muted-foreground overflow-auto",
                          children: this.state.errorInfo.componentStack,
                        }),
                    ],
                  }),
                _jsxs("div", {
                  className: "flex gap-2",
                  children: [
                    _jsx(Button, {
                      onClick: this.handleReset,
                      variant: "outline",
                      className: "flex-1",
                      children: "Try Again",
                    }),
                    _jsxs(Button, {
                      onClick: this.handleReload,
                      className: "flex-1",
                      children: [
                        _jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
                        "Reload Page",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      });
    }
    return this.props.children;
  }
}
export default ErrorBoundary;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from "lucide-react";
const LoadingScreen = ({ message = "Loading..." }) => {
  return _jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-background",
    children: _jsxs("div", {
      className: "text-center space-y-4",
      children: [
        _jsx("div", {
          className: "flex justify-center",
          children: _jsx(Loader2, {
            className: "h-8 w-8 animate-spin text-primary",
          }),
        }),
        _jsx("p", { className: "text-muted-foreground", children: message }),
      ],
    }),
  });
};
export default LoadingScreen;

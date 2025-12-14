import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
const OfflineIndicator = () => {
  return _jsxs(Alert, {
    className:
      "rounded-none border-x-0 border-t-0 bg-destructive text-destructive-foreground",
    children: [
      _jsx(WifiOff, { className: "h-4 w-4" }),
      _jsx(AlertDescription, {
        children:
          "You're currently offline. Some features may not be available.",
      }),
    ],
  });
};
export default OfflineIndicator;

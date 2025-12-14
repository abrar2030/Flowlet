import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Wallet,
  CreditCard,
  BarChart3,
  MessageSquare,
  Shield,
  Settings,
  PiggyBank,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
const navigationItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: CreditCard, label: "Cards", path: "/cards" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: PiggyBank, label: "Budgeting", path: "/budgeting" },
  { icon: MessageSquare, label: "AI Chat", path: "/chat" },
  { icon: AlertTriangle, label: "Fraud Alerts", path: "/alerts" },
  { icon: Shield, label: "Security", path: "/security" },
  { icon: Settings, label: "Settings", path: "/settings" },
];
const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  if (isMobile) {
    return _jsxs(_Fragment, {
      children: [
        isOpen &&
          _jsx("div", {
            className: "fixed inset-0 bg-black/50 z-40 lg:hidden",
            onClick: onClose,
          }),
        _jsxs("div", {
          className: cn(
            "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-300 lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
          ),
          children: [
            _jsxs("div", {
              className: "flex items-center justify-between p-4 border-b",
              children: [
                _jsx("h2", {
                  className: "text-lg font-semibold",
                  children: "Flowlet",
                }),
                _jsx(Button, {
                  variant: "ghost",
                  size: "sm",
                  onClick: onClose,
                  children: _jsx(X, { className: "h-4 w-4" }),
                }),
              ],
            }),
            _jsx(SidebarContent, { location: location, onItemClick: onClose }),
          ],
        }),
      ],
    });
  }
  return _jsx("div", {
    className: cn(
      "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r transform transition-transform duration-300 z-30",
      isOpen ? "translate-x-0" : "-translate-x-64",
    ),
    children: _jsx(SidebarContent, { location: location }),
  });
};
const SidebarContent = ({ location, onItemClick }) => {
  return _jsx(ScrollArea, {
    className: "h-full",
    children: _jsx("nav", {
      className: "p-4 space-y-2",
      children: navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return _jsxs(
          Link,
          {
            to: item.path,
            onClick: onItemClick,
            className: cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ),
            children: [
              _jsx(Icon, { className: "h-4 w-4" }),
              _jsx("span", { children: item.label }),
            ],
          },
          item.path,
        );
      }),
    }),
  });
};
export default Sidebar;

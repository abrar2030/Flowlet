import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, Bell, User, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/store/authSlice";
import { setTheme } from "@/store/uiSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
const Header = ({ onMenuClick, isMobile }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { theme, unreadNotifications } = useAppSelector((state) => state.ui);
  const handleLogout = () => {
    dispatch(logoutUser());
  };
  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
  };
  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return _jsx(Sun, { className: "h-4 w-4" });
      case "dark":
        return _jsx(Moon, { className: "h-4 w-4" });
      default:
        return _jsx(Monitor, { className: "h-4 w-4" });
    }
  };
  return _jsx("header", {
    className: "fixed top-0 left-0 right-0 h-16 bg-background border-b z-40",
    children: _jsxs("div", {
      className: "flex items-center justify-between h-full px-4",
      children: [
        _jsxs("div", {
          className: "flex items-center space-x-4",
          children: [
            _jsx(Button, {
              variant: "ghost",
              size: "sm",
              onClick: onMenuClick,
              className: "p-2",
              children: _jsx(Menu, { className: "h-5 w-5" }),
            }),
            _jsxs("div", {
              className: "flex items-center space-x-2",
              children: [
                _jsx("h1", {
                  className: "text-xl font-bold text-primary",
                  children: "Flowlet",
                }),
                isMobile &&
                  _jsx(Badge, {
                    variant: "secondary",
                    className: "text-xs",
                    children: "Mobile",
                  }),
              ],
            }),
          ],
        }),
        _jsxs("div", {
          className: "flex items-center space-x-2",
          children: [
            _jsxs(Button, {
              variant: "ghost",
              size: "sm",
              className: "relative",
              children: [
                _jsx(Bell, { className: "h-5 w-5" }),
                unreadNotifications > 0 &&
                  _jsx(Badge, {
                    variant: "destructive",
                    className:
                      "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0",
                    children:
                      unreadNotifications > 9 ? "9+" : unreadNotifications,
                  }),
              ],
            }),
            _jsxs(DropdownMenu, {
              children: [
                _jsx(DropdownMenuTrigger, {
                  asChild: true,
                  children: _jsx(Button, {
                    variant: "ghost",
                    className: "relative h-8 w-8 rounded-full",
                    children: _jsxs(Avatar, {
                      className: "h-8 w-8",
                      children: [
                        _jsx(AvatarImage, {
                          src: user?.avatar,
                          alt: user?.name,
                        }),
                        _jsx(AvatarFallback, {
                          children:
                            user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U",
                        }),
                      ],
                    }),
                  }),
                }),
                _jsxs(DropdownMenuContent, {
                  className: "w-56",
                  align: "end",
                  forceMount: true,
                  children: [
                    _jsx(DropdownMenuLabel, {
                      className: "font-normal",
                      children: _jsxs("div", {
                        className: "flex flex-col space-y-1",
                        children: [
                          _jsx("p", {
                            className: "text-sm font-medium leading-none",
                            children: user?.name,
                          }),
                          _jsx("p", {
                            className:
                              "text-xs leading-none text-muted-foreground",
                            children: user?.email,
                          }),
                        ],
                      }),
                    }),
                    _jsx(DropdownMenuSeparator, {}),
                    _jsxs(DropdownMenuItem, {
                      children: [
                        _jsx(User, { className: "mr-2 h-4 w-4" }),
                        _jsx("span", { children: "Profile" }),
                      ],
                    }),
                    _jsxs(DropdownMenuSub, {
                      children: [
                        _jsxs(DropdownMenuSubTrigger, {
                          children: [
                            getThemeIcon(),
                            _jsx("span", {
                              className: "ml-2",
                              children: "Theme",
                            }),
                          ],
                        }),
                        _jsxs(DropdownMenuSubContent, {
                          children: [
                            _jsxs(DropdownMenuItem, {
                              onClick: () => handleThemeChange("light"),
                              children: [
                                _jsx(Sun, { className: "mr-2 h-4 w-4" }),
                                _jsx("span", { children: "Light" }),
                              ],
                            }),
                            _jsxs(DropdownMenuItem, {
                              onClick: () => handleThemeChange("dark"),
                              children: [
                                _jsx(Moon, { className: "mr-2 h-4 w-4" }),
                                _jsx("span", { children: "Dark" }),
                              ],
                            }),
                            _jsxs(DropdownMenuItem, {
                              onClick: () => handleThemeChange("system"),
                              children: [
                                _jsx(Monitor, { className: "mr-2 h-4 w-4" }),
                                _jsx("span", { children: "System" }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsx(DropdownMenuSeparator, {}),
                    _jsxs(DropdownMenuItem, {
                      onClick: handleLogout,
                      children: [
                        _jsx(LogOut, { className: "mr-2 h-4 w-4" }),
                        _jsx("span", { children: "Log out" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
};
export default Header;

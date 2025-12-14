import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { loginUser } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});
const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "demo@flowlet.com",
      password: "demo123",
      rememberMe: false,
    },
  });
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await dispatch(loginUser(data)).unwrap();
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      setError("root", { message: error || "Login failed" });
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };
  return _jsx("div", {
    className:
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4",
    children: _jsxs(Card, {
      className: "w-full max-w-md",
      children: [
        _jsxs(CardHeader, {
          className: "text-center",
          children: [
            _jsx(CardTitle, {
              className: "text-2xl font-bold",
              children: "Welcome Back",
            }),
            _jsx(CardDescription, {
              children: "Sign in to your Flowlet account to continue",
            }),
          ],
        }),
        _jsxs(CardContent, {
          children: [
            _jsxs("form", {
              onSubmit: handleSubmit(onSubmit),
              className: "space-y-4",
              children: [
                errors.root &&
                  _jsx(Alert, {
                    variant: "destructive",
                    children: _jsx(AlertDescription, {
                      children: errors.root.message,
                    }),
                  }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, { htmlFor: "email", children: "Email" }),
                    _jsx(Input, {
                      id: "email",
                      type: "email",
                      placeholder: "Enter your email",
                      ...register("email"),
                      className: errors.email ? "border-destructive" : "",
                    }),
                    errors.email &&
                      _jsx("p", {
                        className: "text-sm text-destructive",
                        children: errors.email.message,
                      }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, { htmlFor: "password", children: "Password" }),
                    _jsxs("div", {
                      className: "relative",
                      children: [
                        _jsx(Input, {
                          id: "password",
                          type: showPassword ? "text" : "password",
                          placeholder: "Enter your password",
                          ...register("password"),
                          className: errors.password
                            ? "border-destructive pr-10"
                            : "pr-10",
                        }),
                        _jsx(Button, {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          className:
                            "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent",
                          onClick: () => setShowPassword(!showPassword),
                          children: showPassword
                            ? _jsx(EyeOff, { className: "h-4 w-4" })
                            : _jsx(Eye, { className: "h-4 w-4" }),
                        }),
                      ],
                    }),
                    errors.password &&
                      _jsx("p", {
                        className: "text-sm text-destructive",
                        children: errors.password.message,
                      }),
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      className: "flex items-center space-x-2",
                      children: [
                        _jsx(Checkbox, {
                          id: "rememberMe",
                          ...register("rememberMe"),
                        }),
                        _jsx(Label, {
                          htmlFor: "rememberMe",
                          className: "text-sm",
                          children: "Remember me",
                        }),
                      ],
                    }),
                    _jsx(Link, {
                      to: "/forgot-password",
                      className: "text-sm text-primary hover:underline",
                      children: "Forgot password?",
                    }),
                  ],
                }),
                _jsxs(Button, {
                  type: "submit",
                  className: "w-full",
                  disabled: isLoading,
                  children: [
                    isLoading &&
                      _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                    "Sign In",
                  ],
                }),
                _jsxs("div", {
                  className: "text-center text-sm",
                  children: [
                    "Don't have an account?",
                    " ",
                    _jsx(Link, {
                      to: "/register",
                      className: "text-primary hover:underline",
                      children: "Sign up",
                    }),
                  ],
                }),
              ],
            }),
            _jsxs("div", {
              className: "mt-6 p-4 bg-muted rounded-lg",
              children: [
                _jsx("p", {
                  className: "text-sm text-muted-foreground mb-2",
                  children: "Demo Credentials:",
                }),
                _jsx("p", {
                  className: "text-xs",
                  children: "Email: demo@flowlet.com",
                }),
                _jsx("p", {
                  className: "text-xs",
                  children: "Password: demo123",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
};
export default LoginScreen;

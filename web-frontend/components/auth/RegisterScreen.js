import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { registerUser } from "@/store/authSlice";
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
const registerSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the terms and conditions",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
const RegisterScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Remove confirmPassword and acceptTerms from the data sent to the API
      const { confirmPassword, acceptTerms, firstName, lastName, ...rest } =
        data;
      // Transform to API format (snake_case)
      const registerData = {
        ...rest,
        first_name: firstName,
        last_name: lastName,
      };
      await dispatch(registerUser(registerData)).unwrap();
      toast.success("Account created successfully!");
      navigate("/onboarding");
    } catch (error) {
      setError("root", { message: error || "Registration failed" });
      toast.error("Registration failed. Please try again.");
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
              children: "Create Account",
            }),
            _jsx(CardDescription, {
              children: "Join Flowlet and start managing your finances",
            }),
          ],
        }),
        _jsx(CardContent, {
          children: _jsxs("form", {
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
                  _jsx(Label, {
                    htmlFor: "first_name",
                    children: "First Name",
                  }),
                  _jsx(Input, {
                    id: "first_name",
                    type: "text",
                    placeholder: "Enter your first name",
                    ...register("first_name"),
                    className: errors.first_name ? "border-destructive" : "",
                  }),
                  errors.first_name &&
                    _jsx("p", {
                      className: "text-sm text-destructive",
                      children: errors.first_name.message,
                    }),
                ],
              }),
              _jsxs("div", {
                className: "space-y-2",
                children: [
                  _jsx(Label, { htmlFor: "last_name", children: "Last Name" }),
                  _jsx(Input, {
                    id: "last_name",
                    type: "text",
                    placeholder: "Enter your last name",
                    ...register("last_name"),
                    className: errors.last_name ? "border-destructive" : "",
                  }),
                  errors.last_name &&
                    _jsx("p", {
                      className: "text-sm text-destructive",
                      children: errors.last_name.message,
                    }),
                ],
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
                        placeholder: "Create a password",
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
                className: "space-y-2",
                children: [
                  _jsx(Label, {
                    htmlFor: "confirmPassword",
                    children: "Confirm Password",
                  }),
                  _jsxs("div", {
                    className: "relative",
                    children: [
                      _jsx(Input, {
                        id: "confirmPassword",
                        type: showConfirmPassword ? "text" : "password",
                        placeholder: "Confirm your password",
                        ...register("confirmPassword"),
                        className: errors.confirmPassword
                          ? "border-destructive pr-10"
                          : "pr-10",
                      }),
                      _jsx(Button, {
                        type: "button",
                        variant: "ghost",
                        size: "sm",
                        className:
                          "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent",
                        onClick: () =>
                          setShowConfirmPassword(!showConfirmPassword),
                        children: showConfirmPassword
                          ? _jsx(EyeOff, { className: "h-4 w-4" })
                          : _jsx(Eye, { className: "h-4 w-4" }),
                      }),
                    ],
                  }),
                  errors.confirmPassword &&
                    _jsx("p", {
                      className: "text-sm text-destructive",
                      children: errors.confirmPassword.message,
                    }),
                ],
              }),
              _jsxs("div", {
                className: "flex items-center space-x-2",
                children: [
                  _jsx(Checkbox, {
                    id: "acceptTerms",
                    ...register("acceptTerms"),
                  }),
                  _jsxs(Label, {
                    htmlFor: "acceptTerms",
                    className: "text-sm",
                    children: [
                      "I agree to the",
                      " ",
                      _jsx(Link, {
                        to: "/terms",
                        className: "text-primary hover:underline",
                        children: "Terms of Service",
                      }),
                      " ",
                      "and",
                      " ",
                      _jsx(Link, {
                        to: "/privacy",
                        className: "text-primary hover:underline",
                        children: "Privacy Policy",
                      }),
                    ],
                  }),
                ],
              }),
              errors.acceptTerms &&
                _jsx("p", {
                  className: "text-sm text-destructive",
                  children: errors.acceptTerms.message,
                }),
              _jsxs(Button, {
                type: "submit",
                className: "w-full",
                disabled: isLoading,
                children: [
                  isLoading &&
                    _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                  "Create Account",
                ],
              }),
              _jsxs("div", {
                className: "text-center text-sm",
                children: [
                  "Already have an account?",
                  " ",
                  _jsx(Link, {
                    to: "/login",
                    className: "text-primary hover:underline",
                    children: "Sign in",
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    }),
  });
};
export default RegisterScreen;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export default function SettingsScreen() {
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-4xl",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "Settings",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Manage your account preferences and settings",
          }),
        ],
      }),
      _jsxs(Tabs, {
        defaultValue: "profile",
        className: "space-y-4",
        children: [
          _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, { value: "profile", children: "Profile" }),
              _jsx(TabsTrigger, {
                value: "notifications",
                children: "Notifications",
              }),
              _jsx(TabsTrigger, {
                value: "preferences",
                children: "Preferences",
              }),
              _jsx(TabsTrigger, { value: "security", children: "Security" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "profile",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Profile Information" }),
                    _jsx(CardDescription, {
                      children: "Update your account details",
                    }),
                  ],
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsxs("div", {
                      className: "grid grid-cols-2 gap-4",
                      children: [
                        _jsxs("div", {
                          className: "space-y-2",
                          children: [
                            _jsx(Label, {
                              htmlFor: "firstName",
                              children: "First Name",
                            }),
                            _jsx(Input, {
                              id: "firstName",
                              defaultValue: "John",
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "space-y-2",
                          children: [
                            _jsx(Label, {
                              htmlFor: "lastName",
                              children: "Last Name",
                            }),
                            _jsx(Input, {
                              id: "lastName",
                              defaultValue: "Doe",
                            }),
                          ],
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
                          defaultValue: "john@example.com",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "phone",
                          children: "Phone Number",
                        }),
                        _jsx(Input, {
                          id: "phone",
                          type: "tel",
                          defaultValue: "+1 234 567 8900",
                        }),
                      ],
                    }),
                    _jsx(Button, { children: "Save Changes" }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "notifications",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Notification Preferences" }),
                    _jsx(CardDescription, {
                      children: "Choose how you want to be notified",
                    }),
                  ],
                }),
                _jsx(CardContent, {
                  className: "space-y-4",
                  children: [
                    {
                      id: "email-notifications",
                      label: "Email Notifications",
                      description: "Receive updates via email",
                    },
                    {
                      id: "push-notifications",
                      label: "Push Notifications",
                      description: "Get push notifications on your devices",
                    },
                    {
                      id: "transaction-alerts",
                      label: "Transaction Alerts",
                      description: "Notify me of all transactions",
                    },
                    {
                      id: "security-alerts",
                      label: "Security Alerts",
                      description: "Important security updates",
                    },
                  ].map((notif) =>
                    _jsxs(
                      "div",
                      {
                        className: "flex items-center justify-between py-2",
                        children: [
                          _jsxs("div", {
                            className: "space-y-0.5",
                            children: [
                              _jsx(Label, {
                                htmlFor: notif.id,
                                children: notif.label,
                              }),
                              _jsx("p", {
                                className: "text-sm text-muted-foreground",
                                children: notif.description,
                              }),
                            ],
                          }),
                          _jsx(Switch, { id: notif.id, defaultChecked: true }),
                        ],
                      },
                      notif.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "preferences",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "App Preferences" }),
                    _jsx(CardDescription, {
                      children: "Customize your experience",
                    }),
                  ],
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "language",
                          children: "Language",
                        }),
                        _jsxs(Select, {
                          defaultValue: "en",
                          children: [
                            _jsx(SelectTrigger, {
                              id: "language",
                              children: _jsx(SelectValue, {}),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "en",
                                  children: "English",
                                }),
                                _jsx(SelectItem, {
                                  value: "es",
                                  children: "Spanish",
                                }),
                                _jsx(SelectItem, {
                                  value: "fr",
                                  children: "French",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "currency",
                          children: "Default Currency",
                        }),
                        _jsxs(Select, {
                          defaultValue: "usd",
                          children: [
                            _jsx(SelectTrigger, {
                              id: "currency",
                              children: _jsx(SelectValue, {}),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "usd",
                                  children: "USD",
                                }),
                                _jsx(SelectItem, {
                                  value: "eur",
                                  children: "EUR",
                                }),
                                _jsx(SelectItem, {
                                  value: "gbp",
                                  children: "GBP",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "timezone",
                          children: "Timezone",
                        }),
                        _jsxs(Select, {
                          defaultValue: "utc",
                          children: [
                            _jsx(SelectTrigger, {
                              id: "timezone",
                              children: _jsx(SelectValue, {}),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "utc",
                                  children: "UTC",
                                }),
                                _jsx(SelectItem, {
                                  value: "est",
                                  children: "EST",
                                }),
                                _jsx(SelectItem, {
                                  value: "pst",
                                  children: "PST",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsx(Button, { children: "Save Preferences" }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "security",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Security Settings" }),
                    _jsx(CardDescription, {
                      children: "Manage your security options",
                    }),
                  ],
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "current-password",
                          children: "Current Password",
                        }),
                        _jsx(Input, {
                          id: "current-password",
                          type: "password",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "new-password",
                          children: "New Password",
                        }),
                        _jsx(Input, { id: "new-password", type: "password" }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, {
                          htmlFor: "confirm-password",
                          children: "Confirm Password",
                        }),
                        _jsx(Input, {
                          id: "confirm-password",
                          type: "password",
                        }),
                      ],
                    }),
                    _jsx(Button, { children: "Update Password" }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}

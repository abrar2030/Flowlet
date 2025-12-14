import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Shield,
  Users,
  Key,
  Lock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  Globe,
  Building,
} from "lucide-react";
export function RoleBasedAccess({
  currentUser,
  permissions = [],
  roles = [],
  users = [],
  accessRequests = [],
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  onUserRoleUpdate,
  onAccessRequestReview,
  onPermissionCheck,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    searchTerm: "",
    filterCategory: "all",
    filterLevel: "all",
    selectedRole: null,
    selectedUser: null,
    isCreatingRole: false,
    isEditingRole: false,
    newRole: {
      name: "",
      description: "",
      permissions: [],
      inheritsFrom: [],
      isSystem: false,
      isActive: true,
    },
    error: null,
    success: null,
  });
  // Permission categories
  const permissionCategories = useMemo(() => {
    const categories = new Set(permissions.map((p) => p.category));
    return Array.from(categories);
  }, [permissions]);
  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      const matchesSearch =
        permission.name
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        permission.description
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
      const matchesCategory =
        state.filterCategory === "all" ||
        permission.category === state.filterCategory;
      const matchesLevel =
        state.filterLevel === "all" || permission.level === state.filterLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [permissions, state.searchTerm, state.filterCategory, state.filterLevel]);
  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(state.searchTerm.toLowerCase()),
    );
  }, [roles, state.searchTerm]);
  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (user.department &&
          user.department
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase())),
    );
  }, [users, state.searchTerm]);
  // Get permission by ID
  const getPermission = useCallback(
    (permissionId) => {
      return permissions.find((p) => p.id === permissionId);
    },
    [permissions],
  );
  // Get role by ID
  const getRole = useCallback(
    (roleId) => {
      return roles.find((r) => r.id === roleId);
    },
    [roles],
  );
  // Get effective permissions for a role (including inherited)
  const getEffectivePermissions = useCallback(
    (role) => {
      const allPermissions = new Set();
      // Add direct permissions
      role.permissions.forEach((permId) => allPermissions.add(permId));
      // Add inherited permissions
      if (role.inheritsFrom) {
        role.inheritsFrom.forEach((parentRoleId) => {
          const parentRole = getRole(parentRoleId);
          if (parentRole) {
            const parentPermissions = getEffectivePermissions(parentRole);
            parentPermissions.forEach((perm) => allPermissions.add(perm.id));
          }
        });
      }
      return Array.from(allPermissions)
        .map((permId) => getPermission(permId))
        .filter(Boolean);
    },
    [getRole, getPermission],
  );
  // Check if user has permission
  const hasPermission = useCallback(
    async (userId, permissionId, resource) => {
      if (onPermissionCheck) {
        return await onPermissionCheck(userId, permissionId, resource);
      }
      // Fallback local check
      const user = users.find((u) => u.id === userId);
      if (!user) return false;
      for (const roleId of user.roles) {
        const role = getRole(roleId);
        if (role && role.isActive) {
          const effectivePermissions = getEffectivePermissions(role);
          if (effectivePermissions.some((p) => p.id === permissionId)) {
            return true;
          }
        }
      }
      return false;
    },
    [onPermissionCheck, users, getRole, getEffectivePermissions],
  );
  // Handle role creation
  const handleCreateRole = useCallback(async () => {
    if (!state.newRole.name || !state.newRole.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isCreatingRole: true, error: null }));
    try {
      if (onRoleCreate) {
        await onRoleCreate({
          name: state.newRole.name,
          description: state.newRole.description,
          permissions: state.newRole.permissions || [],
          inheritsFrom: state.newRole.inheritsFrom || [],
          isSystem: state.newRole.isSystem || false,
          isActive: state.newRole.isActive !== false,
        });
        setState((prev) => ({
          ...prev,
          success: "Role created successfully",
          newRole: {
            name: "",
            description: "",
            permissions: [],
            inheritsFrom: [],
            isSystem: false,
            isActive: true,
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to create role" }));
    } finally {
      setState((prev) => ({ ...prev, isCreatingRole: false }));
    }
  }, [state.newRole, onRoleCreate]);
  // Handle role update
  const handleUpdateRole = useCallback(
    async (roleId, updates) => {
      setState((prev) => ({ ...prev, error: null }));
      try {
        if (onRoleUpdate) {
          await onRoleUpdate(roleId, updates);
          setState((prev) => ({
            ...prev,
            success: "Role updated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to update role" }));
      }
    },
    [onRoleUpdate],
  );
  // Handle role deletion
  const handleDeleteRole = useCallback(
    async (roleId) => {
      if (!confirm("Are you sure you want to delete this role?")) return;
      setState((prev) => ({ ...prev, error: null }));
      try {
        if (onRoleDelete) {
          await onRoleDelete(roleId);
          setState((prev) => ({
            ...prev,
            success: "Role deleted successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to delete role" }));
      }
    },
    [onRoleDelete],
  );
  // Handle user role update
  const handleUserRoleUpdate = useCallback(
    async (userId, newRoles) => {
      setState((prev) => ({ ...prev, error: null }));
      try {
        if (onUserRoleUpdate) {
          await onUserRoleUpdate(userId, newRoles);
          setState((prev) => ({
            ...prev,
            success: "User roles updated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to update user roles" }));
      }
    },
    [onUserRoleUpdate],
  );
  // Handle access request review
  const handleAccessRequestReview = useCallback(
    async (requestId, status, notes) => {
      setState((prev) => ({ ...prev, error: null }));
      try {
        if (onAccessRequestReview) {
          await onAccessRequestReview(requestId, status, notes);
          setState((prev) => ({
            ...prev,
            success: `Access request ${status} successfully`,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to review access request",
        }));
      }
    },
    [onAccessRequestReview],
  );
  const getLevelColor = (level) => {
    switch (level) {
      case "read":
        return "bg-green-100 text-green-600";
      case "write":
        return "bg-blue-100 text-blue-600";
      case "admin":
        return "bg-orange-100 text-orange-600";
      case "super_admin":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "approved":
        return "bg-green-100 text-green-600";
      case "rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  return _jsxs("div", {
    className: `space-y-6 ${className}`,
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              className: "flex items-center justify-between",
              children: [
                _jsxs("div", {
                  className: "flex items-center",
                  children: [
                    _jsx(Shield, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Role-Based Access Control",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Users, { className: "w-3 h-3 mr-1" }),
                        users.length,
                        " Users",
                      ],
                    }),
                    _jsxs(Badge, {
                      className: "bg-green-100 text-green-600",
                      children: [
                        _jsx(Key, { className: "w-3 h-3 mr-1" }),
                        roles.length,
                        " Roles",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("p", {
              className: "text-sm text-gray-600",
              children:
                "Manage user roles, permissions, and access controls for your financial application.",
            }),
          }),
        ],
      }),
      state.error &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsx(AlertDescription, {
              className: "text-red-800",
              children: state.error,
            }),
          ],
        }),
      state.success &&
        _jsxs(Alert, {
          className: "border-green-200 bg-green-50",
          children: [
            _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }),
            _jsx(AlertDescription, {
              className: "text-green-800",
              children: state.success,
            }),
          ],
        }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "p-4",
          children: _jsxs("div", {
            className: "flex space-x-4",
            children: [
              _jsx("div", {
                className: "flex-1",
                children: _jsxs("div", {
                  className: "relative",
                  children: [
                    _jsx(Search, {
                      className:
                        "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
                    }),
                    _jsx(Input, {
                      placeholder: "Search roles, users, or permissions...",
                      value: state.searchTerm,
                      onChange: (e) =>
                        setState((prev) => ({
                          ...prev,
                          searchTerm: e.target.value,
                        })),
                      className: "pl-10",
                    }),
                  ],
                }),
              }),
              _jsxs(Select, {
                value: state.filterCategory,
                onValueChange: (value) =>
                  setState((prev) => ({ ...prev, filterCategory: value })),
                children: [
                  _jsx(SelectTrigger, {
                    className: "w-48",
                    children: _jsx(SelectValue, {
                      placeholder: "Filter by category",
                    }),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "all",
                        children: "All Categories",
                      }),
                      permissionCategories.map((category) =>
                        _jsx(
                          SelectItem,
                          { value: category, children: category },
                          category,
                        ),
                      ),
                    ],
                  }),
                ],
              }),
              _jsxs(Select, {
                value: state.filterLevel,
                onValueChange: (value) =>
                  setState((prev) => ({ ...prev, filterLevel: value })),
                children: [
                  _jsx(SelectTrigger, {
                    className: "w-48",
                    children: _jsx(SelectValue, {
                      placeholder: "Filter by level",
                    }),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "all",
                        children: "All Levels",
                      }),
                      _jsx(SelectItem, { value: "read", children: "Read" }),
                      _jsx(SelectItem, { value: "write", children: "Write" }),
                      _jsx(SelectItem, { value: "admin", children: "Admin" }),
                      _jsx(SelectItem, {
                        value: "super_admin",
                        children: "Super Admin",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-5",
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "roles", children: "Roles" }),
              _jsx(TabsTrigger, { value: "users", children: "Users" }),
              _jsx(TabsTrigger, {
                value: "permissions",
                children: "Permissions",
              }),
              _jsx(TabsTrigger, { value: "requests", children: "Requests" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "overview",
            children: _jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
              children: [
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    className: "p-4",
                    children: _jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Total Users",
                            }),
                            _jsx("p", {
                              className: "text-2xl font-bold",
                              children: users.length,
                            }),
                          ],
                        }),
                        _jsx(Users, { className: "w-8 h-8 text-blue-500" }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    className: "p-4",
                    children: _jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Active Roles",
                            }),
                            _jsx("p", {
                              className: "text-2xl font-bold",
                              children: roles.filter((r) => r.isActive).length,
                            }),
                          ],
                        }),
                        _jsx(Key, { className: "w-8 h-8 text-green-500" }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    className: "p-4",
                    children: _jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Permissions",
                            }),
                            _jsx("p", {
                              className: "text-2xl font-bold",
                              children: permissions.length,
                            }),
                          ],
                        }),
                        _jsx(Lock, { className: "w-8 h-8 text-orange-500" }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    className: "p-4",
                    children: _jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Pending Requests",
                            }),
                            _jsx("p", {
                              className: "text-2xl font-bold text-red-600",
                              children: accessRequests.filter(
                                (r) => r.status === "pending",
                              ).length,
                            }),
                          ],
                        }),
                        _jsx(Clock, { className: "w-8 h-8 text-red-500" }),
                      ],
                    }),
                  }),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "roles",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Roles Management",
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          isCreatingRole: !prev.isCreatingRole,
                        })),
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Create Role",
                      ],
                    }),
                  ],
                }),
                state.isCreatingRole &&
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          children: "Create New Role",
                        }),
                      }),
                      _jsxs(CardContent, {
                        className: "space-y-4",
                        children: [
                          _jsxs("div", {
                            className: "grid grid-cols-2 gap-4",
                            children: [
                              _jsxs("div", {
                                children: [
                                  _jsx(Label, { children: "Role Name" }),
                                  _jsx(Input, {
                                    value: state.newRole.name || "",
                                    onChange: (e) =>
                                      setState((prev) => ({
                                        ...prev,
                                        newRole: {
                                          ...prev.newRole,
                                          name: e.target.value,
                                        },
                                      })),
                                    placeholder: "Enter role name",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx(Label, { children: "Description" }),
                                  _jsx(Input, {
                                    value: state.newRole.description || "",
                                    onChange: (e) =>
                                      setState((prev) => ({
                                        ...prev,
                                        newRole: {
                                          ...prev.newRole,
                                          description: e.target.value,
                                        },
                                      })),
                                    placeholder: "Enter role description",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx(Label, { children: "Permissions" }),
                              _jsx("div", {
                                className:
                                  "grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2",
                                children: permissions.map((permission) =>
                                  _jsxs(
                                    "div",
                                    {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        _jsx(Checkbox, {
                                          checked:
                                            state.newRole.permissions?.includes(
                                              permission.id,
                                            ),
                                          onCheckedChange: (checked) => {
                                            setState((prev) => ({
                                              ...prev,
                                              newRole: {
                                                ...prev.newRole,
                                                permissions: checked
                                                  ? [
                                                      ...(prev.newRole
                                                        .permissions || []),
                                                      permission.id,
                                                    ]
                                                  : (
                                                      prev.newRole
                                                        .permissions || []
                                                    ).filter(
                                                      (id) =>
                                                        id !== permission.id,
                                                    ),
                                              },
                                            }));
                                          },
                                        }),
                                        _jsx("span", {
                                          className: "text-sm",
                                          children: permission.name,
                                        }),
                                      ],
                                    },
                                    permission.id,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex space-x-2",
                            children: [
                              _jsx(Button, {
                                onClick: handleCreateRole,
                                disabled: state.isCreatingRole,
                                children: "Create Role",
                              }),
                              _jsx(Button, {
                                onClick: () =>
                                  setState((prev) => ({
                                    ...prev,
                                    isCreatingRole: false,
                                  })),
                                variant: "outline",
                                children: "Cancel",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredRoles.map((role) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsx("div", {
                                className: "flex items-center space-x-3",
                                children: _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium",
                                      children: role.name,
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children: role.description,
                                    }),
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mt-1",
                                      children: [
                                        _jsx(Badge, {
                                          className: role.isActive
                                            ? "bg-green-100 text-green-600"
                                            : "bg-gray-100 text-gray-600",
                                          children: role.isActive
                                            ? "Active"
                                            : "Inactive",
                                        }),
                                        role.isSystem &&
                                          _jsx(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: "System",
                                          }),
                                        _jsxs("span", {
                                          className: "text-xs text-gray-500",
                                          children: [role.userCount, " users"],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                              _jsxs("div", {
                                className: "flex space-x-2",
                                children: [
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedRole: role,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Edit, { className: "w-3 h-3 mr-1" }),
                                      "Edit",
                                    ],
                                  }),
                                  !role.isSystem &&
                                    _jsxs(Button, {
                                      onClick: () => handleDeleteRole(role.id),
                                      size: "sm",
                                      variant: "destructive",
                                      children: [
                                        _jsx(Trash2, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Delete",
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      role.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "users",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Users Management",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredUsers.map((user) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsx("div", {
                                className: "flex items-center space-x-3",
                                children: _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium",
                                      children: user.name,
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children: user.email,
                                    }),
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mt-1",
                                      children: [
                                        user.department &&
                                          _jsxs(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: [
                                              _jsx(Building, {
                                                className: "w-3 h-3 mr-1",
                                              }),
                                              user.department,
                                            ],
                                          }),
                                        user.location &&
                                          _jsxs(Badge, {
                                            className:
                                              "bg-green-100 text-green-600",
                                            children: [
                                              _jsx(Globe, {
                                                className: "w-3 h-3 mr-1",
                                              }),
                                              user.location,
                                            ],
                                          }),
                                        _jsx(Badge, {
                                          className: user.isActive
                                            ? "bg-green-100 text-green-600"
                                            : "bg-gray-100 text-gray-600",
                                          children: user.isActive
                                            ? "Active"
                                            : "Inactive",
                                        }),
                                      ],
                                    }),
                                    _jsx("div", {
                                      className: "flex flex-wrap gap-1 mt-2",
                                      children: user.roles.map((roleId) => {
                                        const role = getRole(roleId);
                                        return role
                                          ? _jsx(
                                              Badge,
                                              {
                                                className:
                                                  "bg-purple-100 text-purple-600 text-xs",
                                                children: role.name,
                                              },
                                              roleId,
                                            )
                                          : null;
                                      }),
                                    }),
                                  ],
                                }),
                              }),
                              _jsx("div", {
                                className: "flex space-x-2",
                                children: _jsxs(Button, {
                                  onClick: () =>
                                    setState((prev) => ({
                                      ...prev,
                                      selectedUser: user,
                                    })),
                                  size: "sm",
                                  variant: "outline",
                                  children: [
                                    _jsx(Edit, { className: "w-3 h-3 mr-1" }),
                                    "Manage Roles",
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      },
                      user.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "permissions",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Permissions Overview",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredPermissions.map((permission) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsx("div", {
                            className: "flex items-center justify-between",
                            children: _jsxs("div", {
                              children: [
                                _jsx("h4", {
                                  className: "font-medium",
                                  children: permission.name,
                                }),
                                _jsx("p", {
                                  className: "text-sm text-gray-600",
                                  children: permission.description,
                                }),
                                _jsxs("div", {
                                  className: "flex items-center space-x-2 mt-1",
                                  children: [
                                    _jsx(Badge, {
                                      className: getLevelColor(
                                        permission.level,
                                      ),
                                      children: permission.level.replace(
                                        "_",
                                        " ",
                                      ),
                                    }),
                                    _jsx(Badge, {
                                      className: "bg-gray-100 text-gray-600",
                                      children: permission.category,
                                    }),
                                    _jsxs("span", {
                                      className: "text-xs text-gray-500",
                                      children: [
                                        "Resource: ",
                                        permission.resource,
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        }),
                      },
                      permission.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "requests",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Access Requests",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: accessRequests.map((request) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsxs("div", {
                                children: [
                                  _jsx("h4", {
                                    className: "font-medium",
                                    children: request.userName,
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600",
                                    children: request.reason,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-2 mt-1",
                                    children: [
                                      _jsx(Badge, {
                                        className: getStatusColor(
                                          request.status,
                                        ),
                                        children: request.status,
                                      }),
                                      _jsxs("span", {
                                        className: "text-xs text-gray-500",
                                        children: [
                                          "Requested:",
                                          " ",
                                          new Date(
                                            request.requestedAt,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsx("div", {
                                    className: "flex flex-wrap gap-1 mt-2",
                                    children: request.requestedRoles.map(
                                      (roleId) => {
                                        const role = getRole(roleId);
                                        return role
                                          ? _jsx(
                                              Badge,
                                              {
                                                className:
                                                  "bg-blue-100 text-blue-600 text-xs",
                                                children: role.name,
                                              },
                                              roleId,
                                            )
                                          : null;
                                      },
                                    ),
                                  }),
                                ],
                              }),
                              request.status === "pending" &&
                                _jsxs("div", {
                                  className: "flex space-x-2",
                                  children: [
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleAccessRequestReview(
                                          request.id,
                                          "approved",
                                        ),
                                      size: "sm",
                                      className:
                                        "bg-green-600 hover:bg-green-700",
                                      children: [
                                        _jsx(CheckCircle, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Approve",
                                      ],
                                    }),
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleAccessRequestReview(
                                          request.id,
                                          "rejected",
                                        ),
                                      size: "sm",
                                      variant: "destructive",
                                      children: [
                                        _jsx(XCircle, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Reject",
                                      ],
                                    }),
                                  ],
                                }),
                            ],
                          }),
                        }),
                      },
                      request.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
export default RoleBasedAccess;

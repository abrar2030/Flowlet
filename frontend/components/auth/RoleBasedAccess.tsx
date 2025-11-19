import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Shield,
  Users,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  Globe,
  Building
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'read' | 'write' | 'admin' | 'super_admin';
  resource: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inheritsFrom?: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: string;
  department?: string;
  location?: string;
}

interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  requestedRoles: string[];
  requestedPermissions: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface RoleBasedAccessProps {
  currentUser?: User;
  permissions?: Permission[];
  roles?: Role[];
  users?: User[];
  accessRequests?: AccessRequest[];
  onRoleCreate?: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>) => Promise<void>;
  onRoleUpdate?: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onRoleDelete?: (roleId: string) => Promise<void>;
  onUserRoleUpdate?: (userId: string, roles: string[]) => Promise<void>;
  onAccessRequestReview?: (requestId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  onPermissionCheck?: (userId: string, permission: string, resource?: string) => Promise<boolean>;
  className?: string;
}

interface ComponentState {
  activeTab: string;
  searchTerm: string;
  filterCategory: string;
  filterLevel: string;
  selectedRole: Role | null;
  selectedUser: User | null;
  isCreatingRole: boolean;
  isEditingRole: boolean;
  newRole: Partial<Role>;
  error: string | null;
  success: string | null;
}

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
  className = ''
}: RoleBasedAccessProps) {
  const [state, setState] = useState<ComponentState>({
    activeTab: 'overview',
    searchTerm: '',
    filterCategory: 'all',
    filterLevel: 'all',
    selectedRole: null,
    selectedUser: null,
    isCreatingRole: false,
    isEditingRole: false,
    newRole: {
      name: '',
      description: '',
      permissions: [],
      inheritsFrom: [],
      isSystem: false,
      isActive: true
    },
    error: null,
    success: null
  });

  // Permission categories
  const permissionCategories = useMemo(() => {
    const categories = new Set(permissions.map(p => p.category));
    return Array.from(categories);
  }, [permissions]);

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                           permission.description.toLowerCase().includes(state.searchTerm.toLowerCase());
      const matchesCategory = state.filterCategory === 'all' || permission.category === state.filterCategory;
      const matchesLevel = state.filterLevel === 'all' || permission.level === state.filterLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [permissions, state.searchTerm, state.filterCategory, state.filterLevel]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  }, [roles, state.searchTerm]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(state.searchTerm.toLowerCase()))
    );
  }, [users, state.searchTerm]);

  // Get permission by ID
  const getPermission = useCallback((permissionId: string) => {
    return permissions.find(p => p.id === permissionId);
  }, [permissions]);

  // Get role by ID
  const getRole = useCallback((roleId: string) => {
    return roles.find(r => r.id === roleId);
  }, [roles]);

  // Get effective permissions for a role (including inherited)
  const getEffectivePermissions = useCallback((role: Role): Permission[] => {
    const allPermissions = new Set<string>();

    // Add direct permissions
    role.permissions.forEach(permId => allPermissions.add(permId));

    // Add inherited permissions
    if (role.inheritsFrom) {
      role.inheritsFrom.forEach(parentRoleId => {
        const parentRole = getRole(parentRoleId);
        if (parentRole) {
          const parentPermissions = getEffectivePermissions(parentRole);
          parentPermissions.forEach(perm => allPermissions.add(perm.id));
        }
      });
    }

    return Array.from(allPermissions)
      .map(permId => getPermission(permId))
      .filter(Boolean) as Permission[];
  }, [getRole, getPermission]);

  // Check if user has permission
  const hasPermission = useCallback(async (userId: string, permissionId: string, resource?: string): Promise<boolean> => {
    if (onPermissionCheck) {
      return await onPermissionCheck(userId, permissionId, resource);
    }

    // Fallback local check
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    for (const roleId of user.roles) {
      const role = getRole(roleId);
      if (role && role.isActive) {
        const effectivePermissions = getEffectivePermissions(role);
        if (effectivePermissions.some(p => p.id === permissionId)) {
          return true;
        }
      }
    }

    return false;
  }, [onPermissionCheck, users, getRole, getEffectivePermissions]);

  // Handle role creation
  const handleCreateRole = useCallback(async () => {
    if (!state.newRole.name || !state.newRole.description) {
      setState(prev => ({ ...prev, error: 'Name and description are required' }));
      return;
    }

    setState(prev => ({ ...prev, isCreatingRole: true, error: null }));

    try {
      if (onRoleCreate) {
        await onRoleCreate({
          name: state.newRole.name!,
          description: state.newRole.description!,
          permissions: state.newRole.permissions || [],
          inheritsFrom: state.newRole.inheritsFrom || [],
          isSystem: state.newRole.isSystem || false,
          isActive: state.newRole.isActive !== false
        });

        setState(prev => ({
          ...prev,
          success: 'Role created successfully',
          newRole: {
            name: '',
            description: '',
            permissions: [],
            inheritsFrom: [],
            isSystem: false,
            isActive: true
          }
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create role' }));
    } finally {
      setState(prev => ({ ...prev, isCreatingRole: false }));
    }
  }, [state.newRole, onRoleCreate]);

  // Handle role update
  const handleUpdateRole = useCallback(async (roleId: string, updates: Partial<Role>) => {
    setState(prev => ({ ...prev, error: null }));

    try {
      if (onRoleUpdate) {
        await onRoleUpdate(roleId, updates);
        setState(prev => ({ ...prev, success: 'Role updated successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update role' }));
    }
  }, [onRoleUpdate]);

  // Handle role deletion
  const handleDeleteRole = useCallback(async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    setState(prev => ({ ...prev, error: null }));

    try {
      if (onRoleDelete) {
        await onRoleDelete(roleId);
        setState(prev => ({ ...prev, success: 'Role deleted successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to delete role' }));
    }
  }, [onRoleDelete]);

  // Handle user role update
  const handleUserRoleUpdate = useCallback(async (userId: string, newRoles: string[]) => {
    setState(prev => ({ ...prev, error: null }));

    try {
      if (onUserRoleUpdate) {
        await onUserRoleUpdate(userId, newRoles);
        setState(prev => ({ ...prev, success: 'User roles updated successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update user roles' }));
    }
  }, [onUserRoleUpdate]);

  // Handle access request review
  const handleAccessRequestReview = useCallback(async (
    requestId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    setState(prev => ({ ...prev, error: null }));

    try {
      if (onAccessRequestReview) {
        await onAccessRequestReview(requestId, status, notes);
        setState(prev => ({
          ...prev,
          success: `Access request ${status} successfully`
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to review access request' }));
    }
  }, [onAccessRequestReview]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'read': return 'bg-green-100 text-green-600';
      case 'write': return 'bg-blue-100 text-blue-600';
      case 'admin': return 'bg-orange-100 text-orange-600';
      case 'super_admin': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'approved': return 'bg-green-100 text-green-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Role-Based Access Control
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-600">
                <Users className="w-3 h-3 mr-1" />
                {users.length} Users
              </Badge>
              <Badge className="bg-green-100 text-green-600">
                <Key className="w-3 h-3 mr-1" />
                {roles.length} Roles
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Manage user roles, permissions, and access controls for your financial application.
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search roles, users, or permissions..."
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={state.filterCategory} onValueChange={(value) => setState(prev => ({ ...prev, filterCategory: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {permissionCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={state.filterLevel} onValueChange={(value) => setState(prev => ({ ...prev, filterLevel: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Roles</p>
                    <p className="text-2xl font-bold">{roles.filter(r => r.isActive).length}</p>
                  </div>
                  <Key className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Permissions</p>
                    <p className="text-2xl font-bold">{permissions.length}</p>
                  </div>
                  <Lock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-red-600">
                      {accessRequests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Roles Management</h3>
              <Button onClick={() => setState(prev => ({ ...prev, isCreatingRole: !prev.isCreatingRole }))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </div>

            {/* Create Role Form */}
            {state.isCreatingRole && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Role Name</Label>
                      <Input
                        value={state.newRole.name || ''}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          newRole: { ...prev.newRole, name: e.target.value }
                        }))}
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={state.newRole.description || ''}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          newRole: { ...prev.newRole, description: e.target.value }
                        }))}
                        placeholder="Enter role description"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={state.newRole.permissions?.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              setState(prev => ({
                                ...prev,
                                newRole: {
                                  ...prev.newRole,
                                  permissions: checked
                                    ? [...(prev.newRole.permissions || []), permission.id]
                                    : (prev.newRole.permissions || []).filter(id => id !== permission.id)
                                }
                              }));
                            }}
                          />
                          <span className="text-sm">{permission.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateRole}
                      disabled={state.isCreatingRole}
                    >
                      Create Role
                    </Button>
                    <Button
                      onClick={() => setState(prev => ({ ...prev, isCreatingRole: false }))}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Roles List */}
            <div className="grid gap-4">
              {filteredRoles.map(role => (
                <Card key={role.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-gray-600">{role.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={role.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {role.isSystem && (
                              <Badge className="bg-blue-100 text-blue-600">System</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {role.userCount} users
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setState(prev => ({ ...prev, selectedRole: role }))}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {!role.isSystem && (
                          <Button
                            onClick={() => handleDeleteRole(role.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Users Management</h3>

            <div className="grid gap-4">
              {filteredUsers.map(user => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {user.department && (
                              <Badge className="bg-blue-100 text-blue-600">
                                <Building className="w-3 h-3 mr-1" />
                                {user.department}
                              </Badge>
                            )}
                            {user.location && (
                              <Badge className="bg-green-100 text-green-600">
                                <Globe className="w-3 h-3 mr-1" />
                                {user.location}
                              </Badge>
                            )}
                            <Badge className={user.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.roles.map(roleId => {
                              const role = getRole(roleId);
                              return role ? (
                                <Badge key={roleId} className="bg-purple-100 text-purple-600 text-xs">
                                  {role.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setState(prev => ({ ...prev, selectedUser: user }))}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Manage Roles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Permissions Overview</h3>

            <div className="grid gap-4">
              {filteredPermissions.map(permission => (
                <Card key={permission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{permission.name}</h4>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getLevelColor(permission.level)}>
                            {permission.level.replace('_', ' ')}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-600">
                            {permission.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Resource: {permission.resource}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Access Requests Tab */}
        <TabsContent value="requests">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Access Requests</h3>

            <div className="grid gap-4">
              {accessRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{request.userName}</h4>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {request.requestedRoles.map(roleId => {
                            const role = getRole(roleId);
                            return role ? (
                              <Badge key={roleId} className="bg-blue-100 text-blue-600 text-xs">
                                {role.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAccessRequestReview(request.id, 'approved')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleAccessRequestReview(request.id, 'rejected')}
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoleBasedAccess;

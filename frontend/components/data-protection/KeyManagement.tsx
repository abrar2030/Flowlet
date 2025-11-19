import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  Key,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Globe,
  Users,
  Settings,
  FileText,
  Copy,
  Trash2,
  Plus,
  Edit,
  Archive,
  RotateCcw
} from 'lucide-react';

interface EncryptionKey {
  id: string;
  name: string;
  description: string;
  type: 'symmetric' | 'asymmetric' | 'master' | 'data' | 'signing' | 'transport';
  algorithm: 'AES-256' | 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384' | 'ChaCha20-Poly1305';
  keySize: number;
  purpose: 'encryption' | 'decryption' | 'signing' | 'verification' | 'key_wrapping' | 'key_derivation';
  status: 'active' | 'inactive' | 'compromised' | 'expired' | 'revoked' | 'pending_activation';
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  maxUsageCount?: number;
  rotationSchedule?: {
    enabled: boolean;
    intervalDays: number;
    nextRotation: string;
  };
  accessControl: {
    allowedUsers: string[];
    allowedRoles: string[];
    allowedApplications: string[];
    requireMfa: boolean;
    requireApproval: boolean;
  };
  metadata: {
    environment: 'production' | 'staging' | 'development';
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    compliance: string[];
    tags: string[];
  };
  auditTrail: KeyAuditEvent[];
}

interface KeyAuditEvent {
  id: string;
  timestamp: string;
  action: 'created' | 'accessed' | 'rotated' | 'revoked' | 'exported' | 'imported' | 'modified';
  userId: string;
  userName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

interface KeyVault {
  id: string;
  name: string;
  description: string;
  type: 'hardware' | 'software' | 'cloud' | 'hybrid';
  provider: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  keyCount: number;
  maxKeys: number;
  encryptionLevel: 'FIPS-140-2-L1' | 'FIPS-140-2-L2' | 'FIPS-140-2-L3' | 'FIPS-140-2-L4' | 'Common-Criteria';
  backupEnabled: boolean;
  lastBackup?: string;
  accessLogs: boolean;
  auditCompliance: string[];
}

interface KeyPolicy {
  id: string;
  name: string;
  description: string;
  keyTypes: string[];
  minKeySize: number;
  maxKeyAge: number; // in days
  rotationRequired: boolean;
  rotationInterval: number; // in days
  backupRequired: boolean;
  auditRequired: boolean;
  approvalRequired: boolean;
  mfaRequired: boolean;
  allowedEnvironments: string[];
  complianceRequirements: string[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface KeyManagementProps {
  keys?: EncryptionKey[];
  vaults?: KeyVault[];
  policies?: KeyPolicy[];
  onKeyGenerate?: (keySpec: Partial<EncryptionKey>) => Promise<void>;
  onKeyRotate?: (keyId: string) => Promise<void>;
  onKeyRevoke?: (keyId: string, reason: string) => Promise<void>;
  onKeyExport?: (keyId: string, format: 'pem' | 'der' | 'jwk') => Promise<Blob>;
  onKeyImport?: (keyData: string, format: 'pem' | 'der' | 'jwk', metadata: any) => Promise<void>;
  onPolicyCreate?: (policy: Omit<KeyPolicy, 'id' | 'createdAt'>) => Promise<void>;
  onPolicyUpdate?: (policyId: string, updates: Partial<KeyPolicy>) => Promise<void>;
  onVaultStatus?: (vaultId: string) => Promise<KeyVault>;
  className?: string;
}

interface ComponentState {
  activeTab: string;
  selectedKey: EncryptionKey | null;
  selectedVault: KeyVault | null;
  selectedPolicy: KeyPolicy | null;
  searchTerm: string;
  filterStatus: string;
  filterType: string;
  filterVault: string;
  showKeyDetails: boolean;
  showKeyGenerator: boolean;
  showPolicyEditor: boolean;
  showImportDialog: boolean;
  isGenerating: boolean;
  isRotating: boolean;
  isExporting: boolean;
  isImporting: boolean;
  error: string | null;
  success: string | null;
  newKey: Partial<EncryptionKey>;
  newPolicy: Partial<KeyPolicy>;
  importData: {
    keyData: string;
    format: 'pem' | 'der' | 'jwk';
    name: string;
    description: string;
  };
  revocationReason: string;
  showRevocationDialog: string | null;
}

export function KeyManagement({
  keys = [],
  vaults = [],
  policies = [],
  onKeyGenerate,
  onKeyRotate,
  onKeyRevoke,
  onKeyExport,
  onKeyImport,
  onPolicyCreate,
  onPolicyUpdate,
  onVaultStatus,
  className = ''
}: KeyManagementProps) {
  const [state, setState] = useState<ComponentState>({
    activeTab: 'keys',
    selectedKey: null,
    selectedVault: null,
    selectedPolicy: null,
    searchTerm: '',
    filterStatus: 'all',
    filterType: 'all',
    filterVault: 'all',
    showKeyDetails: false,
    showKeyGenerator: false,
    showPolicyEditor: false,
    showImportDialog: false,
    isGenerating: false,
    isRotating: false,
    isExporting: false,
    isImporting: false,
    error: null,
    success: null,
    newKey: {
      name: '',
      description: '',
      type: 'symmetric',
      algorithm: 'AES-256',
      purpose: 'encryption',
      metadata: {
        environment: 'production',
        classification: 'confidential',
        compliance: [],
        tags: []
      },
      accessControl: {
        allowedUsers: [],
        allowedRoles: [],
        allowedApplications: [],
        requireMfa: true,
        requireApproval: false
      }
    },
    newPolicy: {
      name: '',
      description: '',
      keyTypes: [],
      minKeySize: 256,
      maxKeyAge: 365,
      rotationRequired: true,
      rotationInterval: 90,
      backupRequired: true,
      auditRequired: true,
      approvalRequired: false,
      mfaRequired: true,
      allowedEnvironments: ['production'],
      complianceRequirements: [],
      createdBy: 'current-user',
      isActive: true
    },
    importData: {
      keyData: '',
      format: 'pem',
      name: '',
      description: ''
    },
    revocationReason: '',
    showRevocationDialog: null
  });

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const total = keys.length;
    const active = keys.filter(k => k.status === 'active').length;
    const expired = keys.filter(k => k.status === 'expired').length;
    const compromised = keys.filter(k => k.status === 'compromised').length;
    const nearExpiry = keys.filter(k => {
      if (!k.expiresAt) return false;
      const daysUntilExpiry = (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    const byType = keys.reduce((acc, key) => {
      acc[key.type] = (acc[key.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAlgorithm = keys.reduce((acc, key) => {
      acc[key.algorithm] = (acc[key.algorithm] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalUsage = keys.reduce((sum, key) => sum + key.usageCount, 0);
    const averageUsage = total > 0 ? totalUsage / total : 0;

    return {
      total,
      active,
      expired,
      compromised,
      nearExpiry,
      byType,
      byAlgorithm,
      totalUsage,
      averageUsage
    };
  }, [keys]);

  // Filter keys
  const filteredKeys = useMemo(() => {
    return keys.filter(key => {
      const matchesSearch = key.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                           key.description.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                           key.metadata.tags.some(tag => tag.toLowerCase().includes(state.searchTerm.toLowerCase()));

      const matchesStatus = state.filterStatus === 'all' || key.status === state.filterStatus;
      const matchesType = state.filterType === 'all' || key.type === state.filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [keys, state.searchTerm, state.filterStatus, state.filterType]);

  // Handle key generation
  const handleKeyGenerate = useCallback(async () => {
    if (!state.newKey.name || !state.newKey.description) {
      setState(prev => ({ ...prev, error: 'Name and description are required' }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      if (onKeyGenerate) {
        await onKeyGenerate(state.newKey);
        setState(prev => ({
          ...prev,
          success: 'Key generated successfully',
          showKeyGenerator: false,
          newKey: {
            name: '',
            description: '',
            type: 'symmetric',
            algorithm: 'AES-256',
            purpose: 'encryption',
            metadata: {
              environment: 'production',
              classification: 'confidential',
              compliance: [],
              tags: []
            },
            accessControl: {
              allowedUsers: [],
              allowedRoles: [],
              allowedApplications: [],
              requireMfa: true,
              requireApproval: false
            }
          }
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to generate key' }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [onKeyGenerate, state.newKey]);

  // Handle key rotation
  const handleKeyRotate = useCallback(async (keyId: string) => {
    setState(prev => ({ ...prev, isRotating: true, error: null }));

    try {
      if (onKeyRotate) {
        await onKeyRotate(keyId);
        setState(prev => ({ ...prev, success: 'Key rotation initiated successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to rotate key' }));
    } finally {
      setState(prev => ({ ...prev, isRotating: false }));
    }
  }, [onKeyRotate]);

  // Handle key revocation
  const handleKeyRevoke = useCallback(async (keyId: string) => {
    if (!state.revocationReason.trim()) {
      setState(prev => ({ ...prev, error: 'Revocation reason is required' }));
      return;
    }

    setState(prev => ({ ...prev, isRotating: true, error: null }));

    try {
      if (onKeyRevoke) {
        await onKeyRevoke(keyId, state.revocationReason);
        setState(prev => ({
          ...prev,
          success: 'Key revoked successfully',
          showRevocationDialog: null,
          revocationReason: ''
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to revoke key' }));
    } finally {
      setState(prev => ({ ...prev, isRotating: false }));
    }
  }, [onKeyRevoke, state.revocationReason]);

  // Handle key export
  const handleKeyExport = useCallback(async (keyId: string, format: 'pem' | 'der' | 'jwk') => {
    setState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      if (onKeyExport) {
        const blob = await onKeyExport(keyId, format);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `key-${keyId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setState(prev => ({ ...prev, success: 'Key exported successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to export key' }));
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [onKeyExport]);

  // Handle key import
  const handleKeyImport = useCallback(async () => {
    if (!state.importData.keyData || !state.importData.name) {
      setState(prev => ({ ...prev, error: 'Key data and name are required' }));
      return;
    }

    setState(prev => ({ ...prev, isImporting: true, error: null }));

    try {
      if (onKeyImport) {
        await onKeyImport(
          state.importData.keyData,
          state.importData.format,
          {
            name: state.importData.name,
            description: state.importData.description
          }
        );
        setState(prev => ({
          ...prev,
          success: 'Key imported successfully',
          showImportDialog: false,
          importData: {
            keyData: '',
            format: 'pem',
            name: '',
            description: ''
          }
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to import key' }));
    } finally {
      setState(prev => ({ ...prev, isImporting: false }));
    }
  }, [onKeyImport, state.importData]);

  // Handle policy creation
  const handlePolicyCreate = useCallback(async () => {
    if (!state.newPolicy.name || !state.newPolicy.description) {
      setState(prev => ({ ...prev, error: 'Name and description are required' }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      if (onPolicyCreate) {
        await onPolicyCreate(state.newPolicy as Omit<KeyPolicy, 'id' | 'createdAt'>);
        setState(prev => ({
          ...prev,
          success: 'Policy created successfully',
          showPolicyEditor: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create policy' }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [onPolicyCreate, state.newPolicy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'compromised': return 'bg-red-100 text-red-600';
      case 'expired': return 'bg-orange-100 text-orange-600';
      case 'revoked': return 'bg-red-100 text-red-600';
      case 'pending_activation': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'symmetric': return <Key className="w-4 h-4" />;
      case 'asymmetric': return <Shield className="w-4 h-4" />;
      case 'master': return <Lock className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      case 'signing': return <FileText className="w-4 h-4" />;
      case 'transport': return <Globe className="w-4 h-4" />;
      default: return <Key className="w-4 h-4" />;
    }
  };

  const getVaultStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-600';
      case 'offline': return 'bg-red-100 text-red-600';
      case 'maintenance': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatKeySize = (algorithm: string, keySize: number) => {
    if (algorithm.includes('RSA')) {
      return `${keySize} bits`;
    } else if (algorithm.includes('AES')) {
      return `${keySize} bits`;
    } else if (algorithm.includes('ECDSA')) {
      return `${keySize} bits`;
    }
    return `${keySize} bits`;
  };

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Key className="w-6 h-6 mr-3 text-blue-600" />
              Key Management System
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-600">
                <Key className="w-3 h-3 mr-1" />
                {keyMetrics.total} Keys
              </Badge>
              <Badge className="bg-green-100 text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                {keyMetrics.active} Active
              </Badge>
              {keyMetrics.nearExpiry > 0 && (
                <Badge className="bg-yellow-100 text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {keyMetrics.nearExpiry} Expiring
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Centralized management of encryption keys, certificates, and cryptographic policies.
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

      {keyMetrics.compromised > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Security Alert:</strong> {keyMetrics.compromised} compromised keys require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {keyMetrics.nearExpiry > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Expiry Warning:</strong> {keyMetrics.nearExpiry} keys will expire within 30 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search keys by name, description, or tags..."
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={state.filterStatus} onValueChange={(value) => setState(prev => ({ ...prev, filterStatus: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="compromised">Compromised</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={state.filterType} onValueChange={(value) => setState(prev => ({ ...prev, filterType: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="symmetric">Symmetric</SelectItem>
                <SelectItem value="asymmetric">Asymmetric</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="signing">Signing</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="vaults">Vaults</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Keys Tab */}
        <TabsContent value="keys">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Encryption Keys ({filteredKeys.length})</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setState(prev => ({ ...prev, showImportDialog: true }))}
                  size="sm"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Key
                </Button>
                <Button
                  onClick={() => setState(prev => ({ ...prev, showKeyGenerator: true }))}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Key
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredKeys.map(key => {
                const daysUntilExpiry = getDaysUntilExpiry(key.expiresAt);
                const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                return (
                  <Card key={key.id} className={`hover:shadow-md transition-shadow ${isNearExpiry ? 'border-yellow-300' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(key.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium truncate">{key.name}</h4>
                              <Badge className={getStatusColor(key.status)}>
                                {key.status.replace('_', ' ')}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-600">
                                {key.algorithm}
                              </Badge>
                              <Badge className="bg-purple-100 text-purple-600">
                                {key.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{key.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                              <span>Size: {formatKeySize(key.algorithm, key.keySize)}</span>
                              <span>Usage: {key.usageCount.toLocaleString()}</span>
                              <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                              {key.expiresAt && (
                                <span className={isNearExpiry ? 'text-yellow-600 font-medium' : ''}>
                                  Expires: {daysUntilExpiry !== null ? `${daysUntilExpiry} days` : 'Never'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge className="bg-gray-100 text-gray-600 text-xs">
                                {key.metadata.environment}
                              </Badge>
                              <Badge className="bg-gray-100 text-gray-600 text-xs">
                                {key.metadata.classification}
                              </Badge>
                              {key.metadata.tags.map(tag => (
                                <Badge key={tag} className="bg-gray-100 text-gray-600 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setState(prev => ({ ...prev, selectedKey: key, showKeyDetails: true }))}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          {key.status === 'active' && (
                            <>
                              <Button
                                onClick={() => handleKeyRotate(key.id)}
                                disabled={state.isRotating}
                                size="sm"
                                variant="outline"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Rotate
                              </Button>
                              <Button
                                onClick={() => setState(prev => ({ ...prev, showRevocationDialog: key.id }))}
                                size="sm"
                                variant="destructive"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredKeys.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Keys Found</h3>
                  <p className="text-sm text-gray-600">
                    No encryption keys match your current filters. Try adjusting your search criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Vaults Tab */}
        <TabsContent value="vaults">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Key Vaults</h3>

            <div className="grid gap-4">
              {vaults.map(vault => (
                <Card key={vault.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{vault.name}</h4>
                          <Badge className={getVaultStatusColor(vault.status)}>
                            {vault.status}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-600">
                            {vault.type}
                          </Badge>
                          <Badge className="bg-green-100 text-green-600">
                            {vault.encryptionLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{vault.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                          <span>Provider: {vault.provider}</span>
                          <span>Location: {vault.location}</span>
                          <span>Keys: {vault.keyCount}/{vault.maxKeys}</span>
                          {vault.lastBackup && (
                            <span>Last Backup: {new Date(vault.lastBackup).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Capacity</span>
                              <span>{vault.keyCount}/{vault.maxKeys}</span>
                            </div>
                            <Progress value={(vault.keyCount / vault.maxKeys) * 100} className="h-2" />
                          </div>
                          <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center">
                              {vault.backupEnabled ? (
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1 text-red-600" />
                              )}
                              Backup {vault.backupEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className="flex items-center">
                              {vault.accessLogs ? (
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1 text-red-600" />
                              )}
                              Access Logs {vault.accessLogs ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            if (onVaultStatus) {
                              onVaultStatus(vault.id);
                            }
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </Button>
                        <Button
                          onClick={() => setState(prev => ({ ...prev, selectedVault: vault }))}
                          size="sm"
                          variant="outline"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Key Policies</h3>
              <Button
                onClick={() => setState(prev => ({ ...prev, showPolicyEditor: true }))}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Policy
              </Button>
            </div>

            <div className="grid gap-4">
              {policies.map(policy => (
                <Card key={policy.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{policy.name}</h4>
                          <Badge className={policy.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                            {policy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                          <span>Min Key Size: {policy.minKeySize} bits</span>
                          <span>Max Age: {policy.maxKeyAge} days</span>
                          <span>Rotation: {policy.rotationInterval} days</span>
                          <span>Types: {policy.keyTypes.length}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="flex items-center">
                            {policy.rotationRequired ? (
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1 text-gray-400" />
                            )}
                            Rotation Required
                          </span>
                          <span className="flex items-center">
                            {policy.mfaRequired ? (
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1 text-gray-400" />
                            )}
                            MFA Required
                          </span>
                          <span className="flex items-center">
                            {policy.auditRequired ? (
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1 text-gray-400" />
                            )}
                            Audit Required
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setState(prev => ({ ...prev, selectedPolicy: policy, showPolicyEditor: true }))}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Keys</p>
                      <p className="text-2xl font-bold">{keyMetrics.total}</p>
                    </div>
                    <Key className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Keys</p>
                      <p className="text-2xl font-bold text-green-600">{keyMetrics.active}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Usage</p>
                      <p className="text-2xl font-bold text-blue-600">{keyMetrics.totalUsage.toLocaleString()}</p>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Key Vaults</p>
                      <p className="text-2xl font-bold text-purple-600">{vaults.length}</p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Key Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(keyMetrics.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type)}
                        <span className="font-medium capitalize">{type}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-600">
                        {count} keys
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(keyMetrics.byAlgorithm).map(([algorithm, count]) => (
                    <div key={algorithm} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{algorithm}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-600">
                        {count} keys
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Key Generator Modal */}
      {state.showKeyGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Generate New Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={state.newKey.name || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      newKey: { ...prev.newKey, name: e.target.value }
                    }))}
                    placeholder="Enter key name"
                  />
                </div>
                <div>
                  <Label>Key Type</Label>
                  <Select
                    value={state.newKey.type}
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      newKey: { ...prev.newKey, type: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symmetric">Symmetric</SelectItem>
                      <SelectItem value="asymmetric">Asymmetric</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="signing">Signing</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={state.newKey.description || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    newKey: { ...prev.newKey, description: e.target.value }
                  }))}
                  placeholder="Enter key description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Algorithm</Label>
                  <Select
                    value={state.newKey.algorithm}
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      newKey: { ...prev.newKey, algorithm: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AES-256">AES-256</SelectItem>
                      <SelectItem value="RSA-2048">RSA-2048</SelectItem>
                      <SelectItem value="RSA-4096">RSA-4096</SelectItem>
                      <SelectItem value="ECDSA-P256">ECDSA-P256</SelectItem>
                      <SelectItem value="ECDSA-P384">ECDSA-P384</SelectItem>
                      <SelectItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Select
                    value={state.newKey.purpose}
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      newKey: { ...prev.newKey, purpose: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encryption">Encryption</SelectItem>
                      <SelectItem value="decryption">Decryption</SelectItem>
                      <SelectItem value="signing">Signing</SelectItem>
                      <SelectItem value="verification">Verification</SelectItem>
                      <SelectItem value="key_wrapping">Key Wrapping</SelectItem>
                      <SelectItem value="key_derivation">Key Derivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleKeyGenerate}
                  disabled={state.isGenerating}
                >
                  {state.isGenerating ? 'Generating...' : 'Generate Key'}
                </Button>
                <Button
                  onClick={() => setState(prev => ({ ...prev, showKeyGenerator: false }))}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Revocation Modal */}
      {state.showRevocationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Revoke Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for revoking this key. This action cannot be undone.
              </p>
              <div>
                <Label>Revocation Reason</Label>
                <Textarea
                  value={state.revocationReason}
                  onChange={(e) => setState(prev => ({ ...prev, revocationReason: e.target.value }))}
                  placeholder="Enter reason for revocation..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleKeyRevoke(state.showRevocationDialog!)}
                  disabled={state.isRotating || !state.revocationReason.trim()}
                  variant="destructive"
                >
                  {state.isRotating ? 'Revoking...' : 'Revoke Key'}
                </Button>
                <Button
                  onClick={() => setState(prev => ({
                    ...prev,
                    showRevocationDialog: null,
                    revocationReason: ''
                  }))}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default KeyManagement;

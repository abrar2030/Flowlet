import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Globe,
  Database,
  Server,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Target,
  Gauge,
  Timer,
  Wifi,
  WifiOff,
  Users,
  FileText,
  Calendar,
  MapPin,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'application' | 'database' | 'api' | 'user_experience';
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  timestamp: string;
  source: string;
  tags: string[];
  historicalData: { timestamp: string; value: number }[];
}

interface SystemResource {
  id: string;
  name: string;
  type: 'server' | 'database' | 'application' | 'service' | 'endpoint';
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  location: string;
  environment: 'production' | 'staging' | 'development';
  metrics: {
    cpu: { usage: number; cores: number };
    memory: { used: number; total: number; percentage: number };
    disk: { used: number; total: number; percentage: number };
    network: { inbound: number; outbound: number; latency: number };
  };
  uptime: number; // percentage
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  throughput: number; // requests per second
  lastCheck: string;
  dependencies: string[];
  alerts: SystemAlert[];
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'availability' | 'error' | 'security' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  source: string;
  details: Record<string, any>;
}

interface UserExperienceMetric {
  id: string;
  sessionId: string;
  userId?: string;
  page: string;
  metrics: {
    loadTime: number; // milliseconds
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screenResolution: string;
  };
  network: {
    type: 'wifi' | '4g' | '3g' | 'ethernet' | 'unknown';
    speed: number; // Mbps
    latency: number; // milliseconds
  };
  location: {
    country: string;
    city: string;
    timezone: string;
  };
  timestamp: string;
  errors: string[];
  userAgent: string;
}

interface APIPerformance {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  responseTime: number; // milliseconds
  statusCode: number;
  requestSize: number; // bytes
  responseSize: number; // bytes
  timestamp: string;
  userId?: string;
  userAgent: string;
  ipAddress: string;
  errors: string[];
  cached: boolean;
  region: string;
}

interface PerformanceMonitorProps {
  metrics?: PerformanceMetric[];
  resources?: SystemResource[];
  userExperience?: UserExperienceMetric[];
  apiPerformance?: APIPerformance[];
  onMetricRefresh?: (metricId?: string) => Promise<void>;
  onAlertAcknowledge?: (alertId: string) => Promise<void>;
  onResourceRestart?: (resourceId: string) => Promise<void>;
  onExportReport?: (type: 'performance' | 'resources' | 'ux' | 'api', filters: any) => Promise<Blob>;
  realTimeUpdates?: boolean;
  refreshInterval?: number; // seconds
  className?: string;
}

interface ComponentState {
  activeTab: string;
  selectedResource: SystemResource | null;
  selectedMetric: PerformanceMetric | null;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  filterCategory: string;
  filterStatus: string;
  filterEnvironment: string;
  searchTerm: string;
  showResourceDetails: boolean;
  showMetricDetails: boolean;
  isRefreshing: boolean;
  isExporting: boolean;
  error: string | null;
  success: string | null;
  lastRefresh: string;
}

export function PerformanceMonitor({
  metrics = [],
  resources = [],
  userExperience = [],
  apiPerformance = [],
  onMetricRefresh,
  onAlertAcknowledge,
  onResourceRestart,
  onExportReport,
  realTimeUpdates = true,
  refreshInterval = 30,
  className = ''
}: PerformanceMonitorProps) {
  const [state, setState] = useState<ComponentState>({
    activeTab: 'overview',
    selectedResource: null,
    selectedMetric: null,
    timeRange: '24h',
    filterCategory: 'all',
    filterStatus: 'all',
    filterEnvironment: 'all',
    searchTerm: '',
    showResourceDetails: false,
    showMetricDetails: false,
    isRefreshing: false,
    isExporting: false,
    error: null,
    success: null,
    lastRefresh: new Date().toISOString()
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setState(prev => ({ ...prev, lastRefresh: new Date().toISOString() }));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [realTimeUpdates, refreshInterval]);

  // Calculate performance overview
  const performanceOverview = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[state.timeRange];

    const cutoffTime = new Date(now.getTime() - timeRangeMs);

    // Filter data by time range
    const recentUX = userExperience.filter(ux => new Date(ux.timestamp) > cutoffTime);
    const recentAPI = apiPerformance.filter(api => new Date(api.timestamp) > cutoffTime);

    // System health
    const healthyResources = resources.filter(r => r.status === 'healthy').length;
    const degradedResources = resources.filter(r => r.status === 'degraded').length;
    const downResources = resources.filter(r => r.status === 'down').length;
    const totalResources = resources.length;

    const systemHealthScore = totalResources > 0 ? (healthyResources / totalResources) * 100 : 100;

    // Average metrics
    const avgCpuUsage = resources.length > 0 
      ? resources.reduce((sum, r) => sum + r.metrics.cpu.usage, 0) / resources.length 
      : 0;

    const avgMemoryUsage = resources.length > 0 
      ? resources.reduce((sum, r) => sum + r.metrics.memory.percentage, 0) / resources.length 
      : 0;

    const avgDiskUsage = resources.length > 0 
      ? resources.reduce((sum, r) => sum + r.metrics.disk.percentage, 0) / resources.length 
      : 0;

    const avgResponseTime = resources.length > 0 
      ? resources.reduce((sum, r) => sum + r.responseTime, 0) / resources.length 
      : 0;

    // User experience metrics
    const avgLoadTime = recentUX.length > 0 
      ? recentUX.reduce((sum, ux) => sum + ux.metrics.loadTime, 0) / recentUX.length 
      : 0;

    const avgFCP = recentUX.length > 0 
      ? recentUX.reduce((sum, ux) => sum + ux.metrics.firstContentfulPaint, 0) / recentUX.length 
      : 0;

    const avgLCP = recentUX.length > 0 
      ? recentUX.reduce((sum, ux) => sum + ux.metrics.largestContentfulPaint, 0) / recentUX.length 
      : 0;

    const avgCLS = recentUX.length > 0 
      ? recentUX.reduce((sum, ux) => sum + ux.metrics.cumulativeLayoutShift, 0) / recentUX.length 
      : 0;

    // API performance
    const avgAPIResponseTime = recentAPI.length > 0 
      ? recentAPI.reduce((sum, api) => sum + api.responseTime, 0) / recentAPI.length 
      : 0;

    const apiErrorRate = recentAPI.length > 0 
      ? (recentAPI.filter(api => api.statusCode >= 400).length / recentAPI.length) * 100 
      : 0;

    const totalAPIRequests = recentAPI.length;

    // Alerts
    const totalAlerts = resources.reduce((sum, r) => sum + r.alerts.length, 0);
    const criticalAlerts = resources.reduce((sum, r) => sum + r.alerts.filter(a => a.severity === 'critical').length, 0);
    const unacknowledgedAlerts = resources.reduce((sum, r) => sum + r.alerts.filter(a => !a.acknowledged).length, 0);

    // Device breakdown
    const deviceBreakdown = recentUX.reduce((acc, ux) => {
      acc[ux.device.type] = (acc[ux.device.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Network breakdown
    const networkBreakdown = recentUX.reduce((acc, ux) => {
      acc[ux.network.type] = (acc[ux.network.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Performance by category
    const metricsByCategory = metrics.reduce((acc, metric) => {
      acc[metric.category] = acc[metric.category] || [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return {
      systemHealthScore,
      healthyResources,
      degradedResources,
      downResources,
      totalResources,
      avgCpuUsage,
      avgMemoryUsage,
      avgDiskUsage,
      avgResponseTime,
      avgLoadTime,
      avgFCP,
      avgLCP,
      avgCLS,
      avgAPIResponseTime,
      apiErrorRate,
      totalAPIRequests,
      totalAlerts,
      criticalAlerts,
      unacknowledgedAlerts,
      deviceBreakdown,
      networkBreakdown,
      metricsByCategory
    };
  }, [metrics, resources, userExperience, apiPerformance, state.timeRange]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                           resource.location.toLowerCase().includes(state.searchTerm.toLowerCase());
      
      const matchesStatus = state.filterStatus === 'all' || resource.status === state.filterStatus;
      const matchesEnvironment = state.filterEnvironment === 'all' || resource.environment === state.filterEnvironment;

      return matchesSearch && matchesStatus && matchesEnvironment;
    });
  }, [resources, state.searchTerm, state.filterStatus, state.filterEnvironment]);

  // Handle metric refresh
  const handleMetricRefresh = useCallback(async (metricId?: string) => {
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));

    try {
      if (onMetricRefresh) {
        await onMetricRefresh(metricId);
      }
      setState(prev => ({ 
        ...prev, 
        success: 'Metrics refreshed successfully',
        lastRefresh: new Date().toISOString()
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to refresh metrics' }));
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [onMetricRefresh]);

  // Handle alert acknowledgment
  const handleAlertAcknowledge = useCallback(async (alertId: string) => {
    try {
      if (onAlertAcknowledge) {
        await onAlertAcknowledge(alertId);
        setState(prev => ({ ...prev, success: 'Alert acknowledged' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to acknowledge alert' }));
    }
  }, [onAlertAcknowledge]);

  // Handle resource restart
  const handleResourceRestart = useCallback(async (resourceId: string) => {
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));

    try {
      if (onResourceRestart) {
        await onResourceRestart(resourceId);
        setState(prev => ({ ...prev, success: 'Resource restart initiated' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to restart resource' }));
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [onResourceRestart]);

  // Handle export
  const handleExport = useCallback(async (type: 'performance' | 'resources' | 'ux' | 'api') => {
    setState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      if (onExportReport) {
        const filters = {
          timeRange: state.timeRange,
          category: state.filterCategory,
          status: state.filterStatus,
          environment: state.filterEnvironment,
          search: state.searchTerm
        };
        
        const blob = await onExportReport(type, filters);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setState(prev => ({ ...prev, success: 'Report exported successfully' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to export report' }));
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [onExportReport, state.timeRange, state.filterCategory, state.filterStatus, state.filterEnvironment, state.searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'normal': return 'bg-green-100 text-green-600';
      case 'degraded': case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'down': case 'critical': return 'bg-red-100 text-red-600';
      case 'maintenance': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'high': return 'bg-orange-100 text-orange-600';
      case 'critical': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'application': return <Monitor className="w-4 h-4" />;
      case 'service': return <Globe className="w-4 h-4" />;
      case 'endpoint': return <Network className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Laptop className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getNetworkIcon = (type: string) => {
    switch (type) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'ethernet': return <Network className="w-4 h-4" />;
      case '4g': case '3g': return <Smartphone className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`w-4 h-4 ${percentage > 0 ? 'text-red-500' : 'text-green-500'}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`w-4 h-4 ${percentage > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Gauge className="w-6 h-6 mr-3 text-blue-600" />
              Performance Monitoring
            </div>
            <div className="flex items-center space-x-2">
              <Select value={state.timeRange} onValueChange={(value) => setState(prev => ({ ...prev, timeRange: value as any }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleMetricRefresh()}
                disabled={state.isRefreshing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${state.isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {realTimeUpdates && (
                <Badge className="bg-green-100 text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Real-time system performance, user experience, and API monitoring.
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date(state.lastRefresh).toLocaleTimeString()}
            </p>
          </div>
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

      {performanceOverview.criticalAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Alerts:</strong> {performanceOverview.criticalAlerts} critical performance alerts require attention.
          </AlertDescription>
        </Alert>
      )}

      {performanceOverview.downResources > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>System Down:</strong> {performanceOverview.downResources} system resources are currently down.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="user-experience">User Experience</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Health</p>
                      <p className="text-2xl font-bold text-green-600">{performanceOverview.systemHealthScore.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{performanceOverview.healthyResources}/{performanceOverview.totalResources} healthy</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-2xl font-bold">{performanceOverview.avgResponseTime.toFixed(0)}ms</p>
                      <p className="text-xs text-gray-500">across all services</p>
                    </div>
                    <Timer className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Page Load Time</p>
                      <p className="text-2xl font-bold">{formatDuration(performanceOverview.avgLoadTime)}</p>
                      <p className="text-xs text-gray-500">average user experience</p>
                    </div>
                    <Globe className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">API Error Rate</p>
                      <p className="text-2xl font-bold text-red-600">{performanceOverview.apiErrorRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{performanceOverview.totalAPIRequests} requests</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resource Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className="text-lg font-bold">{performanceOverview.avgCpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceOverview.avgCpuUsage} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MemoryStick className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="text-lg font-bold">{performanceOverview.avgMemoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceOverview.avgMemoryUsage} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <span className="text-lg font-bold">{performanceOverview.avgDiskUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceOverview.avgDiskUsage} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Network className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Network I/O</span>
                    </div>
                    <span className="text-lg font-bold">Active</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Monitoring network traffic
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Core Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">First Contentful Paint</p>
                    <p className="text-2xl font-bold text-blue-600">{formatDuration(performanceOverview.avgFCP)}</p>
                    <p className="text-xs text-gray-500">Good: &lt; 1.8s</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Largest Contentful Paint</p>
                    <p className="text-2xl font-bold text-green-600">{formatDuration(performanceOverview.avgLCP)}</p>
                    <p className="text-xs text-gray-500">Good: &lt; 2.5s</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Cumulative Layout Shift</p>
                    <p className="text-2xl font-bold text-yellow-600">{performanceOverview.avgCLS.toFixed(3)}</p>
                    <p className="text-xs text-gray-500">Good: &lt; 0.1</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Page Load Time</p>
                    <p className="text-2xl font-bold text-purple-600">{formatDuration(performanceOverview.avgLoadTime)}</p>
                    <p className="text-xs text-gray-500">Target: &lt; 3s</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device and Network Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceOverview.deviceBreakdown).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(device)}
                          <span className="font-medium capitalize">{device}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-600">
                          {count} sessions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceOverview.networkBreakdown).map(([network, count]) => (
                      <div key={network} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {getNetworkIcon(network)}
                          <span className="font-medium uppercase">{network}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-600">
                          {count} sessions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search resources..."
                      value={state.searchTerm}
                      onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    />
                  </div>
                  <Select value={state.filterStatus} onValueChange={(value) => setState(prev => ({ ...prev, filterStatus: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={state.filterEnvironment} onValueChange={(value) => setState(prev => ({ ...prev, filterEnvironment: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Environments</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {filteredResources.length} of {resources.length} resources
                  </p>
                  <Button
                    onClick={() => handleExport('resources')}
                    disabled={state.isExporting}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resources List */}
            <div className="grid gap-4">
              {filteredResources.map(resource => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getResourceIcon(resource.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{resource.name}</h4>
                            <Badge className={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-600">
                              {resource.type}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-600">
                              {resource.environment}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                            <span>CPU: {resource.metrics.cpu.usage.toFixed(1)}%</span>
                            <span>Memory: {resource.metrics.memory.percentage.toFixed(1)}%</span>
                            <span>Disk: {resource.metrics.disk.percentage.toFixed(1)}%</span>
                            <span>Uptime: {resource.uptime.toFixed(1)}%</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>CPU</span>
                                <span>{resource.metrics.cpu.usage.toFixed(1)}%</span>
                              </div>
                              <Progress value={resource.metrics.cpu.usage} className="h-1" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Memory</span>
                                <span>{resource.metrics.memory.percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={resource.metrics.memory.percentage} className="h-1" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Disk</span>
                                <span>{resource.metrics.disk.percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={resource.metrics.disk.percentage} className="h-1" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Uptime</span>
                                <span>{resource.uptime.toFixed(1)}%</span>
                              </div>
                              <Progress value={resource.uptime} className="h-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setState(prev => ({ ...prev, selectedResource: resource, showResourceDetails: true }))}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {resource.status === 'down' && (
                          <Button
                            onClick={() => handleResourceRestart(resource.id)}
                            disabled={state.isRefreshing}
                            size="sm"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Restart
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

        {/* User Experience Tab */}
        <TabsContent value="user-experience">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">User Experience Metrics</h3>
              <Button
                onClick={() => handleExport('ux')}
                disabled={state.isExporting}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export UX Data
              </Button>
            </div>

            {/* UX Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Average Load Time</p>
                    <p className="text-3xl font-bold text-blue-600">{formatDuration(performanceOverview.avgLoadTime)}</p>
                    <p className="text-xs text-gray-500">Target: &lt; 3s</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">First Contentful Paint</p>
                    <p className="text-3xl font-bold text-green-600">{formatDuration(performanceOverview.avgFCP)}</p>
                    <p className="text-xs text-gray-500">Target: &lt; 1.8s</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Cumulative Layout Shift</p>
                    <p className="text-3xl font-bold text-yellow-600">{performanceOverview.avgCLS.toFixed(3)}</p>
                    <p className="text-xs text-gray-500">Target: &lt; 0.1</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent UX Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent User Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userExperience.slice(0, 10).map(ux => (
                    <div key={ux.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(ux.device.type)}
                        <div>
                          <p className="font-medium text-sm">{ux.page}</p>
                          <p className="text-xs text-gray-600">
                            {ux.device.browser} on {ux.device.os} • {ux.location.city}, {ux.location.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <p className="font-medium">Load Time</p>
                          <p className="text-gray-600">{formatDuration(ux.metrics.loadTime)}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">FCP</p>
                          <p className="text-gray-600">{formatDuration(ux.metrics.firstContentfulPaint)}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">CLS</p>
                          <p className="text-gray-600">{ux.metrics.cumulativeLayoutShift.toFixed(3)}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Network</p>
                          <p className="text-gray-600 uppercase">{ux.network.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">API Performance</h3>
              <Button
                onClick={() => handleExport('api')}
                disabled={state.isExporting}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export API Data
              </Button>
            </div>

            {/* API Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold">{performanceOverview.totalAPIRequests}</p>
                    <p className="text-xs text-gray-500">in selected timeframe</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">{performanceOverview.avgAPIResponseTime.toFixed(0)}ms</p>
                    <p className="text-xs text-gray-500">across all endpoints</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold text-red-600">{performanceOverview.apiErrorRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">4xx and 5xx responses</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {apiPerformance.length > 0 
                        ? ((apiPerformance.filter(api => api.cached).length / apiPerformance.length) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500">cached responses</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent API Calls */}
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiPerformance.slice(0, 10).map(api => (
                    <div key={api.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge className={api.statusCode >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}>
                          {api.method}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{api.endpoint}</p>
                          <p className="text-xs text-gray-600">
                            {api.ipAddress} • {api.region} • {new Date(api.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <p className="font-medium">Status</p>
                          <Badge className={api.statusCode >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}>
                            {api.statusCode}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Response Time</p>
                          <p className="text-gray-600">{api.responseTime}ms</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Size</p>
                          <p className="text-gray-600">{formatBytes(api.responseSize)}</p>
                        </div>
                        {api.cached && (
                          <Badge className="bg-blue-100 text-blue-600">
                            Cached
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Performance Alerts ({performanceOverview.totalAlerts})</h3>
              <div className="flex space-x-2">
                <Badge className="bg-red-100 text-red-600">
                  {performanceOverview.criticalAlerts} Critical
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-600">
                  {performanceOverview.unacknowledgedAlerts} Unacknowledged
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              {resources.flatMap(resource => 
                resource.alerts.map(alert => (
                  <Card key={alert.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{alert.message}</h4>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-600">
                                {alert.type}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge className="bg-green-100 text-green-600">
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Resource:</strong> {resource.name} ({resource.type})
                            </div>
                            <div className="text-xs text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(alert.timestamp).toLocaleString()}
                              {alert.resolvedAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!alert.acknowledged && (
                            <Button
                              onClick={() => handleAlertAcknowledge(alert.id)}
                              size="sm"
                              variant="outline"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {performanceOverview.totalAlerts === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-sm text-gray-600">
                    All systems are operating normally with no performance alerts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceMonitor;


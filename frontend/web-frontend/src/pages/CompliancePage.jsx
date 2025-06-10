import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Camera,
  User,
  Building,
  Globe,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

const CompliancePage = () => {
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState('');

  // Mock compliance data
  const complianceStatus = {
    overall: 'verified',
    kycLevel: 'level_2',
    amlStatus: 'cleared',
    lastReview: '2024-06-01T10:00:00Z',
    nextReview: '2024-12-01T10:00:00Z',
    riskScore: 'low'
  };

  const verificationSteps = [
    {
      id: 'email',
      title: 'Email Verification',
      description: 'Verify your email address',
      status: 'completed',
      completedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number',
      status: 'completed',
      completedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Upload government-issued ID',
      status: 'completed',
      completedAt: '2024-01-16T14:20:00Z'
    },
    {
      id: 'address',
      title: 'Address Verification',
      description: 'Verify your residential address',
      status: 'completed',
      completedAt: '2024-01-16T15:45:00Z'
    },
    {
      id: 'enhanced',
      title: 'Enhanced Due Diligence',
      description: 'Additional verification for higher limits',
      status: 'pending',
      completedAt: null
    }
  ];

  const documents = [
    {
      id: 'doc_001',
      type: 'passport',
      name: 'Passport',
      status: 'verified',
      uploadedAt: '2024-01-16T14:20:00Z',
      expiresAt: '2030-01-16T00:00:00Z'
    },
    {
      id: 'doc_002',
      type: 'utility_bill',
      name: 'Utility Bill',
      status: 'verified',
      uploadedAt: '2024-01-16T15:45:00Z',
      expiresAt: null
    },
    {
      id: 'doc_003',
      type: 'bank_statement',
      name: 'Bank Statement',
      status: 'pending',
      uploadedAt: '2024-06-10T09:00:00Z',
      expiresAt: null
    }
  ];

  const complianceAlerts = [
    {
      id: 'alert_001',
      type: 'document_expiry',
      title: 'Document Expiring Soon',
      description: 'Your passport will expire in 6 months. Please upload a new one.',
      severity: 'warning',
      createdAt: '2024-06-10T08:00:00Z'
    },
    {
      id: 'alert_002',
      type: 'review_required',
      title: 'Periodic Review Due',
      description: 'Your account is due for periodic compliance review.',
      severity: 'info',
      createdAt: '2024-06-09T10:00:00Z'
    }
  ];

  const transactionLimits = {
    daily: { current: 1500, limit: 5000 },
    monthly: { current: 12000, limit: 25000 },
    yearly: { current: 85000, limit: 100000 }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning':
        return 'destructive';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance</h1>
          <p className="text-muted-foreground">
            Manage your KYC/AML verification and compliance status
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Verification Document</DialogTitle>
                <DialogDescription>
                  Upload a document for identity or address verification
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="utility_bill">Utility Bill</SelectItem>
                      <SelectItem value="bank_statement">Bank Statement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG. Max file size: 10MB
                </div>
                <Button className="w-full">Upload Document</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(complianceStatus.overall)}
              <span className="text-2xl font-bold capitalize">
                {complianceStatus.overall}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last reviewed {formatDate(complianceStatus.lastReview)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Level</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level 2</div>
            <p className="text-xs text-muted-foreground">
              Enhanced verification completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AML Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">Cleared</span>
            </div>
            <p className="text-xs text-muted-foreground">
              No suspicious activity detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Low</div>
            <p className="text-xs text-muted-foreground">
              Based on transaction patterns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Verification Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Progress</CardTitle>
              <CardDescription>
                Complete these steps to increase your account limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed on {formatDate(step.completedAt)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Badge variant={getStatusColor(step.status)}>
                        {step.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Your verification documents and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {formatDate(doc.uploadedAt)}
                          {doc.expiresAt && (
                            <span> • Expires {formatDate(doc.expiresAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Transaction Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Limits</CardTitle>
              <CardDescription>
                Your current usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Daily Limit</span>
                  <span>{formatCurrency(transactionLimits.daily.current)} / {formatCurrency(transactionLimits.daily.limit)}</span>
                </div>
                <Progress value={(transactionLimits.daily.current / transactionLimits.daily.limit) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Monthly Limit</span>
                  <span>{formatCurrency(transactionLimits.monthly.current)} / {formatCurrency(transactionLimits.monthly.limit)}</span>
                </div>
                <Progress value={(transactionLimits.monthly.current / transactionLimits.monthly.limit) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Yearly Limit</span>
                  <span>{formatCurrency(transactionLimits.yearly.current)} / {formatCurrency(transactionLimits.yearly.limit)}</span>
                </div>
                <Progress value={(transactionLimits.yearly.current / transactionLimits.yearly.limit) * 100} />
              </div>
              <Button variant="outline" className="w-full">
                Request Limit Increase
              </Button>
            </CardContent>
          </Card>

          {/* Compliance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                Important notifications and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(alert.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;


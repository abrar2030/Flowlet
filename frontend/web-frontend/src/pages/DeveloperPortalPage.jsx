import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Code, 
  Book,
  Key,
  Play,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Server,
  Database,
  Activity
} from 'lucide-react';

const DeveloperPortalPage = () => {
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');

  // Mock API data
  const apiKeys = [
    {
      id: 'key_001',
      name: 'Production API Key',
      key: 'pk_live_51H7...',
      environment: 'live',
      created: '2024-01-15T10:00:00Z',
      lastUsed: '2024-06-10T14:30:00Z',
      permissions: ['read', 'write']
    },
    {
      id: 'key_002',
      name: 'Test API Key',
      key: 'pk_test_51H7...',
      environment: 'test',
      created: '2024-01-15T10:05:00Z',
      lastUsed: '2024-06-10T12:15:00Z',
      permissions: ['read', 'write']
    }
  ];

  const apiEndpoints = [
    {
      category: 'Wallets',
      endpoints: [
        { method: 'GET', path: '/v1/wallets', description: 'List all wallets' },
        { method: 'POST', path: '/v1/wallets', description: 'Create a new wallet' },
        { method: 'GET', path: '/v1/wallets/{id}', description: 'Retrieve a wallet' },
        { method: 'PUT', path: '/v1/wallets/{id}', description: 'Update a wallet' }
      ]
    },
    {
      category: 'Payments',
      endpoints: [
        { method: 'POST', path: '/v1/payments', description: 'Create a payment' },
        { method: 'GET', path: '/v1/payments/{id}', description: 'Retrieve a payment' },
        { method: 'POST', path: '/v1/payments/{id}/cancel', description: 'Cancel a payment' }
      ]
    },
    {
      category: 'Cards',
      endpoints: [
        { method: 'POST', path: '/v1/cards', description: 'Issue a new card' },
        { method: 'GET', path: '/v1/cards/{id}', description: 'Retrieve card details' },
        { method: 'POST', path: '/v1/cards/{id}/activate', description: 'Activate a card' },
        { method: 'POST', path: '/v1/cards/{id}/freeze', description: 'Freeze a card' }
      ]
    },
    {
      category: 'Compliance',
      endpoints: [
        { method: 'POST', path: '/v1/kyc/verify', description: 'Start KYC verification' },
        { method: 'GET', path: '/v1/kyc/{id}', description: 'Get verification status' },
        { method: 'POST', path: '/v1/documents', description: 'Upload verification document' }
      ]
    }
  ];

  const sdks = [
    {
      name: 'Node.js',
      icon: '🟢',
      version: 'v2.1.0',
      description: 'Official Node.js SDK for server-side integration',
      installCommand: 'npm install @flowlet/node'
    },
    {
      name: 'Python',
      icon: '🐍',
      version: 'v1.8.0',
      description: 'Python SDK for backend applications',
      installCommand: 'pip install flowlet'
    },
    {
      name: 'React',
      icon: '⚛️',
      version: 'v1.5.0',
      description: 'React components for frontend integration',
      installCommand: 'npm install @flowlet/react'
    },
    {
      name: 'PHP',
      icon: '🐘',
      version: 'v1.3.0',
      description: 'PHP SDK for web applications',
      installCommand: 'composer require flowlet/flowlet-php'
    }
  ];

  const quickStartGuides = [
    {
      title: 'Accept Your First Payment',
      description: 'Learn how to process payments in 5 minutes',
      duration: '5 min',
      icon: Zap
    },
    {
      title: 'Create Digital Wallets',
      description: 'Set up wallet infrastructure for your users',
      duration: '10 min',
      icon: Database
    },
    {
      title: 'Issue Virtual Cards',
      description: 'Enable card issuance in your application',
      duration: '15 min',
      icon: Smartphone
    },
    {
      title: 'Implement KYC Verification',
      description: 'Add compliance workflows to your app',
      duration: '20 min',
      icon: Shield
    }
  ];

  const codeExamples = {
    createWallet: `// Create a new wallet
const wallet = await flowlet.wallets.create({
  userId: 'user_123',
  currency: 'USD',
  type: 'personal'
});

console.log('Wallet created:', wallet.id);`,
    
    processPayment: `// Process a payment
const payment = await flowlet.payments.create({
  amount: 1000, // $10.00 in cents
  currency: 'USD',
  source: 'wallet_abc123',
  destination: 'wallet_def456',
  description: 'Payment for services'
});

console.log('Payment status:', payment.status);`,
    
    issueCard: `// Issue a virtual card
const card = await flowlet.cards.create({
  walletId: 'wallet_abc123',
  type: 'virtual',
  spendingLimits: {
    daily: 50000, // $500.00
    monthly: 200000 // $2000.00
  }
});

console.log('Card number:', card.number);`
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Developer Portal</h1>
          <p className="text-muted-foreground">
            Build with Flowlet's embedded finance APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Key className="mr-2 h-4 w-4" />
                Generate API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for your application
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="My Application Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <select className="w-full p-2 border border-border rounded-md">
                    <option value="test">Test</option>
                    <option value="live">Live</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Read access</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Write access</span>
                    </label>
                  </div>
                </div>
                <Button className="w-full">Generate Key</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Book className="mr-2 h-4 w-4" />
            View Docs
          </Button>
        </div>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guides</CardTitle>
          <CardDescription>
            Get up and running with Flowlet in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartGuides.map((guide, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <guide.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {guide.description}
                  </p>
                  <Badge variant="secondary">{guide.duration}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="endpoints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="endpoints">API Reference</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
              <TabsTrigger value="testing">API Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    Explore all available API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {apiEndpoints.map((category, categoryIndex) => (
                      <div key={categoryIndex}>
                        <h3 className="text-lg font-semibold mb-3">{category.category}</h3>
                        <div className="space-y-2">
                          {category.endpoints.map((endpoint, endpointIndex) => (
                            <div key={endpointIndex} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <Badge className={getMethodColor(endpoint.method)}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm font-mono">{endpoint.path}</code>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                  {endpoint.description}
                                </span>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>
                    Ready-to-use code snippets for common operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Create a Wallet</h3>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{codeExamples.createWallet}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(codeExamples.createWallet)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Process a Payment</h3>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{codeExamples.processPayment}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(codeExamples.processPayment)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Issue a Card</h3>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{codeExamples.issueCard}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(codeExamples.issueCard)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Testing</CardTitle>
                  <CardDescription>
                    Test API endpoints directly from the portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="method">Method</Label>
                        <select className="w-full p-2 border border-border rounded-md">
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endpoint">Endpoint</Label>
                        <Input
                          id="endpoint"
                          placeholder="/v1/wallets"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headers">Headers</Label>
                      <textarea
                        id="headers"
                        className="w-full p-2 border border-border rounded-md h-20"
                        placeholder='{"Authorization": "Bearer your_api_key"}'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Request Body</Label>
                      <textarea
                        id="body"
                        className="w-full p-2 border border-border rounded-md h-32"
                        placeholder='{"userId": "user_123", "currency": "USD"}'
                      />
                    </div>
                    <Button className="w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Send Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys and access tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{key.name}</h4>
                      <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                        {key.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {key.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(key.created)} • Last used {formatDate(key.lastUsed)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SDKs */}
          <Card>
            <CardHeader>
              <CardTitle>SDKs & Libraries</CardTitle>
              <CardDescription>
                Official SDKs for popular programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sdks.map((sdk, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{sdk.icon}</span>
                        <h4 className="font-medium">{sdk.name}</h4>
                      </div>
                      <Badge variant="secondary">{sdk.version}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {sdk.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                        {sdk.installCommand}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(sdk.installCommand)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
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

export default DeveloperPortalPage;


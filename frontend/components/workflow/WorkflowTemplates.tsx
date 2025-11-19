import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Play,
  DollarSign,
  Shield,
  CreditCard,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  FileText,
  Mail,
  Database,
  Globe
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  nodeCount: number;
  rating: number;
  downloads: number;
  author: string;
  tags: string[];
  icon: React.ComponentType<any>;
  color: string;
  preview: string[];
  features: string[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Payment Processing Pipeline',
    description: 'Complete payment processing workflow with fraud detection, validation, and notification system',
    category: 'Payments',
    difficulty: 'intermediate',
    estimatedTime: '15 min',
    nodeCount: 8,
    rating: 4.8,
    downloads: 1247,
    author: 'Flowlet Team',
    tags: ['payments', 'fraud-detection', 'notifications'],
    icon: DollarSign,
    color: 'bg-green-500',
    preview: ['Payment Received', 'Fraud Check', 'Validate Amount', 'Process Payment', 'Send Confirmation'],
    features: ['Real-time fraud detection', 'Multi-currency support', 'Automated notifications', 'Compliance checks']
  },
  {
    id: '2',
    name: 'KYC Verification Flow',
    description: 'Comprehensive customer verification workflow with document validation and risk assessment',
    category: 'Compliance',
    difficulty: 'advanced',
    estimatedTime: '25 min',
    nodeCount: 12,
    rating: 4.9,
    downloads: 856,
    author: 'Compliance Pro',
    tags: ['kyc', 'verification', 'compliance', 'risk-assessment'],
    icon: Shield,
    color: 'bg-blue-500',
    preview: ['Document Upload', 'ID Verification', 'Address Validation', 'Risk Assessment', 'Approval Decision'],
    features: ['Document OCR', 'Biometric verification', 'Risk scoring', 'Regulatory compliance']
  },
  {
    id: '3',
    name: 'Card Issuance Automation',
    description: 'Automated card creation, activation, and delivery tracking system',
    category: 'Cards',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    nodeCount: 6,
    rating: 4.7,
    downloads: 623,
    author: 'Card Solutions',
    tags: ['cards', 'issuance', 'activation', 'delivery'],
    icon: CreditCard,
    color: 'bg-purple-500',
    preview: ['Application Review', 'Card Creation', 'PIN Generation', 'Activation', 'Delivery Tracking'],
    features: ['Instant card creation', 'Secure PIN generation', 'Delivery tracking', 'Activation notifications']
  },
  {
    id: '4',
    name: 'Fraud Alert System',
    description: 'Real-time fraud detection and alert notification system with machine learning',
    category: 'Security',
    difficulty: 'advanced',
    estimatedTime: '30 min',
    nodeCount: 15,
    rating: 4.9,
    downloads: 1089,
    author: 'Security Expert',
    tags: ['fraud', 'alerts', 'machine-learning', 'real-time'],
    icon: AlertTriangle,
    color: 'bg-red-500',
    preview: ['Transaction Monitor', 'ML Analysis', 'Risk Scoring', 'Alert Generation', 'Response Action'],
    features: ['ML-powered detection', 'Real-time monitoring', 'Multi-channel alerts', 'Automated responses']
  },
  {
    id: '5',
    name: 'Customer Onboarding',
    description: 'Complete customer onboarding workflow with welcome emails and account setup',
    category: 'Customer Management',
    difficulty: 'beginner',
    estimatedTime: '12 min',
    nodeCount: 7,
    rating: 4.6,
    downloads: 945,
    author: 'UX Team',
    tags: ['onboarding', 'welcome', 'account-setup', 'emails'],
    icon: Users,
    color: 'bg-indigo-500',
    preview: ['Registration', 'Email Verification', 'Profile Setup', 'Welcome Email', 'Account Activation'],
    features: ['Personalized welcome', 'Progressive profiling', 'Email automation', 'Account verification']
  },
  {
    id: '6',
    name: 'Monthly Report Generation',
    description: 'Automated monthly financial reports with analytics and email distribution',
    category: 'Analytics',
    difficulty: 'intermediate',
    estimatedTime: '20 min',
    nodeCount: 9,
    rating: 4.5,
    downloads: 534,
    author: 'Analytics Team',
    tags: ['reports', 'analytics', 'monthly', 'email'],
    icon: BarChart3,
    color: 'bg-teal-500',
    preview: ['Data Collection', 'Analysis', 'Report Generation', 'Chart Creation', 'Email Distribution'],
    features: ['Automated scheduling', 'Interactive charts', 'PDF generation', 'Email distribution']
  },
  {
    id: '7',
    name: 'Transaction Reconciliation',
    description: 'Automated transaction matching and reconciliation with exception handling',
    category: 'Operations',
    difficulty: 'advanced',
    estimatedTime: '35 min',
    nodeCount: 18,
    rating: 4.8,
    downloads: 412,
    author: 'Operations Team',
    tags: ['reconciliation', 'matching', 'exceptions', 'automation'],
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    preview: ['Data Import', 'Transaction Matching', 'Exception Detection', 'Manual Review', 'Final Report'],
    features: ['Smart matching', 'Exception handling', 'Audit trails', 'Automated reporting']
  },
  {
    id: '8',
    name: 'API Integration Workflow',
    description: 'Template for integrating external APIs with error handling and retry logic',
    category: 'Integration',
    difficulty: 'intermediate',
    estimatedTime: '18 min',
    nodeCount: 10,
    rating: 4.4,
    downloads: 678,
    author: 'Integration Team',
    tags: ['api', 'integration', 'error-handling', 'retry'],
    icon: Globe,
    color: 'bg-orange-500',
    preview: ['API Call', 'Response Validation', 'Error Handling', 'Retry Logic', 'Data Processing'],
    features: ['Retry mechanisms', 'Error handling', 'Rate limiting', 'Response validation']
  }
];

interface WorkflowTemplatesProps {
  onUseTemplate: (templateId: string) => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ onUseTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || template.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['all', ...Array.from(new Set(WORKFLOW_TEMPLATES.map(t => t.category)))];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Workflow Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Get started quickly with pre-built workflow templates
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Featured Templates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.slice(0, 3).map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${template.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground">Nodes</div>
                        <div className="font-medium">{template.nodeCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Time</div>
                        <div className="font-medium">{template.estimatedTime}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Rating</div>
                        <div className="font-medium">{template.rating}</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className={`p-2 rounded ${template.color} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              {template.name}
                            </DialogTitle>
                          </DialogHeader>
                          <TemplatePreview template={template} onUse={() => onUseTemplate(template.id)} />
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" className="flex-1" onClick={() => onUseTemplate(template.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* All Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Templates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.slice(3).map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${template.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Downloads</div>
                        <div className="font-medium">{template.downloads}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Author</div>
                        <div className="font-medium">{template.author}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className={`p-2 rounded ${template.color} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              {template.name}
                            </DialogTitle>
                          </DialogHeader>
                          <TemplatePreview template={template} onUse={() => onUseTemplate(template.id)} />
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" className="flex-1" onClick={() => onUseTemplate(template.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
};

// Template Preview Component
const TemplatePreview: React.FC<{ template: WorkflowTemplate; onUse: () => void }> = ({ template, onUse }) => {
  const Icon = template.icon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Workflow Steps</h3>
          <div className="space-y-2">
            {template.preview.map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border rounded">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Key Features</h3>
          <div className="space-y-2">
            {template.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{template.nodeCount} nodes</span>
          <span>{template.estimatedTime} setup</span>
          <span>{template.downloads} downloads</span>
        </div>

        <Button onClick={onUse}>
          <Play className="h-4 w-4 mr-2" />
          Use This Template
        </Button>
      </div>
    </div>
  );
};

export default WorkflowTemplates;

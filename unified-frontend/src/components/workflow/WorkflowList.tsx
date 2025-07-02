import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Archive,
  Eye,
  Calendar,
  Clock,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  version: number;
  nodeCount: number;
  executionCount: number;
  successRate: number;
  lastRun?: Date;
  creator: string;
  category: string;
}

const SAMPLE_WORKFLOWS: WorkflowSummary[] = [
  {
    id: '1',
    name: 'Payment Processing Pipeline',
    description: 'Automated payment processing with fraud detection and compliance checks',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    version: 3,
    nodeCount: 8,
    executionCount: 1247,
    successRate: 98.5,
    lastRun: new Date('2024-01-21'),
    creator: 'John Doe',
    category: 'Payments'
  },
  {
    id: '2',
    name: 'KYC Verification Flow',
    description: 'Customer verification workflow with document validation and risk assessment',
    status: 'active',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    version: 2,
    nodeCount: 12,
    executionCount: 856,
    successRate: 94.2,
    lastRun: new Date('2024-01-21'),
    creator: 'Jane Smith',
    category: 'Compliance'
  },
  {
    id: '3',
    name: 'Card Issuance Automation',
    description: 'Automated card creation and activation process',
    status: 'paused',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
    version: 1,
    nodeCount: 6,
    executionCount: 423,
    successRate: 99.1,
    lastRun: new Date('2024-01-15'),
    creator: 'Mike Johnson',
    category: 'Cards'
  },
  {
    id: '4',
    name: 'Fraud Alert System',
    description: 'Real-time fraud detection and alert notification system',
    status: 'active',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    version: 4,
    nodeCount: 15,
    executionCount: 2341,
    successRate: 96.8,
    lastRun: new Date('2024-01-21'),
    creator: 'Sarah Wilson',
    category: 'Security'
  },
  {
    id: '5',
    name: 'Monthly Report Generation',
    description: 'Automated monthly financial reports and analytics',
    status: 'draft',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21'),
    version: 1,
    nodeCount: 4,
    executionCount: 0,
    successRate: 0,
    creator: 'Alex Brown',
    category: 'Analytics'
  }
];

interface WorkflowListProps {
  onCreateNew: () => void;
  onEditWorkflow: (workflowId: string) => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ onCreateNew, onEditWorkflow }) => {
  const [workflows] = useState<WorkflowSummary[]>(SAMPLE_WORKFLOWS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'archived': return <Archive className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const categories = ['all', ...Array.from(new Set(workflows.map(w => w.category)))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Workflow Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your financial automation workflows
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Workflows</span>
            </div>
            <div className="text-2xl font-bold mt-1">{workflows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {workflows.filter(w => w.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Total Executions</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {workflows.reduce((sum, w) => sum + w.executionCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
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
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{workflow.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {workflow.description}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditWorkflow(workflow.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(workflow.status)} text-white`}
                  >
                    {getStatusIcon(workflow.status)}
                    <span className="ml-1 capitalize">{workflow.status}</span>
                  </Badge>
                  <Badge variant="outline">{workflow.category}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Nodes</div>
                    <div className="font-medium">{workflow.nodeCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Executions</div>
                    <div className="font-medium">{workflow.executionCount.toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Success Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{workflow.successRate}%</span>
                  </div>
                  <Progress value={workflow.successRate} className="h-2" />
                </div>
                
                {/* Creator and Dates */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {workflow.creator.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{workflow.creator}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {workflow.lastRun ? 
                        `Last run ${workflow.lastRun.toLocaleDateString()}` : 
                        'Never run'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onEditWorkflow(workflow.id)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant={workflow.status === 'active' ? 'destructive' : 'default'} 
                    size="sm"
                    className="flex-1"
                  >
                    {workflow.status === 'active' ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Create your first workflow to get started'
            }
          </p>
          {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;


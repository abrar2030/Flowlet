import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Share2, Download, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowList from './WorkflowList';
import WorkflowDesigner from './WorkflowDesigner';
import WorkflowAnalytics from './WorkflowAnalytics';
import WorkflowTemplates from './WorkflowTemplates';

type ViewMode = 'list' | 'designer' | 'analytics' | 'templates';

const WorkflowMain: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setCurrentView('designer');
    setSelectedWorkflowId(null);
  };

  const handleEditWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setCurrentView('designer');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedWorkflowId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <WorkflowList
            onCreateNew={handleCreateNew}
            onEditWorkflow={handleEditWorkflow}
          />
        );

      case 'designer':
        return (
          <div className="h-full flex flex-col">
            <div className="border-b bg-card p-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workflows
                </Button>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <WorkflowDesigner workflowId={selectedWorkflowId} />
            </div>
          </div>
        );

      case 'analytics':
        return <WorkflowAnalytics />;

      case 'templates':
        return (
          <WorkflowTemplates
            onUseTemplate={handleCreateNew}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {currentView === 'list' && (
        <div className="border-b bg-card">
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewMode)}>
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="list">Workflows</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkflowMain;

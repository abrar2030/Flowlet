import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkflowList from "./WorkflowList";
import WorkflowDesigner from "./WorkflowDesigner";
import WorkflowAnalytics from "./WorkflowAnalytics";
import WorkflowTemplates from "./WorkflowTemplates";
const WorkflowMain = () => {
  const [currentView, setCurrentView] = useState("list");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const handleCreateNew = () => {
    setCurrentView("designer");
    setSelectedWorkflowId(null);
  };
  const handleEditWorkflow = (workflowId) => {
    setSelectedWorkflowId(workflowId);
    setCurrentView("designer");
  };
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedWorkflowId(null);
  };
  const renderCurrentView = () => {
    switch (currentView) {
      case "list":
        return _jsx(WorkflowList, {
          onCreateNew: handleCreateNew,
          onEditWorkflow: handleEditWorkflow,
        });
      case "designer":
        return _jsxs("div", {
          className: "h-full flex flex-col",
          children: [
            _jsx("div", {
              className: "border-b bg-card p-4",
              children: _jsxs("div", {
                className: "flex items-center gap-4",
                children: [
                  _jsxs(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: handleBackToList,
                    children: [
                      _jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
                      "Back to Workflows",
                    ],
                  }),
                  _jsx("div", { className: "flex-1" }),
                  _jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        children: [
                          _jsx(Share2, { className: "h-4 w-4 mr-2" }),
                          "Share",
                        ],
                      }),
                      _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        children: [
                          _jsx(Download, { className: "h-4 w-4 mr-2" }),
                          "Export",
                        ],
                      }),
                      _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        children: [
                          _jsx(Settings, { className: "h-4 w-4 mr-2" }),
                          "Settings",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            _jsx("div", {
              className: "flex-1",
              children: _jsx(WorkflowDesigner, {
                workflowId: selectedWorkflowId,
              }),
            }),
          ],
        });
      case "analytics":
        return _jsx(WorkflowAnalytics, {});
      case "templates":
        return _jsx(WorkflowTemplates, { onUseTemplate: handleCreateNew });
      default:
        return null;
    }
  };
  return _jsxs("div", {
    className: "h-full flex flex-col",
    children: [
      currentView === "list" &&
        _jsx("div", {
          className: "border-b bg-card",
          children: _jsx(Tabs, {
            value: currentView,
            onValueChange: (value) => setCurrentView(value),
            children: _jsx("div", {
              className: "px-6 pt-4",
              children: _jsxs(TabsList, {
                className: "grid w-full grid-cols-4 max-w-md",
                children: [
                  _jsx(TabsTrigger, { value: "list", children: "Workflows" }),
                  _jsx(TabsTrigger, {
                    value: "templates",
                    children: "Templates",
                  }),
                  _jsx(TabsTrigger, {
                    value: "analytics",
                    children: "Analytics",
                  }),
                  _jsx(TabsTrigger, {
                    value: "settings",
                    children: "Settings",
                  }),
                ],
              }),
            }),
          }),
        }),
      _jsx("div", {
        className: "flex-1 overflow-hidden",
        children: _jsx(AnimatePresence, {
          mode: "wait",
          children: _jsx(
            motion.div,
            {
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -20 },
              transition: { duration: 0.2 },
              className: "h-full",
              children: renderCurrentView(),
            },
            currentView,
          ),
        }),
      }),
    ],
  });
};
export default WorkflowMain;

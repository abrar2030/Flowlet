import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Save,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Zap,
  Shield,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Mail,
  MessageSquare,
  FileText,
  BarChart3,
  GitBranch,
  Filter,
  Calculator,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import "./workflow.css";
// Node types for FinTech workflows
const NODE_TYPES = {
  trigger: {
    category: "Triggers",
    items: [
      {
        type: "payment_received",
        label: "Payment Received",
        icon: DollarSign,
        color: "bg-green-500",
      },
      {
        type: "transaction_created",
        label: "Transaction Created",
        icon: CreditCard,
        color: "bg-blue-500",
      },
      {
        type: "user_registered",
        label: "User Registered",
        icon: Users,
        color: "bg-purple-500",
      },
      {
        type: "schedule",
        label: "Schedule",
        icon: Clock,
        color: "bg-orange-500",
      },
      {
        type: "webhook",
        label: "Webhook",
        icon: Globe,
        color: "bg-indigo-500",
      },
    ],
  },
  action: {
    category: "Actions",
    items: [
      {
        type: "send_payment",
        label: "Send Payment",
        icon: DollarSign,
        color: "bg-green-600",
      },
      {
        type: "create_card",
        label: "Create Card",
        icon: CreditCard,
        color: "bg-blue-600",
      },
      {
        type: "send_notification",
        label: "Send Notification",
        icon: MessageSquare,
        color: "bg-yellow-600",
      },
      {
        type: "send_email",
        label: "Send Email",
        icon: Mail,
        color: "bg-red-600",
      },
      {
        type: "update_database",
        label: "Update Database",
        icon: Database,
        color: "bg-gray-600",
      },
      {
        type: "generate_report",
        label: "Generate Report",
        icon: FileText,
        color: "bg-teal-600",
      },
    ],
  },
  condition: {
    category: "Logic",
    items: [
      {
        type: "if_condition",
        label: "If Condition",
        icon: GitBranch,
        color: "bg-amber-500",
      },
      { type: "filter", label: "Filter", icon: Filter, color: "bg-cyan-500" },
      {
        type: "calculator",
        label: "Calculator",
        icon: Calculator,
        color: "bg-pink-500",
      },
      { type: "delay", label: "Delay", icon: Clock, color: "bg-slate-500" },
    ],
  },
  security: {
    category: "Security & Compliance",
    items: [
      {
        type: "fraud_check",
        label: "Fraud Check",
        icon: Shield,
        color: "bg-red-500",
      },
      {
        type: "compliance_check",
        label: "Compliance Check",
        icon: CheckCircle,
        color: "bg-emerald-500",
      },
      {
        type: "risk_assessment",
        label: "Risk Assessment",
        icon: AlertTriangle,
        color: "bg-orange-600",
      },
      {
        type: "kyc_verification",
        label: "KYC Verification",
        icon: Users,
        color: "bg-violet-500",
      },
    ],
  },
  analytics: {
    category: "Analytics",
    items: [
      {
        type: "track_event",
        label: "Track Event",
        icon: BarChart3,
        color: "bg-blue-700",
      },
      {
        type: "analytics_report",
        label: "Analytics Report",
        icon: BarChart3,
        color: "bg-green-700",
      },
    ],
  },
};
const WorkflowDesigner = ({ workflowId }) => {
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [connectionStart, setConnectionStart] = useState(null);
  // Create new workflow
  const createNewWorkflow = useCallback(() => {
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      name: "New Workflow",
      description: "A new financial workflow",
      nodes: [],
      connections: [],
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    setWorkflows((prev) => [...prev, newWorkflow]);
    setCurrentWorkflow(newWorkflow);
  }, []);
  // Add node to canvas
  const addNode = useCallback(
    (nodeType, position) => {
      if (!currentWorkflow) return;
      const nodeInfo = Object.values(NODE_TYPES)
        .flatMap((category) => category.items)
        .find((item) => item.type === nodeType);
      if (!nodeInfo) return;
      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: nodeInfo.label,
          description: `${nodeInfo.label} node`,
          config: {},
          status: "idle",
        },
      };
      const updatedWorkflow = {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, newNode],
        updatedAt: new Date(),
      };
      setCurrentWorkflow(updatedWorkflow);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w)),
      );
    },
    [currentWorkflow],
  );
  // Handle canvas drop
  const handleCanvasDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (!draggedNodeType || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom,
      };
      addNode(draggedNodeType, position);
      setDraggedNodeType(null);
    },
    [draggedNodeType, canvasOffset, zoom, addNode],
  );
  // Delete node
  const deleteNode = useCallback(
    (nodeId) => {
      if (!currentWorkflow) return;
      const updatedWorkflow = {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter((n) => n.id !== nodeId),
        connections: currentWorkflow.connections.filter(
          (c) => c.source !== nodeId && c.target !== nodeId,
        ),
        updatedAt: new Date(),
      };
      setCurrentWorkflow(updatedWorkflow);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w)),
      );
      setSelectedNode(null);
    },
    [currentWorkflow],
  );
  // Update node
  const updateNode = useCallback(
    (nodeId, updates) => {
      if (!currentWorkflow) return;
      const updatedWorkflow = {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
        updatedAt: new Date(),
      };
      setCurrentWorkflow(updatedWorkflow);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w)),
      );
    },
    [currentWorkflow],
  );
  // Run workflow simulation
  const runWorkflow = useCallback(async () => {
    if (!currentWorkflow || isRunning) return;
    setIsRunning(true);
    // Simulate workflow execution
    for (const node of currentWorkflow.nodes) {
      updateNode(node.id, { data: { ...node.data, status: "running" } });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateNode(node.id, { data: { ...node.data, status: "completed" } });
    }
    setIsRunning(false);
  }, [currentWorkflow, isRunning, updateNode]);
  // Initialize with sample workflow
  useEffect(() => {
    if (workflows.length === 0) {
      createNewWorkflow();
    }
  }, [workflows.length, createNewWorkflow]);
  return _jsxs("div", {
    className: "h-screen flex flex-col bg-background",
    children: [
      _jsx("div", {
        className: "border-b bg-card p-4",
        children: _jsxs("div", {
          className: "flex items-center justify-between",
          children: [
            _jsxs("div", {
              className: "flex items-center gap-4",
              children: [
                _jsxs("h1", {
                  className: "text-2xl font-bold flex items-center gap-2",
                  children: [
                    _jsx(Zap, { className: "h-6 w-6 text-primary" }),
                    "Workflow Designer",
                  ],
                }),
                currentWorkflow &&
                  _jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      _jsx(Input, {
                        value: currentWorkflow.name,
                        onChange: (e) => {
                          const updatedWorkflow = {
                            ...currentWorkflow,
                            name: e.target.value,
                          };
                          setCurrentWorkflow(updatedWorkflow);
                          setWorkflows((prev) =>
                            prev.map((w) =>
                              w.id === currentWorkflow.id ? updatedWorkflow : w,
                            ),
                          );
                        },
                        className: "w-48",
                      }),
                      _jsx(Badge, {
                        variant:
                          currentWorkflow.status === "active"
                            ? "default"
                            : "secondary",
                        children: currentWorkflow.status,
                      }),
                    ],
                  }),
              ],
            }),
            _jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                _jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: createNewWorkflow,
                  children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "New"],
                }),
                _jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save"],
                }),
                _jsx(Button, {
                  variant: isRunning ? "destructive" : "default",
                  size: "sm",
                  onClick: runWorkflow,
                  disabled:
                    !currentWorkflow || currentWorkflow.nodes.length === 0,
                  children: isRunning
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx(Pause, { className: "h-4 w-4 mr-2" }),
                          "Stop",
                        ],
                      })
                    : _jsxs(_Fragment, {
                        children: [
                          _jsx(Play, { className: "h-4 w-4 mr-2" }),
                          "Run",
                        ],
                      }),
                }),
              ],
            }),
          ],
        }),
      }),
      _jsxs("div", {
        className: "flex flex-1 overflow-hidden",
        children: [
          _jsx("div", {
            className: "w-80 border-r bg-card",
            children: _jsx(ScrollArea, {
              className: "h-full",
              children: _jsxs("div", {
                className: "p-4",
                children: [
                  _jsx("h3", {
                    className: "font-semibold mb-4",
                    children: "Node Library",
                  }),
                  Object.entries(NODE_TYPES).map(([categoryKey, category]) =>
                    _jsxs(
                      "div",
                      {
                        className: "mb-6",
                        children: [
                          _jsx("h4", {
                            className:
                              "text-sm font-medium text-muted-foreground mb-3",
                            children: category.category,
                          }),
                          _jsx("div", {
                            className: "space-y-2",
                            children: category.items.map((nodeType) => {
                              const Icon = nodeType.icon;
                              return _jsxs(
                                motion.div,
                                {
                                  className:
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-grab hover:bg-accent transition-colors",
                                  draggable: true,
                                  onDragStart: () =>
                                    setDraggedNodeType(nodeType.type),
                                  whileHover: { scale: 1.02 },
                                  whileTap: { scale: 0.98 },
                                  children: [
                                    _jsx("div", {
                                      className: `p-2 rounded ${nodeType.color} text-white`,
                                      children: _jsx(Icon, {
                                        className: "h-4 w-4",
                                      }),
                                    }),
                                    _jsx("div", {
                                      className: "flex-1",
                                      children: _jsx("div", {
                                        className: "font-medium text-sm",
                                        children: nodeType.label,
                                      }),
                                    }),
                                  ],
                                },
                                nodeType.type,
                              );
                            }),
                          }),
                        ],
                      },
                      categoryKey,
                    ),
                  ),
                ],
              }),
            }),
          }),
          _jsx("div", {
            className: "flex-1 relative overflow-hidden",
            children: _jsxs("div", {
              ref: canvasRef,
              className: "w-full h-full bg-grid-pattern relative",
              onDrop: handleCanvasDrop,
              onDragOver: (e) => e.preventDefault(),
              style: {
                backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              },
              children: [
                _jsxs("div", {
                  className: "absolute top-4 right-4 flex gap-2 z-10",
                  children: [
                    _jsx(Button, {
                      variant: "outline",
                      size: "sm",
                      onClick: () => setZoom(1),
                      children: _jsx(RotateCcw, { className: "h-4 w-4" }),
                    }),
                    _jsxs("div", {
                      className:
                        "flex items-center gap-2 bg-card border rounded-md px-3 py-1",
                      children: [
                        _jsx("span", {
                          className: "text-sm",
                          children: "Zoom:",
                        }),
                        _jsxs("span", {
                          className: "text-sm font-mono",
                          children: [Math.round(zoom * 100), "%"],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx(AnimatePresence, {
                  children: currentWorkflow?.nodes.map((node) => {
                    const nodeInfo = Object.values(NODE_TYPES)
                      .flatMap((category) => category.items)
                      .find((item) => item.type === node.type);
                    if (!nodeInfo) return null;
                    const Icon = nodeInfo.icon;
                    return _jsxs(
                      motion.div,
                      {
                        className: `absolute bg-card border-2 rounded-lg p-4 cursor-pointer min-w-[200px] ${
                          selectedNode?.id === node.id
                            ? "border-primary"
                            : "border-border"
                        } ${node.data.status === "running" ? "animate-pulse" : ""}`,
                        style: {
                          left: node.position.x * zoom + canvasOffset.x,
                          top: node.position.y * zoom + canvasOffset.y,
                          transform: `scale(${zoom})`,
                        },
                        onClick: () => setSelectedNode(node),
                        initial: { opacity: 0, scale: 0.8 },
                        animate: { opacity: 1, scale: 1 },
                        exit: { opacity: 0, scale: 0.8 },
                        whileHover: { scale: zoom * 1.05 },
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3 mb-2",
                            children: [
                              _jsx("div", {
                                className: `p-2 rounded ${nodeInfo.color} text-white`,
                                children: _jsx(Icon, { className: "h-4 w-4" }),
                              }),
                              _jsxs("div", {
                                className: "flex-1",
                                children: [
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: node.data.label,
                                  }),
                                  node.data.description &&
                                    _jsx("div", {
                                      className:
                                        "text-xs text-muted-foreground",
                                      children: node.data.description,
                                    }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex gap-1",
                                children: [
                                  node.data.status === "completed" &&
                                    _jsx(CheckCircle, {
                                      className: "h-4 w-4 text-green-500",
                                    }),
                                  node.data.status === "error" &&
                                    _jsx(AlertTriangle, {
                                      className: "h-4 w-4 text-red-500",
                                    }),
                                  node.data.status === "running" &&
                                    _jsx("div", {
                                      className:
                                        "h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin",
                                    }),
                                ],
                              }),
                            ],
                          }),
                          _jsx("div", {
                            className:
                              "absolute -right-2 top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-crosshair",
                          }),
                          _jsx("div", {
                            className:
                              "absolute -left-2 top-1/2 w-4 h-4 bg-secondary rounded-full border-2 border-background cursor-crosshair",
                          }),
                        ],
                      },
                      node.id,
                    );
                  }),
                }),
                currentWorkflow &&
                  currentWorkflow.nodes.length === 0 &&
                  _jsx("div", {
                    className:
                      "absolute inset-0 flex items-center justify-center",
                    children: _jsxs("div", {
                      className: "text-center text-muted-foreground",
                      children: [
                        _jsx(Zap, {
                          className: "h-12 w-12 mx-auto mb-4 opacity-50",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium mb-2",
                          children: "Start Building Your Workflow",
                        }),
                        _jsx("p", {
                          className: "text-sm",
                          children:
                            "Drag nodes from the palette to begin creating your financial workflow",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(AnimatePresence, {
            children:
              selectedNode &&
              _jsxs(motion.div, {
                className: "w-80 border-l bg-card",
                initial: { x: 320 },
                animate: { x: 0 },
                exit: { x: 320 },
                children: [
                  _jsx("div", {
                    className: "p-4 border-b",
                    children: _jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        _jsx("h3", {
                          className: "font-semibold",
                          children: "Node Properties",
                        }),
                        _jsx(Button, {
                          variant: "ghost",
                          size: "sm",
                          onClick: () => deleteNode(selectedNode.id),
                          children: _jsx(Trash2, { className: "h-4 w-4" }),
                        }),
                      ],
                    }),
                  }),
                  _jsx(ScrollArea, {
                    className: "h-full",
                    children: _jsxs("div", {
                      className: "p-4 space-y-4",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx(Label, {
                              htmlFor: "node-label",
                              children: "Label",
                            }),
                            _jsx(Input, {
                              id: "node-label",
                              value: selectedNode.data.label,
                              onChange: (e) =>
                                updateNode(selectedNode.id, {
                                  data: {
                                    ...selectedNode.data,
                                    label: e.target.value,
                                  },
                                }),
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx(Label, {
                              htmlFor: "node-description",
                              children: "Description",
                            }),
                            _jsx(Textarea, {
                              id: "node-description",
                              value: selectedNode.data.description || "",
                              onChange: (e) =>
                                updateNode(selectedNode.id, {
                                  data: {
                                    ...selectedNode.data,
                                    description: e.target.value,
                                  },
                                }),
                            }),
                          ],
                        }),
                        _jsx(Separator, {}),
                        _jsxs("div", {
                          children: [
                            _jsx("h4", {
                              className: "font-medium mb-3",
                              children: "Configuration",
                            }),
                            _jsx(NodeConfiguration, {
                              node: selectedNode,
                              onUpdate: (config) =>
                                updateNode(selectedNode.id, {
                                  data: { ...selectedNode.data, config },
                                }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              }),
          }),
        ],
      }),
    ],
  });
};
// Node Configuration Component
const NodeConfiguration = ({ node, onUpdate }) => {
  const config = node.data.config || {};
  const renderConfigForNodeType = () => {
    switch (node.type) {
      case "payment_received":
        return _jsxs("div", {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Minimum Amount" }),
                _jsx(Input, {
                  type: "number",
                  value: config.minAmount || "",
                  onChange: (e) =>
                    onUpdate({ ...config, minAmount: e.target.value }),
                  placeholder: "0.00",
                }),
              ],
            }),
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Currency" }),
                _jsxs(Select, {
                  value: config.currency || "USD",
                  onValueChange: (value) =>
                    onUpdate({ ...config, currency: value }),
                  children: [
                    _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, { value: "USD", children: "USD" }),
                        _jsx(SelectItem, { value: "EUR", children: "EUR" }),
                        _jsx(SelectItem, { value: "GBP", children: "GBP" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      case "send_notification":
        return _jsxs("div", {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Message Template" }),
                _jsx(Textarea, {
                  value: config.message || "",
                  onChange: (e) =>
                    onUpdate({ ...config, message: e.target.value }),
                  placeholder: "Enter notification message...",
                }),
              ],
            }),
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Priority" }),
                _jsxs(Select, {
                  value: config.priority || "normal",
                  onValueChange: (value) =>
                    onUpdate({ ...config, priority: value }),
                  children: [
                    _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, { value: "low", children: "Low" }),
                        _jsx(SelectItem, {
                          value: "normal",
                          children: "Normal",
                        }),
                        _jsx(SelectItem, { value: "high", children: "High" }),
                        _jsx(SelectItem, {
                          value: "urgent",
                          children: "Urgent",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      case "fraud_check":
        return _jsxs("div", {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Risk Threshold" }),
                _jsx(Slider, {
                  value: [config.riskThreshold || 50],
                  onValueChange: ([value]) =>
                    onUpdate({ ...config, riskThreshold: value }),
                  max: 100,
                  step: 1,
                  className: "mt-2",
                }),
                _jsxs("div", {
                  className: "text-sm text-muted-foreground mt-1",
                  children: ["Current: ", config.riskThreshold || 50, "%"],
                }),
              ],
            }),
            _jsxs("div", {
              className: "flex items-center space-x-2",
              children: [
                _jsx(Switch, {
                  checked: config.blockSuspicious || false,
                  onCheckedChange: (checked) =>
                    onUpdate({ ...config, blockSuspicious: checked }),
                }),
                _jsx(Label, { children: "Block suspicious transactions" }),
              ],
            }),
          ],
        });
      case "delay":
        return _jsxs("div", {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Delay Duration" }),
                _jsx(Input, {
                  type: "number",
                  value: config.duration || "",
                  onChange: (e) =>
                    onUpdate({ ...config, duration: e.target.value }),
                  placeholder: "5",
                }),
              ],
            }),
            _jsxs("div", {
              children: [
                _jsx(Label, { children: "Unit" }),
                _jsxs(Select, {
                  value: config.unit || "minutes",
                  onValueChange: (value) =>
                    onUpdate({ ...config, unit: value }),
                  children: [
                    _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "seconds",
                          children: "Seconds",
                        }),
                        _jsx(SelectItem, {
                          value: "minutes",
                          children: "Minutes",
                        }),
                        _jsx(SelectItem, { value: "hours", children: "Hours" }),
                        _jsx(SelectItem, { value: "days", children: "Days" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      default:
        return _jsx("div", {
          className: "text-sm text-muted-foreground",
          children: "No specific configuration available for this node type.",
        });
    }
  };
  return _jsx("div", { children: renderConfigForNodeType() });
};
export default WorkflowDesigner;

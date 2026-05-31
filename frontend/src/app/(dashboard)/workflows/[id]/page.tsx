"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { departmentsApi, workflowsApi } from "@/lib/api";
import { Workflow, WorkflowStage, WorkflowEdge as ApiEdge, Department } from "@/types";
import { ArrowLeft, Save, Circle, Square, Diamond, Mail, Settings, Trash2 } from "lucide-react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TaskNode from "@/components/workflows/nodes/TaskNode";
import EventNode from "@/components/workflows/nodes/EventNode";
import DecisionNode from "@/components/workflows/nodes/DecisionNode";
import EmailNode from "@/components/workflows/nodes/EmailNode";

function BuilderCanvas({ workflow, id, onWorkflowUpdate, showToast, departments }: any) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const nodeTypes = useMemo(() => ({
    task: TaskNode,
    start: EventNode,
    end: EventNode,
    decision: DecisionNode,
    notification: EmailNode
  }), []);

  useEffect(() => {
    if (workflow) {
      const initialNodes: Node[] = (workflow.stages || []).map((stage: any) => ({
        id: stage.id.toString(),
        type: stage.node_type || 'task',
        position: { x: stage.pos_x || 100, y: stage.pos_y || 100 },
        data: { stage, updateStage: handleUpdateStageField, departments },
      }));
      setNodes(initialNodes);

      const initialEdges: Edge[] = (workflow.edges || []).map((edge: any) => ({
        id: `e${edge.source_stage_id}-${edge.target_stage_id}`,
        source: edge.source_stage_id.toString(),
        target: edge.target_stage_id.toString(),
        animated: true,
        label: edge.label || undefined,
        style: { strokeWidth: 2 },
        labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9, stroke: '#cbd5e1' },
        labelBgPadding: [6, 4]
      }));
      setEdges(initialEdges);
    }
  }, [workflow]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  const handleUpdateStageField = useCallback((stageId: number, field: string, value: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === stageId.toString()) {
          const updatedStage = { ...(node.data.stage as any), [field]: value };
          return {
            ...node,
            data: {
              ...node.data,
              stage: updatedStage
            }
          };
        }
        return node;
      })
    );
    
    // Update selectedNode if it's currently selected
    setSelectedNode((prev) => {
      if (prev && prev.id === stageId.toString()) {
        return {
          ...prev,
          data: {
            ...prev.data,
            stage: { ...(prev.data.stage as any), [field]: value }
          }
        }
      }
      return prev;
    });

    const updateStage = async () => {
      try {
        await workflowsApi.updateStage(stageId, { [field]: value });
      } catch (err) {
        console.error(err);
      }
    };
    updateStage();
  }, []);

  const handleDeleteNode = useCallback(async () => {
    if (!selectedNode) return;
    try {
      await workflowsApi.deleteStage(parseInt(selectedNode.id));
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      showToast("Nodo eliminado con éxito.", "success");
    } catch (err) {
      showToast("Error al eliminar el nodo.", "error");
    }
  }, [selectedNode]);

  const handleDeleteEdge = useCallback(async () => {
    if (!selectedEdge) return;
    try {
      // Find the edge ID in the API by looking up source/target in original workflow
      const edge = workflow.edges.find((e: any) => 
        e.source_stage_id.toString() === selectedEdge.source && 
        e.target_stage_id.toString() === selectedEdge.target
      );
      if (edge) await workflowsApi.deleteEdge(edge.id);
      
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      showToast("Conexión eliminada.", "success");
    } catch (err) {
      showToast("Error al eliminar la conexión.", "error");
    }
  }, [selectedEdge, workflow]);

  const saveCanvas = async () => {
    setLoading(true);
    try {
      for (const node of nodes) {
        await workflowsApi.updateStage(parseInt(node.id), {
          pos_x: node.position.x,
          pos_y: node.position.y
        });
      }

      const res = await workflowsApi.get(id);
      const currentEdges: ApiEdge[] = res.data.edges || [];
      
      for (const edge of currentEdges) {
        await workflowsApi.deleteEdge(edge.id);
      }

      for (const edge of edges) {
        await workflowsApi.addEdge(id, {
          source_stage_id: parseInt(edge.source),
          target_stage_id: parseInt(edge.target),
          label: edge.label
        });
      }

      showToast("Diagrama guardado con éxito.", "success");
    } catch (err) {
      console.error(err);
      showToast("Hubo un error al guardar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      if (!reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let name = "Nuevo Nodo";
      if (type === "start") name = "Inicio";
      if (type === "end") name = "Fin";
      if (type === "task") name = "Tarea Manual";
      if (type === "decision") name = "Decisión";
      if (type === "notification") name = "Notificación";

      try {
        const res = await workflowsApi.addStage(id, {
          name: name,
          order: nodes.length + 1,
          color: "blue",
          requires_approval: type === "decision",
          node_type: type,
          pos_x: position.x,
          pos_y: position.y,
        });
        
        const newStage = res.data;
        const newNode: Node = {
          id: newStage.id.toString(),
          type: type,
          position,
          data: { stage: newStage, updateStage: handleUpdateStageField, departments },
        };
        
        setNodes((nds) => nds.concat(newNode));
      } catch (err) {
        showToast("Error al crear el nodo", "error");
      }
    },
    [screenToFlowPosition, nodes.length, id]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);



  return (
    <div className="flex h-full relative" ref={reactFlowWrapper}>
      {/* Sidebar for Drag & Drop */}
      <div className="w-20 bg-[#07060B]/80 border-r border-[#2E455C]/50 flex flex-col items-center py-4 space-y-6 z-10 shadow-sm shrink-0">
        <div 
          className="cursor-grab hover:scale-110 transition-transform" 
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'start'); e.dataTransfer.effectAllowed = 'move'; }} 
          draggable 
          title="Inicio"
        >
          <Circle className="w-8 h-8 text-emerald-500" />
        </div>
        <div 
          className="cursor-grab hover:scale-110 transition-transform" 
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'task'); e.dataTransfer.effectAllowed = 'move'; }} 
          draggable 
          title="Tarea Manual"
        >
          <Square className="w-8 h-8 text-blue-500 rounded-lg" />
        </div>
        <div 
          className="cursor-grab hover:scale-110 transition-transform" 
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'decision'); e.dataTransfer.effectAllowed = 'move'; }} 
          draggable 
          title="Decisión"
        >
          <Diamond className="w-8 h-8 text-emerald-500" />
        </div>
        <div 
          className="cursor-grab hover:scale-110 transition-transform" 
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'notification'); e.dataTransfer.effectAllowed = 'move'; }} 
          draggable 
          title="Notificación"
        >
          <Mail className="w-8 h-8 text-orange-500" />
        </div>
        <div 
          className="cursor-grab hover:scale-110 transition-transform" 
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'end'); e.dataTransfer.effectAllowed = 'move'; }} 
          draggable 
          title="Fin"
        >
          <Circle className="w-8 h-8 text-rose-500" />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#2E455C]/20 relative">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-[#07060B]/80 p-3 rounded-xl shadow-sm border border-[#2E455C]/30 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/workflows")} className="p-2 border border-[#2E455C]/50 rounded-lg hover:bg-[#2E455C]/20 transition-colors text-slate-400">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input 
              value={workflow.name} 
              onChange={(e) => onWorkflowUpdate("name", e.target.value)}
              className="text-lg font-bold border-transparent bg-transparent hover:bg-[#2E455C]/20 focus:bg-[#07060B]/80 focus:border-violet-200 px-2 rounded-md outline-none focus:ring-2 focus:ring-violet-200 w-64 transition-all"
            />
          </div>
          <button onClick={saveCanvas} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[#20CDFE]/20">
            <Save className="h-4 w-4" /> Guardar
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls className="mb-4" />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-[#07060B]/80 border-l border-[#2E455C]/50 shadow-xl z-20 flex flex-col absolute right-0 top-0 bottom-0">
          <div className="p-4 border-b border-[#2E455C]/30 flex items-center gap-2 bg-[#2E455C]/20">
            <Settings className="w-5 h-5 text-[#20CDFE]" />
            <h3 className="font-bold text-white">Propiedades del Nodo</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Nombre</label>
              <input 
                value={(selectedNode.data as any).stage?.name || ""}
                onChange={(e) => handleUpdateStageField(parseInt(selectedNode.id), "name", e.target.value)}
                className="w-full px-3 py-2 border border-[#2E455C]/50 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {['task', 'decision'].includes(selectedNode.type || '') && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">Departamento Asignado</label>
                <select 
                  value={(selectedNode.data as any).stage?.department || ""}
                  onChange={(e) => handleUpdateStageField(parseInt(selectedNode.id), "department", e.target.value)}
                  className="w-full px-3 py-2 bg-[#07060B]/80 border border-[#2E455C]/50 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="">Selecciona área...</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="pt-4 border-t border-[#2E455C]/30">
              <button 
                onClick={handleDeleteNode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} /> Eliminar Nodo
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="w-80 bg-[#07060B]/80 border-l border-[#2E455C]/50 shadow-xl z-20 flex flex-col absolute right-0 top-0 bottom-0">
          <div className="p-4 border-b border-[#2E455C]/30 flex items-center gap-2 bg-[#2E455C]/20">
            <Settings className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-white">Condición de Línea</h3>
          </div>
          <div className="p-4 flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Etiqueta / Condición</label>
              <input 
                value={selectedEdge.label as string || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setEdges((eds) => eds.map((edge) => {
                    if (edge.id === selectedEdge.id) {
                      edge.label = val || undefined;
                      setSelectedEdge({ ...edge, label: val || undefined });
                    }
                    return edge;
                  }));
                }}
                placeholder="Ej. Aprobado"
                className="w-full px-3 py-2 border border-[#2E455C]/50 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="pt-4 border-t border-[#2E455C]/30">
              <button 
                onClick={handleDeleteEdge}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} /> Eliminar Conexión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilderPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const router = useRouter();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [wfRes, deptRes] = await Promise.all([
        workflowsApi.get(id),
        departmentsApi.getAll()
      ]);
      setWorkflow(wfRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      showToast("No se pudo cargar el flujo o los departamentos.", "error");
      router.push("/workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateWorkflow = async (field: string, value: any) => {
    if (!workflow) return;
    setWorkflow({ ...workflow, [field]: value });
    try {
      await workflowsApi.update(id, { [field]: value });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !workflow) return <div className="p-8 text-center text-slate-400">Cargando constructor visual...</div>;
  if (!workflow) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative bg-[#2E455C]/20">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <ReactFlowProvider>
        <BuilderCanvas 
          workflow={workflow} 
          id={id} 
          onWorkflowUpdate={handleUpdateWorkflow} 
          showToast={showToast}
          departments={departments}
        />
      </ReactFlowProvider>
    </div>
  );
}

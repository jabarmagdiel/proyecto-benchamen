import { Handle, Position } from "@xyflow/react";
import { Settings, Bell, AlertTriangle } from "lucide-react";

export default function StageNode({ data }: any) {
  const { stage, updateStage } = data;

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-400" />
      
      <div className="mb-2">
        <span className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none w-full block text-center">
          {stage.name || "Nueva Tarea"}
        </span>
      </div>

      <div className="bg-slate-50 rounded-lg p-2 text-xs border border-slate-100 mt-3">
        <span className="text-slate-500 font-semibold mb-1 block">Departamento Asignado</span>
        <span className="w-full block bg-white border border-slate-200 rounded-md p-1 text-slate-700 text-center truncate">
          {stage.department || "No asignado"}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
}

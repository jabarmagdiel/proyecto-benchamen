import { Handle, Position } from "@xyflow/react";
import { Settings, Bell, AlertTriangle } from "lucide-react";

export default function StageNode({ data }: any) {
  const { stage, updateStage } = data;

  return (
    <div className="bg-[#07060B]/80 rounded-xl shadow-md border-2 border-[#2E455C]/50 p-4 w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-400" />
      
      <div className="mb-2">
        <span className="text-sm font-bold text-white bg-transparent border-none outline-none w-full block text-center">
          {stage.name || "Nueva Tarea"}
        </span>
      </div>

      <div className="bg-[#2E455C]/20 rounded-lg p-2 text-xs border border-[#2E455C]/30 mt-3">
        <span className="text-slate-400 font-semibold mb-1 block">Departamento Asignado</span>
        <span className="w-full block bg-[#07060B]/80 border border-[#2E455C]/50 rounded-md p-1 text-white text-center truncate">
          {stage.department || "No asignado"}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
}

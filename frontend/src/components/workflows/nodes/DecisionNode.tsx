import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export default function DecisionNode({ data }: any) {
  const { stage, updateStage } = data;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Diamond Shape */}
      <div className="absolute inset-0 bg-emerald-50 border-4 border-emerald-400 rotate-45 rounded-lg shadow-sm"></div>
      
      {/* Content (Not Rotated) */}
      <div className="relative z-10 flex flex-col items-center justify-center p-2 text-center w-full">
        <GitBranch className="w-5 h-5 text-emerald-600 mb-1" />
        <span className="text-xs font-bold text-emerald-800 bg-transparent border-none outline-none w-full text-center block">
          {stage.name || "Decisión"}
        </span>
        <span className="w-full mt-1 block bg-emerald-100 border border-emerald-200 rounded-sm p-0.5 text-[10px] text-emerald-800 text-center truncate">
          {stage.department || "Sin Área"}
        </span>
      </div>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 bg-slate-400" />
      <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 bg-slate-400" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-slate-400" />
    </div>
  );
}

import { Handle, Position } from "@xyflow/react";
import { Mail } from "lucide-react";

export default function EmailNode({ data }: any) {
  const { stage, updateStage } = data;

  return (
    <div className="bg-orange-50 rounded-xl shadow-md border-2 border-orange-400 p-3 w-48 flex items-center">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      
      <div className="bg-orange-100 p-2 rounded-lg mr-3">
        <Mail className="w-5 h-5 text-orange-600" />
      </div>

      <div className="flex-1">
        <input 
          value={stage.name}
          onChange={(e) => updateStage(stage.id, "name", e.target.value)}
          className="text-sm font-bold text-orange-900 bg-transparent border-none outline-none w-full"
          placeholder="Notificación"
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" />
    </div>
  );
}

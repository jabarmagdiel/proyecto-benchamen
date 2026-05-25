import { Handle, Position } from "@xyflow/react";

export default function EventNode({ data }: any) {
  const { stage, updateStage } = data;

  const isStart = stage.node_type === "start";
  const colorClass = isStart ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600";
  const bgColor = isStart ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className={`rounded-full w-24 h-24 shadow-md border-4 ${colorClass} ${bgColor} flex flex-col items-center justify-center p-2`}>
      {isStart ? null : <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />}
      
      <input 
        value={stage.name}
        onChange={(e) => updateStage(stage.id, "name", e.target.value)}
        className={`text-xs font-bold text-center bg-transparent border-none outline-none w-full ${colorClass.split(' ')[1]}`}
        placeholder={isStart ? "Inicio" : "Fin"}
      />

      {isStart ? <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" /> : null}
    </div>
  );
}

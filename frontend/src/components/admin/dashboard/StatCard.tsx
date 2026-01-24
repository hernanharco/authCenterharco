import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend: string;
}

export function StatCard({ label, value, icon: Icon, color, bg, trend }: StatCardProps) {
  return (
    <Card className="p-6 border-slate-200/60 shadow-sm hover:border-indigo-200 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bg} transition-colors group-hover:bg-opacity-80`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
          <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
        </Badge>
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
    </Card>
  );
}
import { Card } from "@/components/ui/card";

export interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  extra?: string;
}

export function StatsCard({ icon, label, value, extra }: StatsCardProps) {
  return (
    <Card className="group bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors group-hover:text-primary">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {extra && <div className="mt-1 text-xs text-primary font-medium">{extra}</div>}
    </Card>
  );
}

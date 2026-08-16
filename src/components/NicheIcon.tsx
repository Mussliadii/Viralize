import {
  GraduationCap,
  HeartPulse,
  TrendingUp,
  Cpu,
  Gamepad2,
  Sparkles,
  UtensilsCrossed,
  Plane,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  HeartPulse,
  TrendingUp,
  Cpu,
  Gamepad2,
  Sparkles,
  UtensilsCrossed,
  Plane,
};

export function NicheIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? GraduationCap;
  return <Icon className={className} aria-hidden="true" />;
}

import { Home, Calendar, FileText, User, Activity, Pill, Package, TrendingUp, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  role?: 'doctor' | 'patient' | 'pharmacy';
}

const patientNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Appointments", path: "/appointments" },
  { icon: Brain, label: "AI Tools", path: "/ai-assistant" },
  { icon: FileText, label: "Records", path: "/records" },
  { icon: User, label: "Profile", path: "/profile" },
];

const doctorNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Schedule", path: "/appointments" },
  { icon: Pill, label: "Prescribe", path: "/prescription-assistant" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
];

const pharmacyNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Package, label: "Orders", path: "/prescriptions" },
  { icon: FileText, label: "Inventory", path: "/prescriptions" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const MobileBottomNav = ({ role = 'patient' }: MobileBottomNavProps) => {
  const location = useLocation();

  const navItems = 
    role === 'doctor' ? doctorNavItems :
    role === 'pharmacy' ? pharmacyNavItems :
    patientNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
              <item.icon className={cn("w-6 h-6", isActive && "scale-110 transition-transform")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

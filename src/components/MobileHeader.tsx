import { Activity, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface MobileHeaderProps {
  title: string;
  profile?: any;
}

export const MobileHeader = ({ title, profile }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-border pt-safe shadow-lg">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary shadow-glow">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            {profile && (
              <p className="text-xs text-muted-foreground capitalize">
                {profile.role}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {/* Profile Section */}
                <div className="flex items-center gap-3 p-4 rounded-xl gradient-primary border-0 shadow-glow">
                  <Avatar className="w-12 h-12 border-2 border-primary-foreground/20">
                    <AvatarFallback className="gradient-secondary text-secondary-foreground font-bold">
                      {profile?.full_name ? getInitials(profile.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-primary-foreground">
                    <div className="font-semibold">{profile?.full_name}</div>
                    <div className="text-sm text-primary-foreground/70">{profile?.email}</div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start hover:bg-primary/10" onClick={() => navigate("/profile")}>
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start hover:bg-primary/10">
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start hover:bg-primary/10">
                    Help & Support
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Plus, Leaf, Settings, HelpCircle, Layers, Globe, FileStack, User, LogOut, Shield, ShieldCheck, BookOpen, Beaker, Target, Banknote, Eye, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapitalModeSwitch } from "./capital-mode-context";
import { useRole } from "./role-context";
import { useAuth } from "./auth-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role } = useRole();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/authority", label: "Authority Index", icon: Globe },
    { href: "/portfolios", label: "Portfolios", icon: Layers },
    { href: "/pipelines", label: "Pipelines", icon: FileStack },
    { href: "/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/methodology", label: "Methodology", icon: BookOpen },
    { href: "/calibration", label: "Calibration", icon: Beaker },
    { href: "/outcomes", label: "Outcomes", icon: Target },
    { href: "/disbursement", label: "Disbursement", icon: Banknote },
    { href: "/overrides", label: "Overrides", icon: Eye },
    { href: "/funder-logic", label: "Funder Logic", icon: Building2 },
    { href: "/new", label: "+ New Analysis", icon: Plus },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/auth-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-background via-background/95 to-background/50" />

      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col z-10 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Leaf className="h-6 w-6 text-primary mr-3" />
          <span className="font-display font-bold text-lg tracking-wide text-foreground">
            ESL <span className="text-primary font-light">Intelligence</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4 mt-2 px-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className={cn("h-4 w-4 mr-3 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-2">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="text-sm font-medium text-foreground truncate">{user.email}</div>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary">{user.role}</span>
              </div>
            </div>
          )}
          <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
            <Settings className="h-4 w-4 mr-3" /> Settings
          </Link>
          <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
            <HelpCircle className="h-4 w-4 mr-3" /> Help & Support
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
          >
            <LogOut className="h-4 w-4 mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center md:hidden">
             <Leaf className="h-5 w-5 text-primary mr-2" />
             <span className="font-display font-bold text-foreground">ESL</span>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <CapitalModeSwitch />
            <div className="text-sm font-display font-semibold text-muted-foreground mr-4 hidden sm:block border-l border-border/50 pl-4">
              Portfolio: <span className="text-foreground">Caribbean Energy Fund</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/50">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-foreground">{role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-xs font-bold text-background shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

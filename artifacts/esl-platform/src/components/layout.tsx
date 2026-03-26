import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Plus, Leaf, Settings, HelpCircle, Layers, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapitalModeSwitch } from "./capital-mode-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/authority", label: "Authority Index", icon: Globe },
    { href: "/portfolios", label: "Portfolios", icon: Layers },
    { href: "/new", label: "New Analysis", icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Background Effect */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/auth-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-background via-background/95 to-background/50" />

      {/* Sidebar */}
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
          <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
            <Settings className="h-4 w-4 mr-3" /> Settings
          </Link>
          <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
            <HelpCircle className="h-4 w-4 mr-3" /> Help & Support
          </Link>
        </div>
      </aside>

      {/* Main Content */}
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
            <div className="flex items-center bg-secondary/50 rounded-full px-3 py-1.5 border border-white/5">
              <Activity className="h-4 w-4 text-primary mr-2 animate-pulse" />
              <span className="text-xs font-medium text-foreground/80">System Nominal</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-xs font-bold text-background shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              AD
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

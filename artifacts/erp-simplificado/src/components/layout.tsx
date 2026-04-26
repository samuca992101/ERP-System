import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Bell,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/forecast", label: "Previsão IA", icon: TrendingUp },
  { href: "/alerts", label: "Alertas", icon: Bell },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <TrendingUp className="h-6 w-6" />
          <span>ERP Inteligente</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium leading-none">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden border-r bg-background w-64 lg:block flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-bold text-lg text-primary">ERP Inteligente</div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

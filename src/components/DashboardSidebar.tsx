
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowRightLeft,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  exact?: boolean;
}

const SidebarLink = ({ to, icon, label, isCollapsed, exact = false }: SidebarLinkProps) => {
  const location = useLocation();
  // Fix active state by including partial path matching for dashboard routes
  const isActive = exact 
    ? location.pathname === to 
    : (location.pathname === to || location.pathname.includes(to.replace('/dashboard/', '/')));

  return (
    <NavLink
      to={to}
      end={exact}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <div className={cn(
        "flex items-center justify-center",
        isActive ? "text-primary" : "text-gray-500"
      )}>{icon}</div>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
};

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser } = useAuth();

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-100 h-screen flex flex-col transition-all shadow-sm",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!isCollapsed && (
          <span className="text-xl font-medium text-primary">Feet</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="px-2 pt-6 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-400 font-medium uppercase tracking-wider px-4 mb-2">Principal</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard"
            icon={<Home size={20} />}
            label="Dashboard"
            isCollapsed={isCollapsed}
            exact={true}
          />
        </nav>
      </div>

      <div className="px-2 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-400 font-medium uppercase tracking-wider px-4 mb-2">Inventario</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/products"
            icon={<Package size={20} />}
            label="Produtos"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/curvas"
            icon={<ArrowRightLeft size={20} />}
            label="Curvas"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/ingreso-mercancia"
            icon={<ArrowDown size={20} strokeWidth={1.5} />}
            label="Ingreso Mercancia"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/salida-mercancia"
            icon={<ArrowDown size={20} strokeWidth={1.5} className="rotate-180" />}
            label="Salida Mercancia"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="px-2 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-400 font-medium uppercase tracking-wider px-4 mb-2">Sistema</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/settings"
            icon={<Settings size={20} />}
            label="Configurações"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/help"
            icon={<HelpCircle size={20} />}
            label="Ajuda"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        {!isCollapsed && (
          <div className="text-xs text-gray-400">
            Feet Colombia v1.0
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;

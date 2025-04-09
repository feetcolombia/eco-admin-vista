import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PackageSearch,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  PackagePlus,
  PackageMinus,
  LineChart,
  MoveHorizontal,
  Building2,
  Network,
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
  const isActive = exact 
    ? location.pathname === to 
    : location.pathname.startsWith(to) || 
      (to.includes("ingreso-mercancia") && location.pathname.includes("ingreso-mercancia")) ||
      (to.includes("salida-mercancia") && location.pathname.includes("salida-mercancia"));

  return (
    <NavLink
      to={to}
      end={exact}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
        isActive
          ? "bg-ecommerce-500 text-white"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <div>{icon}</div>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
};

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-screen flex flex-col transition-all",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <span className="text-xl font-bold text-ecommerce-600">E-Admin</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="px-3 pt-6 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-500 mb-2">GERAL</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard"
            icon={<Home size={18} />}
            label="Dashboard"
            isCollapsed={isCollapsed}
            exact={true}
          />
        </nav>
      </div>

      <div className="px-3 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-500 mb-2">PRODUTOS</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/products"
            icon={<PackageSearch size={18} />}
            label="Produtos"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/curvas"
            icon={<LineChart size={18} />}
            label="Curvas"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/ingreso-mercancia"
            icon={<PackagePlus size={18} />}
            label="Ingreso Mercancia"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/salida-mercancia"
            icon={<PackageMinus size={18} />}
            label="Salida Mercancia"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="px-3 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-500 mb-2">Transferencia</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/transferencia-mercancia"
            icon={<Building2 size={18} />}
            label="Entre Bodegas"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/transferencia-sources"
            icon={<Network size={18} />}
            label="Entre Sources"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="mt-auto p-3">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 mb-2">
            Feet Colombia V1.0
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;

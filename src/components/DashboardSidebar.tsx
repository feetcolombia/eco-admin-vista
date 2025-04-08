
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Package,
  ShoppingCart,
  Settings,
  BarChart2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({ to, icon, label, isCollapsed }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
          isActive
            ? "bg-ecommerce-500 text-white"
            : "text-gray-700 hover:bg-gray-100"
        )
      }
    >
      <div>{icon}</div>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
};

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

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
          />
          <SidebarLink
            to="/dashboard/orders"
            icon={<ShoppingCart size={18} />}
            label="Pedidos"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/products"
            icon={<Package size={18} />}
            label="Produtos"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/customers"
            icon={<Users size={18} />}
            label="Clientes"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/categories"
            icon={<Tag size={18} />}
            label="Categorias"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="px-3 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-500 mb-2">RELATÓRIOS</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/reports"
            icon={<BarChart2 size={18} />}
            label="Relatórios"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="px-3 pt-4 pb-2">
        {!isCollapsed && <div className="text-xs text-gray-500 mb-2">SISTEMA</div>}
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard/settings"
            icon={<Settings size={18} />}
            label="Configurações"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/dashboard/help"
            icon={<HelpCircle size={18} />}
            label="Ajuda"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="mt-auto p-3">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 mb-2">
            {user?.name} ({user?.role})
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;

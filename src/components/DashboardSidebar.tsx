
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PackageSearch,
  Settings,
  HelpCircle,
  Home,
  PackagePlus,
  PackageMinus,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  exact?: boolean;
  basePaths?: string[];
}

const SidebarLink = ({ 
  to, 
  icon, 
  label, 
  tooltip, 
  exact = false,
  basePaths = []
}: SidebarLinkProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if the current path matches this link
  // Either exactly, or it starts with the link path, or it's one of the basePaths
  const isActive = exact
    ? currentPath === to
    : currentPath.startsWith(to) || 
      basePaths.some(path => currentPath.includes(path));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isActive}
        tooltip={tooltip}
      >
        <NavLink to={to} end={exact} className="flex items-center w-full">
          {icon}
          <span className="ml-2">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <span className="text-xl font-bold text-primary">E-Admin</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>GERAL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarLink
                to="/dashboard"
                icon={<Home size={18} />}
                label="Dashboard"
                tooltip="Dashboard"
                exact={true}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>PRODUTOS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarLink
                to="/dashboard/products"
                icon={<PackageSearch size={18} />}
                label="Produtos"
                tooltip="Produtos"
              />
              <SidebarLink
                to="/dashboard/curvas"
                icon={<LineChart size={18} />}
                label="Curvas"
                tooltip="Curvas"
              />
              <SidebarLink
                to="/dashboard/ingreso-mercancia"
                icon={<PackagePlus size={18} />}
                label="Ingreso Mercancia"
                tooltip="Ingreso Mercancia"
                basePaths={["/ingreso-mercancia"]}
              />
              <SidebarLink
                to="/dashboard/salida-mercancia"
                icon={<PackageMinus size={18} />}
                label="Salida Mercancia"
                tooltip="Salida Mercancia"
                basePaths={["/salida-mercancia"]}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>SISTEMA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarLink
                to="/dashboard/settings"
                icon={<Settings size={18} />}
                label="Configurações"
                tooltip="Configurações"
              />
              <SidebarLink
                to="/dashboard/help"
                icon={<HelpCircle size={18} />}
                label="Ajuda"
                tooltip="Ajuda"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {!isCollapsed && "Feet Colombia V1.0"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;

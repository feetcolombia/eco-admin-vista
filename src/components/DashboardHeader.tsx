
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DashboardHeader = () => {
  const { logout } = useAuth();
  const [notifications] = useState([
    { id: 1, text: "Novo pedido recebido", time: "2 minutos atrás" },
    { id: 2, text: "Produto com estoque baixo", time: "1 hora atrás" },
    { id: 3, text: "Nova avaliação de cliente", time: "3 horas atrás" },
  ]);

  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4 flex justify-between items-center">
      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar..."
            className="pl-8 w-full bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-medium">Notificações</h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="text-sm">{notification.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-200">
              <button className="text-sm text-center w-full text-blue-500 hover:underline">
                Ver todas as notificações
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-gray-50 p-1 px-2 rounded-md">
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User size={16} className="mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings size={16} className="mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => logout()}>
              <LogOut size={16} className="mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;

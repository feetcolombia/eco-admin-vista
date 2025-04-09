
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  HelpCircle,
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
  const { currentUser, logout } = useAuth();
  const [notifications] = useState([
    { id: 1, text: "Novo pedido recebido", time: "2 minutos atrás" },
    { id: 2, text: "Produto com estoque baixo", time: "1 hora atrás" },
    { id: 3, text: "Nova avaliação de cliente", time: "3 horas atrás" },
  ]);

  return (
    <header className="bg-white py-3 px-6 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar..."
            className="pl-10 w-full bg-gray-50 border-gray-100 rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-50 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-xl shadow-lg border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-medium">Notificações</h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="text-sm">{notification.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100">
              <button className="text-sm text-center w-full text-primary hover:underline py-1">
                Ver todas as notificações
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <button className="p-2 rounded-full hover:bg-gray-50 text-gray-600">
          <HelpCircle size={20} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-gray-50 p-1.5 px-3 rounded-full border border-gray-100">
              <div className="w-8 h-8 bg-primary/10 rounded-full overflow-hidden flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-primary" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{currentUser?.name || "Usuário"}</div>
                <div className="text-xs text-gray-500">{currentUser?.role || "Admin"}</div>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-gray-100">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/5">
              <User size={16} className="mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/5">
              <Settings size={16} className="mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/5" onClick={() => logout()}>
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

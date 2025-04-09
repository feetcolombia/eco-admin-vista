import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Curvas from "./pages/Curvas";
import IngresoMercancia from "./pages/IngresoMercancia";
import IngresoMercanciaDetalle from "@/pages/IngresoMercanciaDetalle";
import NuevoIngresoMercancia from "@/pages/NuevoIngresoMercancia";
import SalidaMercancia from "@/pages/SalidaMercancia";
import SalidaMercanciaDetalle from "@/pages/SalidaMercanciaDetalle";
import NuevoSalidaMercancia from "@/pages/NuevoSalidaMercancia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Redirecionar / para /dashboard se autenticado, caso contrário, para /login */}
            <Route path="/" element={<ProtectedRoute requireAuth={false} />}>
              <Route index element={<Login />} />
            </Route>

            {/* Rotas protegidas do dashboard */}
            <Route element={<ProtectedRoute requireAuth={true} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/products" element={<Products />} />
                <Route path="/dashboard/curvas" element={<Curvas />} />
                <Route path="/dashboard/ingreso-mercancia" element={<IngresoMercancia />} />
                <Route path="/ingreso-mercancia/nuevo" element={<NuevoIngresoMercancia />} />
                <Route path="/ingreso-mercancia/:id" element={<IngresoMercanciaDetalle />} />
                <Route path="/dashboard/salida-mercancia" element={<SalidaMercancia />} />
                <Route path="/salida-mercancia/nuevo" element={<NuevoSalidaMercancia />} />
                <Route path="/salida-mercancia/:id" element={<SalidaMercanciaDetalle />} />
                {/* Outras rotas do dashboard serão adicionadas aqui */}
              </Route>
            </Route>

            {/* Rota 404 - não encontrado */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

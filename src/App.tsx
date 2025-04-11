import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import NewProduct from "./pages/NewProduct";
import Curvas from "./pages/Curvas";
import IngresoMercancia from "./pages/IngresoMercancia";
import IngresoMercanciaDetalle from "@/pages/IngresoMercanciaDetalle";
import IngresoMercanciaVerificacion from "@/pages/IngresoMercanciaVerificacion";
import NuevoIngresoMercancia from "@/pages/NuevoIngresoMercancia";
import SalidaMercancia from "@/pages/SalidaMercancia";
import SalidaMercanciaDetalle from "@/pages/SalidaMercanciaDetalle";
import SalidaMercanciaConfirmar from "@/pages/SalidaMercanciaConfirmar";
import NuevoSalidaMercancia from "@/pages/NuevoSalidaMercancia";
import TransferenciaBodegas from "@/pages/TransferenciaBodegas";
import TransferenciaSources from "@/pages/TransferenciaSources";
import NovaTransferenciaBodega from "@/pages/NovaTransferenciaBodega";
import ExecutarTransferencia from "@/pages/ExecutarTransferencia";
import ConfirmarTransferencia from "@/pages/ConfirmarTransferencia";
import NotFound from "./pages/NotFound";
import SalidaMercanciaForm from './pages/SalidaMercanciaForm';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Redirect / to /dashboard if authenticated, otherwise to /login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute requireAuth={true} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/products" element={<Products />} />
                <Route path="/dashboard/products/new" element={<NewProduct />} />
                <Route path="/dashboard/curvas" element={<Curvas />} />
                <Route path="/dashboard/ingreso-mercancia" element={<IngresoMercancia />} />
                <Route path="/dashboard/ingreso-mercancia/nuevo" element={<NuevoIngresoMercancia />} />
                <Route path="/dashboard/ingreso-mercancia/:id" element={<IngresoMercanciaDetalle />} />
                <Route path="/dashboard/ingreso-mercancia/:id/verificacion" element={<IngresoMercanciaVerificacion />} />
                <Route path="/dashboard/salida-mercancia" element={<SalidaMercancia />} />
                <Route path="/dashboard/salida-mercancia/nuevo" element={<NuevoSalidaMercancia />} />
                <Route path="/dashboard/salida-mercancia/:id" element={<SalidaMercanciaDetalle />} />
                <Route path="/dashboard/salida-mercancia/:id/confirmar" element={<SalidaMercanciaConfirmar />} />
                <Route path="/dashboard/transferencia-mercancia" element={<TransferenciaBodegas />} />
                <Route path="/dashboard/transferencia-mercancia/novo" element={<NovaTransferenciaBodega />} />
                <Route path="/dashboard/transferencia-mercancia/:id/confirmar" element={<ConfirmarTransferencia />} />
                <Route path="/dashboard/transferencia-mercancia/:id" element={<ExecutarTransferencia />} />
                <Route path="/dashboard/transferencia-sources" element={<TransferenciaSources />} />
                
                {/* Legacy paths to maintain compatibility */}
                <Route path="/ingreso-mercancia/nuevo" element={<Navigate to="/dashboard/ingreso-mercancia/nuevo" replace />} />
                <Route path="/ingreso-mercancia/:id" element={<IngresoMercanciaRedirect />} />
                <Route path="/salida-mercancia/nuevo" element={<Navigate to="/dashboard/salida-mercancia/nuevo" replace />} />
                <Route path="/salida-mercancia/:id" element={<SalidaMercanciaRedirect />} />
              </Route>
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

const IngresoMercanciaRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/dashboard/ingreso-mercancia/${id}`} replace />;
};

const SalidaMercanciaRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/dashboard/salida-mercancia/${id}`} replace />;
};

export default App;

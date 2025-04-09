import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
            {/* Public routes */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Redirect / to /dashboard if authenticated, otherwise to /login */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute requireAuth={true} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/products" element={<Products />} />
                <Route path="/dashboard/curvas" element={<Curvas />} />
                <Route path="/dashboard/ingreso-mercancia" element={<IngresoMercancia />} />
                <Route path="/dashboard/salida-mercancia" element={<SalidaMercancia />} />
                <Route path="/ingreso-mercancia/nuevo" element={<NuevoIngresoMercancia />} />
                <Route path="/ingreso-mercancia/:id" element={<IngresoMercanciaDetalle />} />
                <Route path="/salida-mercancia/nuevo" element={<NuevoSalidaMercancia />} />
                <Route path="/salida-mercancia/:id" element={<SalidaMercanciaDetalle />} />
                {/* Other dashboard routes will be added here */}
              </Route>
            </Route>

            {/* 404 Not Found route */}
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

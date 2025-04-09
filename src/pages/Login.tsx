import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email: username, password });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Coluna da Imagem */}
      <div className="hidden md:flex md:w-1/2 relative">
        <img 
          src="/warehouse.png" 
          alt="Imagem de um armazém" 
          className="object-cover absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
      
      {/* Coluna do Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ecommerce-600">E-Commerce Admin</h1>
            <p className="text-gray-600 mt-2">Gerencie sua loja online</p>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Entre com suas credenciais para acessar o painel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Usuário
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-ecommerce-500 hover:bg-ecommerce-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-gray-500">
              Sistema administrativo de e-commerce
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;

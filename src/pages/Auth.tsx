import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: fullName,
            position: position,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Cadastro realizado! Você já pode fazer login.");
        // Switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        loginTab?.click();
        setLoginEmail(signupEmail);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
      <Card className="w-full max-w-md bg-[#1E293B] border-slate-700 text-white shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Sistema de Combinados</CardTitle>
          <CardDescription className="text-slate-300">
            Gestão corporativa de compromissos e acordos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 text-slate-400">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#F5C542] data-[state=active]:text-slate-900"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-[#F5C542] data-[state=active]:text-slate-900"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-200">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-200">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#F5C542] text-slate-900 hover:bg-[#F5C542]/90 font-semibold"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-200">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-position" className="text-slate-200">Cargo</Label>
                  <Input
                    id="signup-position"
                    type="text"
                    placeholder="Desenvolvedor"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-200">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-200">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#F5C542]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#F5C542] text-slate-900 hover:bg-[#F5C542]/90 font-semibold"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

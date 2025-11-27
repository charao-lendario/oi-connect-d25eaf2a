import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">Sistema de Combinados</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Começar Agora
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Gestão Corporativa de Combinados em Tempo Real
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Crie, gerencie e acompanhe combinados corporativos com notificações instantâneas, 
                checklists colaborativas e auditoria completa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Começar Agora
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                  Fazer Login
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-secondary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-4">Recursos Principais</h3>
              <p className="text-muted-foreground">Tudo que você precisa para gerenciar combinados corporativos</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg bg-background">
                <h4 className="text-xl font-semibold mb-3">⚡ Tempo Real</h4>
                <p className="text-muted-foreground">
                  Notificações instantâneas para todos os stakeholders quando algo muda
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-background">
                <h4 className="text-xl font-semibold mb-3">✅ Checklists</h4>
                <p className="text-muted-foreground">
                  Acompanhe o progresso com checklists colaborativas e percentual de conclusão
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-background">
                <h4 className="text-xl font-semibold mb-3">🔒 Seguro</h4>
                <p className="text-muted-foreground">
                  Controle de acesso por perfis (Colaborador, Gestor, Admin) com auditoria completa
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">
            © 2024 Sistema de Combinados. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

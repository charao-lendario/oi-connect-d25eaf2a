import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewAgreement() {
  const { user, loading: authLoading } = useAuth();
  const { canCreateAgreements, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !canCreateAgreements) {
      navigate("/agreements");
    }
  }, [canCreateAgreements, profileLoading, navigate]);

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (!user || !canCreateAgreements) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Header />
      <main className="container py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Novo Combinado
            </h2>
            <p className="text-muted-foreground">
              Crie um novo combinado corporativo
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulário de Criação</CardTitle>
              <CardDescription>
                Preencha as informações do combinado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Em desenvolvimento</AlertTitle>
                <AlertDescription>
                  O formulário completo de criação de combinados será implementado em breve.
                  Aqui você poderá adicionar título, descrição, participantes, checklists e muito mais.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

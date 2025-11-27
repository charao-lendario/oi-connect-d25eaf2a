import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function AgreementsIndex() {
  const { user, loading: authLoading } = useAuth();
  const { canCreateAgreements, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Hook para notificações em tempo real
  useRealtimeNotifications(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Header />
      <main className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Meus Combinados
              </h2>
              <p className="text-muted-foreground">
                Gerencie todos os seus combinados corporativos
              </p>
            </div>
            {canCreateAgreements && (
               <Button onClick={() => { console.log("[AgreementsIndex] Novo Combinado click"); navigate("/agreements/new"); }}>
                 <Plus className="mr-2 h-4 w-4" />
                 Novo Combinado
               </Button>
             )}
          </div>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>Nenhum combinado encontrado</CardTitle>
              <CardDescription>
                {canCreateAgreements
                  ? "Comece criando seu primeiro combinado"
                  : "Você ainda não participa de nenhum combinado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {canCreateAgreements && (
                 <Button onClick={() => { console.log("[AgreementsIndex] Criar Primeiro Combinado click"); navigate("/agreements/new"); }}>
                   <Plus className="mr-2 h-4 w-4" />
                   Criar Primeiro Combinado
                 </Button>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

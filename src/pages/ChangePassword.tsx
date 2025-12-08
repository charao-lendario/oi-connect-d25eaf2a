import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ChangePassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);

        try {
            // 1. Update Password
            const { error: passwordError } = await supabase.auth.updateUser({
                password: password,
            });

            if (passwordError) throw passwordError;

            // 2. Update profile status
            // We need to get the current user ID first
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({ must_change_password: false } as any) // Type cast until generated types update
                    .eq("id", user.id);

                if (profileError) throw profileError;
            }

            toast.success("Senha alterada com sucesso!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Erro ao alterar senha");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl relative z-10">
                <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>
                        É necessário alterar sua senha no primeiro acesso por segurança.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Atualizar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

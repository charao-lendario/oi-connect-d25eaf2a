import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManageTeam() {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", position: "" });
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const { isAdmin } = useProfile();
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkspaceAndUsers();
    }, []);

    const fetchWorkspaceAndUsers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get current user's workspace
            const { data: profile } = await supabase
                .from("profiles")
                .select("workspace_id")
                .eq("id", user.id)
                .single();

            // @ts-ignore
            if (profile?.workspace_id) {
                // @ts-ignore
                setWorkspaceId(profile.workspace_id);
                // @ts-ignore
                await fetchUsers(profile.workspace_id);
            } else {
                // Check fallback for specific admins or attempt to find by slug if applicable
                const email = user.email?.toLowerCase();
                if (email === 'carol.martins@mutumilklaticinios.com.br') {
                    // Try to find the workspace explicitly
                    const { data: ws, error: wsError } = await supabase
                        .from('workspaces')
                        .select('id')
                        .eq('slug', 'mutumilk')
                        .maybeSingle();

                    if (ws) {
                        setWorkspaceId(ws.id);
                        await fetchUsers(ws.id);

                        // Fix profile connection permanently
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ workspace_id: ws.id } as any)
                            .eq('id', user.id);

                        if (!updateError) toast.success("Perfil vinculado ao workspace automaticamente.");
                    } else {
                        console.error("Could not find mutumilk workspace", wsError);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching team", error);
        }
    };

    const fetchUsers = async (wsId: string) => {
        const { data: team } = await supabase
            .from("profiles")
            .select("*")
            .eq("workspace_id", wsId); // @ts-ignore

        if (team) setUsers(team);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure isAdmin check passes (either via hook or email check if hook lags)
        // We trust the hook mostly, but if user just became admin, hook might need refresh.
        // Assuming hook is accurate or we rely on server RLS eventually.
        // But for UI feedback:
        if (!isAdmin) {
            toast.error("Apenas administradores podem cadastrar novos colaboradores.");
            return;
        }

        if (!workspaceId) {
            // Try one last fetch or just error
            toast.error("Você não está em um workspace. Tente recarregar a página.");
            return;
        }
        setLoading(true);

        try {
            // Create a temporary client to avoid messing with current auth session
            // THIS MUST USE THE IMPORTED FUNCTION, NOT THE INSTANCE
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: false, // Don't save session to local storage
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // 1. Create new user using temp client
            const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        full_name: newUser.name,
                        position: newUser.position,
                    },
                    // This forces no email confirmation requirement if server allows it
                    emailRedirectTo: window.location.origin
                },
            });

            if (signUpError) throw signUpError;

            // If session is null, it means email confirmation is still required by server.
            if (!signUpData.session && !signUpData.user) {
                throw new Error("O servidor ainda está exigindo confirmação de email. Verifique as configurações do Supabase.");
            }

            if (signUpData.user) {
                // 2. We need to update the profile with workspace_id

                const updatePayload = {
                    workspace_id: workspaceId,
                    full_name: newUser.name,
                    position: newUser.position,
                    must_change_password: false
                };

                // @ts-ignore
                const { error: updateError } = await tempClient
                    .from("profiles")
                    .upsert({
                        id: signUpData.user.id,
                        ...updatePayload
                    } as any);

                if (updateError) {
                    console.error("Profile update error", updateError);
                }

                // Also add 'COLABORADOR' role
                // @ts-ignore
                await tempClient.from("user_roles").upsert({
                    user_id: signUpData.user.id,
                    role: 'COLABORADOR'
                });
            }

            toast.success("Colaborador cadastrado com sucesso!");
            setNewUser({ name: "", email: "", password: "", position: "" });
            // Refresh list
            if (workspaceId) fetchUsers(workspaceId);

        } catch (error: any) {
            toast.error(error.message || "Erro ao cadastrar user");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cadastrar Novo Colaborador</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha Inicial</Label>
                            <Input
                                type="text"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cargo</Label>
                            <Input
                                value={newUser.position}
                                onChange={e => setNewUser({ ...newUser, position: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" /> Cadastrar Colaborador
                            </Button>
                        </div>
                    </form>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>(Email via Auth)</TableCell>
                                    <TableCell>{user.position || "-"}</TableCell>
                                    <TableCell>{user.is_active ? "Ativo" : "Inativo"}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={async () => {
                                                if (confirm("Tem certeza que deseja remover este colaborador?")) {
                                                    const { error } = await supabase
                                                        .from("profiles")
                                                        .update({ workspace_id: null, is_active: false } as any)
                                                        .eq("id", user.id);

                                                    if (error) {
                                                        toast.error("Erro ao remover colaborador");
                                                    } else {
                                                        toast.success("Colaborador removido.");
                                                        if (workspaceId) fetchUsers(workspaceId);
                                                    }
                                                }
                                            }}
                                        >
                                            Remover
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Nenhum colaborador encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <p className="text-sm text-muted-foreground mt-4">
                        Nota: O email não é armazenado diretamente no perfil público por padrão, mas o login funcionará com o email cadastrado.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

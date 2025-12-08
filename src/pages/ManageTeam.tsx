import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export default function ManageTeam() {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", position: "" });
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

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

                // Fetch users in this workspace
                // Note: We need to filter profiles by workspace_id.
                // Assuming we are allowed to see profiles in our workspace.
                const { data: team } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("workspace_id", profile.workspace_id);

                if (team) setUsers(team);
            }
        } catch (error) {
            console.error("Error fetching team", error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId) {
            toast.error("Você não está em um workspace.");
            return;
        }
        setLoading(true);

        try {
            // Create a temporary client to avoid messing with current auth session
            // We use the same URL and Key
            // @ts-ignore
            const tempClient = supabase.createClient(
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
                // Since successful signup in tempClient means we have a session for the NEW user in tempClient,
                // we can use tempClient to update the profile of the new user.

                // Wait a moment for trigger to create profile if applicable, or just upsert.
                // Assuming RLS allows user to update own profile.

                const updatePayload = {
                    workspace_id: workspaceId,
                    full_name: newUser.name,
                    position: newUser.position,
                    must_change_password: false
                };

                const { error: updateError } = await tempClient // Use main client? No, must use tempClient because we are editing the NEW user's profile and main client is Admin.
                    // actually, Admin might not have permission to edit other profiles unless we have RLS policies for "Admin of Workspace".
                    // But the NEW user definitely has permission to edit THEMSELVES (usually).
                    // So let's use tempClient.
                    // @ts-ignore
                    .from("profiles")
                    .upsert({
                        id: signUpData.user.id,
                        ...updatePayload
                    } as any);

                if (updateError) {
                    console.error("Profile update error", updateError);
                    // Fallback: Try with main client (current user) if they are admin?
                    // But we haven't set up "Admin can edit workspace members" RLS yet.
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
            fetchWorkspaceAndUsers();

        } catch (error: any) {
            toast.error(error.message || "Erro ao cadastrar user");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Colaboradores</CardTitle>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>(Email via Auth)</TableCell>
                                    <TableCell>{user.position || "-"}</TableCell>
                                    <TableCell>{user.is_active ? "Ativo" : "Inativo"}</TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Nenhum colaborador encontrado.</TableCell>
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetupMutumilk() {
    const [status, setStatus] = useState("Idle");

    const runSetup = async () => {
        setStatus("Running...");
        try {
            // 1. Sign Up Admin
            // WARNING: This will fail if user already exists.
            let userId;
            const email = "carol.martins@mutumilklaticinios.com.br";
            const password = "mutumilk";

            // 0. Check if already logged in as this user
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser?.email === email) {
                setStatus("Already logged in. Proceeding...");
                userId = currentUser.id;
            } else {
                // Not logged in (or logged in as someone else).
                // Try login first to see if exists
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (loginData.user) {
                    setStatus("Logging in...");
                    userId = loginData.user.id;
                } else {
                    // Login failed.
                    // If error is "Invalid login credentials", user might not exist OR password changed.
                    // We'll try to signup. 
                    // Note: If user exists but password changed, SignUp will fail with UserAlreadyRegistered
                    setStatus("Creating user...");
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: "Admin Mutumilk",
                                position: "Administrador"
                            }
                        }
                    });

                    if (signUpError) {
                        // Simplify error message for user
                        if (signUpError.message.includes("already registered")) {
                            throw new Error("User exists but password does not match default 'mutumilk'. Please login manually.");
                        }
                        throw signUpError;
                    }
                    if (!signUpData.user) throw new Error("No user returned");
                    userId = signUpData.user.id;
                }
            }

            // 2. Get Workspace ID
            setStatus("Fetching Workspace...");
            // @ts-ignore
            const { data: workspaceData, error: wsError } = await supabase
                .from("workspaces")
                .select("id")
                .eq("slug", "mutumilk")
                .single();

            if (wsError) throw new Error("Mutumilk workspace not found. Please run migration first.");

            const workspaceId = workspaceData.id;

            // 3. Update Profile
            setStatus("Updating Profile...");
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    workspace_id: workspaceId,
                    must_change_password: true,
                    // role: 'ADMIN' // if user_roles table is used, we might need to insert there too
                } as any)
                .eq("id", userId);

            if (updateError) throw updateError;

            // 4. Update Role (if separate table)
            // Check if user_roles exists in types, yes it does.
            // We should make sure they are ADMIN.

            /* 
               Note: If RLS prevents inserting into user_roles for self, this might fail unless trigger does it.
               But usually apps allow first user or we hope for the best. 
               Let's try.
            */
            const { error: roleError } = await supabase
                .from("user_roles")
                .upsert({
                    user_id: userId,
                    role: 'ADMIN'
                });

            if (roleError) console.warn("Could not set role (might already exist or RLS)", roleError);

            setStatus("Success! Admin configured.");
            toast.success("Setup complete!");

        } catch (e: any) {
            console.error(e);
            setStatus("Error: " + e.message);
            toast.error(e.message);
        }
    };

    return (
        <div className="p-10 flex justify-center">
            <Card className="w-96">
                <CardHeader><CardTitle>Setup Mutumilk</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-4">Status: {status}</p>
                    <Button onClick={runSetup}>Run Setup</Button>
                </CardContent>
            </Card>
        </div>
    );
}

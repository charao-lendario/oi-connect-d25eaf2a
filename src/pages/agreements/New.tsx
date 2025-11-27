import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ChecklistSection, ChecklistItem } from "@/components/agreements/ChecklistSection";
import { AttachmentsSection, AttachmentFile } from "@/components/agreements/AttachmentsSection";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(200),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  meeting_date: z.string().min(1, "Data da reunião é obrigatória"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  participants: z.array(z.string()).min(1, "Selecione pelo menos um participante"),
});

type FormData = z.infer<typeof formSchema>;

interface Profile {
  id: string;
  full_name: string;
  position: string;
  department: string | null;
}

export default function NewAgreement() {
  const { user, loading: authLoading } = useAuth();
  const { canCreateAgreements, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      meeting_date: "",
      due_date: "",
      priority: "MEDIUM",
      category: "",
      tags: [],
      participants: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !authLoading && !canCreateAgreements) {
      navigate("/agreements");
    }
  }, [canCreateAgreements, profileLoading, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, position, department")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setSubmitting(true);
    try {
      // 1. Criar o combinado
      const { data: agreement, error: agreementError } = await supabase
        .from("agreements")
        .insert({
          title: data.title,
          description: data.description,
          meeting_date: new Date(data.meeting_date).toISOString(),
          due_date: new Date(data.due_date).toISOString(),
          priority: data.priority,
          category: data.category || null,
          tags: data.tags,
          creator_id: user.id,
          status: "PENDING",
        })
        .select()
        .single();

      if (agreementError || !agreement) {
        throw new Error(agreementError?.message || "Falha ao criar o combinado");
      }

      // 2. Adicionar participantes
      const participantsData = data.participants.map((participantId) => ({
        agreement_id: agreement.id,
        user_id: participantId,
        status: "PENDING" as const,
      }));

      const { error: participantsError } = await supabase
        .from("agreement_participants")
        .insert(participantsData);

      if (participantsError) {
        throw new Error(participantsError?.message || "Falha ao adicionar participantes");
      }

      // 3. Adicionar checklist (se houver)
      if (checklistItems.length > 0) {
        const checklistData = checklistItems.map((item) => ({
          agreement_id: agreement.id,
          description: item.description,
          order_index: item.order_index,
        }));

        const { error: checklistError } = await supabase
          .from("checklist_items")
          .insert(checklistData);

        if (checklistError) {
          console.error("Erro ao adicionar checklist:", checklistError);
          // Não falha a criação, apenas avisa
          toast.error("Combinado criado, mas houve erro ao adicionar checklist");
        }
      }

      // 4. Upload de anexos (se houver)
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const fileName = `${user.id}/${agreement.id}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('agreement-attachments')
            .upload(fileName, attachment.file);

          if (uploadError) {
            console.error("Erro ao fazer upload:", uploadError);
            continue;
          }

          // Registrar anexo na tabela
          await supabase.from('attachments').insert({
            agreement_id: agreement.id,
            storage_path: fileName,
            file_name: attachment.file.name,
            file_size: attachment.file.size,
            mime_type: attachment.file.type,
            uploaded_by_id: user.id,
          });
        }
      }

      // 5. Criar notificações para participantes
      const notifications = data.participants.map((participantId) => ({
        user_id: participantId,
        type: "AGREEMENT_CREATED" as const,
        title: "Novo Combinado",
        message: `Você foi adicionado ao combinado: ${data.title}`,
        related_type: "agreement",
        related_id: agreement.id,
      }));

      await supabase.from('notifications').insert(notifications);

      toast.success("Combinado criado com sucesso!");
      navigate("/agreements");
    } catch (error: any) {
      console.error("Erro ao criar combinado:", error);
      toast.error(`Erro ao criar combinado: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter((tag) => tag !== tagToRemove));
  };

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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Preencha os dados principais do combinado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título do combinado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva os detalhes do combinado"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="meeting_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Reunião *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="datetime-local"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="due_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="datetime-local"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Baixa</SelectItem>
                              <SelectItem value="MEDIUM">Média</SelectItem>
                              <SelectItem value="HIGH">Alta</SelectItem>
                              <SelectItem value="URGENT">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Vendas, RH, TI" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Adicione uma tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTag();
                                }
                              }}
                            />
                            <Button type="button" onClick={addTag} size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes
                  </CardTitle>
                  <CardDescription>
                    Selecione os colaboradores que farão parte deste combinado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProfiles ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="participants"
                      render={() => (
                        <FormItem>
                          <div className="space-y-3">
                            {profiles.map((profile) => (
                              <FormField
                                key={profile.id}
                                control={form.control}
                                name="participants"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={profile.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4 hover:bg-accent/50 transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(profile.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, profile.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== profile.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <div className="flex-1 space-y-1 leading-none">
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                          {profile.full_name}
                                        </FormLabel>
                                        <FormDescription className="text-sm">
                                          {profile.position}
                                          {profile.department && ` • ${profile.department}`}
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <ChecklistSection
                items={checklistItems}
                onChange={setChecklistItems}
              />

              <AttachmentsSection
                files={attachments}
                onChange={setAttachments}
              />

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/agreements")}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={form.handleSubmit(
                    onSubmit,
                    (errors) => {
                      console.log("[NewAgreement] Erros de validação", errors);
                      toast.error(
                        "Verifique os campos obrigatórios e selecione ao menos um participante."
                      );
                    }
                  )}
                >
                  {submitting ? "Criando..." : "Criar Combinado"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

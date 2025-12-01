import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, GripVertical, User } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceInput } from "@/components/ui/voice-input";

export interface ChecklistItem {
  id: string;
  description: string;
  order_index: number;
  assigned_to_id?: string;
}

interface AssignableUser {
  id: string;
  name: string;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  assignableUsers: AssignableUser[];
}

export function ChecklistSection({ items, onChange, assignableUsers }: ChecklistSectionProps) {
  const [newItem, setNewItem] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("unassigned");

  const addItem = () => {
    if (newItem.trim()) {
      const item: ChecklistItem = {
        id: crypto.randomUUID(),
        description: newItem.trim(),
        order_index: items.length,
        assigned_to_id: selectedAssignee !== "unassigned" ? selectedAssignee : undefined,
      };
      onChange([...items, item]);
      setNewItem("");
      // Manter o assignee selecionado para facilitar adição em lote
    }
  };

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    // Reindex
    const reindexed = updated.map((item, index) => ({
      ...item,
      order_index: index,
    }));
    onChange(reindexed);
  };

  const updateAssignee = (itemId: string, assigneeId: string) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          assigned_to_id: assigneeId !== "unassigned" ? assigneeId : undefined
        };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-item">Novo Item</Label>
            <div className="flex gap-2">
              <Input
                id="new-item"
                placeholder="Descreva a tarefa"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <VoiceInput
                onTranscript={(text) => {
                  setNewItem(prev => prev ? `${prev} ${text}` : text);
                }}
              />
            </div>
          </div>

          {assignableUsers.length > 0 && (
            <div className="w-[200px] space-y-2">
              <Label>Atribuir a (Opcional)</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Ninguém</SelectItem>
                  {assignableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="button" onClick={addItem} size="icon" className="mb-0.5">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <Label>Itens da Checklist</Label>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 rounded-md border bg-card"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.description}</span>

                {assignableUsers.length > 0 && (
                  <div className="w-[150px]">
                    <Select
                      value={item.assigned_to_id || "unassigned"}
                      onValueChange={(val) => updateAssignee(item.id, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Ninguém</SelectItem>
                        {assignableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

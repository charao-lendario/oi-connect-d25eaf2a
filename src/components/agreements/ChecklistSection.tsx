import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, GripVertical } from "lucide-react";
import { useState } from "react";

export interface ChecklistItem {
  id: string;
  description: string;
  order_index: number;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistSection({ items, onChange }: ChecklistSectionProps) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      const item: ChecklistItem = {
        id: crypto.randomUUID(),
        description: newItem.trim(),
        order_index: items.length,
      };
      onChange([...items, item]);
      setNewItem("");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar item da checklist"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Button type="button" onClick={addItem} size="icon">
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

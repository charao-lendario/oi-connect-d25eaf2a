import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileIcon } from "lucide-react";
import { useRef } from "react";

export interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
}

interface AttachmentsSectionProps {
  files: AttachmentFile[];
  onChange: (files: AttachmentFile[]) => void;
}

export function AttachmentsSection({ files, onChange }: AttachmentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: AttachmentFile[] = selectedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    onChange([...files, ...newFiles]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Label htmlFor="file-upload">
            <Button type="button" variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Adicionar Arquivos
              </span>
            </Button>
          </Label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Arquivos Anexados</Label>
            {files.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-md border bg-card"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(attachment.id)}
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

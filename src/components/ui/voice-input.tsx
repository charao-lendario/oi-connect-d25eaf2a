import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isListening?: boolean;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = "pt-BR";

            recognitionInstance.onstart = () => {
                setIsRecording(true);
            };

            recognitionInstance.onend = () => {
                setIsRecording(false);
            };

            recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                onTranscript(transcript);
            };

            recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error("Erro no reconhecimento de fala:", event.error);
                setIsRecording(false);
                toast.error("Erro ao reconhecer fala. Tente novamente.");
            };

            setRecognition(recognitionInstance);
        }
    }, [onTranscript]);

    const toggleRecording = () => {
        if (!recognition) {
            toast.error("Seu navegador não suporta reconhecimento de fala.");
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    if (!recognition) return null;

    return (
        <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            className="shrink-0"
            title={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
            {isRecording ? (
                <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
        </Button>
    );
}

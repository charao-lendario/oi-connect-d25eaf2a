import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('app-realtime')
      // Notificações
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new;
          toast.info(notification.title, {
            description: notification.message,
          });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      // Atualizações em Combinados (para atualizar a lista/detalhes)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agreements',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agreements"] });
          queryClient.invalidateQueries({ queryKey: ["agreement"] });
        }
      )
      // Atualizações em Participantes (para atualizar status)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agreement_participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agreement"] });
          queryClient.invalidateQueries({ queryKey: ["agreements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

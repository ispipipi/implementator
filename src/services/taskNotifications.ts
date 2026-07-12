import {
  customAuthEmailApiReady,
  enviarNotificacionTareaApi,
  TaskNotificationPayload,
} from './customAuthEmailApi';

const APP_PUBLIC_URL = (import.meta.env.VITE_APP_PUBLIC_URL || 'https://implementator.npr.cl/').trim();

export type TaskNotificationInput = Omit<TaskNotificationPayload, 'actionUrl' | 'ctaLabel'> & {
  actionUrl?: string;
  ctaLabel?: string;
};

export async function enviarNotificacionTarea(payload: TaskNotificationInput) {
  if (!customAuthEmailApiReady) {
    throw new Error('La API de correos transaccionales aun no esta configurada.');
  }

  return enviarNotificacionTareaApi({
    ...payload,
    actionUrl: payload.actionUrl || APP_PUBLIC_URL,
    ctaLabel: payload.ctaLabel || 'Abrir Implementator',
  });
}

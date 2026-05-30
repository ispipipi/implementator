import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState, UsuarioActivo } from '../types';
import { db } from './firebaseClient';

type SharedState = Pick<
  AppState,
  'perfiles' | 'ejecutivos' | 'proyectos' | 'fases' | 'tareas' | 'alertas' | 'diasAnticipacionAlerta' | 'fuenteGoogleSheetsUrl'
>;

const workspaceRef = () => {
  if (!db) return null;
  return doc(db, 'implementator', 'workspace');
};

export function toSharedState(state: AppState): SharedState {
  return {
    perfiles: state.perfiles,
    ejecutivos: state.ejecutivos,
    proyectos: state.proyectos,
    fases: state.fases,
    tareas: state.tareas,
    alertas: state.alertas,
    diasAnticipacionAlerta: state.diasAnticipacionAlerta,
    fuenteGoogleSheetsUrl: state.fuenteGoogleSheetsUrl,
  };
}

export async function ensureWorkspaceState(state: AppState) {
  const ref = workspaceRef();
  if (!ref) return;
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      ...toSharedState(state),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.usuarioActivo?.email ?? state.usuarioActivo?.nombre ?? 'Sistema',
    });
  }
}

export async function loadWorkspaceState() {
  const ref = workspaceRef();
  if (!ref) return null;
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Partial<SharedState>;
}

export async function saveWorkspaceState(state: AppState, motivo: string) {
  const ref = workspaceRef();
  if (!ref) return;
  await setDoc(
    ref,
    {
      ...toSharedState(state),
      updatedAt: serverTimestamp(),
      updatedBy: state.usuarioActivo?.email ?? state.usuarioActivo?.nombre ?? 'Sistema',
      motivo,
    },
    { merge: true },
  );
}

export async function bootstrapAdminProfile(state: AppState, profile: UsuarioActivo) {
  const ref = workspaceRef();
  if (!ref) return;
  const nextProfiles = [profile, ...state.perfiles.filter((p) => p.id !== profile.id)];
  await setDoc(
    ref,
    {
      ...toSharedState({ ...state, perfiles: nextProfiles }),
      updatedAt: serverTimestamp(),
      updatedBy: profile.email ?? profile.nombre,
      motivo: 'bootstrap_admin',
    },
    { merge: true },
  );
}

export function subscribeWorkspaceState(
  onState: (state: Partial<SharedState>) => void,
  onError?: (error: Error) => void,
) {
  const ref = workspaceRef();
  if (!ref) return () => undefined;

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      onState(snapshot.data() as Partial<SharedState>);
    },
    (error) => onError?.(error),
  );
}

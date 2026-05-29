import { useEffect } from 'react';
import type { AuthUser, LoginResponse } from '@myway/shared';
import { loadBackendHealth, loadCurrentSession, loadLoginUsers } from '../lib/api';
import { refreshLearningState } from '../lib/app-state';

type BootstrapDeps = {
  setSession: (v: LoginResponse | null) => void;
  setApiStatus: (v: 'checking' | 'online' | 'offline') => void;
  setLoginUsers: (v: AuthUser[]) => void;
  setLoading: (v: boolean) => void;
  learningDeps: Parameters<typeof refreshLearningState>[0];
};

export function useAppBootstrap({ setSession, setApiStatus, setLoginUsers, setLoading, learningDeps }: BootstrapDeps) {
  useEffect(() => {
    let active = true;
    async function initialize() {
      setLoading(true);
      const [storedSession, backendOnline] = await Promise.all([loadCurrentSession(), loadBackendHealth()]);
      const resolvedUsers = await loadLoginUsers();
      if (!active) return;
      setSession(storedSession);
      setApiStatus(backendOnline ? 'online' : 'offline');
      setLoginUsers(resolvedUsers);
      await refreshLearningState(learningDeps, storedSession);
      setLoading(false);
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);
}

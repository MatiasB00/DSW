import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';

type AccessState = 'checking' | 'authenticated' | 'anonymous' | 'error';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const [access, setAccess] = useState<AccessState>('checking');

    useEffect(() => {
        let cancelled = false;

        const checkAccess = async () => {
            if (!localStorage.getItem('token')) {
                setAccess('anonymous');
                return;
            }

            try {
                const response = await apiFetch('/api/auth/me');
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('authChange'));
                    if (!cancelled) setAccess('anonymous');
                    return;
                }
                if (!response.ok) throw new Error('No se pudo verificar la sesión.');
                const user = await response.json();
                localStorage.setItem('user', JSON.stringify(user));
                if (!cancelled) setAccess('authenticated');
            } catch {
                if (!cancelled) setAccess('error');
            }
        };

        void checkAccess();
        return () => {
            cancelled = true;
        };
    }, []);

    if (access === 'checking') return <p role="status">Verificando sesión...</p>;
    if (access === 'anonymous') return <Navigate to="/login" replace />;
    if (access === 'error') {
        return <p role="alert">No se pudo verificar la sesión. Intentá nuevamente.</p>;
    }
    return <>{children}</>;
}

import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { demoStudentRoutes } from '../data/demoStudentRoutes';
import { getStudentRoutes, getStudentStops } from '../services/studentRouteService';
import type { StudentRoute, StudentStop } from '../types/studentRoutes';

export function useStudentRoutes() {
  const { authSession, apiGet } = useAppContext();
  const isDemo = authSession === null;
  const [routes, setRoutes] = useState<StudentRoute[]>([]);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState('');
  const [routesAttempt, setRoutesAttempt] = useState(0);
  const [stopsAttempt, setStopsAttempt] = useState(0);
  const [stopState, setStopState] = useState<{
    routeId: number | null; data: StudentStop[]; loading: boolean; error: string;
  }>({ routeId: null, data: [], loading: false, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setRoutesLoading(true);
    setRoutesError('');
    setRoutes([]);
    setRouteId(null);
    const load = async () => {
      try {
        const data = isDemo ? demoStudentRoutes : await getStudentRoutes(apiGet, controller.signal);
        if (controller.signal.aborted) return;
        setRoutes(data);
        setRouteId(data[0]?.routeId ?? null);
      } catch (error) {
        if (!controller.signal.aborted) setRoutesError(error instanceof Error ? error.message : 'Không thể tải tuyến xe.');
      } finally {
        if (!controller.signal.aborted) setRoutesLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [apiGet, isDemo, routesAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    if (routeId === null) {
      setStopState({ routeId: null, data: [], loading: false, error: '' });
      return () => controller.abort();
    }
    setStopState({ routeId, data: [], loading: true, error: '' });
    const load = async () => {
      try {
        const data = isDemo ? demoStudentRoutes[0].stops : await getStudentStops(apiGet, routeId, controller.signal);
        if (!controller.signal.aborted) setStopState({ routeId, data, loading: false, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setStopState({
          routeId, data: [], loading: false,
          error: error instanceof Error ? error.message : 'Không thể tải điểm dừng.',
        });
      }
    };
    void load();
    return () => controller.abort();
  }, [apiGet, isDemo, routeId, stopsAttempt]);

  return {
    isDemo, routes, routeId, selectRoute: setRouteId, routesLoading, routesError,
    stops: stopState.routeId === routeId ? stopState.data : [],
    stopsLoading: routeId !== null && (stopState.routeId !== routeId || stopState.loading),
    stopsError: stopState.routeId === routeId ? stopState.error : '',
    retryRoutes: () => setRoutesAttempt((attempt) => attempt + 1),
    retryStops: () => setStopsAttempt((attempt) => attempt + 1),
  };
}

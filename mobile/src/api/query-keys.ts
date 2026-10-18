/**
 * Claves de consulta de React Query, centralizadas para invalidaciones consistentes.
 */
export const qk = {
  perfiles: ['perfiles'] as const,
  perfil: (id: string) => ['perfiles', id] as const,
  candidatos: (perfilId: string) => ['candidatos', perfilId] as const,
  /** Prefijo para invalidar todas las candidaturas (p. ej. al publicar). */
  candidatosTodos: ['candidatos'] as const,
  servicios: (perfilId: string) => ['servicios', perfilId] as const,
  tareas: (perfilId: string) => ['tareas', perfilId] as const,
  registros: (perfilId: string, fecha: string) => ['registros', perfilId, fecha] as const,
  incidencias: (perfilId: string) => ['incidencias', perfilId] as const,
  informe: (perfilId: string) => ['informes', perfilId] as const,
  historial: (perfilId: string) => ['historial', perfilId] as const,
};

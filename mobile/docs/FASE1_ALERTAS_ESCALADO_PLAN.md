# Fase 1: Alertas médicas + Escalado

## Resumen de servicios a implementar

| Servicio | Descripción | Archivos principales |
|----------|-------------|---------------------|
| **Motor de reglas** | Evalúa condiciones y genera alertas automáticas | `src/utils/alertas/motor-reglas.ts` |
| **Evaluador de condiciones** | Lógica: cron, umbrales, eventos, recurrencia | `src/utils/alertas/evaluar-condicion.ts` |
| **Programador de alertas** | Agenda notificaciones locales (expo-notifications) | `src/utils/alertas/programar-alertas.ts` |
| **Motor de escalado** | Escala alertas no respondidas a contactos | `src/utils/alertas/escalado.ts` |
| **Gestión de alertas (CRUD)** | Listar, marcar leída, descartar, historial | `src/api/endpoints.ts` + hooks |
| **Gestión de reglas (CRUD)** | Crear/editar/eliminar reglas por perfil | `src/api/endpoints.ts` + hooks |
| **Configuración notificaciones** | Preferencias globales + por perfil | `src/api/endpoints.ts` + hooks |
| **Sistema de notificaciones** | Permisos, tokens, handlers, sonidos | `src/notifications/` |
| **Persistencia (WatermelonDB)** | Modelos Alerta + ReglaAlerta + migración v2 | `src/db/schema.ts`, `src/db/models/` |
| **UI Components** | Cards, listas, formularios, settings | `src/components/alertas/` |

---

## 1. Nuevos Tipos (`src/types/index.ts`)

```typescript
// ============================================
// ALERTAS MÉDICAS
// ============================================

export type TipoAlerta = 
  | 'medicacion'      // Toma de medicamento
  | 'signos_vitales'  // Control tensión, glucosa, temperatura
  | 'cita'            // Cita médica, revisión
  | 'recordatorio'    // Genérico personalizado
  | 'urgencia';       // Activada manual o por umbral crítico

export type PrioridadAlerta = 'baja' | 'media' | 'alta' | 'critica';

export interface AlertaMedica {
  id: ID;
  perfilId: ID;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  titulo: string;
  mensaje: string;
  fechaHora: ISODateTime;        // Cuándo debe dispararse
  leida: boolean;
  descartada: boolean;           // Usuario la cierra sin actuar
  accion?: AccionAlerta;         // Qué hacer al tocar
  reglaId?: ID;                  // Regla que la generó (si es automática)
  creadaEn: ISODateTime;
  leidaEn?: ISODateTime;
  escalada: boolean;             // Si ya entró en escalado
  nivelEscaladoActual: number;   // 0 = sin escalar
}

export interface AccionAlerta {
  tipo: 'abrir_tarea' | 'abrir_incidencia' | 'llamar' | 'url' | 'registrar_valor';
  valor: string;                 // taskId, incidenciaId, tel:, url, tipo_valor
}

// ============================================
// REGLAS DE ALERTA (Configurables por familia)
// ============================================

export type TipoRegla = 
  | 'medicacion'      // Cada X horas / a hora fija
  | 'signos_vitales'  // Si valor > umbral / < umbral
  | 'cita'            // Fecha/hora concreta + recordatorios previos
  | 'recordatorio'    // Recurrencia flexible (cron)
  | 'personalizada';  // Expresión libre futura

export interface ReglaCondicion {
  // Para medicacion/recordatorio
  frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'personalizada';
  hora?: string;                    // "09:00" - hora fija
  horasEntreTomas?: number;         // Cada N horas
  diasSemana?: number[];            // [1,3,5] = Lun, Mié, Vie (1=Lunes)
  // Para signos_vitales
  tipoValor?: 'tension_sistolica' | 'tension_diastolica' | 'glucosa' | 'temperatura' | 'peso' | 'saturacion';
  operador?: '>' | '<' | '>=' | '<=' | '==';
  umbral?: number;
  // Para cita
  fechaCita?: ISODate;
  recordatoriosPrevios?: number[];  // Minutos antes: [1440, 60, 15] = 1 día, 1h, 15min
  // Cron expression (futuro v2)
  cron?: string;
}

export interface ReglaAccion {
  // Qué hacer cuando se cumple la condición
  crearAlerta: boolean;              // Siempre true en v1
  prioridadAlerta: PrioridadAlerta;
  tituloPlantilla: string;           // "Hora de {medicamento}"
  mensajePlantilla: string;          // "Toca tomar {dosis} de {medicamento}"
  accion?: AccionAlerta;             // Qué botón muestra la alerta
  // Crear automáticamente otros objetos
  crearTarea?: boolean;              // Crear tarea en rutina
  tareaPlantilla?: Partial<Tarea>;
  crearIncidencia?: boolean;         // Si prioridad = critica
}

export interface ConfigEscalado {
  niveles: NivelEscalado[];
  tiempoMaximoSinRespuesta: number;  // Minutos antes de escalar al siguiente nivel
}

export interface NivelEscalado {
  orden: number;                     // 1, 2, 3...
  tipo: 'push_local' | 'push_familia' | 'sms' | 'llamada' | 'contacto_emergencia';
  destinatario: 'familia' | 'cuidador' | 'contacto_emergencia' | 'telefono_personalizado';
  telefono?: string;                 // Si destinatario = telefono_personalizado
  mensajePlantilla: string;          // "ALERTA: {titulo} - {mensaje}"
  retrasoMinutos: number;            // Minutos tras nivel anterior (0 = inmediato)
  requiereConfirmacion: boolean;     // Si true, espera acción del usuario
}

export interface ReglaAlerta {
  id: ID;
  perfilId: ID;
  nombre: string;                    // "Insulina mañana"
  tipo: TipoRegla;
  condicion: ReglaCondicion;
  accion: ReglaAccion;
  escalado?: ConfigEscalado;
  activa: boolean;
  creadaEn: ISODateTime;
  actualizadaEn: ISODateTime;
  // Metadatos de ejecución
  ultimaEjecucion?: ISODateTime;
  proximaEjecucion?: ISODateTime;
  vecesEjecutada: number;
}

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

export interface ConfigNotificaciones {
  // Globales (por dispositivo/familia)
  pushHabilitado: boolean;
  sonidoHabilitado: boolean;
  vibracionHabilitada: boolean;
  // Por prioridad
  sonidoPorPrioridad: Record<PrioridadAlerta, string>; // nombre archivo sonido
  // Horarios "no molestar"
  noMolestar: {
    activado: boolean;
    inicio: string;  // "22:00"
    fin: string;     // "08:00"
    permitirCriticas: boolean; // Romper no molestar si prioridad = critica
  };
  // Por perfil (override)
  porPerfil: Record<ID, {
    pushHabilitado?: boolean;
    sonidoHabilitado?: boolean;
    noMolestar?: { activado: boolean; inicio: string; fin: string; };
  }>;
}
```

---

## 2. WatermelonDB - Schema v2 y Modelos

### `src/db/schema.ts` - Añadir tablas

```typescript
// En el schema actual, añadir al final del array tables:
{
  name: 'alertas',
  columns: [
    { name: 'perfil_id', type: 'string', isIndexed: true },
    { name: 'tipo', type: 'string' },
    { name: 'prioridad', type: 'string' },
    { name: 'titulo', type: 'string' },
    { name: 'mensaje', type: 'string' },
    { name: 'fecha_hora', type: 'number' },      // timestamp
    { name: 'leida', type: 'boolean' },
    { name: 'descartada', type: 'boolean' },
    { name: 'accion', type: 'string' },          // JSON
    { name: 'regla_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'escalada', type: 'boolean' },
    { name: 'nivel_escalado_actual', type: 'number' },
    { name: 'leida_en', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
},
{
  name: 'reglas_alerta',
  columns: [
    { name: 'perfil_id', type: 'string', isIndexed: true },
    { name: 'nombre', type: 'string' },
    { name: 'tipo', type: 'string' },
    { name: 'condicion', type: 'string' },       // JSON
    { name: 'accion', type: 'string' },          // JSON
    { name: 'escalado', type: 'string', isOptional: true }, // JSON
    { name: 'activa', type: 'boolean' },
    { name: 'ultima_ejecucion', type: 'number', isOptional: true },
    { name: 'proxima_ejecucion', type: 'number', isOptional: true },
    { name: 'veces_ejecutada', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
},
{
  name: 'config_notificaciones',
  columns: [
    { name: 'clave', type: 'string', isIndexed: true }, // 'global' o 'perfil_{id}'
    { name: 'valor', type: 'string' },                  // JSON
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
},
```

**Importante**: Incrementar `schema.version` a `2`.

### `src/db/models/Alerta.ts`

```typescript
import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Alerta extends Model {
  static table = 'alertas';
  static associations = {
    perfiles: { type: 'belongs_to', key: 'perfil_id' },
    reglas_alerta: { type: 'belongs_to', key: 'regla_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('tipo') tipo!: string;
  @field('prioridad') prioridad!: string;
  @field('titulo') titulo!: string;
  @field('mensaje') mensaje!: string;
  @field('fecha_hora') fechaHoraRaw!: number;
  @field('leida') leida!: boolean;
  @field('descartada') descartada!: boolean;
  @json('accion', {}) accion!: Record<string, any>;
  @field('regla_id') reglaId?: string;
  @field('escalada') escalada!: boolean;
  @field('nivel_escalado_actual') nivelEscaladoActual!: number;
  @field('leida_en') leidaEnRaw?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helpers
  get fechaHora(): Date { return new Date(this.fechaHoraRaw); }
  get leidaEn(): Date | undefined { return this.leidaEnRaw ? new Date(this.leidaEnRaw) : undefined; }
}
```

### `src/db/models/ReglaAlerta.ts`

```typescript
import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ReglaAlerta extends Model {
  static table = 'reglas_alerta';
  static associations = {
    perfiles: { type: 'belongs_to', key: 'perfil_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('nombre') nombre!: string;
  @field('tipo') tipo!: string;
  @json('condicion', {}) condicion!: Record<string, any>;
  @json('accion', {}) accion!: Record<string, any>;
  @json('escalado', null) escalado?: Record<string, any>;
  @field('activa') activa!: boolean;
  @field('ultima_ejecucion') ultimaEjecucionRaw?: number;
  @field('proxima_ejecucion') proximaEjecucionRaw?: number;
  @field('veces_ejecutada') vecesEjecutada!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get ultimaEjecucion(): Date | undefined { 
    return this.ultimaEjecucionRaw ? new Date(this.ultimaEjecucionRaw) : undefined; 
  }
  get proximaEjecucion(): Date | undefined { 
    return this.proximaEjecucionRaw ? new Date(this.proximaEjecucionRaw) : undefined; 
  }
}
```

### `src/db/models/ConfigNotificaciones.ts`

```typescript
import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ConfigNotificaciones extends Model {
  static table = 'config_notificaciones';

  @field('clave') clave!: string; // 'global' | 'perfil_<id>'
  @json('valor', {}) valor!: Record<string, any>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
```

### Registrar modelos en `src/db/models/index.ts` y `src/db/index.ts`

---

## 3. Motor de Reglas (`src/utils/alertas/`)

### Estructura de carpetas
```
src/utils/alertas/
├── index.ts                 # Exportaciones públicas
├── tipos.ts                 # Tipos internos del motor
├── motor-reglas.ts          # Orquestador principal
├── evaluar-condicion.ts     # Lógica pura de condiciones
├── programar-alertas.ts     # Integración expo-notifications
├── escalado.ts              # Motor de escalado
└── helpers.ts               // Utilidades compartidas
```

### `motor-reglas.ts` - API principal

```typescript
// Funciones exportadas:
export async function evaluarTodasLasReglas(perfilId: string): Promise<AlertaMedica[]>;
export async function evaluarRegla(regla: ReglaAlerta): Promise<AlertaMedica | null>;
export async function programarProximasAlertas(perfilId: string): Promise<void>;
export async function cancelarAlertasDeRegla(reglaId: string): Promise<void>;
export async function procesarEscaladosPendientes(): Promise<void>; // Job periódico
```

### `evaluar-condicion.ts` - Lógica pura (testable)

```typescript
export interface ContextoEvaluacion {
  ahora: Date;
  perfilId: string;
  // Datos necesarios para evaluar:
  registrosHistorial: RegistroHistorial[]; // Para signos_vitales
  tareas: Tarea[];                         // Para medicacion
  citas: CitaMedica[];                     // Para tipo cita (futuro)
}

export function evaluarCondicion(
  condicion: ReglaCondicion, 
  contexto: ContextoEvaluacion
): { cumple: boolean; proximaFecha?: Date; datosExtra?: any };
```

**Casos soportados v1:**
- `medicacion` + `frecuencia: 'diaria'` + `hora` →毎日 a esa hora
- `medicacion` + `horasEntreTomas` → cada N horas desde ahora
- `signos_vitales` + `tipoValor` + `operador` + `umbral` → evalúa último registro
- `cita` + `fechaCita` + `recordatoriosPrevios` → alertas en esos offsets
- `recordatorio` + `cron` (básico) → usando `cron-parser` o similar simple

### `programar-alertas.ts` - Expo Notifications

```typescript
import * as Notifications from 'expo-notifications';

export async function programarNotificacionLocal(alerta: AlertaMedica): Promise<string>;
// Returns notificationId

export async function cancelarNotificacion(notificationId: string): Promise<void>;

export async function programarTodasLasAlertasDeHoy(perfilId: string): Promise<void>;
// Programa alertas de hoy + próximas 24h

export function configurarHandlersNotificaciones(
  onRecibida: (notification: Notifications.Notification) => void,
  onRespondida: (response: Notifications.NotificationResponse) => void
): void;
```

### `escalado.ts`

```typescript
export async function iniciarEscalado(alertaId: string): Promise<void>;
// Inicia el proceso de escalado para una alerta

export async function procesarNivelEscalado(
  alerta: AlertaMedica, 
  nivel: NivelEscalado
): Promise<boolean>;
// Returns true si se envió, false si error

export async function cancelarEscalado(alertaId: string): Promise<void>;
// Se llama cuando usuario marca leída/actúa

export async function jobProcesarEscaladosPendientes(): Promise<void>;
// Llamar cada minuto (setInterval o background task)
```

---

## 4. Endpoints API (`src/api/endpoints.ts`)

Añadir al objeto `endpoints`:

```typescript
// --- Alertas médicas ---
listarAlertas: async (perfilId: string, opts?: { 
  soloPendientes?: boolean; 
  desde?: string; 
  hasta?: string;
  limite?: number;
}): Promise<AlertaMedica[]>,

marcarAlertaLeida: async (alertaId: string): Promise<AlertaMedica>,
descartarAlerta: async (alertaId: string): Promise<void>,

// --- Reglas de alerta ---
listarReglas: async (perfilId: string): Promise<ReglaAlerta[]>,
obtenerRegla: async (reglaId: string): Promise<ReglaAlerta>,
crearRegla: async (regla: Omit<ReglaAlerta, 'id' | 'creadaEn' | 'actualizadaEn' | 'vecesEjecutada'>): Promise<ReglaAlerta>,
actualizarRegla: async (id: string, cambios: Partial<ReglaAlerta>): Promise<ReglaAlerta>,
eliminarRegla: async (id: string): Promise<void>,
activarRegla: async (id: string, activa: boolean): Promise<ReglaAlerta>,

// --- Escalado ---
obtenerConfigEscalado: async (perfilId: string): Promise<ConfigEscalado | null>,
guardarConfigEscalado: async (perfilId: string, config: ConfigEscalado): Promise<ConfigEscalado>,

// --- Configuración notificaciones ---
obtenerConfigNotificaciones: async (): Promise<ConfigNotificaciones>,
guardarConfigNotificaciones: async (config: Partial<ConfigNotificaciones>): Promise<ConfigNotificaciones>,
obtenerConfigNotificacionesPerfil: async (perfilId: string): Promise<Partial<ConfigNotificaciones>>,
guardarConfigNotificacionesPerfil: async (perfilId: string, config: Partial<ConfigNotificaciones>): Promise<void>,
```

**Patrón mock/real**: Igual que endpoints existentes - usar `getMockStore()` en modo demo.

---

## 5. Mock DB (`src/api/mock-db.ts`)

Añadir funciones (usando Zustand store):

```typescript
// Alertas
export async function getAlertas(perfilId?: string) { ... }
export async function getAlertaPorId(id: string) { ... }
export async function crearAlerta(alerta: AlertaMedica) { ... }
export async function actualizarAlerta(id: string, cambios: Partial<AlertaMedica>) { ... }
export async function marcarAlertaLeida(id: string) { ... }
export async function descartarAlerta(id: string) { ... }

// Reglas
export async function getReglas(perfilId: string) { ... }
export async function crearRegla(regla: ReglaAlerta) { ... }
export async function actualizarRegla(id: string, cambios: Partial<ReglaAlerta>) { ... }
export async function eliminarRegla(id: string) { ... }

// Config notificaciones
export async function getConfigNotificaciones() { ... }
export async function setConfigNotificaciones(config: ConfigNotificaciones) { ... }
export async function getConfigNotificacionesPerfil(perfilId: string) { ... }
export async function setConfigNotificacionesPerfil(perfilId: string, config: any) { ... }
```

---

## 6. React Query Hooks (`src/hooks/`)

### `useAlertas.ts`

```typescript
export function useAlertas(perfilId: string, opts?: { soloPendientes: boolean }) {
  return useQuery({
    queryKey: ['alertas', perfilId, opts],
    queryFn: () => endpoints.listarAlertas(perfilId, opts),
    enabled: !!perfilId,
  });
}

export function useMarcarAlertaLeida() {
  return useMutation({
    mutationFn: endpoints.marcarAlertaLeida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  });
}
```

### `useReglasAlerta.ts`

```typescript
export function useReglasAlerta(perfilId: string) { ... }
export function useCrearRegla() { ... }
export function useActualizarRegla() { ... }
export function useEliminarRegla() { ... }
export function useActivarRegla() { ... }
```

### `useConfigNotificaciones.ts`

```typescript
export function useConfigNotificaciones() { ... }
export function useConfigNotificacionesPerfil(perfilId: string) { ... }
export function useGuardarConfigNotificaciones() { ... }
```

---

## 7. Sistema de Notificaciones (`src/notifications/`)

### `src/notifications/index.ts`

```typescript
export async function inicializarNotificaciones(): Promise<void> {
  // 1. Configurar canal (Android)
  // 2. Solicitar permisos
  // 3. Registrar handlers
  // 4. Programar alertas de hoy
}

export async function solicitarPermisosNotificaciones(): Promise<boolean>;
export async function registrarPushToken(): Promise<string | null>; // Para backend futuro
```

### `src/notifications/permisos.ts`

```typescript
export async function verificarPermisos(): Promise<Notifications.PermissionStatus>;
export async function solicitarPermisos(): Promise<boolean>;
export function abrirAjustesSistema(): void;
```

### `src/notifications/handlers.ts`

```typescript
// Listeners globales
Notifications.addNotificationReceivedListener(handleNotificationReceived);
Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

function handleNotificationReceived(notification: Notifications.Notification) {
  // App en foreground: mostrar toast/banner custom
  // Actualizar badge, etc.
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  // Usuario tocó la notificación
  const alertaId = response.notification.request.content.data?.alertaId;
  if (alertaId) {
    // Navegar a pantalla correspondiente
    router.push(`/perfil/${perfilId}/alerta/${alertaId}`);
    // Marcar como leída
    endpoints.marcarAlertaLeida(alertaId);
    // Cancelar escalado
    cancelarEscalado(alertaId);
  }
}
```

### `src/notifications/sonidos.ts`

```typescript
// Mapeo prioridad → archivo sonido (en assets/sounds/)
export const SONIDOS_POR_PRIORIDAD: Record<PrioridadAlerta, string> = {
  baja: 'notification_low.wav',
  media: 'notification_medium.wav',
  alta: 'notification_high.wav',
  critica: 'notification_critical.wav',
};
```

---

## 8. Integración en AppProviders

### `src/providers/app-providers.tsx` - Actualizar

```typescript
import { inicializarNotificaciones } from '@/notifications';
import { programarTodasLasAlertasDeHoy } from '@/utils/alertas/programar-alertas';
import { jobProcesarEscaladosPendientes } from '@/utils/alertas/escalado';

export function AppProviders({ children }) {
  // ... existing code ...
  
  useEffect(() => {
    let mounted = true;
    initializeDatabase()
      .then(() => migrateFromZustand())
      .then(async () => {
        if (!mounted) return;
        
        // Inicializar notificaciones
        await inicializarNotificaciones();
        
        // Programar alertas del día para perfiles activos
        const perfiles = useDataStore.getState().perfiles;
        for (const perfil of perfiles) {
          await programarTodasLasAlertasDeHoy(perfil.id);
        }
        
        // Iniciar job de escalado (cada minuto)
        const interval = setInterval(jobProcesarEscaladosPendientes, 60_000);
        
        setDbReady(true);
        return () => clearInterval(interval);
      })
      .catch((e) => {
        console.error('[AppProviders] Error:', e);
        if (mounted) setDbReady(true);
      });
    return () => { mounted = false; };
  }, []);
  
  // ...
}
```

---

## 9. UI Components (`src/components/alertas/`)

```
src/components/alertas/
├── AlertaCard.tsx           # Tarjeta individual (swipe actions: leer, descartar)
├── AlertaList.tsx           # Lista con tabs: Pendientes / Historial / Por prioridad
├── AlertaDetalle.tsx        # Pantalla detalle con botones de acción
├── ReglaForm.tsx            # Formulario crear/editar regla (stepper: tipo → condición → acción → escalado)
├── ReglaCard.tsx            # Tarjeta en lista de reglas (toggle activar/desactivar)
├── EscaladoConfig.tsx       # Configurar niveles de escalado (drag-reorder)
├── NotificacionesSettings.tsx # Pantalla settings globales + por perfil
├── SelectorCondicion.tsx    # Componente reusable para builder de condiciones
└── SelectorAccion.tsx       # Componente reusable para builder de acciones
```

### Patrones UI a seguir:
- Usar `Tooltip`/`CoachMark` existente (`src/components/ui/tooltip.tsx`) para onboarding
- `React Hook Form` + `zod` para validación (ya en deps)
- `expo-router` para navegación
- Estilos con `StyleSheet` + tema (`src/constants/theme.ts`)

---

## 10. Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP START                                │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  AppProviders                                                   │
│  ├── initializeDatabase() → WatermelonDB v2                    │
│  ├── migrateFromZustand()                                      │
│  ├── inicializarNotificaciones()                               │
│  │   ├── solicitarPermisos()                                   │
│  │   ├── configurarHandlers()                                  │
│  │   └── programarTodasLasAlertasDeHoy()                      │
│  └── setInterval(jobProcesarEscaladosPendientes, 60s)         │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  MOTOR DE REGLAS (bajo demanda / job)                          │
│  ├── evaluarTodasLasReglas(perfilId)                           │
│  │   ├── obtener reglas activas del perfil                     │
│  │   ├── para cada regla: evaluarCondicion()                  │
│  │   │   └── devuelve { cumple, proximaFecha }                │
│  │   ├── si cumple: crear AlertaMedica en WatermelonDB        │
│  │   ├── programarNotificacionLocal(alerta)                   │
│  │   └── si tiene escalado: programar job de escalado         │
│  └── actualizar regla.proximaEjecucion                         │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  NOTIFICACIÓN LOCAL (expo-notifications)                       │
│  ├── Usuario recibe push                                       │
│  ├── App en foreground: handleNotificationReceived → Toast     │
│  ├── App en background/killed: handleNotificationResponse      │
│  │   ├── Navega a AlertaDetalle                               │
│  │   ├── Marca alerta como leída (endpoint)                   │
│  │   └── Cancela escalado de esa alerta                       │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  ESCALADO (job cada minuto)                                    │
│  ├── jobProcesarEscaladosPendientes()                          │
│  │   ├── Buscar alertas con escalada=true y nivelActual < max │
│  │   ├── Para cada una: calcular si pasó tiempo de espera     │
│  │   ├── Si sí: enviar siguiente nivel (push_familia, sms...) │
│  │   └── Actualizar alerta.nivelEscaladoActual                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Testing Strategy

### Unit Tests (`src/utils/alertas/__tests__/`)

| Archivo | Qué testea |
|---------|------------|
| `evaluar-condicion.test.ts` | Todas las combinaciones de condiciones (hora fija, intervalo, umbral, cita) |
| `motor-reglas.test.ts` | Integración: regla → alerta → notificación programada |
| `escalado.test.ts` | Niveles, tiempos, cancelación al leer, múltiples alertas |
| `programar-alertas.test.ts` | Mock de expo-notifications, IDs correctos, cancelación |

### Integration Tests (`src/api/endpoints.test.ts`)

```typescript
describe('endpoints · alertas', () => {
  it('crear regla medicación → genera alerta a la hora', async () => { ... });
  it('listarAlertas filtra por perfil y pendientes', async () => { ... });
  it('marcar leída cancela escalado', async () => { ... });
  it('escalado sube nivel tras tiempo configurado', async () => { ... });
});
```

### E2E (Playwright/Detox - futuro)
- Crear regla → esperar hora → verificar push → tocar → verificar navegación
- No responder → verificar escalado a contacto emergencia

---

## 12. Orden de Implementación Recomendado

### Sprint 1: Fundación (2-3 días)
1. ✅ **Tipos** en `src/types/index.ts`
2. ✅ **Schema v2 + Modelos** WatermelonDB + migración
3. ✅ **Mock DB** funciones CRUD alertas/reglas/config
4. ✅ **Endpoints** API completos (mock + real stubs)

### Sprint 2: Motor de Reglas (3-4 días)
5. ✅ **evaluar-condicion.ts** (lógica pura, bien testada)
6. ✅ **motor-reglas.ts** (orquestador)
7. ✅ **Tests unitarios** del motor

### Sprint 3: Notificaciones (2-3 días)
8. ✅ **notifications/** (permisos, handlers, sonidos)
8. ✅ **programar-alertas.ts** (integración expo-notifications)
9. ✅ **Integración en AppProviders** (inicialización + job escalado)

### Sprint 4: Escalado + UI (3-4 días)
10. ✅ **escalado.ts** (motor + job)
11. ✅ **Hooks React Query** (useAlertas, useReglas, useConfig)
12. ✅ **Componentes UI** (AlertaCard, AlertaList, ReglaForm, Settings)
13. ✅ **Pantallas** en `src/app/` (alertas, regla-nueva, regla-editar, config-notificaciones)

### Sprint 5: Pulido (1-2 días)
14. ✅ **Onboarding permisos** (coach mark primer uso)
15. ✅ **Tests integración** completos
16. ✅ **Lint + TypeScript + Jest** all green
17. ✅ **Documentación** en README o docs/

---

## 13. Comandos de Verificación

```bash
# En mobile/
npx tsc --noEmit --skipLibCheck      # TypeScript OK
npx eslint .                          # 0 errors
npx jest                              # All tests pass
npx expo-doctor                       # Check config

# Test manual notificaciones
npx expo start --dev-client
# En dispositivo: crear regla → esperar → verificar push
```

---

## 14. Dependencias a Verificar/Añadir

```json
// package.json - verificar existentes
"expo-notifications": "~57.0.24",  // ✅ Ya instalado
"expo-device": "~57.0.2",          // ✅ Para push token
"expo-constants": "~57.0.22",      // ✅ Para app config

// Posibles nuevas (evaluar necesidad):
// "cron-parser" o similar para cron expressions v2
// "date-fns" ya está para manipulación fechas
```

---

## 15. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Permisos notificaciones denegados | Alto | Coach mark onboarding + deep link a settings |
| Expo Notifications no funciona en background (iOS) | Medio | Usar `background fetch` + silent push futuro |
| WatermelonDB migración v2 falla | Alto | Test migración en CI, backup Zustand antes |
| Escalado consume batería (job cada min) | Bajo | Usar `expo-task-manager` / `expo-background-fetch` |
| Reglas complejas (cron) v1 | Medio | Limitar v1 a: hora fija, intervalo, umbral simple |

---

## 16. Checklist de Entrega Fase 1

- [ ] Tipos TypeScript completos y exportados
- [ ] Schema WatermelonDB v2 con 3 tablas nuevas
- [ ] Modelos Alerta, ReglaAlerta, ConfigNotificaciones
- [ ] Migración v1→v2 probada
- [ ] Mock DB con todas las funciones CRUD
- [ ] Endpoints API (mock + real stubs)
- [ ] Motor de reglas: evaluarCondicion (100% testado)
- [ ] Motor de reglas: motorReglas (orquestador)
- [ ] Programador alertas: expo-notifications integrado
- [ ] Handlers notificaciones (foreground/background)
- [ ] Motor de escalado + job periódico
- [ ] Hooks React Query para alertas/reglas/config
- [ ] Componentes UI: AlertaCard, AlertaList, ReglaForm, Settings
- [ ] Pantallas en Expo Router
- [ ] Integración en AppProviders
- [ ] Onboarding permisos notificaciones
- [ ] Tests unitarios > 80% coverage motor
- [ ] Tests integración endpoints
- [ ] Lint/TypeScript/Jest all green
- [ ] Documentación actualizada

---

## Próximos Pasos

¿Quieres que empiece por **Sprint 1** (tipos + schema + modelos + mock + endpoints) o prefieres ajustar algo del alcance primero?
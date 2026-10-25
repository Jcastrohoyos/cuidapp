import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ReglaAlerta extends Model {
  static table = 'reglas_alerta';

  static associations = {
    perfiles: { type: 'belongs_to' as const, key: 'perfil_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('nombre') nombre!: string;
  @field('tipo') tipo!: string;
  @json('condicion', (v: any) => v ?? {}) condicion!: Record<string, any>;
  @json('accion', (v: any) => v ?? {}) accion!: Record<string, any>;
  @json('escalado', (v: any) => v ?? null) escalado?: Record<string, any> | null;
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
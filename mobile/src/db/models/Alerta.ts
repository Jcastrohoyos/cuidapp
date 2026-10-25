import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Alerta extends Model {
  static table = 'alertas';

  static associations = {
    perfiles: { type: 'belongs_to' as const, key: 'perfil_id' },
    reglas_alerta: { type: 'belongs_to' as const, key: 'regla_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('tipo') tipo!: string;
  @field('prioridad') prioridad!: string;
  @field('titulo') titulo!: string;
  @field('mensaje') mensaje!: string;
  @field('fecha_hora') fechaHoraRaw!: number;
  @field('leida') leida!: boolean;
  @field('descartada') descartada!: boolean;
  @json('accion', (v: any) => v ?? {}) accion!: Record<string, any> | null;
  @field('regla_id') reglaId?: string;
  @field('escalada') escalada!: boolean;
  @field('nivel_escalado_actual') nivelEscaladoActual!: number;
  @field('leida_en') leidaEnRaw?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get fechaHora(): Date { return new Date(this.fechaHoraRaw); }
  get leidaEn(): Date | undefined { return this.leidaEnRaw ? new Date(this.leidaEnRaw) : undefined; }
}
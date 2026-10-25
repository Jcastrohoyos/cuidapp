import Model from '@nozbe/watermelondb/Model';
import { field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ConfigNotificaciones extends Model {
  static table = 'config_notificaciones';

  @field('clave') clave!: string; // 'global' | 'perfil_<id>'
  @json('valor', (v: any) => v ?? {}) valor!: Record<string, any>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
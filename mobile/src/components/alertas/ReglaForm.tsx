import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Text } from '@/components/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '@/components/ui/section-header';
import { Stepper } from '@/components/ui/stepper';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/api/endpoints';
import type { ReglaAlerta, ReglaCondicion, ReglaAccion, ConfigEscalado, NivelEscalado, PrioridadAlerta, TipoRegla, AccionAlerta } from '@/types';

const PASOS = [
  { id: 'tipo', titulo: 'Tipo', icono: '📋' },
  { id: 'condicion', titulo: 'Condición', icono: '🔧' },
  { id: 'accion', titulo: 'Acción', icono: '⚡' },
  { id: 'escalado', titulo: 'Escalado', icono: '⬆️' },
  { id: 'resumen', titulo: 'Resumen', icono: '✅' },
];

const TIPOS_REGLA: { value: TipoRegla; label: string; descripcion: string; icono: string }[] = [
  { value: 'medicacion', label: 'Medicación', descripcion: 'Recordatorio de toma de medicamentos', icono: '💊' },
  { value: 'signos_vitales', label: 'Signos vitales', descripcion: 'Alerta si valor supera umbral', icono: '📊' },
  { value: 'cita', label: 'Cita médica', descripcion: 'Recordatorios previos a una cita', icono: '📅' },
  { value: 'recordatorio', label: 'Recordatorio', descripcion: 'Alarma personalizable recurrente', icono: '🔔' },
  { value: 'personalizada', label: 'Personalizada', descripcion: 'Configuración avanzada (próximamente)', icono: '⚙️' },
];

const PRIORIDADES: { value: PrioridadAlerta; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: '#6B7280' },
  { value: 'media', label: 'Media', color: '#3B82F6' },
  { value: 'alta', label: 'Alta', color: '#F59E0B' },
  { value: 'critica', label: 'Crítica', color: '#EF4444' },
];

const ACCIONES_TIPO: { value: Exclude<AccionAlerta['tipo'], undefined>; label: string; descripcion: string }[] = [
  { value: 'abrir_tarea', label: 'Abrir tarea', descripcion: 'Navega a la rutina con tarea específica' },
  { value: 'abrir_incidencia', label: 'Abrir incidencia', descripcion: 'Ver detalles de una incidencia' },
  { value: 'llamar', label: 'Llamar', descripcion: 'Abre el marcador telefónico' },
  { value: 'url', label: 'Abrir enlace', descripcion: 'Abre una URL en el navegador' },
  { value: 'registrar_valor', label: 'Registrar valor', descripcion: 'Formulario para signos vitales' },
];

export interface ReglaFormProps {
  regla?: ReglaAlerta;
  perfilId: string;
  onGuardar: (regla: Partial<ReglaAlerta>) => Promise<void>;
  onCancelar: () => void;
}

export function ReglaForm({ regla, perfilId, onGuardar, onCancelar }: ReglaFormProps) {
  const theme = useTheme();
  const toast = useToast();
  const [pasoActual, setPasoActual] = useState(0);
  const [cargando, setCargando] = useState(false);

  const [tipo, setTipo] = useState<TipoRegla>(regla?.tipo || 'medicacion');
  const [nombre, setNombre] = useState(regla?.nombre || '');
  const [activa, setActiva] = useState(regla?.activa ?? true);
  const [condicion, setCondicion] = useState<ReglaCondicion>(regla?.condicion || {});
  const [accion, setAccion] = useState<ReglaAccion>(regla?.accion || { crearAlerta: true, prioridadAlerta: 'media', tituloPlantilla: '', mensajePlantilla: '' });
  const [escalado, setEscalado] = useState<ConfigEscalado | undefined>(regla?.escalado);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const puedeAvanzar = useCallback(() => {
    const nuevosErrores: Record<string, string> = {};
    switch (pasoActual) {
      case 0:
        if (!tipo) nuevosErrores.tipo = 'Selecciona un tipo';
        if (!nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
        break;
      case 1:
        if (tipo === 'medicacion' || tipo === 'recordatorio') {
          if (!condicion.hora && !condicion.horasEntreTomas) nuevosErrores.condicion = 'Define hora fija o intervalo';
        }
        if (tipo === 'signos_vitales') {
          if (!condicion.tipoValor || !condicion.operador || condicion.umbral === undefined) nuevosErrores.condicion = 'Completa tipo, operador y umbral';
        }
        if (tipo === 'cita') {
          if (!condicion.fechaCita || !condicion.recordatoriosPrevios?.length) nuevosErrores.condicion = 'Define fecha y recordatorios';
        }
        break;
      case 2:
        if (!accion.tituloPlantilla.trim()) nuevosErrores.titulo = 'Título obligatorio';
        if (!accion.mensajePlantilla.trim()) nuevosErrores.mensaje = 'Mensaje obligatorio';
        break;
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }, [pasoActual, tipo, nombre, condicion, accion]);

  const handleGuardar = useCallback(async () => {
    setCargando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), tipo, condicion, accion, escalado, activa });
      toast.exito(regla ? 'Regla actualizada' : 'Regla creada');
      onCancelar();
    } catch (e) { console.error('[ReglaForm] Error guardando:', e); toast.error('No se pudo guardar la regla'); }
    finally { setCargando(false); }
  }, [tipo, nombre, condicion, accion, escalado, activa, onGuardar, onCancelar, toast]);

  const handleSiguiente = useCallback(async () => {
    if (puedeAvanzar()) {
      if (pasoActual < PASOS.length - 1) setPasoActual(p => p + 1);
      else await handleGuardar();
    } else toast.error('Completa los campos requeridos');
  }, [pasoActual, puedeAvanzar, toast]);

  const handleAnterior = useCallback(() => { if (pasoActual > 0) setPasoActual(p => p - 1); }, [pasoActual]);

  const renderPaso = () => {
    switch (pasoActual) {
      case 0: return renderPasoTipo();
      case 1: return renderPasoCondicion();
      case 2: return renderPasoAccion();
      case 3: return renderPasoEscalado();
      case 4: return renderPasoResumen();
      default: return null;
    }
  };

  const renderPasoTipo = () => (
    <View style={styles.paso}>
      <SectionHeader titulo="Tipo de regla">
        <ThemedText style={styles.ayuda}>El tipo determina cómo se evalúa la condición</ThemedText>
      </SectionHeader>
      <View style={styles.tiposGrid}>
        {TIPOS_REGLA.map(t => (
          <Pressable key={t.value} style={[styles.tipoCard, tipo === t.value && styles.tipoCardSelected]} onPress={() => setTipo(t.value)} hitSlop={8}>
            <ThemedText style={styles.tipoIcon}>{t.icono}</ThemedText>
            <ThemedText style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelSelected]}>{t.label}</ThemedText>
            <ThemedText style={[styles.tipoDesc, tipo === t.value && styles.tipoDescSelected]}>{t.descripcion}</ThemedText>
          </Pressable>
        ))}
      </View>
      {errores.nombre && <ThemedText style={styles.error}>{errores.nombre}</ThemedText>}
      <Input label="Nombre de la regla" placeholder="Ej: Insulina mañana, Control glucosa, Cita cardiólogo" value={nombre} onChangeText={setNombre} error={errores.nombre} autoFocus />
    </View>
  );

  const obtenerDescripcionCondicion = (): string => {
    switch (tipo) { case 'medicacion': return 'Define cuándo debe tomarse el medicamento'; case 'signos_vitales': return 'Configura el umbral que disparará la alerta'; case 'cita': return 'Establece la fecha y recordatorios previos'; case 'recordatorio': return 'Programa una alarma recurrente'; default: return 'Configuración avanzada'; }
  };

  const renderPasoCondicion = () => (
    <View style={styles.paso}>
      <SectionHeader titulo="Condición"><ThemedText style={styles.ayuda}>{obtenerDescripcionCondicion()}</ThemedText></SectionHeader>
      {errores.condicion && <ThemedText style={styles.error}>{errores.condicion}</ThemedText>}
      {tipo === 'medicacion' && renderCondicionMedicacion()}
      {tipo === 'signos_vitales' && renderCondicionSignosVitales()}
      {tipo === 'cita' && renderCondicionCita()}
      {tipo === 'recordatorio' && renderCondicionRecordatorio()}
      {tipo === 'personalizada' && <ThemedText style={styles.ayuda}>Próximamente: expresiones cron personalizadas</ThemedText>}
    </View>
  );

  const renderCondicionMedicacion = () => (
    <View style={styles.condicionGroup}>
      <ThemedText style={styles.subLabel}>Modo</ThemedText>
      <View style={styles.radioGroup}>
        <Pressable style={[styles.radio, condicion.horasEntreTomas ? styles.radioActive : null]} onPress={() => setCondicion({ ...condicion, hora: undefined, horasEntreTomas: 8 })}>
          <ThemedText style={[styles.radioLabel, condicion.horasEntreTomas ? styles.radioLabelActive : null]}>Cada N horas</ThemedText>
        </Pressable>
        <Pressable style={[styles.radio, condicion.hora && !condicion.horasEntreTomas ? styles.radioActive : null]} onPress={() => setCondicion({ ...condicion, horasEntreTomas: undefined, hora: '09:00' })}>
          <ThemedText style={[styles.radioLabel, condicion.hora && !condicion.horasEntreTomas ? styles.radioLabelActive : null]}>Hora fija diaria</ThemedText>
        </Pressable>
      </View>
      {condicion.horasEntreTomas && (
        <View style={styles.inputRow}>
          <Input label="Horas entre tomas" type="numeric" value={String(condicion.horasEntreTomas)} onChangeText={v => setCondicion({ ...condicion, horasEntreTomas: parseInt(v) || 1 })} min={1} max={24} />
          <Select label="Días de la semana" value={condicion.diasSemana ? condicion.diasSemana.join(',') : ''} options={[{value:'1,2,3,4,5',label:'Lunes a Viernes'},{value:'1,2,3,4,5,6,7',label:'Todos los días'},{value:'6,7',label:'Solo fines de semana'}]} onChange={v => setCondicion({ ...condicion, diasSemana: v.split(',').map(Number) })} />
        </View>
      )}
      {condicion.hora && !condicion.horasEntreTomas && <Input label="Hora (HH:MM, 24h)" type="time" value={condicion.hora} onChangeText={v => setCondicion({ ...condicion, hora: v })} />}
      <View style={styles.inputRow}><Select label="Días de la semana" value={condicion.diasSemana ? condicion.diasSemana.join(',') : '1,2,3,4,5,6,7'} options={[{value:'1,2,3,4,5',label:'Lunes a Viernes'},{value:'1,2,3,4,5,6,7',label:'Todos los días'},{value:'6,7',label:'Solo fines de semana'}]} onChange={v => setCondicion({ ...condicion, diasSemana: v.split(',').map(Number) })} /></View>
    </View>
  );

  const renderCondicionSignosVitales = () => (
    <View style={styles.condicionGroup}>
      <View style={styles.inputRow}>
        <Select label="Signo vital" value={condicion.tipoValor || ''} options={[{value:'tension_sistolica',label:'Tensión sistólica (mmHg)'},{value:'tension_diastolica',label:'Tensión diastólica (mmHg)'},{value:'glucosa',label:'Glucosa (mg/dL)'},{value:'temperatura',label:'Temperatura (°C)'},{value:'peso',label:'Peso (kg)'},{value:'saturacion',label:'Saturación O₂ (%)'}]} onChange={v => setCondicion({ ...condicion, tipoValor: v as ReglaCondicion['tipoValor'] })} error={!condicion.tipoValor ? 'Selecciona un signo' : undefined} />
        <Select label="Operador" value={condicion.operador || ''} options={[{value:'>',label:'Mayor que (> )'},{value:'>=',label:'Mayor o igual (>=)'},{value:'<',label:'Menor que (<)'},{value:'<=',label:'Menor o igual (<=)'},{value:'==',label:'Igual (==)'}]} onChange={v => setCondicion({ ...condicion, operador: v as ReglaCondicion['operador'] })} error={!condicion.operador ? 'Selecciona operador' : undefined} />
      </View>
      <Input label="Umbral" type="numeric" placeholder="Ej: 140, 38, 180..." value={condicion.umbral !== undefined ? String(condicion.umbral) : ''} onChangeText={v => setCondicion({ ...condicion, umbral: parseFloat(v) })} error={condicion.umbral === undefined ? 'Introduce un valor numérico' : undefined} />
    </View>
  );

  const renderCondicionCita = () => (
    <View style={styles.condicionGroup}>
      <Input label="Fecha de la cita (YYYY-MM-DD)" type="date" value={condicion.fechaCita || ''} onChangeText={v => setCondicion({ ...condicion, fechaCita: v })} error={!condicion.fechaCita ? 'Fecha obligatoria' : undefined} />
      <ThemedText style={styles.subLabel}>Recordatorios previos (minutos antes)</ThemedText>
      <View style={styles.recordatoriosContainer}>
        {(condicion.recordatoriosPrevios || [1440, 60, 15]).map((min, i) => (
          <View key={i} style={styles.recordatorioRow}>
            <Input type="numeric" placeholder="Minutos" value={String(min)} onChangeText={v => { const arr = [...(condicion.recordatoriosPrevios || [])]; arr[i] = parseInt(v) || 0; setCondicion({ ...condicion, recordatoriosPrevios: arr }); }} style={styles.recordatorioInput} />
            <ThemedText style={styles.recordatorioLabel}>{formatearMinutos(min)}</ThemedText>
          </View>
        ))}
        <Pressable style={styles.addButton} onPress={() => setCondicion({ ...condicion, recordatoriosPrevios: [...(condicion.recordatoriosPrevios || []), 15] })}><ThemedText style={styles.addButtonText}>+ Añadir recordatorio</ThemedText></Pressable>
      </View>
    </View>
  );

  const renderCondicionRecordatorio = () => (
    <View style={styles.condicionGroup}>
      <View style={styles.radioGroup}>
        <Pressable style={[styles.radio, condicion.horasEntreTomas ? styles.radioActive : null]} onPress={() => setCondicion({ ...condicion, hora: undefined, horasEntreTomas: 24 })}><ThemedText style={[styles.radioLabel, condicion.horasEntreTomas ? styles.radioLabelActive : null]}>Cada N horas</ThemedText></Pressable>
        <Pressable style={[styles.radio, condicion.hora && !condicion.horasEntreTomas ? styles.radioActive : null]} onPress={() => setCondicion({ ...condicion, horasEntreTomas: undefined, hora: '09:00' })}><ThemedText style={[styles.radioLabel, condicion.hora && !condicion.horasEntreTomas ? styles.radioLabelActive : null]}>Hora fija</ThemedText></Pressable>
        <Pressable style={[styles.radio, condicion.cron ? styles.radioActive : null]} onPress={() => Alert.alert('Próximamente', 'Expresiones cron en v2')}><ThemedText style={[styles.radioLabel, condicion.cron ? styles.radioLabelActive : null]}>Expresión cron</ThemedText></Pressable>
      </View>
      {condicion.horasEntreTomas && <Input label="Horas" type="numeric" value={String(condicion.horasEntreTomas)} onChangeText={v => setCondicion({ ...condicion, horasEntreTomas: parseInt(v) || 1 })} min={1} max={168} />}
      {condicion.hora && !condicion.horasEntreTomas && <Input label="Hora (HH:MM)" type="time" value={condicion.hora} onChangeText={v => setCondicion({ ...condicion, hora: v })} />}
      <Select label="Días" value={condicion.diasSemana ? condicion.diasSemana.join(',') : '1,2,3,4,5,6,7'} options={[{value:'1,2,3,4,5',label:'Lunes a Viernes'},{value:'1,2,3,4,5,6,7',label:'Todos los días'},{value:'6,7',label:'Solo fines de semana'}]} onChange={v => setCondicion({ ...condicion, diasSemana: v.split(',').map(Number) })} />
    </View>
  );

  const renderPasoAccion = () => (
    <View style={styles.paso}>
      <SectionHeader titulo="Acción"><ThemedText style={styles.ayuda}>Qué ocurre al dispararse la alerta</ThemedText></SectionHeader>
      {errores.titulo && <ThemedText style={styles.error}>{errores.titulo}</ThemedText>}
      {errores.mensaje && <ThemedText style={styles.error}>{errores.mensaje}</ThemedText>}
      <Input label="Título de la alerta" placeholder="Ej: Hora de {medicamento}, {tipoValor} alto" value={accion.tituloPlantilla} onChangeText={v => setAccion({ ...accion, tituloPlantilla: v })} error={errores.titulo} />
      <Input label="Mensaje" placeholder="Ej: Toca tomar {dosis} de {medicamento}. Valor actual: {valorActual}" value={accion.mensajePlantilla} onChangeText={v => setAccion({ ...accion, mensajePlantilla: v })} error={errores.mensaje} multiline numberOfLines={3} />
      <ThemedText style={styles.subLabel}>Prioridad de la alerta</ThemedText>
      <View style={styles.prioridadGrid}>{PRIORIDADES.map(p => (<Pressable key={p.value} style={[styles.prioridadCard, accion.prioridadAlerta === p.value && styles.prioridadCardSelected, { borderColor: p.color }]} onPress={() => setAccion({ ...accion, prioridadAlerta: p.value })}><View style={[styles.prioridadDot, { backgroundColor: p.color }]} /><ThemedText style={[styles.prioridadLabel, accion.prioridadAlerta === p.value && styles.prioridadLabelSelected]}>{p.label}</ThemedText></Pressable>))}</View>
      <ThemedText style={styles.subLabel}>Acción al tocar notificación</ThemedText>
      <Select label="Tipo de acción" value={accion.accion?.tipo || ''} options={ACCIONES_TIPO.map(a => ({ value: a.value, label: a.label }))} onChange={v => setAccion({ ...accion, accion: { ...accion.accion, tipo: v as AccionAlerta['tipo'], valor: accion.accion?.valor || '' } })} placeholder="Ninguna (solo notificación)" />
      {accion.accion?.tipo === 'url' && <Input label="URL" placeholder="https://ejemplo.com" value={accion.accion?.valor || ''} onChangeText={v => setAccion({ ...accion, accion: { ...accion.accion, valor: v } })} />}
      {accion.accion?.tipo === 'llamar' && <Input label="Teléfono" placeholder="+34 600 000 000" value={accion.accion?.valor || ''} onChangeText={v => setAccion({ ...accion, accion: { ...accion.accion, valor: v } })} type="phone-pad" />}
      {accion.accion?.tipo === 'abrir_tarea' && <Input label="ID de tarea" placeholder="task_123" value={accion.accion?.valor || ''} onChangeText={v => setAccion({ ...accion, accion: { ...accion.accion, valor: v } })} />}
      {accion.accion?.tipo === 'registrar_valor' && <Select label="Tipo de valor a registrar" value={accion.accion?.valor || ''} options={[{value:'tension',label:'Tensión arterial'},{value:'glucosa',label:'Glucosa'},{value:'temperatura',label:'Temperatura'},{value:'peso',label:'Peso'},{value:'saturacion',label:'Saturación O₂'}]} onChange={v => setAccion({ ...accion, accion: { ...accion.accion, valor: v } })} />}
      <View style={styles.checkboxRow}><Switch value={accion.crearTarea ?? false} onValueChange={v => setAccion({ ...accion, crearTarea: v })} /><ThemedText style={styles.checkboxLabel}>Crear tarea en rutina automáticamente</ThemedText></View>
      {accion.crearTarea && <ThemedText style={styles.ayuda}>Se creará una tarea diaria con la hora de la alerta</ThemedText>}
    </View>
  );

  const renderPasoEscalado = () => (
    <View style={styles.paso}>
      <SectionHeader titulo="Escalado automático"><ThemedText style={styles.ayuda}>Opcional: si se configura, la alerta subirá de nivel si no se lee</ThemedText></SectionHeader>
      <View style={styles.checkboxRow}><Switch value={!!escalado} onValueChange={v => setEscalado(v ? { niveles: [], tiempoMaximoSinRespuesta: 30 } : undefined)} /><ThemedText style={styles.checkboxLabel}>Activar escalado</ThemedText></View>
      {escalado && (
        <>
          <Input label="Tiempo máximo sin respuesta (minutos)" type="numeric" value={String(escalado.tiempoMaximoSinRespuesta)} onChangeText={v => { const val = parseInt(v) || 30; setEscalado({ ...escalado, tiempoMaximoSinRespuesta: val }); }} min={1} max={1440} />
          <SectionHeader titulo="Niveles de escalado"><ThemedText style={styles.ayuda}>Se ejecutan en orden si no hay respuesta. Arrastra para reordenar (próximamente).</ThemedText></SectionHeader>
          {escalado.niveles.map((nivel, index) => (
            <Card key={index} style={styles.nivelCard}>
              <View style={styles.nivelHeader}><ThemedText style={styles.nivelNumero}>Nivel {nivel.orden}</ThemedText><Pressable style={styles.deleteButton} onPress={() => { const nuevos = escalado.niveles.filter((_, i) => i !== index); setEscalado({ ...escalado, niveles: nuevos }); }} disabled={escalado.niveles.length <= 1}><ThemedText style={styles.deleteText}>Eliminar</ThemedText></Pressable></View>
              <View style={styles.inputRow}><Select label="Tipo" value={nivel.tipo} options={[{value:'push_local',label:'Push local (mismo dispositivo)'},{value:'push_familia',label:'Push a familia (futuro)'},{value:'contacto_emergencia',label:'Contacto de emergencia'},{value:'sms',label:'SMS (requiere Twilio)'},{value:'llamada',label:'Llamada (requiere Twilio)'}]} onChange={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], tipo: v as NivelEscalado['tipo'] }; setEscalado({ ...escalado, niveles: nuevos }); }} /><Select label="Destinatario" value={nivel.destinatario} options={[{value:'familia',label:'Familia'},{value:'cuidador',label:'Cuidador'},{value:'contacto_emergencia',label:'Contacto emergencia'},{value:'telefono_personalizado',label:'Teléfono personalizado'}]} onChange={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], destinatario: v as NivelEscalado['destinatario'] }; setEscalado({ ...escalado, niveles: nuevos }); }} /></View>
              {nivel.destinatario === 'telefono_personalizado' && <Input label="Teléfono" placeholder="+34 600 000 000" value={nivel.telefono || ''} onChangeText={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], telefono: v }; setEscalado({ ...escalado, niveles: nuevos }); }} type="phone-pad" />}
              <View style={styles.inputRow}><Input label="Retraso (minutos)" type="numeric" value={String(nivel.retrasoMinutos)} onChangeText={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], retrasoMinutos: parseInt(v) || 0 }; setEscalado({ ...escalado, niveles: nuevos }); }} min={0} max={1440} /><Switch label="Requiere confirmación" value={nivel.requiereConfirmacion} onValueChange={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], requiereConfirmacion: v }; setEscalado({ ...escalado, niveles: nuevos }); }} /></View>
              <Input label="Plantilla de mensaje" placeholder="ALERTA: {titulo} - {mensaje}" value={nivel.mensajePlantilla} onChangeText={v => { const nuevos = [...escalado.niveles]; nuevos[index] = { ...nuevos[index], mensajePlantilla: v }; setEscalado({ ...escalado, niveles: nuevos }); }} />
              <ThemedText style={styles.variablesAyuda}>Variables disponibles: titulo, mensaje, prioridad, fechaHora</ThemedText>
            </Card>
          ))}
          <Pressable style={styles.addButton} onPress={() => setEscalado({ ...escalado!, niveles: [...escalado!.niveles, { orden: escalado!.niveles.length + 1, tipo: 'push_local', destinatario: 'familia', mensajePlantilla: 'ALERTA: {titulo} - {mensaje}', retrasoMinutos: 30, requiereConfirmacion: false }] })}><ThemedText style={styles.addButtonText}>+ Añadir nivel de escalado</ThemedText></Pressable>
          <ThemedText style={styles.ayuda}>{escalado.niveles.length} nivel{escalado.niveles.length !== 1 ? 'es' : ''} configurado{escalado.niveles.length !== 1 ? 's' : ''}. Tiempo total máximo: {escalado.niveles.reduce((sum, n) => sum + n.retrasoMinutos, 0)} min.</ThemedText>
        </>
      )}
    </View>
  );

  const renderPasoResumen = () => (
    <View style={styles.paso}>
      <SectionHeader titulo="Resumen"><ThemedText style={styles.ayuda}>Revisa la configuración antes de guardar</ThemedText></SectionHeader>
      <Card style={styles.resumenCard}>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Nombre</ThemedText><ThemedText style={styles.resumenValor}>{nombre}</ThemedText></View>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Tipo</ThemedText><ThemedText style={styles.resumenValor}>{TIPOS_REGLA.find(t => t.value === tipo)?.label}</ThemedText></View>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Condición</ThemedText><ThemedText style={styles.resumenValor}>{formatearCondicion(condicion, tipo)}</ThemedText></View>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Acción</ThemedText><ThemedText style={styles.resumenValor}>{accion.tituloPlantilla} / Prioridad: {accion.prioridadAlerta}</ThemedText></View>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Escalado</ThemedText><ThemedText style={styles.resumenValor}>{escalado ? `${escalado.niveles.length} niveles, ${escalado.tiempoMaximoSinRespuesta} min` : 'No configurado'}</ThemedText></View>
        <View style={styles.resumenRow}><ThemedText style={styles.resumenLabel}>Estado</ThemedText><ThemedText style={styles.resumenValor}>{activa ? 'Activa' : 'Inactiva'}</ThemedText></View>
      </Card>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={90}>
      <View style={styles.header}><ThemedText style={styles.headerTitle}>{regla ? 'Editar regla' : 'Nueva regla'}</ThemedText><Pressable onPress={onCancelar} hitSlop={16}><ThemedText style={styles.headerCancel}>Cancelar</ThemedText></Pressable></View>
      <Stepper steps={PASOS.map(p => p.titulo)} activeStep={pasoActual} onStepPress={setPasoActual} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>{renderPaso()}</ScrollView>
      <View style={styles.footer}>
        {pasoActual > 0 && <Button variante="ghost" onPress={handleAnterior} style={styles.botonAnterior} titulo="← Anterior" />}
        <Button onPress={handleSiguiente} disabled={cargando} cargando={cargando} style={styles.botonSiguiente} titulo={pasoActual === PASOS.length - 1 ? (regla ? 'Guardar cambios' : 'Crear regla') : 'Siguiente →'} />
      </View>
    </KeyboardAvoidingView>
  );
}

function formatearCondicion(cond: ReglaCondicion, tipo: TipoRegla): string {
  if (tipo === 'medicacion') { if (cond.horasEntreTomas) return `Cada ${cond.horasEntreTomas}h`; if (cond.hora) return `Diario a las ${cond.hora}`; return 'Sin configurar'; }
  if (tipo === 'signos_vitales') { if (cond.tipoValor && cond.operador && cond.umbral !== undefined) return `${cond.tipoValor} ${cond.operador} ${cond.umbral}`; return 'Sin configurar'; }
  if (tipo === 'cita') { if (cond.fechaCita) return `Cita: ${cond.fechaCita} (${cond.recordatoriosPrevios?.length || 0} recordatorios)`; return 'Sin configurar'; }
  if (tipo === 'recordatorio') { if (cond.horasEntreTomas) return `Cada ${cond.horasEntreTomas}h`; if (cond.hora) return `Diario a las ${cond.hora}`; return 'Sin configurar'; }
  return 'Personalizada';
}
function formatearMinutos(min: number): string { if (min >= 1440) return `${min / 1440} día${min > 1440 ? 's' : ''}`; if (min >= 60) return `${min / 60}h`; return `${min} min`; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: Color.gray200 },
  headerTitle: { fontFamily: fam(700), fontSize: FontSize.xl },
  headerCancel: { fontFamily: fam(500), fontSize: FontSize.base, color: Color.gray600 },
  scroll: { flex: 1 }, scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  paso: { gap: Spacing.four }, ayuda: { fontFamily: fam(400), fontSize: FontSize.sm, color: Color.gray500, marginBottom: Spacing.two },
  error: { fontFamily: fam(400), fontSize: FontSize.sm, color: Color.red500, marginBottom: Spacing.two },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tipoCard: { flex: 1, minWidth: 140, maxWidth: 160, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: 2, borderColor: Color.gray200, backgroundColor: '#fff', alignItems: 'center', gap: Spacing.one },
  tipoCardSelected: { borderColor: Color.teal600, backgroundColor: Color.teal50 },
  tipoIcon: { fontSize: 28 }, tipoLabel: { fontFamily: fam(600), fontSize: FontSize.sm, color: Color.gray700, textAlign: 'center' },
  tipoLabelSelected: { color: Color.teal700 }, tipoDesc: { fontFamily: fam(400), fontSize: FontSize.xs, color: Color.gray500, textAlign: 'center' },
  tipoDescSelected: { color: Color.teal600 },
  condicionGroup: { gap: Spacing.three }, subLabel: { fontFamily: fam(500), fontSize: FontSize.sm, color: Color.gray600, marginBottom: Spacing.one },
  inputRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  radio: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.full, borderWidth: 2, borderColor: Color.gray300, backgroundColor: '#fff', gap: Spacing.one },
  radioActive: { borderColor: Color.teal600, backgroundColor: Color.teal50 },
  radioLabel: { fontFamily: fam(500), fontSize: FontSize.sm, color: Color.gray700 },
  radioLabelActive: { color: Color.teal700 },
  recordatoriosContainer: { gap: Spacing.two },
  recordatorioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  recordatorioInput: { width: 80 }, recordatorioLabel: { fontFamily: fam(400), fontSize: FontSize.sm, color: Color.gray600, minWidth: 80 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: Color.gray400 },
  addButtonText: { fontFamily: fam(500), fontSize: FontSize.sm, color: Color.teal600 },
  prioridadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  prioridadCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.full, borderWidth: 2, borderColor: Color.gray300, backgroundColor: '#fff', gap: Spacing.one },
  prioridadCardSelected: { borderWidth: 2 },
  prioridadDot: { width: 10, height: 10, borderRadius: 5 },
  prioridadLabel: { fontFamily: fam(500), fontSize: FontSize.sm, color: Color.gray700 },
  prioridadLabelSelected: { color: Color.teal700, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkboxLabel: { fontFamily: fam(400), fontSize: FontSize.sm, color: Color.gray700, flex: 1 },
  nivelCard: { marginBottom: Spacing.three, gap: Spacing.two },
  nivelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivelNumero: { fontFamily: fam(700), fontSize: FontSize.base, color: Color.teal700 },
  deleteButton: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, borderRadius: Radius.sm, backgroundColor: Color.red50 },
  deleteText: { fontFamily: fam(600), fontSize: FontSize.xs, color: Color.red600 },
  resumenCard: { gap: Spacing.two },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.one, borderBottomWidth: 1, borderBottomColor: Color.gray100 },
  resumenLabel: { fontFamily: fam(500), fontSize: FontSize.sm, color: Color.gray600 },
  resumenValor: { fontFamily: fam(400), fontSize: FontSize.sm, color: Color.gray900, textAlign: 'right', flex: 1, marginLeft: Spacing.three },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderTopWidth: 1, borderTopColor: Color.gray200, backgroundColor: '#fff', gap: Spacing.three },
  botonAnterior: { flex: 1 }, botonSiguiente: { flex: 1 },
  variablesAyuda: { fontFamily: fam(400), fontSize: FontSize.xs, color: Color.gray500, marginTop: 4 },
});
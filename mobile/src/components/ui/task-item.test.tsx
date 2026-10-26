import { fireEvent, render } from '@testing-library/react-native';

import { TareaItem } from './task-item';
import type { Tarea } from '@/types';

const tarea: Tarea = {
  id: 'tar_1',
  perfilId: 'per_1',
  nombre: 'Medicación',
  momento: 'manana',
  hora: '09:00',
  personalizada: false,
  repeticion: 'diaria',
};

// TLRN v14: render es asíncrono
describe('TareaItem', () => {
  it('muestra la tarea como pendiente y permite completarla', async () => {
    const onToggle = jest.fn();
    const { getByText, getByRole } = await render(
      <TareaItem tarea={tarea} estado="pendiente" onToggle={onToggle} />,
    );

    expect(getByText('Medicación')).toBeOnTheScreen();
    expect(getByRole('checkbox', { checked: false })).toBeOnTheScreen();

    fireEvent.press(getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('refleja el estado realizada con accesibilidad marcada', async () => {
    const { getByRole } = await render(
      <TareaItem tarea={tarea} estado="realizada" onToggle={() => {}} />,
    );
    expect(getByRole('checkbox', { checked: true })).toBeOnTheScreen();
  });

  it('indica las incidencias en el texto de la fila', async () => {
    const { getByText } = await render(
      <TareaItem tarea={tarea} estado="incidencia" onToggle={() => {}} />,
    );
    expect(getByText(/incidencia/)).toBeOnTheScreen();
  });

  it('no pinta ✕ cuando la pantalla no pasa onEliminar (tareas fijas)', async () => {
    // En rutina.tsx solo se pasa onEliminar a tareas personalizadas; aquí se
    // verifica el contrato del componente: sin handler, no hay botón de borrar.
    const { queryByRole } = await render(
      <TareaItem tarea={tarea} estado="pendiente" onToggle={() => {}} />,
    );
    expect(queryByRole('button', { name: 'Eliminar Medicación de la rutina' })).toBeNull();
  });

  it('el ✕ de tarea personalizada llama a onEliminar', async () => {
    const onEliminar = jest.fn();
    const personalizada: Tarea = {
      ...tarea,
      id: 'tar_9',
      nombre: 'Poner la lavada',
      personalizada: true,
      repeticion: 'unica',
      fechaAplicacion: '2026-10-18',
    };
    const { getByRole, getByText } = await render(
      <TareaItem
        tarea={personalizada}
        estado="pendiente"
        onToggle={() => {}}
        onEliminar={onEliminar}
      />,
    );

    // Etiqueta "solo hoy" visible en la meta de la fila.
    expect(getByText(/solo hoy/)).toBeOnTheScreen();

    fireEvent.press(getByRole('button', { name: 'Eliminar Poner la lavada de la rutina' }));
    expect(onEliminar).toHaveBeenCalledTimes(1);
  });
});

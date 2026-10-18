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
});

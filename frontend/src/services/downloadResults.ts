import type { ArenaView } from '../../../shared/live';

function cell(value: string | number) {
  if (typeof value === 'number') return String(value);
  const safe = /^[\s\uFEFF]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function downloadResults(view: ArenaView) {
  if (!view.host || view.phase !== 'finished' || !view.summary) return;
  const scores = new Map(view.summary.map(({ id, correct }) => [id, correct]));
  const header = ['Apodo', 'Aciertos', 'Preguntas', 'Porcentaje académico', 'Puntos', 'Puesto'];
  const rows = view.players.flatMap(player => {
    const correct = scores.get(player.id);
    if (correct === undefined) return [];
    const percent = view.total > 0 ? Math.round(100 * correct / view.total) : 0;
    return [[player.nickname, correct, view.total, percent, player.score, player.rank]];
  });
  const csv = [header, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv, '\r\n'], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `chaosarena-resultados-${view.pin}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

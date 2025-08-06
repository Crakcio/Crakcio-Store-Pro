import { supabase } from '../supabaseClient.js';

export async function guardarPuntaje(usuario_id, nombre_juego, puntaje) {
  if (!usuario_id) return;

  // Verifica si ya existe un puntaje mayor para este usuario y juego
  const { data: existente } = await supabase
    .from('ranking_juegos')
    .select('puntaje')
    .eq('usuario_id', usuario_id)
    .eq('nombre_juego', nombre_juego)
    .single();

  if (existente && existente.puntaje >= puntaje) {
    return; // No se guarda si el nuevo puntaje no supera el anterior
  }

  // Si es mayor, actualiza o inserta
  await supabase
    .from('ranking_juegos')
    .upsert([
      { usuario_id, nombre_juego, puntaje }
    ]);
}

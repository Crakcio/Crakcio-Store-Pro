import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('perfil-form');
  const cerrarSesionBtn = document.getElementById('cerrar-sesion');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert('No estás autenticado');
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;

  // Cargar datos del usuario
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !usuario) {
    alert('Error al cargar tu perfil');
    return;
  }

  form.nombre.value = usuario.nombre;
  form.telefono.value = usuario.telefono;
  form.direccion.value = usuario.direccion;

  // Guardar cambios
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        nombre: form.nombre.value,
        telefono: form.telefono.value,
        direccion: form.direccion.value,
      })
      .eq('id', userId);

    if (updateError) {
      alert('Error al guardar los cambios');
    } else {
      alert('Perfil actualizado con éxito');
    }
  });

  // Cerrar sesión
  cerrarSesionBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
});

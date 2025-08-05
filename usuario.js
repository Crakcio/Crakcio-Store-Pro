import { supabase } from './supabaseClient.js';

async function mostrarNombreUsuario() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', userId)
    .single();

  if (error) return;

  const div = document.getElementById('usuario-info');
  div.textContent = `Hola, ${usuario.nombre}`;
  div.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', mostrarNombreUsuario);


document.addEventListener('DOMContentLoaded', () => {
  const cerrarSesionBtn = document.getElementById('cerrar-sesion');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Error al cerrar sesión');
        return;
      }

      // Limpiar datos locales y redirigir
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
});


import { supabase } from './supabaseClient.js';

const form = document.getElementById('login-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = form.email.value;
  const password = form.password.value;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
    return;
  }

  const user = authData.user;
  if (!user) {
    alert('No se pudo obtener el usuario.');
    return;
  }

  // Consultar datos adicionales del usuario
  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('nombre, telefono, direccion')
    .eq('id', user.id)
    .single();

  if (usuarioError) {
    console.error('Error al obtener datos del usuario:', usuarioError);
    alert('Error al validar datos del usuario.');
    return;
  }

  const { nombre, telefono, direccion } = usuario;

  alert('Bienvenido a Crakcio Store');

  if (nombre && telefono && direccion) {
    window.location.href = 'index.html';
  } else {
    window.location.href = 'perfil.html';
  }
});

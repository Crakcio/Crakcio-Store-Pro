import { supabase } from './supabaseClient.js';

const form = document.getElementById('registro-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = form.email.value;
  const password = form.password.value;
  const nombre = form.nombre.value;
  const telefono = form.telefono.value;
  const direccion = form.direccion.value;

  // Paso 1: Crear cuenta en Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    alert('Error al registrarse: ' + signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    alert('No se pudo registrar correctamente. Intenta de nuevo.');
    return;
  }

  // 🕒 Esperar hasta que la sesión esté activa
  let sessionReady = false;
  let tries = 0;
  let session = null;

  while (!sessionReady && tries < 5) {
    const { data } = await supabase.auth.getSession();
    session = data.session;
    if (session) {
      sessionReady = true;
    } else {
      await new Promise(res => setTimeout(res, 500)); // esperar medio segundo
      tries++;
    }
  }

  if (!sessionReady) {
    alert('No se pudo activar la sesión. Intenta iniciar sesión manualmente.');
    return;
  }

  // Paso 2: Insertar en tabla usuarios
  const { error: insertError } = await supabase
    .from('usuarios')
    .insert([
      {
        id: user.id,
        nombre,
        telefono,
        direccion
      }
    ]);

  if (insertError) {
    alert('Error al guardar datos adicionales: ' + insertError.message);
  } else {
    alert('Registro exitoso.');
    window.location.href = 'login.html';
  }
});

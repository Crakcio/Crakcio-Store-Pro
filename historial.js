import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Estilo activo
  const { data: config } = await supabase
    .from('configuracion_tienda')
    .select('estilo_activo')
    .single();

  document.getElementById('estilo-activo').href = config?.estilo_activo === 'B' ? 'estiloB.css' : 'estiloA.css';

  // Validar sesión
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    alert('Debes iniciar sesión para ver tu historial.');
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;

  // Obtener pedidos
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, fecha, estado')
    .eq('usuario_id', userId)
    .order('fecha', { ascending: false });

  if (error || !pedidos || pedidos.length === 0) {
    document.getElementById('historial-container').innerHTML = '<p>No tienes pedidos registrados.</p>';
    return;
  }

  // Mostrar pedidos y sus productos
  const historialContainer = document.getElementById('historial-container');

  for (const pedido of pedidos) {
    const { data: detalles } = await supabase
      .from('detalle_pedido')
      .select('nombre, cantidad, precio')
      .eq('pedido_id', pedido.id);

    const div = document.createElement('div');
    div.classList.add('pedido');
    div.innerHTML = `
      <h3>🧾 Pedido #${pedido.id}</h3>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()}</p>
      <p><strong>Estado:</strong> ${pedido.estado}</p>
      <h4>Productos:</h4>
      ${detalles.map(p => `
        <div class="producto">
          ${p.nombre} × ${p.cantidad} — S/ ${(p.precio * p.cantidad).toFixed(2)}
        </div>
      `).join('')}
    `;
    historialContainer.appendChild(div);
  }
});


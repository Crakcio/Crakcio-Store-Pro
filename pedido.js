import { supabase } from './supabaseClient.js';
import { obtenerCarrito } from './carrito.js';

export async function guardarPedidoYDetalle(metodo_pago) {
  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    alert('Debes iniciar sesión.');
    return;
  }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

// Validación del perfil antes de continuar
if (!perfil?.nombre || !perfil?.direccion || !perfil?.telefono) {
  alert("Debes completar tu perfil antes de realizar una compra.");
  window.location.href = "perfil.html";
  return;
}

const pedido = {
  usuario_id: user.id,
  nombre: perfil.nombre,
  direccion: perfil.direccion,
  telefono: perfil.telefono,
  metodo_pago,
  estado: 'pendiente',
  fecha: new Date().toISOString(),
};


  const { data: nuevoPedido, error } = await supabase
    .from('pedidos')
    .insert([pedido])
    .select()
    .single();

  if (error) {
    alert('Error al registrar el pedido.');
    return;
  }

  const detalles = carrito.map(item => ({
    pedido_id: nuevoPedido.id,
    producto_id: item.id,
    cantidad: item.cantidad,
    precio_unitario: item.precio,
  }));

  // Guardar los detalles del pedido
await supabase.from('detalle_pedido').insert(detalles);

// Restar el stock de cada producto
for (const item of carrito) {
  // Primero obtenemos el stock actual
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('stock')
    .eq('id', item.id)
    .single();

  if (!errorProducto && producto && producto.stock >= item.cantidad) {
    const nuevoStock = producto.stock - item.cantidad;

    await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', item.id);
  } else {
    console.warn(`No se pudo actualizar stock del producto ${item.id}`);
  }
}

alert('Pedido registrado correctamente.');
localStorage.removeItem('carrito');
window.location.href = 'index.html';

}
async function validarPerfilCompleto() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .select('nombre, direccion, telefono')
    .eq('id', user.id)
    .single();

  if (errorUsuario || !usuario) return false;

  // Validamos que los 3 campos estén completos
  if (!usuario.nombre || !usuario.direccion || !usuario.telefono) {
    return false;
  }

  return true;
}

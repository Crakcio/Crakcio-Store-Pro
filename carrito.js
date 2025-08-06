// carrito.js (versión profesional como módulo ES)

import { supabase } from './supabaseClient.js';

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let metodoSeleccionado = '';

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

export function agregarAlCarrito(producto) {
  const existente = carrito.find(p => p.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push(producto);
  }
  guardarCarrito();
  mostrarCarrito();
  actualizarContadorCarrito();
}

export function agregarAlCarritoDesdeProducto(id, nombre, precio, imagen_url) {
  const existente = carrito.find(p => p.id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, imagen_url, cantidad: 1 });
  }
  guardarCarrito();
  mostrarCarrito();
  actualizarIconoCarrito();
}

export function mostrarCarrito() {
  const panel = document.getElementById('carrito-panel');
  if (!panel) return;

  panel.innerHTML = '<h3>🛒 Tu carrito</h3>';

  if (carrito.length === 0) {
    panel.innerHTML += '<p>El carrito está vacío.</p>';
    return;
  }

  carrito.forEach((item, index) => {
    panel.innerHTML += `
      <div class="item-carrito">
        <img src="${item.imagen_url}" width="50" />
        <span>${item.nombre} - S/ ${item.precio} x ${item.cantidad}</span>
        <div>
          <button data-restar-index="${index}">➖</button>
          <button data-quitar-index="${index}">❌</button>
        </div>
      </div>
    `;
  });

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  panel.innerHTML += `<p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>`;
  panel.innerHTML += `<button id="btn-comprar">Comprar</button>`;

  // Agregar eventos dinámicamente
  panel.querySelectorAll('[data-restar-index]').forEach(btn => {
    btn.addEventListener('click', () => restarProductoDelCarrito(+btn.dataset.restarIndex));
  });

  panel.querySelectorAll('[data-quitar-index]').forEach(btn => {
    btn.addEventListener('click', () => quitarDelCarrito(+btn.dataset.quitarIndex));
  });

  const btnComprar = document.getElementById('btn-comprar');
  if (btnComprar) {
    btnComprar.addEventListener('click', elegirMetodoPago);
  }
}

export function elegirMetodoPago() {
  const panel = document.getElementById('carrito-panel');
  if (!panel) return;

  panel.innerHTML = `
    <h3>Selecciona un método de pago</h3>
    <button id="pago-yape">Yape</button>
    <button id="pago-plin">Plin</button>
    <button id="pago-tarjeta">Tarjeta</button>
    <button id="volver-carrito">⬅️ Volver</button>
  `;

  document.getElementById('pago-yape')?.addEventListener('click', () => mostrarQR('yape'));
  document.getElementById('pago-plin')?.addEventListener('click', () => mostrarQR('plin'));
  document.getElementById('pago-tarjeta')?.addEventListener('click', iniciarPagoConTarjeta);
  document.getElementById('volver-carrito')?.addEventListener('click', mostrarCarrito);
}

export function mostrarQR(metodo) {
  metodoSeleccionado = metodo;
  const panel = document.getElementById('carrito-panel');
  if (!panel) return;

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const imagenQR = metodo === 'yape' ? 'images/yape-qr.jpeg' : 'images/plin-qr.jpeg';

  panel.innerHTML = `
    <h3>Paga con ${metodo === 'yape' ? 'Yape' : 'Plin'}</h3>
    <p>Total: S/ ${total.toFixed(2)}</p>
    <img src="${imagenQR}" style="width: 200px; margin: 20px 0;" />
    <p>Luego de pagar, haz clic en el botón para confirmar tu pedido:</p>
    <button id="confirmar-pago">✅ Ya pagué</button>
    <br/><br/>
    <button id="volver-carrito">⬅️ Volver</button>
  `;

  document.getElementById('confirmar-pago')?.addEventListener('click', confirmarCompra);
  document.getElementById('volver-carrito')?.addEventListener('click', mostrarCarrito);
}

export async function confirmarCompra() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    alert('Debes iniciar sesión para comprar.');
    window.location.href = 'login.html';
    return;
  }

  if (carrito.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('nombre, telefono, direccion')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil || !perfil.nombre || !perfil.telefono || !perfil.direccion) {
    alert('Debes completar tu perfil antes de comprar.');
    window.location.href = 'perfil.html';
    return;
  }

  const pedido = {
    usuario_id: user.id,
    nombre_cliente: perfil.nombre,
    telefono_cliente: perfil.telefono,
    direccion_cliente: perfil.direccion,
    estado: 'pendiente',
    fecha: new Date().toISOString(),
    metodo_pago: metodoSeleccionado
  };

  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([pedido])
    .select()
    .single();

  if (pedidoError || !pedidoData) {
    alert('Error al registrar el pedido.');
    return;
  }

  const pedidoId = pedidoData.id;
  const detalles = carrito.map(p => ({
    pedido_id: pedidoId,
    producto_id: p.id,
    cantidad: p.cantidad,
    precio_unitario: p.precio,
    nombre_producto: p.nombre
  }));

  const { error: detalleError } = await supabase
    .from('detalle_pedido')
    .insert(detalles);

  if (detalleError) {
    alert('Error al guardar productos.');
    return;
  }

  const resumen = carrito.map(p => `${p.cantidad} x ${p.nombre}`).join(', ');
  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const mensaje = `Hola, ya pagué con ${metodoSeleccionado}. Mi pedido es: ${resumen}. Total: S/ ${total.toFixed(2)}.`;

  carrito = [];
  localStorage.removeItem('carrito');

  const whatsappUrl = `https://wa.me/51999207025?text=${encodeURIComponent(mensaje)}`;
  window.location.href = whatsappUrl;
}

export function restarProductoDelCarrito(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad--;
  } else {
    carrito.splice(index, 1);
  }
  guardarCarrito();
  mostrarCarrito();
  actualizarContadorCarrito();
}

export function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  mostrarCarrito();
  actualizarContadorCarrito();
}

export function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
  actualizarContadorCarrito();
}

export async function verificarPerfilCompleto() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Debes iniciar sesión.');
    window.location.href = 'login.html';
    return false;
  }
  const { data: perfil, error } = await supabase
    .from('usuarios')
    .select('nombre, telefono, direccion')
    .eq('id', user.id)
    .single();
  if (error || !perfil?.nombre || !perfil?.telefono || !perfil?.direccion) {
    alert('Completa tu perfil.');
    window.location.href = 'perfil.html';
    return false;
  }
  return true;
}

export function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById('contador-carrito');
  if (contador) {
    contador.textContent = total > 0 ? total : '';
  }
}

export function actualizarIconoCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById('contador-carrito');
  if (contador) {
    contador.textContent = total > 0 ? total : '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarrito();
  actualizarIconoCarrito();
  mostrarCarrito();
});

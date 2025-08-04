import { supabase } from './supabaseClient.js';

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let metodoSeleccionado = '';
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(producto) {
  const existente = carrito.find(p => p.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push(producto);
  }
  guardarCarrito();
  mostrarCarrito();
}

function mostrarCarrito() {
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
          <button onclick="restarProductoDelCarrito(${index})">➖</button>
          <button onclick="quitarDelCarrito(${index})">❌</button>
        </div>
      </div>
    `;
  });

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  panel.innerHTML += `<p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>`;
  panel.innerHTML += `<button onclick="elegirMetodoPago()">Comprar</button>`;
}

function elegirMetodoPago() {
  const panel = document.getElementById('carrito-panel');
  panel.innerHTML = `
    <h3>Selecciona un método de pago</h3>    
    <button onclick="mostrarQR('yape')">Yape</button>
    <button onclick="mostrarQR('plin')">Plin</button>
    <button onclick="iniciarPagoConTarjeta()">Tarjeta</button>
    <button onclick="mostrarCarrito()">⬅️ Volver</button>
  `;
}

function mostrarQR(metodo) {
  metodoSeleccionado = metodo;

  const panel = document.getElementById('carrito-panel');
  if (!panel) return;

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const imagenQR = metodo === 'yape' ? 'images/yape-qr.jpeg' : 'images/plin-qr.jpeg';

  panel.innerHTML = `
    <h3>Paga con ${metodo === 'yape' ? 'Yape' : 'Plin'}</h3>
    <p>Total: S/ ${total.toFixed(2)}</p>
    <img id="qr-img" src="${imagenQR}" alt="QR de ${metodo}" style="width: 200px; margin: 20px 0;" />
    <p>Luego de pagar, haz clic en el botón para confirmar tu pedido:</p>
    <button onclick="confirmarCompra()">✅ Ya pagué</button>
    <br/><br/>
    <button onclick="mostrarCarrito()">⬅️ Volver</button>
  `;
}




async function confirmarCompra(metodo = 'otro') {
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

  // 👉 Crear el pedido
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
    console.log('Pedido insertado:', pedidoData); // 👈 Añade esta línea

const pedidoId = pedidoData.id;
  if (pedidoError || !pedidoData) {
    alert('Error al registrar el pedido.');
    console.error('PedidoError:', pedidoError);
    return;
  }

  

 const detalles = carrito.map(producto => ({
  pedido_id: pedidoId,
  producto_id: producto.id,
  cantidad: producto.cantidad,
  precio_unitario: producto.precio,
  nombre_producto: producto.nombre // 👈 agregar esto si tu tabla lo tiene
}));



  const { error: detalleError } = await supabase
    .from('detalle_pedido')
    .insert(detalles);

  if (detalleError) {
    alert('Error al guardar los productos del pedido.');
    console.error('DetalleError:', detalleError);
    return;
  }

  // 👉 Preparar resumen del pedido antes de vaciar carrito
  const resumen = carrito.map(p => `${p.cantidad} x ${p.nombre}`).join(', ');
  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const mensaje = `Hola, ya pagué con ${metodo}. Mi pedido es: ${resumen}. Total: S/ ${total.toFixed(2)}.`

  // ✅ Vaciar carrito solo si todo fue exitoso
  carrito = [];
  localStorage.removeItem('carrito');

  // 👉 Redirigir al WhatsApp con el mensaje
  const whatsappUrl = `https://wa.me/51999207025?text=${encodeURIComponent(mensaje)}`;
  window.location.href = whatsappUrl;
}


async function iniciarPagoConTarjeta() {
  const ok = await verificarPerfilCompleto(); // ✅ validación de perfil
  if (!ok) return;

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const totalEnCentimos = Math.round(total * 100); // Culqi usa centavos

  Culqi.publicKey = 'pk_live_tu_public_key_aqui'; // ← reemplaza con tu PUBLIC KEY

  Culqi.settings({
    title: 'Crakcio Store',
    currency: 'PEN',
    description: 'Compra de productos Crakcio',
    amount: totalEnCentimos
  });

  Culqi.open();
}


function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  mostrarCarrito();
}
function restarProductoDelCarrito(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad -= 1;
  } else {
    carrito.splice(index, 1);
  }
  guardarCarrito();
  mostrarCarrito();
}
function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
}
export async function verificarPerfilCompleto() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('Debes iniciar sesión para comprar.');
    window.location.href = 'login.html';
    return false;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('nombre, telefono, direccion')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil || !perfil.nombre || !perfil.telefono || !perfil.direccion) {
    alert('Debes completar tu perfil antes de continuar con la compra.');
    window.location.href = 'perfil.html';
    return false;
  }

  return true;
}
function actualizarIconoCarrito() {
  const icono = document.getElementById('icono-carrito');
  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  icono.textContent = `🛒 (${totalUnidades})`;
}

window.agregarAlCarritoDesdeProducto = function(id, nombre, precio, imagen_url) {
  const existente = carrito.find(p => p.id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, imagen_url, cantidad: 1 });
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  mostrarCarrito();
  actualizarIconoCarrito(); // ✅ ACTUALIZA el ícono
};



// Exponer funciones globales
window.mostrarCarrito = mostrarCarrito;
window.restarProductoDelCarrito = restarProductoDelCarrito;
window.quitarDelCarrito = quitarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.confirmarCompra = confirmarCompra;
window.elegirMetodoPago = elegirMetodoPago;
window.mostrarQR = mostrarQR;

document.addEventListener('DOMContentLoaded', mostrarCarrito);

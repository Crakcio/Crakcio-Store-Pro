import { supabase } from './supabaseClient.js';

const panelProductos = document.getElementById('panel-productos');
const panelPedidos = document.getElementById('panel-pedidos');
const btnVerProductos = document.getElementById('verProductos');
const btnVerPedidos = document.getElementById('verPedidos');

btnVerProductos.addEventListener('click', () => {
  panelProductos.classList.remove('hidden');
  panelPedidos.classList.add('hidden');
  cargarProductos();
});

btnVerPedidos.addEventListener('click', () => {
  panelPedidos.classList.remove('hidden');
  panelProductos.classList.add('hidden');
  cargarPedidos();
});

async function cargarProductos() {
  const contenedor = document.getElementById('productos-admin');
  const { data, error } = await supabase.from('productos').select('*');
  contenedor.innerHTML = '';

  if (error) {
    contenedor.innerHTML = '<p>Error al cargar productos.</p>';
    return;
  }

  data.forEach(producto => {
    const div = document.createElement('div');
    div.classList.add('producto');
    div.innerHTML = `
      <h4>${producto.nombre}</h4>
      <p>S/ ${producto.precio}</p>
      <p>Categoría: ${producto.categoria}</p>
      <button onclick="editarProducto(${producto.id}, '${producto.nombre}', ${producto.precio}, '${producto.categoria}', '${producto.imagen_url}')">✏️</button>
      <button onclick="eliminarProducto(${producto.id})">🗑️</button>
    `;
    contenedor.appendChild(div);
  });
}
// Agregar o editar producto
const form = document.getElementById('form-producto');
const btnNuevo = document.getElementById('nuevo-producto');
const btnGuardar = document.getElementById('guardar-producto');

let editandoId = null;

btnNuevo.addEventListener('click', () => {
  form.classList.toggle('hidden');
  editandoId = null;
  form.nombre.value = '';
  form.precio.value = '';
  form.categoria.value = '';
  form.imagen_url.value = '';
});

btnGuardar.addEventListener('click', async () => {
  const nombre = document.getElementById('nombre').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const categoria = document.getElementById('categoria').value;
  const imagen_url = document.getElementById('imagen_url').value;

  if (!nombre || !precio || !categoria || !imagen_url) {
    alert('Completa todos los campos');
    return;
  }

  if (editandoId) {
    await supabase
      .from('productos')
      .update({ nombre, precio, categoria, imagen_url })
      .eq('id', editandoId);
    alert('Producto actualizado');
  } else {
    await supabase
      .from('productos')
      .insert([{ nombre, precio, categoria, imagen_url }]);
    alert('Producto agregado');
  }

  form.classList.add('hidden');
  cargarProductos();
});

window.editarProducto = function (id, nombre, precio, categoria, imagen_url) {
  const form = document.getElementById('form-producto');
  if (!form) return;

  form.classList.remove('hidden');
  editandoId = id;

  if (form.nombre) form.nombre.value = nombre;
  if (form.precio) form.precio.value = precio;
  if (form.categoria) form.categoria.value = categoria;
  if (form.imagen_url) form.imagen_url.value = imagen_url;
};


window.eliminarProducto = async function (id) {
  if (confirm('¿Eliminar este producto?')) {
    await supabase.from('productos').delete().eq('id', id);
    cargarProductos();
  }
};
async function cargarPedidos() {
  const contenedor = document.getElementById('pedidos-admin');
  contenedor.innerHTML = '';

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
  contenedor.innerHTML = `<p>Error al cargar pedidos: ${error.message}</p>`;
  console.error("Error al consultar pedidos:", error);
  return;
}

if (!pedidos || pedidos.length === 0) {
  contenedor.innerHTML = "<p>No hay pedidos registrados.</p>";
  return;
}


  for (const pedido of pedidos) {
    const pedidoDiv = document.createElement('div');
    pedidoDiv.classList.add('pedido');

    // Cargar los productos asociados al pedido
    const { data: detalles, error: errorDetalles } = await supabase
      .from('detalle_pedido')
      .select('nombre_producto, precio_unitario, cantidad')
      .eq('pedido_id', pedido.id);

    let listaProductos = '<ul>';
    let total = 0;

    if (errorDetalles) {
  console.error("Error al cargar detalles del pedido:", errorDetalles);
  listaProductos += `<li>Error al cargar productos: ${errorDetalles.message}</li>`;
} else if (detalles && detalles.length > 0) {
      detalles.forEach(prod => {
        const subtotal = prod.precio_unitario * prod.cantidad;
        total += subtotal;
        listaProductos += `<li>${prod.nombre_producto} x${prod.cantidad} - S/ ${prod.precio_unitario.toFixed(2)} (Subtotal: S/ ${subtotal.toFixed(2)})</li>`;
      });
    } else {
      listaProductos += '<li>No se encontraron productos.</li>';
    }

    listaProductos += '</ul>';

    pedidoDiv.innerHTML = `
      <h3>Pedido #${pedido.id}</h3>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()}</p>
      <p><strong>Cliente:</strong> ${pedido.nombre_cliente}</p>
      <p><strong>Teléfono:</strong> ${pedido.telefono_cliente}</p>
      <p><strong>Dirección:</strong> ${pedido.direccion_cliente}</p>
      <p><strong>Método de pago:</strong> ${pedido.metodo_pago}</p>
      <p><strong>Estado:</strong> ${pedido.estado}</p>
      <h4>Productos:</h4>
      ${listaProductos}
      <p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
      <button onclick="marcarComoEntregado('${pedido.id}')">✅ Marcar como entregado</button>
      <hr>
    `;

    contenedor.appendChild(pedidoDiv);
  }
}
async function verificarAccesoAdmin() {

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  const user = sessionData?.session?.user;

  if (sessionError || !user) {
    alert("No estás logueado.");
    window.location.href = "login.html";
    return;
  }

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !admin) {
    alert("Acceso no autorizado. Redirigiendo...");
    window.location.href = "index.html";
    return;
  }

  // Si pasa, cargar el contenido del panel
  cargarProductos();
  cargarPedidos(); // si la tienes activa
// Por defecto solo mostramos productos
panelProductos.classList.remove('hidden');
panelPedidos.classList.add('hidden');


}
verificarAccesoAdmin();

window.guardarEstilo = async function () {
  const estilo = document.getElementById('selector-estilo').value;

  const { error } = await supabase
    .from('configuracion_tienda')
    .update({ estilo_activo: estilo })
    .eq('id', 1);

  if (error) {
    alert('Error al guardar estilo');
  } else {
    alert('Estilo guardado. Recarga la página principal para ver los cambios.');
  }
};
window.marcarComoEntregado = async function (idPedido) {
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'entregado' })
    .eq('id', idPedido);

  if (error) {
    alert('Error al marcar como entregado');
    console.error(error);
  } else {
    alert('Pedido marcado como entregado');
    cargarPedidos(); // recarga la lista
  }
}













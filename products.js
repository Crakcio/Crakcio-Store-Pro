// products.js
import { supabase } from './supabaseClient.js';
import { agregarAlCarritoDesdeProducto } from './carrito.js';

const contenedor = document.getElementById('productos-container');

function crearTarjetaProducto(producto) {
  const div = document.createElement('div');
  div.classList.add('producto-flip-card');

  let estadoStock = '';
  let boton = '';

  if (producto.stock <= 0) {
    estadoStock = `<div class="etiqueta-agotado">AGOTADO</div>`;
    boton = `<button disabled style="opacity: 0.5; cursor: not-allowed;">Agotado</button>`;
  } else {
    if (producto.stock <= 3) {
      estadoStock = `<p style="color: red;">¡Últimas unidades!</p>`;
    }
    boton = `
      <button class="agregar-btn"
        data-id="${producto.id}"
        data-nombre="${encodeURIComponent(producto.nombre)}"
        data-precio="${producto.precio}"
        data-imagen="${producto.imagen_url}">
        Agregar al carrito
      </button>`;
  }

  div.innerHTML = `
    <div class="producto-flip-inner">
      <div class="producto-flip-front">
        <div class="imagen-container" style="position: relative;">
          <img src="${producto.imagen_url}" alt="${producto.nombre}">
          ${estadoStock}
        </div>
        <h4>${producto.nombre}</h4>
        <p>S/ ${producto.precio}</p>
      </div>
      <div class="producto-flip-back">
        <p>${producto.descripcion || 'Sin descripción disponible.'}</p>
      </div>
    </div>
    ${boton}
  `;

  contenedor.appendChild(div);
}

export async function cargarProductosDestacados() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .limit(8);

  if (error || !data) {
    contenedor.innerHTML = '<p>Error al cargar productos destacados.</p>';
    console.error(error);
    return;
  }

  contenedor.innerHTML = '';
  data.forEach(producto => crearTarjetaProducto(producto));
}

export async function mostrarProductosPorCategoria(categoria) {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria', categoria);

  contenedor.innerHTML = '';

  if (error || !productos) {
    contenedor.innerHTML = '<p>Error al cargar productos.</p>';
    return;
  }

  productos.forEach(producto => crearTarjetaProducto(producto));
  configurarBotonesAgregarCarrito();
}

function configurarBotonesAgregarCarrito() {
  document.querySelectorAll('.agregar-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true)); // limpia listeners previos
  });

  document.querySelectorAll('.agregar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const nombre = decodeURIComponent(btn.dataset.nombre);
      const precio = parseFloat(btn.dataset.precio);
      const imagen_url = btn.dataset.imagen;

      if (!id || !nombre || isNaN(precio)) {
        console.warn('Producto inválido:', { id, nombre, precio });
        return;
      }

      agregarAlCarritoDesdeProducto(id, nombre, precio, imagen_url);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (contenedor && location.pathname.endsWith('index.html')) {
    cargarProductosDestacados().then(() => configurarBotonesAgregarCarrito());
  }
});


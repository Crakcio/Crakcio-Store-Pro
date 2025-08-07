import { supabase } from './supabaseClient.js';
import {
  agregarAlCarritoDesdeProducto,
  mostrarCarrito,
  actualizarIconoCarrito,
  restarProductoDelCarrito,
  quitarDelCarrito,
  vaciarCarrito,
  confirmarCompra,
  elegirMetodoPago,
  mostrarQR
} from './carrito.js';

const contenedor = document.getElementById('productos-iluminacion');

async function cargarProductosCategoria() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria', 'Iluminación');

  if (error) {
    contenedor.innerHTML = '<p>Error al cargar productos.</p>';
    return;
  }

  contenedor.innerHTML = '';
  data.forEach(producto => {
    const div = document.createElement('div');
    div.classList.add('producto');

    div.innerHTML = `
      <img src="${producto.imagen_url}" alt="${producto.nombre}" />
      <h4>${producto.nombre}</h4>
      <p>S/ ${producto.precio}</p>
      <button onclick="agregarAlCarritoDesdeProducto(${producto.id}, '${producto.nombre}', ${producto.precio}, '${producto.imagen_url}')">
        Agregar al carrito
      </button>
    `;
    contenedor.appendChild(div);
  });
}

cargarProductosCategoria();


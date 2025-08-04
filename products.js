// products.js
import { supabase } from './supabaseClient.js';

const contenedor = document.getElementById('productos-container');

async function cargarProductosDestacados() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .limit(8); // Puedes ajustar el número de productos

  if (error) {
    contenedor.innerHTML = '<p>Error al cargar productos destacados.</p>';
    console.error(error);
    return;
  }

  contenedor.innerHTML = '';
  data.forEach(producto => {
  const div = document.createElement('div');
  div.classList.add('producto-card');

  let estadoStock = '';
  let boton = '';

  if (producto.stock <= 0) {
    estadoStock = `<div class="etiqueta-agotado">AGOTADO</div>`;
    boton = `<button disabled style="opacity: 0.5; cursor: not-allowed;">Agotado</button>`;
  } else {
    if (producto.stock <= 3) {
      estadoStock = `<p style="color: red;">¡Últimas unidades!</p>`;
    }
    boton = `<button onclick='agregarAlCarritoDesdeProducto(${JSON.stringify(producto)})'>Agregar al carrito</button>`;
  }

  div.innerHTML = `
    <div class="imagen-container" style="position: relative;">
      <img src="${producto.imagen_url}" alt="${producto.nombre}">
      ${estadoStock}
    </div>
    <h4>${producto.nombre}</h4>
    <p>S/ ${producto.precio}</p>
    ${boton}
  `;

  contenedor.appendChild(div);
});

}

if (contenedor) {
  cargarProductosDestacados();
}
export async function mostrarProductosPorCategoria(categoria) {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria', categoria);

  const contenedor = document.getElementById('productos-container');
  contenedor.innerHTML = '';

  if (error || !productos) {
    contenedor.innerHTML = '<p>Error al cargar productos.</p>';
    return;
  }

  productos.forEach(producto => {
  const card = document.createElement('div');
  card.className = 'producto-card';

  let estadoStock = '';
  let boton = '';

  if (producto.stock <= 0) {
    estadoStock = `<div class="etiqueta-agotado">AGOTADO</div>`;
    boton = `<button disabled style="opacity: 0.5; cursor: not-allowed;">Agotado</button>`;
  } else {
    if (producto.stock <= 3) {
      estadoStock = `<p style="color: red;">¡Últimas unidades!</p>`;
    }
    boton = `<button onclick='agregarAlCarritoDesdeProducto(${JSON.stringify(producto)})'>Agregar al carrito</button>`;
  }

  card.innerHTML = `
    <div class="imagen-container" style="position:relative;">
      <img src="${producto.imagen_url}" alt="${producto.nombre}">
      ${estadoStock}
    </div>
    <h3>${producto.nombre}</h3>
    <p>S/ ${producto.precio}</p>
    ${boton}
  `;

  contenedor.appendChild(card);
})};

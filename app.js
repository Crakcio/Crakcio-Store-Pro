import { supabase } from './supabaseClient.js';
import { agregarAlCarritoDesdeProducto, mostrarCarrito } from './carrito.js';

async function obtenerProductosDestacados() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('destacado', true)
    .limit(8);

  if (error) {
    console.error('Error al obtener productos:', error.message);
    return [];
  }

  if (!data) {
    console.warn('No se obtuvo data de Supabase');
    return [];
  }

  return data;
}

function mostrarProductosDestacados(productos) {
  const contenedor = document.getElementById('productos-container');
  contenedor.innerHTML = '';

  productos.forEach(producto => {
    const div = document.createElement('div');
    div.classList.add('producto-flip-card');
    div.innerHTML = `
  <div class="producto-flip-inner">
    <div class="producto-flip-front">
      <img src="${producto.imagen_url}" alt="${producto.nombre}" />
      <h4>${producto.nombre}</h4>
      <p>S/ ${producto.precio}</p>
    </div>
    <div class="producto-flip-back">
      <p>${producto.descripcion || 'Sin descripción disponible.'}</p>
    </div>
  </div>
  <button 
    class="agregar-btn"
    data-id="${producto.id}"
    data-nombre="${encodeURIComponent(producto.nombre)}"
    data-precio="${producto.precio}"
    data-imagen="${producto.imagen_url}">
    Agregar al carrito
  </button>
`;

    contenedor.appendChild(div);
  });

  // Agregar los eventos a cada botón
  document.querySelectorAll('.agregar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const nombre = decodeURIComponent(btn.dataset.nombre);
      const precio = parseFloat(btn.dataset.precio);
      const imagen_url = btn.dataset.imagen;
      agregarAlCarritoDesdeProducto(id, nombre, precio, imagen_url);
    });
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  const iconoPerfil = document.getElementById('icono-perfil');
  if (!iconoPerfil) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    iconoPerfil.href = 'perfil.html';
  } else {
    iconoPerfil.href = 'login.html'; // luego en login puedes poner un botón a "registro.html"
  }
});


document.addEventListener('DOMContentLoaded', async () => {
  // Mostrar productos destacados
  const productos = await obtenerProductosDestacados();
  mostrarProductosDestacados(productos);

  // Activar Lucide icons (si lo estás usando)
  if (window.lucide) {
    lucide.createIcons();
  }

  // Activar menú hamburguesa
  const toggleButton = document.getElementById('toggleMenu');
  const menu = document.getElementById('menu');

  if (toggleButton && menu) {
    toggleButton.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const iconoCarrito = document.getElementById('icono-carrito');
  const panelCarrito = document.getElementById('carrito-panel');

  if (iconoCarrito && panelCarrito) {
    iconoCarrito.addEventListener('click', () => {
      panelCarrito.classList.toggle('visible');
    });
  }

  // Mostrar carrito si la función está disponible
  if (typeof mostrarCarrito === 'function') {
    mostrarCarrito();
  }
});


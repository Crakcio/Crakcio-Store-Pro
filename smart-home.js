// Este archivo carga productos de la categoría "Smart Home" desde Supabase
import { supabase } from './supabaseClient.js';

const contenedor = document.getElementById('productos-smart-home');

async function cargarProductosCategoria() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria', 'Smart Home');

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
  <button onclick='agregarAlCarritoDesdeProducto(${JSON.stringify(producto)})'>Agregar al carrito</button>
`;

    contenedor.appendChild(div);
  });
}

cargarProductosCategoria();

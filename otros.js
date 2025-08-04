// Cargar productos categoría Otros
import { supabase } from './supabaseClient.js';

const contenedor = document.getElementById('productos-otros');

async function cargarProductosOtros() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria', 'Otros');

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
    `;
    contenedor.appendChild(div);
  });
}

cargarProductosOtros();

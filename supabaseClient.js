import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = 'https://mzkftygjnkosmdhkvquf.supabase.co'; // Reemplaza con tu URL real
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16a2Z0eWdqbmtvc21kaGt2cXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTEzNzMsImV4cCI6MjA2OTE2NzM3M30.2N5YK74lat6howsKk4RTJqkYU1CPcuuOWTcVtjTZn0s'; // Reemplaza con tu clave pública

export const supabase = createClient(supabaseUrl, supabaseKey);

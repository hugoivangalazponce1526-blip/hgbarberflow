require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno. Asegúrate de tener .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL || 'admin@hggrowthlab.cl';
const password = process.env.ADMIN_PASSWORD;
const fullName = 'Administrador BarberFlow';

if (!password) {
  console.error('❌ Falta ADMIN_PASSWORD en .env.local');
  process.exit(1);
}

async function main() {
  console.log('Iniciando script para crear Super Admin...');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: { transport: require('ws') }
  });

  try {
    // 1. Crear el usuario en Auth
    console.log(`Intentando crear usuario Auth: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already exists') || authError.status === 422) {
        console.log('El usuario de Auth ya existe. Buscando su ID...');
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = usersData.users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('No se pudo encontrar al usuario existente por correo.');
        }
        userId = existingUser.id;
        console.log(`Usuario encontrado con ID: ${userId}`);
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
      console.log(`Usuario de Auth creado con ID: ${userId}`);
    }

    // 2. Crear o actualizar el perfil en la tabla profiles
    console.log('Insertando/Actualizando perfil en la tabla profiles...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: 'super_admin',
        barbershop_id: null
      });

    if (profileError) {
      throw profileError;
    }

    console.log('\n==================================================');
    console.log('🎉 ¡SUPER ADMINISTRADOR CREADO CON ÉXITO!');
    console.log(`📧 Correo: ${email}`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ Error durante la creación:', err.message || err);
  }
}

main();

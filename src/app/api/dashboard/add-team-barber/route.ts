/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('barbershop_id, role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile || profile.role !== 'barber') {
      return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
    }

    const { data: shop, error: shopErr } = await supabase
      .from('barbershops')
      .select('id, plan_type, max_barberos, owner_id')
      .eq('id', profile.barbershop_id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Barbería no encontrada.' }, { status: 404 });
    }

    if (shop.owner_id !== user.id) {
      return NextResponse.json({ error: 'Solo el dueño puede agregar barberos.' }, { status: 403 });
    }

    if (shop.plan_type !== 'equipo') {
      return NextResponse.json({ error: 'Función disponible solo en plan Full Equipo.' }, { status: 403 });
    }

    const raw = await req.json();
    const full_name: string = typeof raw.full_name === 'string' ? raw.full_name.trim().slice(0, 100) : '';
    const email: string = typeof raw.email === 'string' ? raw.email.trim().slice(0, 254) : '';
    const password: string = typeof raw.password === 'string' ? raw.password : '';

    if (!full_name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Faltan campos o la contraseña es muy corta (mínimo 8 caracteres).' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check current barber count
    const { count } = await adminSupabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('barbershop_id', shop.id)
      .eq('role', 'barber');

    if ((count ?? 0) >= shop.max_barberos) {
      return NextResponse.json({ error: `Límite alcanzado: tu plan permite hasta ${shop.max_barberos} barberos.` }, { status: 400 });
    }

    const { data: authUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !authUser?.user) {
      return NextResponse.json({ error: `Error al crear usuario: ${createUserError?.message ?? 'Desconocido'}` }, { status: 500 });
    }

    const { error: insertProfileError } = await adminSupabase.from('profiles').insert({
      id: authUser.user.id,
      barbershop_id: shop.id,
      full_name,
      role: 'barber',
    });

    if (insertProfileError) {
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: `Error al crear perfil: ${insertProfileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: authUser.user.id, full_name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error del servidor.' }, { status: 500 });
  }
}

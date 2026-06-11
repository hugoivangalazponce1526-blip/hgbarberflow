/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    // 1. Initialize server client and verify authorization
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Por favor inicia sesión.' }, { status: 401 });
    }

    // Check if the user is a super admin
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Prohibido. No tienes permisos de Super Administrador.' }, { status: 403 });
    }

    // 2. Parse and sanitize request payload
    const raw = await req.json();

    const sanitizeText = (v: unknown): string =>
      typeof v === 'string'
        ? v.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, 200)
        : '';

    const name = sanitizeText(raw.name);
    const owner_name = sanitizeText(raw.owner_name);
    const email: string = typeof raw.email === 'string' ? raw.email.trim().slice(0, 254) : '';
    const password: string = typeof raw.password === 'string' ? raw.password : '';
    const plan: string = typeof raw.plan === 'string' ? raw.plan : '';

    const VALID_PLANS = ['monthly', 'annual'];
    if (!name || !email || !password || !owner_name || !plan) {
      return NextResponse.json({ error: 'Faltan campos obligatorios en el formulario.' }, { status: 400 });
    }
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });
    }

    // 3. Generate shop slug
    const baseSlug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^\w\s-]/g, '')        // remove non-alphanumeric
      .replace(/[\s_-]+/g, '-')        // spaces to hyphens
      .replace(/^-+|-+$/g, '');        // trim hyphens

    // Add unique short identifier to guarantee slug uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalSlug = `${baseSlug}-${randomSuffix}`;

    // 4. Create database rows using the master Service Role client
    const adminSupabase = createAdminClient();

    // Create barbershop record
    const { data: shop, error: shopError } = await adminSupabase
      .from('barbershops')
      .insert({
        name,
        slug: finalSlug,
        plan,
        is_active: true
      })
      .select()
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: `Error al crear la barbería: ${shopError?.message || 'Desconocido'}` }, { status: 500 });
    }

    // Create user in Supabase Auth
    const { data: authUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // bypass email confirmation
    });

    if (createUserError || !authUser?.user) {
      // Rollback barbershop creation to prevent orphan shops
      await adminSupabase.from('barbershops').delete().eq('id', shop.id);
      return NextResponse.json({ error: `Error al registrar el usuario: ${createUserError?.message || 'Desconocido'}` }, { status: 500 });
    }

    const newUserId = authUser.user.id;

    // Create profile linked to the new user and barbershop
    const { error: insertProfileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        barbershop_id: shop.id,
        full_name: owner_name,
        role: 'barber'
      });

    if (insertProfileError) {
      // Rollback user and shop
      await adminSupabase.auth.admin.deleteUser(newUserId);
      await adminSupabase.from('barbershops').delete().eq('id', shop.id);
      return NextResponse.json({ error: `Error al crear el perfil del barbero: ${insertProfileError.message}` }, { status: 500 });
    }

    // Update barbershop owner_id
    const { error: updateShopError } = await adminSupabase
      .from('barbershops')
      .update({ owner_id: newUserId })
      .eq('id', shop.id);

    if (updateShopError) {
      // Non-blocking rollback: even if owner_id update fails, the associations exist in profile
      console.error('Failed to update barbershop owner_id:', updateShopError);
    }

    return NextResponse.json({
      ok: true,
      barbershop_id: shop.id,
      user_id: newUserId,
      slug: finalSlug
    });

  } catch (err: any) {
    console.error('API Error in create-shop:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor interno.' }, { status: 500 });
  }
}

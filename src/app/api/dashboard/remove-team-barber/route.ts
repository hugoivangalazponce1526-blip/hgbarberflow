/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: callerProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('barbershop_id, role')
      .eq('id', user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== 'barber') {
      return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
    }

    const { data: shop, error: shopErr } = await supabase
      .from('barbershops')
      .select('id, owner_id, plan_type')
      .eq('id', callerProfile.barbershop_id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Barbería no encontrada.' }, { status: 404 });
    }

    if (shop.owner_id !== user.id) {
      return NextResponse.json({ error: 'Solo el dueño puede eliminar barberos.' }, { status: 403 });
    }

    const raw = await req.json();
    const barberId: string = typeof raw.barber_id === 'string' ? raw.barber_id.trim() : '';
    if (!barberId) {
      return NextResponse.json({ error: 'barber_id requerido.' }, { status: 400 });
    }

    // Prevent owner from removing themselves
    if (barberId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo.' }, { status: 400 });
    }

    // Verify target barber belongs to same shop
    const adminSupabase = createAdminClient();
    const { data: targetProfile, error: targetErr } = await adminSupabase
      .from('profiles')
      .select('id, barbershop_id')
      .eq('id', barberId)
      .eq('barbershop_id', shop.id)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: 'Barbero no encontrado en esta barbería.' }, { status: 404 });
    }

    // Delete auth user (cascades to profile via FK)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(barberId);
    if (deleteError) {
      return NextResponse.json({ error: `Error al eliminar: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error del servidor.' }, { status: 500 });
  }
}

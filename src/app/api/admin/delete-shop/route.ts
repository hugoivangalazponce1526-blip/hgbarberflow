/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'super_admin')
      return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { shopId } = await req.json();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!shopId || !UUID_RE.test(shopId))
      return NextResponse.json({ error: 'shopId inválido.' }, { status: 400 });

    const admin = createAdminClient();

    // Get barber profile before deleting (to remove auth user too)
    const { data: ownerProfile } = await admin
      .from('profiles').select('id').eq('barbershop_id', shopId).eq('role', 'barber').maybeSingle();

    // Delete barbershop — cascades to services, schedules, appointments, blocked_dates
    const { error: shopErr } = await admin.from('barbershops').delete().eq('id', shopId);
    if (shopErr) throw shopErr;

    // Delete auth user — cascades to profile row
    if (ownerProfile) {
      await admin.auth.admin.deleteUser(ownerProfile.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor.' }, { status: 500 });
  }
}

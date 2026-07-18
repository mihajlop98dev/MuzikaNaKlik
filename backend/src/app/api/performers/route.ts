import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const type = searchParams.get('type');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const sort = searchParams.get('sort') || 'popularity';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from('performers')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .eq('subscription_status', 'active');

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (priceMin) {
    query = query.gte('price_from', parseInt(priceMin));
  }

  if (priceMax) {
    query = query.lte('price_from', parseInt(priceMax));
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('price_from', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_from', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_avg', { ascending: false });
      break;
    default:
      query = query.order('rating_count', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], count: count || 0 });
}

// db.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://tmphejgbudtvsssiihkm.supabase.co';
const SUPABASE_ANON_KEY = 'TA_PUBLISHABLE_KEY_ICI';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getMaps() {
    const { data, error } = await supabaseClient
        .from('maps')
        .select('*')
        .order('id');
    if (error) throw error;
    return data;
}

export async function getSpotsByMap(mapId) {
    const { data, error } = await supabaseClient
        .from('spots')
        .select('*')
        .eq('map_id', mapId);
    if (error) throw error;
    return data;
}

export async function addSpot(mapId, x, y) {
    const { data, error } = await supabaseClient
        .from('spots')
        .insert({ map_id: Number(mapId), x: Number(x), y: Number(y) })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSpotPosition(spotId, x, y) {
    const { data, error } = await supabaseClient
        .from('spots')
        .update({ x: Number(x), y: Number(y) })
        .eq('id', spotId)
        .select()
        .single();
    if (error) throw

// db.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://tmphejgbudtvsssiihkm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__LRvhwJmwbtFjAgOZSfsgg_4oPLBiQ6';

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

// Met à jour l'heure de fin du timer pour un spot donné
export async function updateSpotTimer(spotId, respawnTimestamp) {
    const { data, error } = await supabaseClient
        .from('spots')
        .update({ respawn_at: respawnTimestamp })
        .eq('id', spotId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSpotNatural(spotId, naturalUntilMs) {
    const { data, error } = await supabaseClient
        .from('spots')
        .update({ natural_until: naturalUntilMs })
        .eq('id', spotId)
        .select();

    if (error) {
        console.error('Erreur updateSpotNatural:', error);
        throw error;
    }
    return data;
}

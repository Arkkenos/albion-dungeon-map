const SUPABASE_URL = 'https://tmphejgbudtvsssiihkm.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable__LRvhwJmwbtFjAgOZSfsgg_4oPLBiQ6';

// On utilise supabaseClient pour éviter tout conflit de variable avec le CDN Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

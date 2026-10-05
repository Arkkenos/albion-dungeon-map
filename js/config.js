const SUPABASE_URL = 'https://lrvhwjmwbtfjagozsfsgg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__LRvhwJmwbtFjAgOZSfsgg_4oPLBiQ6';

// On utilise supabaseClient pour éviter tout conflit de variable avec le CDN Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Obtenir toutes les maps
async function getMaps() {
    const { data, error } = await supabase.from('maps').select('*').order('id');
    if (error) {
        console.error('Erreur maps:', error);
        return [];
    }
    return data;
}

// Obtenir les spots d'une map spécifique
async function getSpotsByMap(mapId) {
    const { data, error } = await supabase.from('spots').select('*').eq('map_id', mapId);
    if (error) {
        console.error('Erreur spots:', error);
        return [];
    }
    return data;
}

// Ajouter un nouveau spot
async function addSpot(mapId, x, y) {
    const { data, error } = await supabase
        .from('spots')
        .insert([{ map_id: mapId, x: x, y: y }])
        .select();
    if (error) {
        console.error('Erreur ajout spot:', error);
        return null;
    }
    return data[0];
}

// Mettre à jour les coordonnées d'un spot
async function updateSpotPosition(spotId, x, y) {
    const { error } = await supabase
        .from('spots')
        .update({ x: x, y: y })
        .eq('id', spotId);
    if (error) console.error('Erreur maj spot:', error);
}

// Supprimer un spot
async function deleteSpot(spotId) {
    const { error } = await supabase.from('spots').delete().eq('id', spotId);
    if (error) console.error('Erreur suppression spot:', error);
}

// Récupérer toutes les cartes
async function getMaps() {
    const { data, error } = await supabaseClient
        .from('maps')
        .select('*');
    
    if (error) {
        console.error('Erreur lors de la récupération des cartes:', error);
        return [];
    }
    return data;
}

// Récupérer les spots d'une carte spécifique
async function getSpotsByMapId(mapId) {
    const { data, error } = await supabaseClient
        .from('spots')
        .select('*')
        .eq('map_id', mapId);

    if (error) {
        console.error('Erreur lors de la récupération des spots:', error);
        return [];
    }
    return data;
}

// Ajouter un spot
async function addSpot(mapId, x, y) {
    const { data, error } = await supabaseClient
        .from('spots')
        .insert([{ map_id: mapId, x: x, y: y }])
        .select();

    if (error) console.error('Erreur lors de l\'ajout du spot:', error);
    return data;
}

// Mettre à jour la position d'un spot (Drag & Drop)
async function updateSpotPosition(spotId, x, y) {
    const { data, error } = await supabaseClient
        .from('spots')
        .update({ x: x, y: y })
        .eq('id', spotId);

    if (error) console.error('Erreur lors de la mise à jour:', error);
    return data;
}

// Supprimer un spot
async function deleteSpot(spotId) {
    const { error } = await supabaseClient
        .from('spots')
        .delete()
        .eq('id', spotId);

    if (error) console.error('Erreur lors de la suppression:', error);
}

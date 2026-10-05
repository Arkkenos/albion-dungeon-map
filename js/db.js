// Récupérer toutes les recettes
async function getRecipes() {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Erreur lors de la récupération des recettes:', error);
        return [];
    }
    return data;
}

// Ajouter une nouvelle recette
async function addRecipe(recipe) {
    const { data, error } = await supabase
        .from('recipes')
        .insert([recipe])
        .select();
        
    if (error) {
        console.error('Erreur lors de l\'ajout de la recette:', error);
        return null;
    }
    return data;
}

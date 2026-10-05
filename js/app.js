document.addEventListener('DOMContentLoaded', async () => {
    const recipeForm = document.getElementById('recipe-form');
    const recipesContainer = document.getElementById('recipes-container');

    // Charger et afficher les recettes
    async function loadRecipes() {
        recipesContainer.innerHTML = '<p>Chargement des recettes...</p>';
        const recipes = await getRecipes();
        
        if (recipes.length === 0) {
            recipesContainer.innerHTML = '<p>Aucune recette pour le moment. Ajoutez-en une !</p>';
            return;
        }

        recipesContainer.innerHTML = recipes.map(recipe => `
            <div class="recipe-card">
                <h3>${escapeHtml(recipe.title)}</h3>
                <p><strong>Ingrédients :</strong> ${escapeHtml(recipe.ingredients)}</p>
                <p><strong>Instructions :</strong> ${escapeHtml(recipe.instructions)}</p>
                ${recipe.prep_time ? `<p><small>⏱ Temps de préparation : ${recipe.prep_time} min</small></p>` : ''}
            </div>
        `).join('');
    }

    // Gestion de la soumission du formulaire
    if (recipeForm) {
        recipeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newRecipe = {
                title: document.getElementById('title').value,
                ingredients: document.getElementById('ingredients').value,
                instructions: document.getElementById('instructions').value,
                prep_time: parseInt(document.getElementById('prep_time').value) || null
            };

            const result = await addRecipe(newRecipe);
            if (result) {
                recipeForm.reset();
                await loadRecipes();
            } else {
                alert('Erreur lors de l\'enregistrement de la recette.');
            }
        });
    }

    // Sécurité XSS simple
    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // Premier chargement
    loadRecipes();
});

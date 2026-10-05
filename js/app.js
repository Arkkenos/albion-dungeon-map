// ⚠️ AJOUT : import des fonctions de db.js
import {
    getMaps,
    getSpotsByMap,
    addSpot,
    updateSpotPosition,
    deleteSpot
} from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');

    const mapsListView = document.getElementById('maps-list-view');
    const mapDetailView = document.getElementById('map-detail-view');
    const mapsGrid = document.getElementById('maps-grid');

    const currentMapTitle = document.getElementById('current-map-title');
    const mapImage = document.getElementById('map-image');
    const mapWrapper = document.getElementById('map-wrapper');
    const spotsLayer = document.getElementById('spots-layer');
    const spotsCount = document.getElementById('spots-count');

    const modeBtn = document.getElementById('mode-btn');
    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // État de l'application
    let currentMap = null;
    let isModificationMode = false;
    let spotToDelete = null;

    // 1. Authentification Simple
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = passwordInput.value;
        if (pwd === 'albion2026') {
            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            loadMapsList();
        } else {
            loginError.innerText = 'Mot de passe incorrect.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        appScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        passwordInput.value = '';
    });

    // 2. Charger la liste des maps
    async function loadMapsList() {
        mapsGrid.innerHTML = '<p>Chargement des zones...</p>';

        let maps = [];
        try {
            maps = await getMaps();
        } catch (err) {
            console.error('Erreur getMaps:', err);
        }

        // Si la BDD est vide, proposer des zones par défaut (id unique !)
        if (!maps || maps.length === 0) {
            maps = [
                { id: 1, name: 'N Steep',    image: 'maps/N Steep.jpg' },
                { id: 2, name: 'NE Precipice', image: 'maps/NE Precipice.jpg' },
                { id: 3, name: 'E Grove',    image: 'maps/E Grove.jpg' },
                { id: 4, name: 'SE Dale',    image: 'maps/SE Dale.jpg' },
                { id: 5, name: 'S Glade',    image: 'maps/S Glade.jpg' },
                { id: 6, name: 'SW Enclave', image: 'maps/SW Enclave.jpg' },
                { id: 7, name: 'W Strand',   image: 'maps/W Strand.jpg' },
                { id: 8, name: 'NW Lake',    image: 'maps/NW Lake.jpg' }
            ];
        }

        mapsGrid.innerHTML = maps.map(m => `
            <div class="map-card" data-id="${m.id}" data-name="${m.name}" data-image="${m.image}">
                <h3>${m.name}</h3>
            </div>
        `).join('');

        document.querySelectorAll('.map-card').forEach(card => {
            card.addEventListener('click', () => {
                openMap({
                    id: card.dataset.id,
                    name: card.dataset.name,
                    image: card.dataset.image
                });
            });
        });
    }

    // 3. Ouvrir une Map
    async function openMap(mapData) {
        currentMap = mapData;
        currentMapTitle.innerText = currentMap.name;
        mapImage.src = currentMap.image;

        mapImage.onerror = () => {
            mapImage.src = 'https://via.placeholder.com/1000x1000/151c28/e2b755?text=' + currentMap.name;
        };

        mapsListView.classList.add('hidden');
        mapDetailView.classList.remove('hidden');

        setMode(false);
        await renderSpots();
    }

    backToMapsBtn.addEventListener('click', () => {
        mapDetailView.classList.add('hidden');
        mapsListView.classList.remove('hidden');
    });

    // 4. Gestion du Mode
    modeBtn.addEventListener('click', () => {
        setMode(!isModificationMode);
    });

    function setMode(modification) {
        isModificationMode = modification;
        if (isModificationMode) {
            modeBtn.innerText = 'MODE MODIFICATION';
            modeBtn.className = 'btn-mode mode-modification';
            mapWrapper.classList.add('mode-modification-active');
        } else {
            modeBtn.innerText = 'MODE CONSULTATION';
            modeBtn.className = 'btn-mode mode-consultation';
            mapWrapper.classList.remove('mode-modification-active');
        }
    }

    // 5. Afficher les spots
    async function renderSpots() {
        spotsLayer.innerHTML = '';
        let spots = [];
        try {
            spots = await getSpotsByMap(currentMap.id);
        } catch (err) {
            console.error('Erreur getSpotsByMap:', err);
        }
        spotsCount.innerText = `${spots.length} SPOTS CONNUS`;
        spots.forEach(spot => createSpotElement(spot));
    }

    function createSpotElement(spot) {
        const elem = document.createElement('div');
        elem.className = 'dungeon-spot';
        elem.style.left = `${spot.x}%`;
        elem.style.top = `${spot.y}%`;
        elem.title = `Spot Donjon (#${spot.id})`;
        elem.dataset.id = spot.id;

        let isDragging = false;

        elem.addEventListener('mousedown', (e) => {
            if (!isModificationMode || e.button !== 0) return;
            isDragging = true;
            e.stopPropagation();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = mapImage.getBoundingClientRect();
            let x = ((e.clientX - rect.left) / rect.width) * 100;
            let y = ((e.clientY - rect.top) / rect.height) * 100;
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));
            elem.style.left = `${x}%`;
            elem.style.top = `${y}%`;
        });

        window.addEventListener('mouseup', async () => {
            if (isDragging) {
                isDragging = false;
                const x = parseFloat(elem.style.left);
                const y = parseFloat(elem.style.top);
                try {
                    await updateSpotPosition(spot.id, x, y);
                } catch (err) {
                    console.error('Erreur updateSpotPosition:', err);
                }
            }
        });

        elem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!isModificationMode) return;
            spotToDelete = { id: spot.id, element: elem };
            confirmModal.classList.remove('hidden');
        });

        spotsLayer.appendChild(elem);
    }

    // 6. Ajout d'un spot au clic
    mapWrapper.addEventListener('click', async (e) => {
        if (!isModificationMode) return;
        if (e.target.classList.contains('dungeon-spot')) return;

        const rect = mapImage.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        try {
            const newSpot = await addSpot(currentMap.id, x.toFixed(3), y.toFixed(3));
            if (newSpot) {
                createSpotElement(newSpot);
                spotsCount.innerText = `${spotsLayer.children.length} SPOTS CONNUS`;
            }
        } catch (err) {
            console.error('Erreur addSpot:', err);
            alert(
                "Impossible d'ajouter le spot.\n\n" +
                "Cause probable : la map (id=" + currentMap.id + ") n'existe pas dans la table 'maps' de Supabase.\n" +
                "Va dans Supabase → SQL Editor et exécute :\n" +
                "INSERT INTO maps (id, name) VALUES (" + currentMap.id + ", '" + currentMap.name + "');"
            );
        }
    });

    // 7. Modal de suppression
    cancelDeleteBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        spotToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (spotToDelete) {
            try {
                await deleteSpot(spotToDelete.id);
                spotToDelete.element.remove();
            } catch (err) {
                console.error('Erreur deleteSpot:', err);
            }
            spotToDelete = null;
            confirmModal.classList.add('hidden');
            spotsCount.innerText = `${spotsLayer.children.length} SPOTS CONNUS`;
        }
    });
});

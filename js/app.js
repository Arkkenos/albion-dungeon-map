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
        // Mot de passe par défaut
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
        let maps = await getMaps();

        // Si la BDD est vide, créer des zones par défaut
        if (maps.length === 0) {
            maps = [
                { id: 1, name: 'N Steep', image: 'maps/N Steep.jpg' },
                { id: 2, name: 'NE Precipice', image: 'maps/NE Precipice.jpg' },
                { id: 3, name: 'E Grove', image: 'maps/E Grove.jpg' },
                { id: 4, name: 'SE Dale', image: 'maps/SE Dale.jpg' },
                { id: 5, name: 'S Glade', image: 'maps/S Glade.jpg' },
                { id: 6, name: 'SW Enclave', image: 'maps/SW Enclave.jpg' },
                { id: 6, name: 'W Strand', image: 'maps/W Strand.jpg' },
                { id: 6, name: 'NW Lake', image: 'maps/NW Lake.jpg' }
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

        // Image temporaire de secours si le fichier n'existe pas encore
        mapImage.onerror = () => {
            mapImage.src = 'https://via.placeholder.com/1000x1000/151c28/e2b755?text=' + currentMap.name;
        };

        mapsListView.classList.add('hidden');
        mapDetailView.classList.remove('hidden');

        setMode(false); // Mode consultation par défaut
        await renderSpots();
    }

    backToMapsBtn.addEventListener('click', () => {
        mapDetailView.classList.add('hidden');
        mapsListView.classList.remove('hidden');
    });

    // 4. Gestion du Mode (Consultation vs Modification)
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
        const spots = await getSpotsByMap(currentMap.id);
        spotsCount.innerText = `${spots.length} SPOTS CONNUS`;

        spots.forEach(spot => {
            createSpotElement(spot);
        });
    }

    function createSpotElement(spot) {
        const elem = document.createElement('div');
        elem.className = 'dungeon-spot';
        elem.style.left = `${spot.x}%`;
        elem.style.top = `${spot.y}%`;
        elem.title = `Spot Donjon (#${spot.id})`;
        elem.dataset.id = spot.id;

        // Déplacement par Drag & Drop en Mode Modification
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

        window.addEventListener('mouseup', async (e) => {
            if (isDragging) {
                isDragging = false;
                const x = parseFloat(elem.style.left);
                const y = parseFloat(elem.style.top);
                await updateSpotPosition(spot.id, x, y);
            }
        });

        // Suppression par Clic Droit
        elem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!isModificationMode) return;
            spotToDelete = { id: spot.id, element: elem };
            confirmModal.classList.remove('hidden');
        });

        spotsLayer.appendChild(elem);
    }

    // 6. Ajout d'un spot au Clic
    mapWrapper.addEventListener('click', async (e) => {
        if (!isModificationMode) return;
        if (e.target.classList.contains('dungeon-spot')) return;

        const rect = mapImage.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newSpot = await addSpot(currentMap.id, x.toFixed(3), y.toFixed(3));
        if (newSpot) {
            createSpotElement(newSpot);
            const count = spotsLayer.children.length;
            spotsCount.innerText = `${count} SPOTS CONNUS`;
        }
    });

    // 7. Modal de suppression
    cancelDeleteBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        spotToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (spotToDelete) {
            await deleteSpot(spotToDelete.id);
            spotToDelete.element.remove();
            spotToDelete = null;
            confirmModal.classList.add('hidden');
            const count = spotsLayer.children.length;
            spotsCount.innerText = `${count} SPOTS CONNUS`;
        }
    });
});

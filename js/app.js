import {
    getMaps,
    getSpotsByMap,
    updateSpotTimer,
    supabaseClient
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

    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Zoom elements
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');

    // État de l'application
    let currentMap = null;
    let currentZoom = 1;
    let spotsData = [];
    let realtimeChannel = null;
    let timerInterval = null;

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
        leaveRealtimeChannel();
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

        if (!maps || maps.length === 0) {
            maps = [
                { id: 1, name: 'N Steep',  image: 'maps/N Steep.jpg' },
                { id: 2, name: 'NE Precipice', image: 'maps/NE Precipice.jpg' },
                { id: 3, name: 'E Grove',  image: 'maps/E Grove.jpg' },
                { id: 4, name: 'SE Dale',  image: 'maps/SE Dale.jpg' },
                { id: 5, name: 'S Glade',  image: 'maps/S Glade.jpg' },
                { id: 6, name: 'SW Enclave', image: 'maps/SW Enclave.jpg' },
                { id: 7, name: 'W Strand',  image: 'maps/W Strand.jpg' },
                { id: 8, name: 'NW Lake',  image: 'maps/NW Lake.jpg' }
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
        currentZoom = 1;
        updateZoomTransform();

        mapImage.onerror = () => {
            mapImage.src = 'https://via.placeholder.com/1000x1000/151c28/e2b755?text=' + currentMap.name;
        };

        mapsListView.classList.add('hidden');
        mapDetailView.classList.remove('hidden');

        await loadAndRenderSpots();
        setupRealtimeSync();
    }

    backToMapsBtn.addEventListener('click', () => {
        leaveRealtimeChannel();
        mapDetailView.classList.add('hidden');
        mapsListView.classList.remove('hidden');
    });

    // 4. Gestion du Zoom
    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.25, 3);
        updateZoomTransform();
    });

    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.25, 1);
        updateZoomTransform();
    });

    zoomResetBtn.addEventListener('click', () => {
        currentZoom = 1;
        updateZoomTransform();
    });

    function updateZoomTransform() {
        mapWrapper.style.transform = `scale(${currentZoom})`;
    }

    // 5. Charger et afficher les spots
    async function loadAndRenderSpots() {
        try {
            spotsData = await getSpotsByMap(currentMap.id);
        } catch (err) {
            console.error('Erreur getSpotsByMap:', err);
            spotsData = [];
        }
        renderSpots();
    }

    function renderSpots() {
        spotsLayer.innerHTML = '';
        spotsCount.innerText = `${spotsData.length} SPOTS DE DONJONS`;

        spotsData.forEach(spot => {
            const elem = document.createElement('div');
            elem.className = 'dungeon-spot';
            elem.style.left = `${spot.x}%`;
            elem.style.top = `${spot.y}%`;
            elem.dataset.id = spot.id;

            const timerLabel = document.createElement('div');
            timerLabel.className = 'spot-timer-label hidden';
            elem.appendChild(timerLabel);

            // Clic sur un spot pour lancer un timer de 1 min 30 (90 secondes)
            elem.addEventListener('click', async (e) => {
                e.stopPropagation();
                const now = Date.now();
                const respawnTime = now + 90 * 1000; // 90 secondes en millisecondes

                try {
                    await updateSpotTimer(spot.id, respawnTime);
                    // La mise à jour sera répercutée pour tous via le Realtime Supabase
                } catch (err) {
                    console.error('Erreur lors du lancement du timer:', err);
                }
            });

            spotsLayer.appendChild(elem);
        });

        startGlobalTimerLoop();
    }

    // Boucle globale pour actualiser l'affichage des timers visuels
    function startGlobalTimerLoop() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const now = Date.now();
            spotsData.forEach(spot => {
                const elem = spotsLayer.querySelector(`[data-id='${spot.id}']`);
                if (!elem) return;
                const label = elem.querySelector('.spot-timer-label');

                if (spot.respawn_at && spot.respawn_at > now) {
                    const remainingSeconds = Math.ceil((spot.respawn_at - now) / 1000);
                    const mins = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;
                    label.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    label.classList.remove('hidden');
                    elem.classList.add('on-cooldown');
                } else {
                    label.classList.add('hidden');
                    elem.classList.remove('on-cooldown');
                }
            });
        }, 1000);
    }

    // 6. Synchronisation en Direct (Realtime Supabase)
    function setupRealtimeSync() {
        leaveRealtimeChannel();

        realtimeChannel = supabaseClient
            .channel(`public:spots:map_id=eq.${currentMap.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'spots',
                    filter: `map_id=eq.${currentMap.id}`
                },
                (payload) => {
                    const updatedSpot = payload.new;
                    const index = spotsData.findIndex(s => s.id === updatedSpot.id);
                    if (index !== -1) {
                        spotsData[index] = updatedSpot;
                    }
                }
            )
            .subscribe();
    }

    function leaveRealtimeChannel() {
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
});

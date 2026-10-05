document.addEventListener('DOMContentLoaded', () => {
    const mapImg = document.getElementById('albion-map-img');
    const mapContainer = document.getElementById('albion-map-container');
    const markersLayer = document.getElementById('markers-layer');
    const mapSelect = document.getElementById('map-select');
    const markerTitleInput = document.getElementById('marker-title');
    const markerTypeSelect = document.getElementById('marker-type');
    
    // Preset des maps Albion
    const mapUrls = {
        martlock: "https://render.albiononline.com/v1/map/Martlock.png",
        bridgewatch: "https://render.albiononline.com/v1/map/Bridgewatch.png",
        lymhurst: "https://render.albiononline.com/v1/map/Lymhurst.png",
        fortsterling: "https://render.albiononline.com/v1/map/FortSterling.png",
        thetford: "https://render.albiononline.com/v1/map/Thetford.png"
    };

    // Changer d'image de map
    mapSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (mapUrls[val]) {
            mapImg.src = mapUrls[val];
        }
    });

    // Clic sur l'image pour placer un marqueur
    mapContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('marker-pin')) return; // Éviter de dédoubler sur un marqueur

        const rect = mapImg.getBoundingClientRect();
        // Calcul du pourcentage relatif sur l'image
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        const title = markerTitleInput.value.trim() || 'Marqueur';
        const type = markerTypeSelect.value;

        addMarkerToMap(xPercent, yPercent, title, type);
    });

    function addMarkerToMap(x, y, title, type) {
        const pin = document.createElement('div');
        pin.className = `marker-pin ${type}`;
        pin.style.left = `${x}%`;
        pin.style.top = `${y}%`;
        pin.title = `${title} (${type})`;
        
        // Icônes simples selon le type
        const icons = {
            resource: '🌾',
            chest: '🎁',
            boss: '💀',
            hideout: '🏰',
            other: '📌'
        };
        pin.innerText = icons[type] || '📌';

        // Supprimer au clic droit ou double clic
        pin.addEventListener('dblclick', () => {
            if (confirm(`Supprimer le marqueur "${title}" ?`)) {
                pin.remove();
            }
        });

        markersLayer.appendChild(pin);
    }
});

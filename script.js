class KyivCafeApp {
    constructor() {
        this.map = null;
        this.cafes = [];
        this.markers = [];
        this.currentFilter = 'all';
        this.selectedCafe = null;
        
        this.init();
    }

    init() {
        this.initMap();
        this.setupEventListeners();
        this.loadCafes();
    }

    initMap() {
        this.map = L.map('map').setView([50.4501, 30.5234], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);
    }

    setupEventListeners() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        const modal = document.getElementById('modal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.getElementById('btn-visited').addEventListener('click', () => {
            this.setCafeStatus('visited');
        });

        document.getElementById('btn-disliked').addEventListener('click', () => {
            this.setCafeStatus('disliked');
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            this.setCafeStatus('new');
        });
    }

    async loadCafes() {
        this.showLoading(true);
        
        try {
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["amenity"="cafe"](50.1,30.0,50.8,31.0);
                  way["amenity"="cafe"](50.1,30.0,50.8,31.0);
                  relation["amenity"="cafe"](50.1,30.0,50.8,31.0);
                );
                out geom;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(overpassQuery)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.processCafes(data.elements);
            
        } catch (error) {
            console.error('Помилка завантаження кафе:', error);
            this.showError('Не вдалося завантажити кафе. Перевірте підключення до інтернету.');
        } finally {
            this.showLoading(false);
        }
    }

    processCafes(elements) {
        this.cafes = elements
            .filter(element => element.lat && element.lon)
            .map(element => {
                const cafe = {
                    id: element.id,
                    lat: element.lat,
                    lon: element.lon,
                    name: element.tags?.name || 'Безназви кафе',
                    address: this.formatAddress(element.tags),
                    phone: element.tags?.phone || '',
                    website: element.tags?.website || '',
                    opening_hours: element.tags?.opening_hours || '',
                    cuisine: element.tags?.cuisine || '',
                    wifi: element.tags?.wifi || '',
                    status: this.getCafeStatus(element.id)
                };
                return cafe;
            });

        this.createMarkers();
        this.updateCounter();
    }

    formatAddress(tags) {
        const parts = [];
        if (tags?.['addr:street']) parts.push(`вул. ${tags['addr:street']}`);
        if (tags?.['addr:housenumber']) parts.push(tags['addr:housenumber']);
        if (tags?.['addr:city']) parts.push(tags['addr:city']);
        return parts.join(', ') || 'Адреса не вказана';
    }

    getCafeStatus(cafeId) {
        const saved = localStorage.getItem('kyiv-cafe-statuses');
        if (!saved) return 'new';
        
        try {
            const statuses = JSON.parse(saved);
            return statuses[cafeId] || 'new';
        } catch {
            return 'new';
        }
    }

    setCafeStatus(status) {
        if (!this.selectedCafe) return;

        this.selectedCafe.status = status;
        
        const saved = localStorage.getItem('kyiv-cafe-statuses');
        let statuses = {};
        
        try {
            statuses = saved ? JSON.parse(saved) : {};
        } catch {
            statuses = {};
        }
        
        statuses[this.selectedCafe.id] = status;
        localStorage.setItem('kyiv-cafe-statuses', JSON.stringify(statuses));

        this.updateMarkerIcon(this.selectedCafe);
        this.updateCounter();
        this.applyFilter();
        this.closeModal();
    }

    createMarkers() {
        this.clearMarkers();
        
        this.cafes.forEach(cafe => {
            const marker = L.marker([cafe.lat, cafe.lon], {
                icon: this.getMarkerIcon(cafe.status)
            });
            
            marker.cafe = cafe;
            
            marker.on('click', () => {
                this.showCafeModal(cafe);
            });

            this.markers.push(marker);
        });

        this.applyFilter();
    }

    getMarkerIcon(status) {
        const colors = {
            'new': '#28a745',      // Зелений
            'visited': '#007bff',   // Синій
            'disliked': '#dc3545'  // Червоний
        };

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: ${colors[status] || colors.new};
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
            "></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
    }

    updateMarkerIcon(cafe) {
        const marker = this.markers.find(m => m.cafe.id === cafe.id);
        if (marker) {
            marker.setIcon(this.getMarkerIcon(cafe.status));
        }
    }

    showCafeModal(cafe) {
        this.selectedCafe = cafe;
        
        document.getElementById('modal-title').textContent = cafe.name;
        
        let info = `<p><strong>Адреса:</strong> ${cafe.address}</p>`;
        if (cafe.phone) info += `<p><strong>Телефон:</strong> ${cafe.phone}</p>`;
        if (cafe.opening_hours) info += `<p><strong>Режим роботи:</strong> ${cafe.opening_hours}</p>`;
        if (cafe.cuisine) info += `<p><strong>Кухня:</strong> ${cafe.cuisine}</p>`;
        if (cafe.wifi) info += `<p><strong>WiFi:</strong> ${cafe.wifi}</p>`;
        if (cafe.website) info += `<p><strong>Веб-сайт:</strong> <a href="${cafe.website}" target="_blank">${cafe.website}</a></p>`;
        
        const statusText = {
            'new': 'Нове кафе',
            'visited': 'Відвідане',
            'disliked': 'Не подобається'
        };
        info += `<p><strong>Статус:</strong> ${statusText[cafe.status]}</p>`;
        
        document.getElementById('modal-info').innerHTML = info;
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
        this.selectedCafe = null;
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.applyFilter();
    }

    applyFilter() {
        this.clearMarkersFromMap();
        
        const filteredMarkers = this.markers.filter(marker => {
            const status = marker.cafe.status;
            
            switch (this.currentFilter) {
                case 'new':
                    return status === 'new';
                case 'visited':
                    return status === 'visited';
                case 'disliked':
                    return status === 'disliked';
                case 'all':
                default:
                    return true;
            }
        });

        filteredMarkers.forEach(marker => {
            marker.addTo(this.map);
        });
    }

    clearMarkersFromMap() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
    }

    clearMarkers() {
        this.clearMarkersFromMap();
        this.markers = [];
    }

    updateCounter() {
        const visitedCount = this.cafes.filter(cafe => cafe.status === 'visited').length;
        const totalCount = this.cafes.length;
        
        document.getElementById('counter-text').textContent = 
            `Відвідано ${visitedCount} з ${totalCount} кафе`;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div style="color: #dc3545; text-align: center;">
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Спробувати ще раз</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KyivCafeApp();
});
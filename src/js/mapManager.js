/**
 * MapManager - Управление картой Leaflet
 * Отвечает за инициализацию карты, стилизацию и отображение слоев
 */

export class MapManager {
    constructor(containerId, geoData) {
        this.containerId = containerId;
        this.geoData = geoData;
        this.map = null;
        this.geojsonLayer = null;
        this.cadastreLayers = {};
        this.foundLayers = [];
        this.hoveredLayers = [];
        
        // Стили
        this.styles = {
            default: { 
                color: "#bce139", 
                weight: 2, 
                opacity: 0.9, 
                fill: true, 
                fillColor: "#fff", 
                fillOpacity: 0, 
                interactive: false 
            },
            hover: { 
                color: "#e63a46", 
                weight: 4, 
                opacity: 1, 
                fill: true, 
                fillColor: "#fff", 
                fillOpacity: 0.2, 
                interactive: false 
            },
            found: { 
                color: "#00d2ff", 
                weight: 5, 
                opacity: 1, 
                fill: true, 
                fillColor: "#00d2ff", 
                fillOpacity: 0.4, 
                interactive: false 
            },
            cadastre: { 
                color: "#ff0000", 
                weight: 1, 
                opacity: 0.8, 
                fill: true, 
                fillColor: "#ff0000", 
                fillOpacity: 0, 
                interactive: false 
            }
        };

        this.init();
    }

    /**
     * Инициализирует карту
     */
    init() {
        // Создание карты
        this.map = L.map(this.containerId, { 
            attributionControl: false, 
            zoomControl: false 
        }).setView([53.038, 39.022], 14);

        // Добавление зума для десктопа
        if (window.innerWidth > 768) {
            L.control.zoom({ position: 'topright' }).addTo(this.map);
        }

        // Добавление базового слоя
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19, 
            keepBuffer: 8, 
            updateWhenZooming: false
        }).addTo(this.map);

        // Создание панелей
        this.createPanes();

        // Загрузка данных
        if (this.geoData && this.geoData.features.length > 0) {
            this.loadGeoJson(this.geoData);
        }

        return this;
    }

    /**
     * Создает панели для слоев
     */
    createPanes() {
        // Основная панель
        this.map.createPane('mainPane');
        this.map.getPane('mainPane').style.zIndex = 400;

        // Кадастровая панель
        this.map.createPane('cadastrePane');
        this.map.getPane('cadastrePane').style.zIndex = 450;
        this.map.getPane('cadastrePane').style.pointerEvents = 'none';
    }

    /**
     * Загружает GeoJSON данные на карту
     */
    loadGeoJson(geoData) {
        this.geojsonLayer = L.geoJSON(geoData, {
            style: this.styles.default,
            pane: 'mainPane',
            onEachFeature: (feature, layer) => {
                // Инициализация флага поиска
                layer.isFound = false;
                layer.isHovered = false;

                // Добавление метки с номером участка
                if (feature.properties?.fieldId) {
                    layer.bindTooltip(String(feature.properties.fieldId), {
                        permanent: true, 
                        direction: 'center', 
                        className: 'permanent-label'
                    });
                }
            }
        }).addTo(this.map);

        // Центрирование карты по границам данных
        this.map.fitBounds(this.geojsonLayer.getBounds(), { padding: [50, 50] });

        return this.geojsonLayer;
    }

    /**
     * Загружает кадастровый слой
     */
    loadCadastreLayer(cadastreData, layerName = 'default') {
        if (!cadastreData || !cadastreData.features) return null;

        const layer = L.geoJSON(cadastreData, { 
            style: this.styles.cadastre, 
            pane: 'cadastrePane' 
        }).addTo(this.map);

        this.cadastreLayers[layerName] = layer;
        return layer;
    }

    /**
     * Применяет стиль "найдено" к слою
     */
    setFoundStyle(layer) {
        if (!layer) return;
        layer.isFound = true;
        layer.setStyle(this.styles.found);
        layer.bringToFront();
        
        if (!this.foundLayers.includes(layer)) {
            this.foundLayers.push(layer);
        }
    }

    /**
     * Сбрасывает стили найденных слоев
     */
    resetFoundStyles() {
        this.foundLayers.forEach(layer => {
            layer.isFound = false;
            this.geojsonLayer.resetStyle(layer);
        });
        this.foundLayers = [];
    }

    /**
     * Применяет стиль наведения к слою
     */
    setHoverStyle(layer) {
        if (!layer) return;
        
        // Если слой уже найден, сохраняем это состояние
        if (layer.isFound) {
            layer.setStyle(this.styles.found);
        } else {
            layer.setStyle(this.styles.hover);
        }
        layer.bringToFront();
        layer.isHovered = true;

        if (!this.hoveredLayers.includes(layer)) {
            this.hoveredLayers.push(layer);
        }
    }

    /**
     * Сбрасывает стили наведения
     */
    resetHoverStyles(excludeFound = true) {
        this.hoveredLayers.forEach(layer => {
            layer.isHovered = false;
            
            // Если слой найден, не сбрасываем его стиль
            if (excludeFound && layer.isFound) {
                layer.setStyle(this.styles.found);
            } else {
                this.geojsonLayer.resetStyle(layer);
            }
        });
        this.hoveredLayers = [];
    }

    /**
     * Находит полигоны под точкой
     */
    getPolygonsUnderPoint(lngLat) {
        if (!this.geojsonLayer) return [];

        const point = [lngLat.lng, lngLat.lat];
        const found = [];

        this.geojsonLayer.eachLayer(layer => {
            const type = layer.feature.geometry.type;
            
            if (type === 'Polygon') {
                if (this.pointInPolygon(point, layer.feature.geometry.coordinates[0])) {
                    found.push(layer);
                }
            } else if (type === 'MultiPolygon') {
                for (const polygon of layer.feature.geometry.coordinates) {
                    if (this.pointInPolygon(point, polygon[0])) {
                        found.push(layer);
                        break;
                    }
                }
            }
        });

        return found;
    }

    /**
     * Проверяет, находится ли точка внутри полигона
     */
    pointInPolygon(point, vs) {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const [xi, yi] = vs[i];
            const [xj, yj] = vs[j];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Центрирует карту на указанных границах
     */
    fitBounds(bounds, padding = [50, 50]) {
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding });
        }
    }

    /**
     * Получает экземпляр карты
     */
    getMap() {
        return this.map;
    }

    /**
     * Получает GeoJSON слой
     */
    getGeojsonLayer() {
        return this.geojsonLayer;
    }

    /**
     * Переключает видимость слоя
     */
    toggleLayerVisibility(layer) {
        if (!layer) return;
        
        if (this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
        } else {
            layer.addTo(this.map);
        }
    }

    /**
     * Очищает все выделенные слои
     */
    clearHighlights() {
        this.resetHoverStyles(false);
        this.resetFoundStyles();
    }

    /**
     * Обновляет карту при изменении размера окна
     */
    invalidateSize() {
        this.map.invalidateSize();
    }
}

export default MapManager;

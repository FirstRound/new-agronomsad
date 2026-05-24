/**
 * Layer Manager - Управление слоями карты
 */
export class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.baseLayers = {};
        this.overlayLayers = {};
    }

    addBaseLayer(name, layer) {
        this.baseLayers[name] = layer;
        return layer;
    }

    addOverlayLayer(name, layer) {
        this.overlayLayers[name] = layer;
        this.layers[name] = layer;
        return layer;
    }

    toggleLayer(name, visible) {
        if (!this.layers[name]) return false;

        if (visible) {
            if (!this.map.hasLayer(this.layers[name])) {
                this.map.addLayer(this.layers[name]);
            }
        } else {
            if (this.map.hasLayer(this.layers[name])) {
                this.map.removeLayer(this.layers[name]);
            }
        }
        return true;
    }

    isLayerVisible(name) {
        if (!this.layers[name]) return false;
        return this.map.hasLayer(this.layers[name]);
    }

    setBaseLayer(name) {
        if (!this.baseLayers[name]) return false;

        // Удаляем все базовые слои
        Object.values(this.baseLayers).forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        // Добавляем выбранный
        this.map.addLayer(this.baseLayers[name]);
        return true;
    }

    createLayerControl() {
        const control = L.control.layers(this.baseLayers, this.overlayLayers, {
            position: 'topright',
            collapsed: true
        }).addTo(this.map);

        return control;
    }

    getLayerNames() {
        return Object.keys(this.layers);
    }

    removeAllLayers() {
        Object.values(this.layers).forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });
    }

    destroy() {
        this.removeAllLayers();
        this.layers = {};
        this.baseLayers = {};
        this.overlayLayers = {};
    }
}

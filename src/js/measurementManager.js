/**
 * Measurement Manager - Инструменты измерения расстояний и площадей
 */
export class MeasurementManager {
    constructor(map) {
        this.map = map;
        this.measurements = [];
        this.isMeasuring = false;
        this.tempLine = null;
        this.tempPolygon = null;
        this.markers = [];
        this.onUpdate = null;
        
        this.initEvents();
    }

    initEvents() {
        this.map.on('click', (e) => this.handleClick(e));
        this.map.on('mousemove', (e) => this.handleMouseMove(e));
        this.map.on('dblclick', () => this.finishMeasurement());
        this.map.on('contextmenu', () => this.cancelMeasurement());
    }

    startMeasurement() {
        this.isMeasuring = true;
        this.measurements = [];
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
        
        if (this.tempLine) this.map.removeLayer(this.tempLine);
        if (this.tempPolygon) this.map.removeLayer(this.tempPolygon);
        
        this.map.getContainer().style.cursor = 'crosshair';
        this.notifyUpdate();
    }

    handleClick(e) {
        if (!this.isMeasuring) return;

        const latlng = e.latlng;
        this.measurements.push(latlng);

        // Добавляем маркер
        const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#bce139',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);
        this.markers.push(marker);

        // Обновляем линию
        if (this.measurements.length > 1) {
            if (this.tempLine) {
                this.tempLine.setLatLngs(this.measurements);
            } else {
                this.tempLine = L.polyline(this.measurements, {
                    color: '#bce139',
                    weight: 3,
                    dashArray: '10, 10'
                }).addTo(this.map);
            }

            // Обновляем полигон для площади
            if (this.measurements.length >= 3) {
                if (this.tempPolygon) {
                    this.tempPolygon.setLatLngs(this.measurements);
                } else {
                    this.tempPolygon = L.polygon(this.measurements, {
                        color: '#bce139',
                        weight: 2,
                        fillOpacity: 0.2
                    }).addTo(this.map);
                }
            }
        }

        this.notifyUpdate();
    }

    handleMouseMove(e) {
        if (!this.isMeasuring || this.measurements.length === 0) return;

        const points = [...this.measurements, e.latlng];
        
        if (this.tempLine && this.measurements.length > 0) {
            this.tempLine.setLatLngs(points);
        }
    }

    finishMeasurement() {
        if (!this.isMeasuring || this.measurements.length < 2) return;

        this.isMeasuring = false;
        this.map.getContainer().style.cursor = '';
        
        // Сохраняем финальные слои
        if (this.tempLine) {
            this.tempLine.setStyle({ dashArray: '' });
        }
        
        this.notifyUpdate();
    }

    cancelMeasurement() {
        if (!this.isMeasuring) return;

        this.isMeasuring = false;
        this.measurements = [];
        
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
        
        if (this.tempLine) {
            this.map.removeLayer(this.tempLine);
            this.tempLine = null;
        }
        
        if (this.tempPolygon) {
            this.map.removeLayer(this.tempPolygon);
            this.tempPolygon = null;
        }
        
        this.map.getContainer().style.cursor = '';
        this.notifyUpdate();
    }

    clearMeasurements() {
        this.cancelMeasurement();
    }

    getDistance() {
        if (this.measurements.length < 2) return 0;
        
        let distance = 0;
        for (let i = 1; i < this.measurements.length; i++) {
            distance += this.map.distance(this.measurements[i-1], this.measurements[i]);
        }
        return distance;
    }

    getArea() {
        if (this.measurements.length < 3) return 0;
        
        const latlngs = this.measurements.map(ll => [ll.lat, ll.lng]);
        return L.GeometryUtil.geodesicArea(latlngs);
    }

    formatDistance(meters) {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} км`;
        }
        return `${Math.round(meters)} м`;
    }

    formatArea(sqMeters) {
        if (sqMeters >= 10000) {
            return `${(sqMeters / 10000).toFixed(2)} га`;
        }
        return `${Math.round(sqMeters)} м²`;
    }

    notifyUpdate() {
        if (this.onUpdate) {
            this.onUpdate({
                isMeasuring: this.isMeasuring,
                distance: this.getDistance(),
                area: this.getArea(),
                pointsCount: this.measurements.length
            });
        }
    }

    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    destroy() {
        this.clearMeasurements();
        this.map.off('click');
        this.map.off('mousemove');
        this.map.off('dblclick');
        this.map.off('contextmenu');
    }
}

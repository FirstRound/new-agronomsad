/**
 * Cache Manager - Кэширование данных в localStorage и IndexedDB
 */
export class CacheManager {
    constructor(prefix = 'agro_cache_') {
        this.prefix = prefix;
        this.maxAge = 24 * 60 * 60 * 1000; // 24 часа
    }

    // localStorage методы
    set(key, data, maxAge = null) {
        try {
            const item = {
                data: data,
                timestamp: Date.now(),
                maxAge: maxAge || this.maxAge
            };
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    get(key) {
        try {
            const itemStr = localStorage.getItem(this.prefix + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            const now = Date.now();

            // Проверяем актуальность
            if (now - item.timestamp > item.maxAge) {
                this.remove(key);
                return null;
            }

            return item.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Cache remove error:', error);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    // Методы для кэширования GeoJSON
    cacheGeoJSON(geoData, version = 'v1') {
        return this.set(`geojson_${version}`, geoData, 7 * 24 * 60 * 60 * 1000); // 7 дней
    }

    getCachedGeoJSON(version = 'v1') {
        return this.get(`geojson_${version}`);
    }

    // Кэширование статистики
    cacheStats(stats) {
        return this.set('stats', stats, 5 * 60 * 1000); // 5 минут
    }

    getCachedStats() {
        return this.get('stats');
    }

    // Кэширование погоды
    cacheWeather(weather) {
        return this.set('weather', weather, 10 * 60 * 1000); // 10 минут
    }

    getCachedWeather() {
        return this.get('weather');
    }

    // Статистика кэша
    getCacheInfo() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        let totalSize = 0;
        const items = {};

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            totalSize += value.length;
            items[key] = {
                size: value.length,
                timestamp: JSON.parse(value).timestamp
            };
        });

        return {
            itemCount: keys.length,
            totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
            items: items
        };
    }
}

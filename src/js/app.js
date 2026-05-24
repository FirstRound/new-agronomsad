/**
 * Гео-сервис: Собрано в саду v2.0
 * Модульное веб-приложение для визуализации и управления агрономическими данными
 */

import { DataManager } from './dataManager.js';
import { MapManager } from './mapManager.js';
import { SearchManager } from './searchManager.js';
import { ExportManager } from './exportManager.js';
import { TooltipManager } from './tooltipManager.js';
import { FilterManager } from './filterManager.js';
import { StatsManager } from './statsManager.js';
import { MeasurementManager } from './measurementManager.js';
import { WeatherManager } from './weatherManager.js';
import { LayerManager } from './layerManager.js';
import { QRManager } from './qrManager.js';
import { NotificationManager } from './notificationManager.js';
import { CacheManager } from './cacheManager.js';

class AgroApp {
    constructor() {
        this.dataManager = new DataManager();
        this.cacheManager = new CacheManager();
        this.mapManager = null;
        this.searchManager = null;
        this.exportManager = null;
        this.tooltipManager = null;
        this.filterManager = null;
        this.statsManager = null;
        this.measurementManager = null;
        this.weatherManager = null;
        this.layerManager = null;
        this.qrManager = null;
        this.notificationManager = null;
        this.isInitialized = false;
        this.currentTheme = 'dark';
    }

    async init() {
        try {
            // Загрузка и обработка данных (с кэшем)
            const cachedData = this.cacheManager.getCachedGeoJSON();
            if (cachedData) {
                this.dataManager.geoData = cachedData;
                this.dataManager.parcels = cachedData.features || [];
                console.log('Данные загружены из кэша');
            } else {
                await this.dataManager.loadAllData();
                this.cacheManager.cacheGeoJSON(this.dataManager.geoData);
            }
            
            // Инициализация карты
            this.mapManager = new MapManager('map', this.dataManager.geoData);
            
            // Инициализация менеджеров
            this.searchManager = new SearchManager(
                'search-input', 
                'clear-btn', 
                this.mapManager, 
                this.dataManager
            );
            
            this.exportManager = new ExportManager(this.dataManager);
            
            this.tooltipManager = new TooltipManager(
                'smart-tooltip', 
                this.mapManager, 
                this.dataManager
            );
            
            this.filterManager = new FilterManager(
                'filter-panel',
                this.mapManager,
                this.dataManager
            );
            
            this.statsManager = new StatsManager(
                'stats-panel',
                this.dataManager
            );
            
            // Новые менеджеры v2.0
            this.measurementManager = new MeasurementManager(this.mapManager.getMap());
            this.weatherManager = new WeatherManager();
            this.layerManager = new LayerManager(this.mapManager.getMap());
            this.qrManager = new QRManager();
            this.notificationManager = new NotificationManager('notification', 'notification-text');
            
            // Инициализация UI компонентов
            this.initUI();
            this.initEventListeners();
            
            // Обновление статистики
            this.updateStats();
            
            // Загрузка погоды
            this.weatherManager.updateUI(
                document.getElementById('weather-temp'),
                document.getElementById('weather-desc')
            );
            
            // Привязка глобальных функций для HTML
            window.executeSearch = () => this.searchManager.executeSearch();
            window.clearSearch = () => this.searchManager.clearSearch();
            window.exportToCsv = () => this.exportManager.exportToCsv();
            window.closeSmartTooltip = () => this.tooltipManager.closeTooltip();
            
            // Обработчик Enter для поиска
            document.getElementById('search-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchManager.executeSearch();
            });
            
            this.isInitialized = true;
            console.log('Приложение v2.0 успешно инициализировано');
            this.notificationManager.success('Приложение готово к работе!');
            
            return true;
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.notificationManager.error('Ошибка загрузки приложения');
            return false;
        }
    }

    initUI() {
        // Инициализация QR менеджера
        this.qrManager.init('qr-modal', 'qr-code', 'qr-info');
        
        // Инициализация фильтров
        this.initFilters();
        
        // Восстановление темы
        const savedTheme = localStorage.getItem('agro_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }

    initFilters() {
        const clusterFilter = document.getElementById('cluster-filter');
        const varietyFilter = document.getElementById('variety-filter');
        const ageFilter = document.getElementById('age-filter');
        const ageValue = document.getElementById('age-value');
        
        // Заполнение фильтров
        if (clusterFilter && this.dataManager.parcels) {
            const clusters = [...new Set(this.dataManager.parcels.map(p => p.properties?.cluster).filter(Boolean))];
            clusters.forEach(cluster => {
                const option = document.createElement('option');
                option.value = cluster;
                option.textContent = cluster;
                clusterFilter.appendChild(option);
            });
        }
        
        if (varietyFilter && this.dataManager.parcels) {
            const varieties = [...new Set(this.dataManager.parcels.map(p => p.properties?.variety).filter(Boolean))];
            varieties.forEach(variety => {
                const option = document.createElement('option');
                option.value = variety;
                option.textContent = variety;
                varietyFilter.appendChild(option);
            });
        }
    }

    initEventListeners() {
        // Переключение sidebar
        document.getElementById('toggle-sidebar-btn')?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar?.classList.toggle('collapsed');
        });
        
        // Переключение темы
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Измерения
        document.getElementById('measure-btn')?.addEventListener('click', () => {
            this.toggleMeasurement();
        });
        
        document.getElementById('clear-measure-btn')?.addEventListener('click', () => {
            this.measurementManager?.clearMeasurements();
        });
        
        document.getElementById('close-measure-btn')?.addEventListener('click', () => {
            document.getElementById('measurement-panel')?.classList.remove('active');
        });
        
        // Экспорт
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportManager?.exportToCsv();
        });
        
        document.getElementById('export-csv-btn')?.addEventListener('click', () => {
            this.exportManager?.exportToCsv();
        });
        
        // Печать
        document.getElementById('print-btn')?.addEventListener('click', () => {
            window.print();
        });
        
        // Импорт
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        
        document.getElementById('import-file')?.addEventListener('change', (e) => {
            this.handleImport(e);
        });
        
        // Фильтры
        document.getElementById('cluster-filter')?.addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        document.getElementById('variety-filter')?.addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        document.getElementById('age-filter')?.addEventListener('input', (e) => {
            document.getElementById('age-value').textContent = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Слои
        document.getElementById('layer-parcels')?.addEventListener('change', (e) => {
            this.toggleLayer('parcels', e.target.checked);
        });
        
        document.getElementById('layer-labels')?.addEventListener('change', (e) => {
            this.toggleLayer('labels', e.target.checked);
        });
        
        document.getElementById('layer-trees')?.addEventListener('change', (e) => {
            this.toggleLayer('trees', e.target.checked);
        });
        
        // QR модальное окно
        document.getElementById('close-qr-btn')?.addEventListener('click', () => {
            this.qrManager?.hide();
        });
        
        // Callback для измерений
        this.measurementManager?.setUpdateCallback((data) => {
            this.updateMeasurementUI(data);
        });
    }

    updateStats() {
        const stats = this.statsManager?.calculate();
        if (stats) {
            document.getElementById('stat-total-area').textContent = stats.totalArea.toFixed(1);
            document.getElementById('stat-total-trees').textContent = stats.totalTrees.toLocaleString();
            document.getElementById('stat-clusters').textContent = stats.clusters;
            document.getElementById('stat-varieties').textContent = stats.varieties;
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(this.currentTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('agro_theme', theme);
    }

    toggleMeasurement() {
        const panel = document.getElementById('measurement-panel');
        if (!panel) return;
        
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
            this.measurementManager?.cancelMeasurement();
        } else {
            panel.classList.add('active');
            this.measurementManager?.startMeasurement();
        }
    }

    updateMeasurementUI(data) {
        const distanceEl = document.getElementById('measure-distance');
        const areaEl = document.getElementById('measure-area');
        
        if (distanceEl) {
            distanceEl.textContent = this.measurementManager?.formatDistance(data.distance) || '0 м';
        }
        
        if (areaEl) {
            areaEl.textContent = this.measurementManager?.formatArea(data.area) || '0 м²';
        }
    }

    applyFilters() {
        const cluster = document.getElementById('cluster-filter')?.value || '';
        const variety = document.getElementById('variety-filter')?.value || '';
        const maxAge = parseInt(document.getElementById('age-filter')?.value || '50');
        
        this.filterManager?.apply({ cluster, variety, maxAge });
        this.updateStats();
    }

    resetFilters() {
        document.getElementById('cluster-filter').value = '';
        document.getElementById('variety-filter').value = '';
        document.getElementById('age-filter').value = '50';
        document.getElementById('age-value').textContent = '50';
        
        this.filterManager?.reset();
        this.updateStats();
        this.notificationManager.info('Фильтры сброшены');
    }

    toggleLayer(name, visible) {
        this.layerManager?.toggleLayer(name, visible);
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const geoJSON = JSON.parse(text);
            
            if (!geoJSON.type || geoJSON.type !== 'FeatureCollection') {
                throw new Error('Неверный формат GeoJSON');
            }
            
            this.dataManager.geoData = geoJSON;
            this.dataManager.parcels = geoJSON.features || [];
            
            // Перерисовка карты
            this.mapManager?.clearLayers();
            this.mapManager?.drawParcels(this.dataManager.parcels);
            
            // Обновление фильтров
            this.initFilters();
            this.updateStats();
            
            // Кэширование
            this.cacheManager.cacheGeoJSON(geoJSON);
            
            this.notificationManager.success(`Импортировано ${geoJSON.features.length} участков`);
        } catch (error) {
            console.error('Import error:', error);
            this.notificationManager.error('Ошибка импорта: ' + error.message);
        }
        
        event.target.value = '';
    }

    showParcelQR(parcelData) {
        this.qrManager?.show(parcelData);
    }

    // Публичные методы для внешнего доступа
    getData() {
        return this.dataManager;
    }

    getMap() {
        return this.mapManager?.getMap();
    }

    refreshStats() {
        this.updateStats();
    }
}

// Экспорт экземпляра приложения
export const app = new AgroApp();
export default AgroApp;

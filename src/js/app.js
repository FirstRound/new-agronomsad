/**
 * Гео-сервис: Собрано в саду
 * Модульное веб-приложение для визуализации и управления агрономическими данными
 */

import { DataManager } from './dataManager.js';
import { MapManager } from './mapManager.js';
import { SearchManager } from './searchManager.js';
import { ExportManager } from './exportManager.js';
import { TooltipManager } from './tooltipManager.js';
import { FilterManager } from './filterManager.js';
import { StatsManager } from './statsManager.js';

class AgroApp {
    constructor() {
        this.dataManager = new DataManager();
        this.mapManager = null;
        this.searchManager = null;
        this.exportManager = null;
        this.tooltipManager = null;
        this.filterManager = null;
        this.statsManager = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Загрузка и обработка данных
            await this.dataManager.loadAllData();
            
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
            console.log('Приложение успешно инициализировано');
            
            return true;
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            return false;
        }
    }

    // Публичные методы для внешнего доступа
    getData() {
        return this.dataManager;
    }

    getMap() {
        return this.mapManager?.getMap();
    }

    refreshStats() {
        this.statsManager?.update();
    }
}

// Экспорт экземпляра приложения
export const app = new AgroApp();
export default AgroApp;

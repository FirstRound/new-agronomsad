/**
 * FilterManager - Управление фильтрами
 * Отвечает за фильтрацию данных по различным критериям
 */

export class FilterManager {
    constructor(panelId, mapManager, dataManager) {
        this.panelElement = document.getElementById(panelId);
        this.mapManager = mapManager;
        this.dataManager = dataManager;
        this.activeFilters = {};
        this.isVisible = false;

        if (this.panelElement) {
            this.init();
        }
    }

    /**
     * Инициализирует панель фильтров
     */
    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Рендерит панель фильтров
     */
    render() {
        if (!this.panelElement) return;

        const clusters = this.dataManager.getAllClusters();
        const sorts = this.dataManager.getAllSorts().slice(0, 50); // Ограничим список

        this.panelElement.innerHTML = `
            <div class="filter-panel-content">
                <div class="filter-header">
                    <h3>Фильтры</h3>
                    <button class="filter-close-btn" id="filter-close">×</button>
                </div>
                
                <div class="filter-group">
                    <label for="filter-cluster">Кластер:</label>
                    <select id="filter-cluster">
                        <option value="">Все</option>
                        ${clusters.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label for="filter-sort">Сорт:</label>
                    <select id="filter-sort">
                        <option value="">Все</option>
                        ${sorts.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label for="filter-type">Тип сада:</label>
                    <select id="filter-type">
                        <option value="">Все</option>
                        <option value="Плодоносящее">Плодоносящее</option>
                        <option value="Входящее в плодоношение">Входящее в плодоношение</option>
                        <option value="Молодое дерево">Молодое дерево</option>
                        <option value="Выходящее из плодоношения">Выходящее из плодоношения</option>
                    </select>
                </div>

                <div class="filter-actions">
                    <button id="filter-apply" class="btn-apply">Применить</button>
                    <button id="filter-reset" class="btn-reset">Сбросить</button>
                </div>
            </div>
        `;
    }

    /**
     * Привязывает обработчики событий
     */
    attachEventListeners() {
        if (!this.panelElement) return;

        // Закрытие панели
        this.panelElement.addEventListener('click', (e) => {
            if (e.target.id === 'filter-close') {
                this.hide();
            }
        });

        // Применение фильтров
        document.getElementById('filter-apply')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Сброс фильтров
        document.getElementById('filter-reset')?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    /**
     * Применяет активные фильтры
     */
    applyFilters() {
        const cluster = document.getElementById('filter-cluster')?.value || '';
        const sort = document.getElementById('filter-sort')?.value || '';
        const type = document.getElementById('filter-type')?.value || '';

        this.activeFilters = { cluster, sort, type };

        const filteredFeatures = this.dataManager.filterData(this.activeFilters);
        
        // Обновление отображения на карте
        this.updateMapDisplay(filteredFeatures);

        return filteredFeatures;
    }

    /**
     * Обновляет отображение на карте
     */
    updateMapDisplay(filteredFeatures) {
        const geojsonLayer = this.mapManager.getGeojsonLayer();
        if (!geojsonLayer) return;

        geojsonLayer.eachLayer(layer => {
            const feature = layer.feature;
            const isVisible = filteredFeatures.includes(feature);

            if (isVisible) {
                layer.getElement()?.style.setProperty('display', '', 'important');
                layer.getElement()?.style.setProperty('opacity', '1', 'important');
            } else {
                layer.getElement()?.style.setProperty('display', 'none', 'important');
            }
        });
    }

    /**
     * Сбрасывает все фильтры
     */
    resetFilters() {
        this.activeFilters = {};

        // Сброс значений в UI
        const selects = this.panelElement.querySelectorAll('select');
        selects.forEach(select => select.value = '');

        // Восстановление отображения всех слоев
        const geojsonLayer = this.mapManager.getGeojsonLayer();
        if (geojsonLayer) {
            geojsonLayer.eachLayer(layer => {
                layer.getElement()?.style.setProperty('display', '', 'important');
                layer.getElement()?.style.setProperty('opacity', '1', 'important');
            });
        }
    }

    /**
     * Показывает панель фильтров
     */
    show() {
        if (this.panelElement) {
            this.panelElement.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * Скрывает панель фильтров
     */
    hide() {
        if (this.panelElement) {
            this.panelElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Переключает видимость панели
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Получает текущие активные фильтры
     */
    getActiveFilters() {
        return { ...this.activeFilters };
    }

    /**
     * Проверяет, активны ли какие-либо фильтры
     */
    hasActiveFilters() {
        return Object.values(this.activeFilters).some(v => v !== '');
    }

    /**
     * Устанавливает фильтры программно
     */
    setFilters(filters) {
        this.activeFilters = { ...filters };

        // Обновление UI
        if (filters.cluster && document.getElementById('filter-cluster')) {
            document.getElementById('filter-cluster').value = filters.cluster;
        }
        if (filters.sort && document.getElementById('filter-sort')) {
            document.getElementById('filter-sort').value = filters.sort;
        }
        if (filters.type && document.getElementById('filter-type')) {
            document.getElementById('filter-type').value = filters.type;
        }

        this.applyFilters();
    }
}

export default FilterManager;

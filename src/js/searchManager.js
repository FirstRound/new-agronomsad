/**
 * SearchManager - Управление поиском
 * Отвечает за поиск по номеру участка и сорту
 */

export class SearchManager {
    constructor(searchInputId, clearBtnId, mapManager, dataManager) {
        this.searchInput = document.getElementById(searchInputId);
        this.clearBtn = document.getElementById(clearBtnId);
        this.mapManager = mapManager;
        this.dataManager = dataManager;
        this.lastQuery = '';
    }

    /**
     * Выполняет поиск по запросу
     */
    executeSearch() {
        if (!this.mapManager.getGeojsonLayer()) return;

        const query = (this.searchInput?.value || '').trim().toLowerCase();
        
        // Если запрос пустой, очищаем поиск
        if (!query) {
            this.clearSearch();
            return;
        }

        this.lastQuery = query;
        this.mapManager.resetFoundStyles();

        const bounds = L.latLngBounds();
        let hasResults = false;

        this.mapManager.getGeojsonLayer().eachLayer(layer => {
            const props = layer.feature.properties;
            let isMatch = false;

            // 1. Поиск по номеру участка
            if (props.fieldId && props.fieldId.toLowerCase().includes(query)) {
                isMatch = true;
            }

            // 2. Поиск по сортам в таблице данных
            if (!isMatch && props.tableRows && props.tableRows.length > 0) {
                for (const row of props.tableRows) {
                    if (row.sort && row.sort.toLowerCase().includes(query)) {
                        isMatch = true;
                        break;
                    }
                }
            }

            // Если найдено совпадение
            if (isMatch) {
                this.mapManager.setFoundStyle(layer);

                if (layer.getBounds) {
                    bounds.extend(layer.getBounds());
                } else if (layer.getLatLng) {
                    bounds.extend(layer.getLatLng());
                }
                hasResults = true;
            }
        });

        // Обновление UI
        if (this.clearBtn) {
            this.clearBtn.style.display = 'block';
        }

        if (hasResults) {
            this.mapManager.fitBounds(bounds);
        } else {
            alert('По вашему запросу ничего не найдено. Проверьте правильность номера или сорта.');
        }

        return hasResults;
    }

    /**
     * Очищает визуальные эффекты поиска
     */
    clearSearchVisuals() {
        this.mapManager.resetFoundStyles();
        if (this.clearBtn) {
            this.clearBtn.style.display = 'none';
        }
    }

    /**
     * Полностью очищает поиск
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.lastQuery = '';
        this.clearSearchVisuals();
    }

    /**
     * Получает текущий запрос
     */
    getQuery() {
        return this.lastQuery;
    }

    /**
     * Устанавливает запрос и выполняет поиск
     */
    setQuery(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
        }
        this.executeSearch();
    }

    /**
     * Проверяет, активен ли поиск
     */
    isActive() {
        return this.lastQuery !== '';
    }
}

export default SearchManager;

/**
 * TooltipManager - Управление умными подсказками
 * Отвечает за отображение информации при наведении и клике
 */

export class TooltipManager {
    constructor(tooltipId, mapManager, dataManager) {
        this.tooltipElement = document.getElementById(tooltipId);
        this.mapManager = mapManager;
        this.dataManager = dataManager;
        this.isVisible = false;
        this.currentLayers = [];

        this.initEventListeners();
    }

    /**
     * Инициализирует обработчики событий
     */
    initEventListeners() {
        if (!this.mapManager.getMap()) return;

        const map = this.mapManager.getMap();

        // Обработка движения мыши (для десктопа)
        map.on('mousemove', (e) => {
            if (window.innerWidth <= 768) return;
            
            const layersToHighlight = this.mapManager.getPolygonsUnderPoint(e.latlng);
            this.handleHover(layersToHighlight);
        });

        // Обработка выхода мыши с карты
        map.on('mouseout', () => {
            if (window.innerWidth <= 768) return;
            this.hideTooltip();
            this.mapManager.resetHoverStyles();
        });

        // Обработка клика
        map.on('click', (e) => {
            const layersToHighlight = this.mapManager.getPolygonsUnderPoint(e.latlng);
            
            if (layersToHighlight.length > 0) {
                this.showTooltip(layersToHighlight, e.originalEvent);
            } else {
                this.hideTooltip();
            }
        });
    }

    /**
     * Обрабатывает наведение мыши
     */
    handleHover(layersToHighlight) {
        // Сброс предыдущих выделений (кроме найденных в поиске)
        this.mapManager.resetHoverStyles();

        // Выделение новых слоев
        layersToHighlight.forEach(layer => {
            this.mapManager.setHoverStyle(layer);
        });

        this.currentLayers = layersToHighlight;
    }

    /**
     * Показывает подсказку с информацией
     */
    showTooltip(layersToHighlight, mouseEvent = null) {
        if (!layersToHighlight || layersToHighlight.length === 0) {
            this.hideTooltip();
            return;
        }

        this.currentLayers = layersToHighlight;
        
        // Генерация содержимого
        const content = this.renderContent(layersToHighlight);
        this.tooltipElement.innerHTML = content;

        // Отображение подсказки
        this.tooltipElement.style.display = 'block';
        this.isVisible = true;

        // Позиционирование для десктопа
        if (window.innerWidth > 768 && mouseEvent) {
            this.positionTooltip(mouseEvent.clientX, mouseEvent.clientY);
        }

        // Выделение слоев
        layersToHighlight.forEach(layer => {
            this.mapManager.setHoverStyle(layer);
        });
    }

    /**
     * Рендерит содержимое подсказки
     */
    renderContent(layersToHighlight) {
        return layersToHighlight.map((layer, index) => {
            const props = layer.feature.properties;
            const rows = props.tableRows || [];
            
            // Кнопка закрытия только для первого элемента
            const closeBtn = index === 0 
                ? '<button class="tooltip-close-btn" onclick="closeSmartTooltip()">×</button>' 
                : '';

            let html = `
                <div class="tooltip-header">
                    <span>Участок ${props.fieldId}</span>
                    ${closeBtn}
                </div>
                <div class="tooltip-body">
            `;

            if (rows.length > 0) {
                rows.forEach(row => {
                    html += '<div class="tooltip-data-block">';
                    
                    if (row.sort !== '—') {
                        html += this.renderDataRow('Сорт:', row.sort);
                    }
                    if (row.rootstock !== '—') {
                        html += this.renderDataRow('Подвой:', row.rootstock);
                    }
                    if (row.year !== '—') {
                        html += this.renderDataRow('Год посадки:', row.year);
                    }
                    if (row.areaFact !== '—') {
                        html += this.renderDataRow('Площадь:', `${row.areaFact} га`);
                    }
                    if (row.trees !== '—') {
                        html += this.renderDataRow('Деревьев:', `${row.trees} шт.`);
                    }
                    if (row.type) {
                        html += this.renderDataRow('Тип:', row.type);
                    }
                    if (row.category) {
                        html += this.renderDataRow('Категория:', row.category);
                    }
                    
                    html += '</div>';
                });
            } else {
                html += '<div class="data-empty">В таблице нет данных по кварталу ' + props.fieldId + '</div>';
            }

            html += '</div>';
            return html;
        }).join('<div style="height: 6px; background: #e0e0e0;"></div>');
    }

    /**
     * Рендерит строку данных
     */
    renderDataRow(label, value) {
        return `
            <div class="data-row">
                <span class="data-label">${label}</span>
                <span class="data-value">${value}</span>
            </div>
        `;
    }

    /**
     * Позиционирует подсказку относительно курсора
     */
    positionTooltip(mouseX, mouseY) {
        const rect = this.tooltipElement.getBoundingClientRect();
        let posX = mouseX + 20;
        let posY = mouseY + 20;

        // Проверка границ экрана
        if (posY + rect.height > window.innerHeight) {
            posY = mouseY - rect.height - 20;
        }
        if (posX + rect.width > window.innerWidth) {
            posX = mouseX - rect.width - 20;
        }
        if (posY < 0) {
            posY = 20;
        }
        if (posX < 0) {
            posX = 20;
        }

        this.tooltipElement.style.transform = `translate(${posX}px, ${posY}px)`;
    }

    /**
     * Скрывает подсказку
     */
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
        this.isVisible = false;
        this.currentLayers = [];
        
        // Сброс выделения (кроме найденных в поиске)
        this.mapManager.resetHoverStyles();
    }

    /**
     * Закрывает подсказку (публичный метод)
     */
    closeTooltip() {
        this.hideTooltip();
    }

    /**
     * Проверяет, видима ли подсказка
     */
    getVisibility() {
        return this.isVisible;
    }

    /**
     * Получает текущие выделенные слои
     */
    getCurrentLayers() {
        return this.currentLayers;
    }

    /**
     * Обновляет позицию подсказки (для мобильных устройств)
     */
    updatePosition() {
        if (window.innerWidth <= 768) {
            this.tooltipElement.style.transform = 'none';
        }
    }
}

export default TooltipManager;

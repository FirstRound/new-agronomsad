/**
 * StatsManager - Управление статистикой
 * Отвечает за отображение и обновление статистики
 */

export class StatsManager {
    constructor(panelId, dataManager) {
        this.panelElement = document.getElementById(panelId);
        this.dataManager = dataManager;
        this.stats = {};
        this.isVisible = false;

        if (this.panelElement) {
            this.init();
        }
    }

    /**
     * Инициализирует панель статистики
     */
    init() {
        this.update();
    }

    /**
     * Обновляет статистику
     */
    update() {
        this.stats = this.dataManager.getStats();
        this.render();
    }

    /**
     * Рендерит панель статистики
     */
    render() {
        if (!this.panelElement) return;

        const { totalFeatures, totalArea, totalTrees, byCluster, byType, byCategory } = this.stats;

        this.panelElement.innerHTML = `
            <div class="stats-panel-content">
                <div class="stats-header">
                    <h3>Статистика</h3>
                </div>
                
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Участков:</span>
                        <span class="stat-value">${totalFeatures}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Площадь:</span>
                        <span class="stat-value">${totalArea.toFixed(2)} га</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Деревьев:</span>
                        <span class="stat-value">${this.formatNumber(totalTrees)}</span>
                    </div>
                </div>

                ${this.renderSection('По кластерам', byCluster)}
                ${this.renderSection('По типам', byType)}
                ${this.renderSection('По категориям', byCategory)}
            </div>
        `;
    }

    /**
     * Рендерит секцию статистики
     */
    renderSection(title, data) {
        if (!data || Object.keys(data).length === 0) return '';

        const items = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => `
                <div class="stat-row">
                    <span class="stat-key">${key}</span>
                    <span class="stat-count">${value}</span>
                </div>
            `)
            .join('');

        return `
            <div class="stats-section">
                <h4>${title}</h4>
                ${items}
            </div>
        `;
    }

    /**
     * Форматирует большие числа
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        return String(num);
    }

    /**
     * Показывает панель статистики
     */
    show() {
        if (this.panelElement) {
            this.panelElement.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * Скрывает панель статистики
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
     * Получает текущую статистику
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Экспортирует статистику в объект
     */
    exportStats() {
        return {
            summary: {
                totalFeatures: this.stats.totalFeatures,
                totalArea: this.stats.totalArea,
                totalTrees: this.stats.totalTrees
            },
            byCluster: { ...this.stats.byCluster },
            byType: { ...this.stats.byType },
            byCategory: { ...this.stats.byCategory }
        };
    }

    /**
     * Получает топ кластеров по количеству
     */
    getTopClusters(limit = 5) {
        return Object.entries(this.stats.byCluster)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([cluster, count]) => ({ cluster, count }));
    }

    /**
     * Получает топ типов садов
     */
    getTopTypes(limit = 5) {
        return Object.entries(this.stats.byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([type, count]) => ({ type, count }));
    }
}

export default StatsManager;

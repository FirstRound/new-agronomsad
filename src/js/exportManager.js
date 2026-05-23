/**
 * ExportManager - Управление экспортом данных
 * Отвечает за экспорт данных в CSV/Excel формат
 */

export class ExportManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Экспортирует данные в CSV файл
     */
    exportToCsv(filename = 'agronom_database_full.csv') {
        const exportData = this.dataManager.getExportData();
        
        if (!exportData || exportData.length === 0) {
            alert('Нет данных для выгрузки.');
            return false;
        }

        // Заголовки столбцов
        const headers = [
            'Название (из Карты)',
            'Номер (ID)',
            'Кластер',
            'Сорт',
            'Подвой',
            'Год посадки',
            'Площадь (га)',
            'Кол-во деревьев',
            'Координаты геометрии (WKT)'
        ];

        // Формирование строк CSV
        const rows = exportData.map(row => [
            row.name,
            row.fieldId,
            row.cluster || '—',
            row.sort || '—',
            row.rootstock || '—',
            row.year || '—',
            row.areaFact || '—',
            row.trees || '—',
            row.geometry || 'ОШИБКА ГЕОМЕТРИИ'
        ]);

        // Создание CSV контента с BOM для корректного отображения кириллицы в Excel
        const csvContent = '\uFEFF' + 
            [headers, ...rows]
                .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
                .join('\n');

        // Скачивание файла
        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        
        return true;
    }

    /**
     * Экспортирует данные в JSON файл
     */
    exportToJson(filename = 'agronom_database.json') {
        const exportData = this.dataManager.getExportData();
        
        if (!exportData || exportData.length === 0) {
            alert('Нет данных для выгрузки.');
            return false;
        }

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
        
        return true;
    }

    /**
     * Экспортирует только статистику
     */
    exportStats(filename = 'agronom_stats.csv') {
        const stats = this.dataManager.getStats();
        
        const rows = [
            ['Параметр', 'Значение'],
            ['Всего участков', stats.totalFeatures],
            ['Общая площадь (га)', stats.totalArea.toFixed(2)],
            ['Всего деревьев', stats.totalTrees]
        ];

        // Статистика по кластерам
        for (const [cluster, count] of Object.entries(stats.byCluster)) {
            rows.push([`Кластер ${cluster}`, count]);
        }

        // Статистика по типам
        for (const [type, count] of Object.entries(stats.byType)) {
            rows.push([`Тип: ${type}`, count]);
        }

        const csvContent = '\uFEFF' + 
            rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        
        return true;
    }

    /**
     * Создает и скачивает файл
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Освобождение памяти
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Копирует данные в буфер обмена
     */
    async copyToClipboard() {
        const exportData = this.dataManager.getExportData();
        
        if (!exportData || exportData.length === 0) {
            alert('Нет данных для копирования.');
            return false;
        }

        const headers = ['Название', 'ID', 'Кластер', 'Сорт', 'Подвой', 'Год', 'Площадь', 'Деревья'];
        const rows = exportData.map(row => [
            row.name,
            row.fieldId,
            row.cluster || '—',
            row.sort || '—',
            row.rootstock || '—',
            row.year || '—',
            row.areaFact || '—',
            row.trees || '—'
        ].join('\t'));

        const tabContent = [headers.join('\t'), ...rows].join('\n');

        try {
            await navigator.clipboard.writeText(tabContent);
            alert('Данные скопированы в буфер обмена!');
            return true;
        } catch (err) {
            console.error('Ошибка копирования:', err);
            alert('Не удалось скопировать данные.');
            return false;
        }
    }

    /**
     * Генерирует предварительный просмотр данных
     */
    getPreview(limit = 5) {
        const exportData = this.dataManager.getExportData();
        return exportData.slice(0, limit);
    }

    /**
     * Получает количество записей для экспорта
     */
    getRecordCount() {
        return this.dataManager.getExportData().length;
    }
}

export default ExportManager;

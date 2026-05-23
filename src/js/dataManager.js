/**
 * DataManager - Управление данными приложения
 * Отвечает за загрузку, парсинг и хранение данных GeoJSON и CSV
 */

export class DataManager {
    constructor() {
        this.geoData = null;
        this.tableData = {};
        this.cadastreLayers = {
            rent: null,
            shared: null,
            owned: null
        };
        this.rawFeatures = [];
        this.processedFeatures = [];
    }

    /**
     * Загружает все данные из DOM элементов
     */
    async loadAllData() {
        this.loadCadastreData();
        this.parseTableData();
        this.parseGeoJsonData();
        return this;
    }

    /**
     * Загружает кадастровые слои из script элементов
     */
    loadCadastreData() {
        const cadastreIds = ['cadastre-rent', 'cadastre-shared', 'cadastre-owned'];
        const keys = ['rent', 'shared', 'owned'];

        cadastreIds.forEach((id, index) => {
            try {
                const el = document.getElementById(id);
                if (!el || !el.textContent.trim()) return;
                
                const data = JSON.parse(el.textContent.trim());
                if (data?.features) {
                    this.cadastreLayers[keys[index]] = data;
                }
            } catch (e) {
                console.warn(`Ошибка загрузки кадастрового слоя ${id}:`, e);
            }
        });
    }

    /**
     * Парсит CSV данные из script элемента
     */
    parseTableData() {
        const csvElement = document.getElementById('csv-data');
        if (!csvElement) return;

        const csvText = csvElement.textContent.trim();
        if (!csvText || csvText.length < 50) return;

        const lines = csvText.split(/\r?\n/);
        const tableMap = {};

        // Пропускаем заголовок (i = 1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Разделяем по запятой, учитывая кавычки
            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (parts.length < 2) continue;

            const cleanParts = parts.map(p => p.replace(/^"|"$/g, '').trim());

            const colB = cleanParts[1]; // № квартала
            if (!colB) continue;

            // Извлекаем номер блока (часть после точки)
            const blockNum = colB.includes('.') ? colB.split('.')[1] : colB;

            const rowData = {
                season: cleanParts[0] || '',
                quarterNumber: colB,
                cluster: cleanParts[2] || '',
                sort: cleanParts[3] || '—',
                rootstock: cleanParts[4] || '—',
                year: cleanParts[5] || '—',
                areaFact: cleanParts[6] || '—',
                area: cleanParts[7] || '—',
                plantingSeats: cleanParts[8] || '—',
                trees: cleanParts[9] || '—',
                category: cleanParts[10] || '',
                type: cleanParts[11] || ''
            };

            if (!tableMap[blockNum]) {
                tableMap[blockNum] = [];
            }
            tableMap[blockNum].push(rowData);
        }

        this.tableData = tableMap;
    }

    /**
     * Парсит основные GeoJSON данные и объединяет с табличными данными
     */
    parseGeoJsonData() {
        const el = document.getElementById('main-geojson');
        if (!el) return null;

        const text = el.textContent.trim();
        if (text.length < 50) return null;

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Ошибка парсинга GeoJSON:', e);
            return null;
        }

        const features = [];
        this.rawFeatures = data.features || [];

        for (const feature of data.features) {
            const props = feature.properties || {};
            const rawName = props.name || props.Name || 
                           props.Uchastki_grupo_base || 
                           String(props.OBJECTID) || 'Без номера';

            // Извлекаем идентификатор участка
            let fieldIdentifier = rawName;
            const match = String(rawName).match(/^(\d+)/);
            if (match) {
                fieldIdentifier = match[1];
            }

            const processedFeature = {
                type: 'Feature',
                properties: {
                    ...props,
                    name: rawName,
                    fieldId: fieldIdentifier,
                    tableRows: this.tableData[fieldIdentifier] || []
                },
                geometry: feature.geometry
            };

            features.push(processedFeature);
        }

        this.geoData = {
            type: 'FeatureCollection',
            features: features
        };
        this.processedFeatures = features;

        return this.geoData;
    }

    /**
     * Получает данные по идентификатору участка
     */
    getFeatureData(fieldId) {
        return this.tableData[fieldId] || [];
    }

    /**
     * Получает все уникальные сорта
     */
    getAllSorts() {
        const sorts = new Set();
        for (const rows of Object.values(this.tableData)) {
            for (const row of rows) {
                if (row.sort && row.sort !== '—') {
                    sorts.add(row.sort);
                }
            }
        }
        return Array.from(sorts).sort();
    }

    /**
     * Получает все уникальные кластеры
     */
    getAllClusters() {
        const clusters = new Set();
        for (const rows of Object.values(this.tableData)) {
            for (const row of rows) {
                if (row.cluster) {
                    clusters.add(row.cluster);
                }
            }
        }
        return Array.from(clusters).sort();
    }

    /**
     * Получает статистику по данным
     */
    getStats() {
        const stats = {
            totalFeatures: this.processedFeatures.length,
            totalArea: 0,
            totalTrees: 0,
            byCluster: {},
            byType: {},
            byCategory: {}
        };

        for (const rows of Object.values(this.tableData)) {
            for (const row of rows) {
                // Площадь
                if (row.areaFact && row.areaFact !== '—') {
                    const area = parseFloat(String(row.areaFact).replace(',', '.'));
                    if (!isNaN(area)) {
                        stats.totalArea += area;
                    }
                }

                // Деревья
                if (row.trees && row.trees !== '—') {
                    const trees = parseInt(String(row.trees).replace(/\s/g, ''));
                    if (!isNaN(trees)) {
                        stats.totalTrees += trees;
                    }
                }

                // По кластерам
                if (row.cluster) {
                    stats.byCluster[row.cluster] = (stats.byCluster[row.cluster] || 0) + 1;
                }

                // По типам
                if (row.type) {
                    stats.byType[row.type] = (stats.byType[row.type] || 0) + 1;
                }

                // По категориям
                if (row.category) {
                    stats.byCategory[row.category] = (stats.byCategory[row.category] || 0) + 1;
                }
            }
        }

        return stats;
    }

    /**
     * Фильтрует данные по заданныым критериям
     */
    filterData(filters = {}) {
        const { cluster, sort, type, category } = filters;
        
        return this.processedFeatures.filter(feature => {
            const rows = feature.properties.tableRows || [];
            
            // Если нет табличных данных, проверяем только ID
            if (rows.length === 0) {
                return true;
            }

            // Проверка по каждому ряду данных
            return rows.some(row => {
                if (cluster && row.cluster !== cluster) return false;
                if (sort && !row.sort.toLowerCase().includes(sort.toLowerCase())) return false;
                if (type && row.type !== type) return false;
                if (category && row.category !== category) return false;
                return true;
            });
        });
    }

    /**
     * Экспортирует данные в формат для CSV
     */
    getExportData() {
        const rows = [];
        
        for (const feature of this.processedFeatures) {
            const props = feature.properties;
            
            if (props.tableRows && props.tableRows.length > 0) {
                for (const row of props.tableRows) {
                    rows.push({
                        name: props.name,
                        fieldId: props.fieldId,
                        ...row,
                        geometry: this.generateWkt(feature.geometry)
                    });
                }
            } else {
                rows.push({
                    name: props.name,
                    fieldId: props.fieldId,
                    cluster: '—',
                    sort: '—',
                    rootstock: '—',
                    year: '—',
                    areaFact: '—',
                    trees: '—',
                    geometry: this.generateWkt(feature.geometry)
                });
            }
        }

        return rows;
    }

    /**
     * Генерирует WKT представление геометрии
     */
    generateWkt(geometry) {
        try {
            if (!geometry) return 'ОШИБКА ГЕОМЕТРИИ';
            
            if (geometry.type === 'Polygon') {
                const coords = geometry.coordinates[0]
                    .map(c => `${c[0]} ${c[1]}`)
                    .join(', ');
                return `POLYGON((${coords}))`;
            } else if (geometry.type === 'MultiPolygon') {
                const coords = geometry.coordinates[0][0]
                    .map(c => `${c[0]} ${c[1]}`)
                    .join(', ');
                return `POLYGON((${coords}))`;
            }
        } catch (e) {
            console.warn('Ошибка генерации WKT:', e);
        }
        return 'ОШИБКА ГЕОМЕТРИИ';
    }

    /**
     * Валидирует данные
     */
    validateData() {
        const errors = [];
        const warnings = [];

        for (const feature of this.processedFeatures) {
            const props = feature.properties;

            // Проверка геометрии
            if (!feature.geometry) {
                errors.push(`Отсутствует геометрия для участка ${props.fieldId}`);
                continue;
            }

            // Проверка координат
            if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0];
                if (!coords || coords.length < 3) {
                    errors.push(`Невалидная геометрия для участка ${props.fieldId}`);
                }
            }
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}

export default DataManager;

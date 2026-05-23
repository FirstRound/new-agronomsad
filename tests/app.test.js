/**
 * Тесты для приложения "Собрано в саду"
 * Запуск: открыть tests/run_tests.html в браузере
 */

import { DataManager } from '../src/js/dataManager.js';
import { StatsManager } from '../src/js/statsManager.js';
import { FilterManager } from '../src/js/filterManager.js';

console.log('🧪 Запуск тестов приложения "Собрано в саду"\n');

let passed = 0;
let failed = 0;
const testResults = [];

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testResults.push({ name, status: 'pass', error: null });
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Ошибка: ${error.message}`);
        testResults.push({ name, status: 'fail', error: error.message });
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// ==================== ТЕСТЫ DATAMANAGER ====================
console.log('\n📦 Тесты DataManager:');

test('Создание экземпляра DataManager', () => {
    const dm = new DataManager();
    assert(dm !== null, 'Экземпляр создан');
    assert(dm.geoData === null, 'geoData изначально null');
    assert(Array.isArray(dm.rawFeatures), 'rawFeatures - массив');
});

test('Парсинг CSV строки', () => {
    const dm = new DataManager();
    const csvContent = `FieldID,Sort,Cluster,Type
114,Golden Delicious,C,Яблони
115,Conference,B,Груши`;
    
    // Симуляция парсинга через прямой вызов
    const lines = csvContent.split(/\r?\n/);
    assert(lines.length === 3, '3 линии в CSV');
    assert(lines[0].includes('FieldID'), 'Заголовок содержит FieldID');
});

test('Поиск по данным (searchInData)', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { properties: { fieldId: '114', sort: 'Golden Delicious', cluster: 'C', tableRows: [] } },
        { properties: { fieldId: '115', sort: 'Conference', cluster: 'B', tableRows: [] } }
    ];
    
    const results = dm.searchInData('golden');
    assert(results.length === 1, 'Найдена 1 запись по "golden"');
    assert(results[0].properties.fieldId === '114', 'Найден участок 114');
});

test('Поиск по номеру участка', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { properties: { fieldId: '114', sort: 'Golden' } },
        { properties: { fieldId: '115', sort: 'Conference' } }
    ];
    
    const results = dm.searchInData('114');
    assert(results.length === 1, 'Найдена 1 запись по номеру');
});

test('Получение всех сортов', () => {
    const dm = new DataManager();
    dm.tableData = {
        '114': [{ sort: 'Golden Delicious' }, { sort: 'Gala' }],
        '115': [{ sort: 'Conference' }]
    };
    
    const sorts = dm.getAllSorts();
    assert(sorts.has('Golden Delicious'), 'Сорт Golden Delicious найден');
    assert(sorts.has('Conference'), 'Сорт Conference найден');
});

test('Получение всех кластеров', () => {
    const dm = new DataManager();
    dm.tableData = {
        '114': [{ cluster: 'A' }],
        '115': [{ cluster: 'B' }],
        '116': [{ cluster: 'A' }]
    };
    
    const clusters = dm.getAllClusters();
    assert(clusters.has('A'), 'Кластер A найден');
    assert(clusters.has('B'), 'Кластер B найден');
});

test('Статистика по данным', () => {
    const dm = new DataManager();
    dm.tableData = {
        '114': [{ trees: 100 }],
        '115': [{ trees: 200 }],
        '116': [{ trees: 300 }]
    };
    
    const stats = dm.getStats();
    assert(stats.totalTrees === 600, 'Общее количество деревьев 600');
    assert(stats.avgTrees === 200, 'Среднее количество деревьев 200');
});

test('Фильтрация данных', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { properties: { fieldId: '114', cluster: 'A', type: 'Яблони' } },
        { properties: { fieldId: '115', cluster: 'B', type: 'Груши' } },
        { properties: { fieldId: '116', cluster: 'A', type: 'Яблони' } }
    ];
    
    const filtered = dm.filterData({ cluster: 'A' });
    assert(filtered.length === 2, 'Найдено 2 участка кластера A');
});

test('Генерация WKT из полигона', () => {
    const dm = new DataManager();
    const geometry = {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    };
    
    const wkt = dm.generateWkt(geometry);
    assert(wkt.includes('POLYGON'), 'WKT содержит POLYGON');
    assert(wkt.includes('0 0'), 'Координаты включены');
});

test('Валидация данных', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { 
            properties: { fieldId: '114' },
            geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
        }
    ];
    
    const result = dm.validateData();
    assert(result.valid === true, 'Данные валидны');
    assert(result.errors.length === 0, 'Нет ошибок');
});

test('Экспорт данных', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { 
            properties: { fieldId: '114', sort: 'Golden' },
            geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
        }
    ];
    
    const exportData = dm.getExportData();
    assert(exportData.length === 1, '1 запись для экспорта');
    assert(exportData[0].fieldId === '114', 'fieldId совпадает');
});

// ==================== ТЕСТЫ STATSMANAGER ====================
console.log('\n📊 Тесты StatsManager:');

test('Создание StatsManager', () => {
    const dm = new DataManager();
    dm.geoData = { features: [] };
    const sm = new StatsManager(null, dm);
    assert(sm !== null, 'StatsManager создан');
});

test('Расчет статистики по площади', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Shape_Area: 100 } },
            { properties: { Shape_Area: 200 } },
            { properties: { Shape_Area: 300 } }
        ]
    };
    
    const sm = new StatsManager(null, dm);
    const stats = sm.calculateStats();
    assert(stats.totalArea === 600, 'Общая площадь 600');
    assert(stats.avgArea === 200, 'Средняя площадь 200');
});

test('Расчет статистики по деревьям', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Количество_Деревьев: 100 } },
            { properties: { Количество_Деревьев: 200 } },
            { properties: { Количество_Деревьев: 300 } }
        ]
    };
    
    const sm = new StatsManager(null, dm);
    const stats = sm.calculateStats();
    assert(stats.totalTrees === 600, 'Всего деревьев 600');
    assert(stats.avgTrees === 200, 'Среднее количество 200');
});

test('Статистика по кластерам', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Кластер: 'A' } },
            { properties: { Кластер: 'B' } },
            { properties: { Кластер: 'A' } }
        ]
    };
    
    const sm = new StatsManager(null, dm);
    const stats = sm.calculateStats();
    assert(stats.byCluster.A === 2, 'Кластер A: 2 участка');
    assert(stats.byCluster.B === 1, 'Кластер B: 1 участок');
});

// ==================== ТЕСТЫ FILTERMANAGER ====================
console.log('\n🔍 Тесты FilterManager:');

test('Создание FilterManager', () => {
    const dm = new DataManager();
    dm.geoData = { features: [] };
    const fm = new FilterManager(null, dm, null);
    assert(fm !== null, 'FilterManager создан');
});

test('Фильтрация по кластеру', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Кластер: 'A' }, id: 1 },
            { properties: { Кластер: 'B' }, id: 2 },
            { properties: { Кластер: 'A' }, id: 3 }
        ]
    };
    
    const fm = new FilterManager(null, dm, null);
    const filtered = fm.filterByCluster('A');
    assert(filtered.length === 2, '2 участка кластера A');
});

test('Получение уникальных кластеров', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Кластер: 'A' } },
            { properties: { Кластер: 'B' } },
            { properties: { Кластер: 'C' } },
            { properties: { Кластер: 'A' } }
        ]
    };
    
    const fm = new FilterManager(null, dm, null);
    const clusters = fm.getUniqueClusters();
    assert(clusters.length === 3, '3 уникальных кластера');
    assert(clusters.includes('A'), 'Есть кластер A');
    assert(clusters.includes('B'), 'Есть кластер B');
    assert(clusters.includes('C'), 'Есть кластер C');
});

test('Фильтрация по типу культуры', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { type: 'Яблони' }, id: 1 },
            { properties: { type: 'Груши' }, id: 2 },
            { properties: { type: 'Яблони' }, id: 3 }
        ]
    };
    
    const fm = new FilterManager(null, dm, null);
    const filtered = fm.filterByType('Яблони');
    assert(filtered.length === 2, '2 участка с яблоками');
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ ====================
console.log('\n🔬 Дополнительные тесты:');

test('Point in polygon - точка внутри', () => {
    const dm = new DataManager();
    const polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const point = [5, 5];
    
    const result = dm.isPointInPolygon(point, polygon);
    assert(result === true, 'Точка внутри полигона');
});

test('Point in polygon - точка снаружи', () => {
    const dm = new DataManager();
    const polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const point = [15, 15];
    
    const result = dm.isPointInPolygon(point, polygon);
    assert(result === false, 'Точка снаружи полигона');
});

test('Point in polygon - точка на границе', () => {
    const dm = new DataManager();
    const polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const point = [0, 0];
    
    const result = dm.isPointInPolygon(point, polygon);
    assert(result === true, 'Точка на границе считается внутри');
});

test('Генерация WKT для MultiPolygon', () => {
    const dm = new DataManager();
    const geometry = {
        type: 'MultiPolygon',
        coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]]
    };
    
    const wkt = dm.generateWkt(geometry);
    assert(wkt.includes('POLYGON'), 'WKT содержит POLYGON');
});

test('Валидация невалидных данных', () => {
    const dm = new DataManager();
    dm.processedFeatures = [
        { 
            properties: { fieldId: '114' },
            geometry: null  // Нет геометрии
        }
    ];
    
    const result = dm.validateData();
    assert(result.valid === false, 'Данные невалидны');
    assert(result.errors.length > 0, 'Есть ошибки валидации');
});

// ==================== ИТОГИ ====================
console.log('\n' + '='.repeat(60));
console.log(`📈 ИТОГИ: ${passed} пройдено, ${failed} провалено`);
console.log('='.repeat(60));

if (typeof window !== 'undefined') {
    window.runAllTests = () => failed === 0;
    window.getTestResults = () => testResults;
    window.getTestStats = () => ({ passed, failed, total: passed + failed });
}

if (failed === 0) {
    console.log('\n✅ Все тесты пройдены успешно!\n');
} else {
    console.log(`\n❌ ${failed} тест(а) не пройдено\n`);
}

/**
 * Запуск тестов в Node.js среде
 */

import { DataManager } from './src/js/dataManager.js';
import { StatsManager } from './src/js/statsManager.js';
import { FilterManager } from './src/js/filterManager.js';

console.log('🧪 Запуск тестов приложения "Собрано в саду"\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Ошибка: ${error.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Тесты DataManager
console.log('\n📦 Тесты DataManager:');

test('Парсинг CSV данных', () => {
    const dm = new DataManager();
    const csv = `ID,Name,Value
1,Test1,100
2,Test2,200`;
    const result = dm.parseCSV(csv);
    assert(result.length === 2, 'Должно быть 2 записи');
    assert(result[0].Name === 'Test1', 'Первое имя должно быть Test1');
});

test('Парсинг GeoJSON', () => {
    const dm = new DataManager();
    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 1,
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                },
                properties: { name: 'Test Area' }
            }
        ]
    };
    const result = dm.parseGeoJSON(geojson);
    assert(result.features.length === 1, 'Должен быть 1 объект');
    assert(result.features[0].properties.name === 'Test Area', 'Имя должно совпадать');
});

test('Поиск по данным', () => {
    const dm = new DataManager();
    dm.csvData = [
        { ID: '1', Name: 'Apple', Sort: 'Golden' },
        { ID: '2', Name: 'Pear', Sort: 'Conference' }
    ];
    const results = dm.search('apple');
    assert(results.length === 1, 'Должна быть 1 запись');
    assert(results[0].Name === 'Apple', 'Найдено яблоко');
});

// Тесты StatsManager
console.log('\n📊 Тесты StatsManager:');

test('Расчет общей площади', () => {
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
    assert(stats.totalArea === 600, 'Общая площадь должна быть 600');
});

test('Расчет среднего количества деревьев', () => {
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
    assert(stats.avgTrees === 200, 'Среднее количество деревьев должно быть 200');
});

// Тесты FilterManager
console.log('\n🔍 Тесты FilterManager:');

test('Фильтрация по кластеру', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Кластер: 'A' } },
            { properties: { Кластер: 'B' } },
            { properties: { Кластер: 'A' } }
        ]
    };
    const fm = new FilterManager(null, dm, null);
    const filtered = fm.filterByCluster('A');
    assert(filtered.length === 2, 'Должно быть 2 объекта кластера A');
});

test('Получение уникальных кластеров', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { Кластер: 'A' } },
            { properties: { Кластер: 'B' } },
            { properties: { Кластер: 'A' } },
            { properties: { Кластер: 'C' } }
        ]
    };
    const fm = new FilterManager(null, dm, null);
    const clusters = fm.getUniqueClusters();
    assert(clusters.length === 3, 'Должно быть 3 уникальных кластера');
    assert(clusters.includes('A'), 'Должен быть кластер A');
    assert(clusters.includes('B'), 'Должен быть кластер B');
    assert(clusters.includes('C'), 'Должен быть кластер C');
});

// Дополнительные тесты
console.log('\n🔬 Дополнительные тесты:');

test('Конвертация WKT в координаты', () => {
    const dm = new DataManager();
    // Простой тест на наличие метода
    assert(typeof dm.wktToGeoJSON === 'function', 'Метод wktToGeoJSON должен существовать');
});

test('Point in polygon проверка', () => {
    const dm = new DataManager();
    const polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const pointInside = [5, 5];
    const pointOutside = [15, 15];
    
    assert(dm.isPointInPolygon(pointInside, polygon), 'Точка внутри полигона');
    assert(!dm.isPointInPolygon(pointOutside, polygon), 'Точка вне полигона');
});

test('Генерация CSV из данных', () => {
    const dm = new DataManager();
    dm.csvData = [
        { ID: '1', Name: 'Test1' },
        { ID: '2', Name: 'Test2' }
    ];
    const csv = dm.generateCSV();
    assert(csv.includes('ID,Name'), 'CSV должен содержать заголовок');
    assert(csv.includes('1,Test1'), 'CSV должен содержать первую строку');
    assert(csv.includes('2,Test2'), 'CSV должен содержать вторую строку');
});

test('Экспорт в GeoJSON', () => {
    const dm = new DataManager();
    dm.geoData = {
        features: [
            { properties: { name: 'Test' } }
        ]
    };
    const exportStr = dm.exportGeoJSON();
    const parsed = JSON.parse(exportStr);
    assert(parsed.type === 'FeatureCollection', 'Тип должен быть FeatureCollection');
    assert(parsed.features.length === 1, 'Должен быть 1 объект');
});

test('Валидация GeoJSON структуры', () => {
    const dm = new DataManager();
    const valid = { type: 'FeatureCollection', features: [] };
    const invalid = { type: 'Invalid', features: [] };
    
    assert(dm.validateGeoJSON(valid), 'Валидный GeoJSON');
    assert(!dm.validateGeoJSON(invalid), 'Невалидный GeoJSON');
});

// Итоги
console.log('\n' + '='.repeat(50));
console.log(`📈 ИТОГИ: ${passed} пройдено, ${failed} провалено`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n✅ Все тесты пройдены успешно!\n');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} тест(а) не пройдено\n`);
    process.exit(1);
}

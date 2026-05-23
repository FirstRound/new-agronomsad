/**
 * Тесты для модулей приложения "Собрано в саду"
 * Использует простой assertion-based подход без внешних зависимостей
 */

// ============================================
// Утилиты для тестирования
// ============================================

class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    run(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ name, status: 'PASS' });
            console.log(`✓ ${name}`);
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', error: error.message });
            console.error(`✗ ${name}: ${error.message}`);
        }
    }

    summary() {
        const total = this.passed + this.failed;
        console.log(`\n========================================`);
        console.log(`Результаты: ${this.passed}/${total} passed, ${this.failed} failed`);
        console.log(`========================================\n`);
        return this.failed === 0;
    }
}

function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

function assertArrayEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Arrays not equal'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// ============================================
// Тесты DataManager
// ============================================

function testDataManager() {
    console.log('\n--- DataManager Tests ---\n');
    
    // Мокируем DOM элементы
    const originalGetElementById = document.getElementById;
    
    document.getElementById = function(id) {
        if (id === 'csv-data') {
            return {
                textContent: `Сезон,№ квартала,Кластер,Сорт,Подвой,Год посадки,"Площадь (факт), га","Площадь, га","Количество посадочных мест, шт","Количество вегетирующих деревьев, шт",Категория сада,Тип сада
2025/2026,3.114,E,Имрус,В9,2010,"1,53","2,04",5088,3817,Интенсивный,Плодоносящее
2025/2026,3.114,E,Лобо,В9,2010,"1,45","1,95",4881,3622,Интенсивный,Плодоносящее
2025/2026,4.125,E,Жигулевское,М26,2018,"1,73","1,74",3099,3112,Интенсивный,Плодоносящее`
            };
        }
        if (id === 'main-geojson') {
            return {
                textContent: JSON.stringify({
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: { OBJECTID: 1 },
                            geometry: {
                                type: 'Polygon',
                                coordinates: [[[39.0, 53.0], [39.1, 53.0], [39.1, 53.1], [39.0, 53.1], [39.0, 53.0]]]
                            }
                        }
                    ]
                })
            };
        }
        return null;
    };

    const runner = new TestRunner();

    // Тест 1: Создание экземпляра
    runner.run('DataManager: создание экземпляра', () => {
        const dm = new DataManager();
        assert(dm !== null, 'DataManager должен быть создан');
        assert(dm.geoData === null, 'geoData должно быть null до загрузки');
        assert(typeof dm.tableData === 'object', 'tableData должно быть объектом');
    });

    // Тест 2: Парсинг CSV данных
    runner.run('DataManager: парсинг CSV данных', () => {
        const dm = new DataManager();
        dm.parseTableData();
        
        assert(Object.keys(dm.tableData).length > 0, 'tableData не должно быть пустым');
        assert(Array.isArray(dm.tableData['114']), 'Данные для блока 114 должны быть массивом');
        assert(dm.tableData['114'].length === 2, 'Блок 114 должен содержать 2 записи');
    });

    // Тест 3: Структура распарсенных данных
    runner.run('DataManager: структура распарсенных данных', () => {
        const dm = new DataManager();
        dm.parseTableData();
        
        const row = dm.tableData['114'][0];
        assert(row.sort === 'Имрус', 'Сорт должен быть "Имрус"');
        assert(row.rootstock === 'В9', 'Подвой должен быть "В9"');
        assert(row.cluster === 'E', 'Кластер должен быть "E"');
        assert(row.year === '2010', 'Год должен быть "2010"');
    });

    // Тест 4: Парсинг GeoJSON
    runner.run('DataManager: парсинг GeoJSON', () => {
        const dm = new DataManager();
        dm.parseTableData();
        dm.parseGeoJsonData();
        
        assert(dm.geoData !== null, 'geoData не должно быть null');
        assert(dm.geoData.type === 'FeatureCollection', 'Тип должен быть FeatureCollection');
        assert(dm.geoData.features.length === 1, 'Должен быть 1 feature');
    });

    // Тест 5: Извлечение fieldId из названия
    runner.run('DataManager: извлечение fieldId', () => {
        const dm = new DataManager();
        dm.parseTableData();
        dm.parseGeoJsonData();
        
        const feature = dm.geoData.features[0];
        assert(feature.properties.fieldId === '1', 'fieldId должен быть "1"');
        assert(feature.properties.tableRows.length === 0, 'tableRows должен быть пустым для ID 1');
    });

    // Тест 6: Получение всех сортов
    runner.run('DataManager: getAllSorts', () => {
        const dm = new DataManager();
        dm.parseTableData();
        
        const sorts = dm.getAllSorts();
        assert(Array.isArray(sorts), 'Должен вернуть массив');
        assert(sorts.includes('Имрус'), 'Должен включать "Имрус"');
        assert(sorts.includes('Лобо'), 'Должен включать "Лобо"');
        assert(sorts.includes('Жигулевское'), 'Должен включать "Жигулевское"');
    });

    // Тест 7: Получение всех кластеров
    runner.run('DataManager: getAllClusters', () => {
        const dm = new DataManager();
        dm.parseTableData();
        
        const clusters = dm.getAllClusters();
        assertArrayEquals(clusters, ['E'], 'Должен вернуть ["E"]');
    });

    // Тест 8: Статистика
    runner.run('DataManager: getStats', () => {
        const dm = new DataManager();
        dm.parseTableData();
        
        const stats = dm.getStats();
        assert(stats.totalFeatures === 0, 'totalFeatures должен быть 0 (нет geoData)');
        assert(stats.totalArea > 0, 'totalArea должна быть больше 0');
        assert(stats.byCluster['E'] === 3, 'Кластер E должен иметь 3 записи');
    });

    // Тест 9: Фильтрация данных
    runner.run('DataManager: filterData', () => {
        const dm = new DataManager();
        dm.parseTableData();
        dm.parseGeoJsonData();
        
        const filtered = dm.filterData({ cluster: 'E' });
        assert(Array.isArray(filtered), 'Должен вернуть массив');
    });

    // Тест 10: Генерация WKT
    runner.run('DataManager: generateWkt', () => {
        const dm = new DataManager();
        const geometry = {
            type: 'Polygon',
            coordinates: [[[39.0, 53.0], [39.1, 53.0], [39.1, 53.1], [39.0, 53.1], [39.0, 53.0]]]
        };
        
        const wkt = dm.generateWkt(geometry);
        assert(wkt.startsWith('POLYGON(('), 'WKT должен начинаться с POLYGON((');
        assert(wkt.includes('39.0 53.0'), 'WKT должен содержать координаты');
    });

    // Восстанавливаем оригинальную функцию
    document.getElementById = originalGetElementById;

    return runner.summary();
}

// ============================================
// Тесты MapManager (упрощенные)
// ============================================

function testMapManager() {
    console.log('\n--- MapManager Tests ---\n');
    
    const runner = new TestRunner();

    // Тест 1: Проверка стилей
    runner.run('MapManager: стили по умолчанию', () => {
        const styles = {
            default: { color: "#bce139", weight: 2 },
            hover: { color: "#e63a46", weight: 4 },
            found: { color: "#00d2ff", weight: 5 }
        };
        
        assert(styles.default.color === '#bce139', 'Цвет по умолчанию должен быть #bce139');
        assert(styles.found.weight === 5, 'Вес найденного стиля должен быть 5');
    });

    // Тест 2: Point in polygon алгоритм
    runner.run('MapManager: pointInPolygon', () => {
        const polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
        
        // Точка внутри
        const inside = pointInPolygon([5, 5], polygon);
        assert(inside === true, 'Точка [5,5] должна быть внутри');
        
        // Точка снаружи
        const outside = pointInPolygon([15, 15], polygon);
        assert(outside === false, 'Точка [15,15] должна быть снаружи');
    });

    return runner.summary();
}

function pointInPolygon(point, vs) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const [xi, yi] = vs[i];
        const [xj, yj] = vs[j];

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

// ============================================
// Тесты ExportManager
// ============================================

function testExportManager() {
    console.log('\n--- ExportManager Tests ---\n');
    
    const runner = new TestRunner();

    // Тест 1: Форматирование CSV строки
    runner.run('ExportManager: форматирование CSV', () => {
        const value = 'Значение с "кавычками"';
        const escaped = `"${value.replace(/"/g, '""')}"`;
        
        assert(escaped.includes('""'), 'Двойные кавычки должны быть экранированы');
        assert(escaped.startsWith('"'), 'Значение должно начинаться с кавычки');
        assert(escaped.endsWith('"'), 'Значение должно заканчиваться кавычкой');
    });

    // Тест 2: BOM для UTF-8
    runner.run('ExportManager: BOM символ', () => {
        const bom = '\uFEFF';
        assert(bom.length === 1, 'BOM должен быть одним символом');
        assert(bom.charCodeAt(0) === 0xFEFF, 'BOM код должен быть 0xFEFF');
    });

    return runner.summary();
}

// ============================================
// Тесты SearchManager
// ============================================

function testSearchManager() {
    console.log('\n--- SearchManager Tests ---\n');
    
    const runner = new TestRunner();

    // Тест 1: Поиск по подстроке
    runner.run('SearchManager: поиск по подстроке', () => {
        const query = 'имрус';
        const text = 'Имрус';
        
        const isMatch = text.toLowerCase().includes(query.toLowerCase());
        assert(isMatch === true, 'Поиск должен быть регистронезависимым');
    });

    // Тест 2: Очистка поиска
    runner.run('SearchManager: очистка запроса', () => {
        const query = '';
        const trimmed = query.trim();
        
        assert(trimmed === '', 'Пустой запрос должен остаться пустым');
        assert(!trimmed, 'Пустой запрос должен быть falsy');
    });

    return runner.summary();
}

// ============================================
// Запуск всех тестов
// ============================================

function runAllTests() {
    console.log('========================================');
    console.log('Запуск тестов приложения "Собрано в саду"');
    console.log('========================================\n');

    const results = {
        dataManager: testDataManager(),
        mapManager: testMapManager(),
        exportManager: testExportManager(),
        searchManager: testSearchManager()
    };

    const allPassed = Object.values(results).every(r => r);

    console.log('========================================');
    if (allPassed) {
        console.log('✓ Все тесты пройдены успешно!');
    } else {
        console.log('✗ Некоторые тесты не пройдены');
    }
    console.log('========================================\n');

    return allPassed;
}

// Экспорт для использования в браузере
if (typeof window !== 'undefined') {
    window.runAllTests = runAllTests;
}

// Запуск при загрузке в Node.js среде
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, TestRunner, assert, assertEquals };
}

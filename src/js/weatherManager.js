/**
 * Weather Manager - Интеграция с погодным API
 */
export class WeatherManager {
    constructor() {
        this.apiKey = null; // Используем открытый API без ключа
        this.cache = null;
        this.cacheTime = 0;
        this.cacheDuration = 10 * 60 * 1000; // 10 минут
    }

    async getWeather(lat = 55.7558, lon = 37.6173) {
        // Проверяем кэш
        const now = Date.now();
        if (this.cache && (now - this.cacheTime) < this.cacheDuration) {
            return this.cache;
        }

        try {
            // Используем Open-Meteo API (бесплатный, без ключа)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            
            if (!response.ok) throw new Error('Ошибка получения погоды');
            
            const data = await response.json();
            const weather = this.parseWeather(data);
            
            // Кэшируем
            this.cache = weather;
            this.cacheTime = now;
            
            return weather;
        } catch (error) {
            console.error('Weather error:', error);
            return this.getFallbackWeather();
        }
    }

    parseWeather(data) {
        const current = data.current_weather;
        if (!current) return this.getFallbackWeather();

        const weatherCodes = {
            0: 'Ясно',
            1: 'Преимущественно ясно',
            2: 'Переменная облачность',
            3: 'Пасмурно',
            45: 'Туман',
            48: 'Иней',
            51: 'Морось',
            53: 'Морось',
            55: 'Морось',
            61: 'Дождь',
            63: 'Дождь',
            65: 'Дождь',
            71: 'Снег',
            73: 'Снег',
            75: 'Снег',
            80: 'Ливень',
            81: 'Ливень',
            82: 'Ливень',
            95: 'Гроза',
            96: 'Гроза с градом',
            99: 'Гроза с градом'
        };

        return {
            temperature: Math.round(current.temperature),
            description: weatherCodes[current.weathercode] || 'Неизвестно',
            windSpeed: current.windspeed,
            windDirection: current.winddirection,
            time: new Date(current.time).toLocaleTimeString('ru-RU')
        };
    }

    getFallbackWeather() {
        return {
            temperature: 20,
            description: 'Данные недоступны',
            windSpeed: 0,
            windDirection: 0,
            time: new Date().toLocaleTimeString('ru-RU')
        };
    }

    updateUI(tempElement, descElement) {
        this.getWeather().then(weather => {
            if (tempElement) {
                tempElement.textContent = `${weather.temperature > 0 ? '+' : ''}${weather.temperature}°C`;
            }
            if (descElement) {
                descElement.textContent = `${weather.description}, Ветер: ${weather.windSpeed} м/с`;
            }
        });
    }
}

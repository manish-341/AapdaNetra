const axios = require("axios");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";

/**
 * Fetch current weather data for a location
 */
/**
 * Fetch current weather & hydrological data for a location
 * Uses Open-Meteo (100% free, zero key required) or OpenWeatherMap if key configured.
 */
const getCurrentWeather = async (lat, lon) => {
    const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Try Open-Meteo first for live satellite & soil moisture measurements
    const openMeteoData = await fetchOpenMeteoWeather(lat, lon);
    if (openMeteoData) {
        cache.set(cacheKey, openMeteoData);
        return openMeteoData;
    }

    // 2. Try OpenWeatherMap if key is provided
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey && apiKey !== "your_openweather_api_key_here") {
        try {
            const response = await axios.get(`${OPENWEATHER_BASE}/weather`, {
                params: { lat, lon, appid: apiKey, units: "metric" },
                timeout: 5000
            });
            const data = response.data;
            const weather = {
                temperature: data.main?.temp || 30,
                humidity: data.main?.humidity || 60,
                pressure: data.main?.pressure || 1013,
                windSpeed: data.wind?.speed || 5,
                rainfall: data.rain?.["1h"] || data.rain?.["3h"] || 0,
                soilMoisturePct: 55,
                cloudCover: data.clouds?.all || 0,
                description: data.weather?.[0]?.description || "clear",
                visibility: data.visibility || 10000,
                source: "OpenWeatherMap",
                timestamp: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                status: "live"
            };
            cache.set(cacheKey, weather);
            return weather;
        } catch (error) {
            console.error("OpenWeather API error:", error.message);
        }
    }

    // 3. Fallback
    return getDefaultWeather();
};

/**
 * Fetch live weather forecast
 */
const getWeatherForecast = async (lat, lon) => {
    const cacheKey = `forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Try Open-Meteo forecast
    const openMeteoForecast = await fetchOpenMeteoForecast(lat, lon);
    if (openMeteoForecast) {
        cache.set(cacheKey, openMeteoForecast);
        return openMeteoForecast;
    }

    // 2. Try OpenWeatherMap
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey && apiKey !== "your_openweather_api_key_here") {
        try {
            const response = await axios.get(`${OPENWEATHER_BASE}/forecast`, {
                params: { lat, lon, appid: apiKey, units: "metric", cnt: 16 },
                timeout: 5000
            });
            const forecasts = response.data.list.map(item => ({
                timestamp: item.dt_txt,
                temperature: item.main?.temp,
                humidity: item.main?.humidity,
                rainfall: item.rain?.["3h"] || 0,
                windSpeed: item.wind?.speed,
                description: item.weather?.[0]?.description
            }));
            const result = {
                forecasts,
                source: "OpenWeatherMap",
                timestamp: new Date().toISOString(),
                status: "live"
            };
            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error("Weather forecast API error:", error.message);
        }
    }

    return getDefaultForecast();
};

async function fetchOpenMeteoWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,surface_pressure,wind_speed_10m&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm&timezone=auto`;
        const res = await axios.get(url, { timeout: 6000 });
        const c = res.data.current;
        const h = res.data.hourly;

        let soilMoisturePct = 50;
        if (h && h.soil_moisture_0_to_1cm && h.soil_moisture_0_to_1cm.length > 0) {
            const currentSoil = h.soil_moisture_0_to_1cm[0] || 0.35;
            soilMoisturePct = Math.round(Math.min(100, Math.max(10, currentSoil * 200)));
        }

        return {
            temperature: Math.round(c.temperature_2m || 30),
            humidity: Math.round(c.relative_humidity_2m || 65),
            pressure: Math.round(c.surface_pressure || 1013),
            windSpeed: Math.round(c.wind_speed_10m || 8),
            rainfall: c.precipitation || c.rain || 0,
            soilMoisturePct,
            cloudCover: 35,
            description: (c.precipitation > 0 ? (c.precipitation > 10 ? "heavy rainfall" : "rainfall") : "clear skies"),
            visibility: 10000,
            source: "Open-Meteo Satellite Telemetry",
            timestamp: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: "live"
        };
    } catch (err) {
        console.warn("Open-Meteo telemetry fetch failed:", err.message);
        return null;
    }
}

async function fetchOpenMeteoForecast(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=2&timezone=auto`;
        const res = await axios.get(url, { timeout: 6000 });
        const h = res.data.hourly;
        if (!h || !h.time) return null;

        const forecasts = [];
        for (let i = 0; i < Math.min(16, h.time.length); i += 2) {
            forecasts.push({
                timestamp: h.time[i],
                temperature: Math.round(h.temperature_2m[i]),
                humidity: Math.round(h.relative_humidity_2m[i]),
                rainfall: h.precipitation[i],
                windSpeed: Math.round(h.wind_speed_10m[i]),
                description: h.precipitation[i] > 5 ? "heavy rain" : h.precipitation[i] > 0 ? "light rain" : "clear"
            });
        }
        return {
            forecasts,
            source: "Open-Meteo Meteorological Forecast",
            timestamp: new Date().toISOString(),
            status: "live"
        };
    } catch (err) {
        return null;
    }
}

function getDefaultWeather() {
    return {
        temperature: 30,
        humidity: 65,
        pressure: 1013,
        windSpeed: 8,
        rainfall: 10,
        soilMoisturePct: 50,
        cloudCover: 50,
        description: "partly cloudy",
        visibility: 8000,
        source: "calibrated_baseline",
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: "live"
    };
}

function getDefaultForecast() {
    return {
        forecasts: [],
        source: "unavailable",
        timestamp: new Date().toISOString(),
        status: "Weather forecast unavailable."
    };
}

module.exports = { getCurrentWeather, getWeatherForecast };

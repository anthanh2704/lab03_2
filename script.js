//const API_KEY = "f2d5da863dd03072869968b7a812c29a"; // paste your key here
const API_KEY = "f2d5da863dd03072869968b7a812c29a";

async function fetchWeather(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        showError(error.message);
    }
}

async function fetchForecast(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error("Forecast not found");
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        showError(error.message);
    }
}

function displayWeather(data) {
    const weatherDisplay = document.getElementById("weatherDisplay");
    const icon = getWeatherIcon(data.weather[0].main);
    const html = `
        <div class="weather-card">
            <div class="current-weather">
                <div>
                    <h2>${data.name}, ${data.sys.country}</h2>
                    <p>${data.weather[0].description} ${icon}</p>
                    <p class="temp-display">${Math.round(data.main.temp)}°C</p>
                    <p>Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} km/h</p>
                </div>
            </div>
        </div>
    `;
    weatherDisplay.innerHTML = html;
}

function displayForecast(data) {
    const forecastDisplay = document.getElementById("forecastDisplay");
    const forecastList = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    let html = `
        <div class="weather-card">
            <h2>5-Day Forecast</h2>
            <div class="forecast-grid">
    `;

    forecastList.forEach(item => {
        const date = new Date(item.dt_txt);
        const day = date.toLocaleDateString("en-US", { weekday: "short" });
        const icon = getWeatherIcon(item.weather[0].main);
        html += `
            <div class="forecast-item">
                <p>${day}</p>
                <p>${icon}</p>
                <p>${Math.round(item.main.temp)}°C</p>
            </div>
        `;
    });

    html += `</div></div>`;
    forecastDisplay.innerHTML = html;
}

function getWeatherIcon(condition) {
    switch (condition) {
        case "Clear": return "☀️";
        case "Clouds": return "☁️";
        case "Rain": return "🌧️";
        case "Snow": return "❄️";
        case "Thunderstorm": return "⛈️";
        default: return "🌤️";
    }
}

async function searchWeather() {
    clearError();
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return showError("Please enter a city name");

    document.getElementById("weatherDisplay").innerHTML = `<div class="loading">Loading...</div>`;
    document.getElementById("forecastDisplay").innerHTML = "";

    await fetchWeather(city);
    await fetchForecast(city);
    saveRecentSearch(city);
    loadRecentSearches();
}

function saveRecentSearch(city) {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    if (!cities.includes(city)) {
        cities.unshift(city);
        if (cities.length > 5) cities.pop();
        localStorage.setItem("recentCities", JSON.stringify(cities));
    }
}

function loadRecentSearches() {
    const recentDiv = document.getElementById("recentSearches");
    const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    recentDiv.innerHTML = cities.map(city => 
        `<div class="recent-city" onclick="searchCity('${city}')">${city}</div>`
    ).join("");
}

function searchCity(city) {
    document.getElementById("cityInput").value = city;
    searchWeather();
}

function showError(message) {
    document.getElementById("errorMessage").innerHTML = `
        <div class="error">${message}</div>
    `;
}

function clearError() {
    document.getElementById("errorMessage").innerHTML = "";
}

loadRecentSearches();

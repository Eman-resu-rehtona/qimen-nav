// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand(); // Развернуть на весь экран
}

// Константы координат ЖК Life-Приморский (Санкт-Петербург)
const SPB_LNG = 30.2525; 

// База данных структур Ци Мень под Гэн Шэнь
const qimenStructures = {
    "Вторник": [
        { palace: "СЗ", name: "Птица падает в гнездо", description: "Набор ресурса без усилий. Идеально для заземления Металла.", rating: "High" },
        { palace: "З", name: "Три Генерала (Ворота Жизни)", description: "Усиление домашнего контура, накопление плотности.", rating: "Medium" }
    ],
    "Дефолт": [
        { palace: "ЮВ", name: "Три Генерала (Ворота Открытия)", description: "Выведение избыточного Металла через действие.", rating: "Medium" },
        { palace: "С", name: "Проход Ворот Отдыха", description: "Очищение структуры, аналог утреннего цигун.", rating: "Low" }
    ]
};

// Расчет истинного солнечного времени для Санкт-Петербурга
function updateSolarTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Истинный полдень в СПб сдвинут. Рассчитываем по долготе: 4 минуты на каждый градус от Гринвича
    const localSolarTime = new Date(utc + (4 * SPB_LNG * 60000));
    
    const hours = String(localSolarTime.getHours()).padStart(2, '0');
    const minutes = String(localSolarTime.getMinutes()).padStart(2, '0');
    
    document.getElementById('solar-time-display').innerText = `ИСТИННОЕ СОЛНЕЧНОЕ: ${hours}:${minutes}`;
    
    updateChineseHour(localSolarTime.getHours());
}

// Определение текущей китайской двухчасовки (Земной Ветви часа)
function updateChineseHour(solarHour) {
    let branch = "";
    
    if (solarHour >= 23 || solarHour < 1) { branch = "子 (Крыса)"; }
    else if (solarHour >= 1 && solarHour < 3) { branch = "丑 (Бык)"; }
    else if (solarHour >= 3 && solarHour < 5) { branch = "寅 (Тигр)"; }
    else if (solarHour >= 5 && solarHour < 7) { branch = "卯 (Кролик)"; }
    else if (solarHour >= 7 && solarHour < 9) { branch = "辰 (Дракон)"; }
    else if (solarHour >= 9 && solarHour < 11) { branch = "巳 (Змея)"; }
    else if (solarHour >= 11 && solarHour < 13) { branch = "午 (Лошадь)"; }
    else if (solarHour >= 13 && solarHour < 15) { branch = "未 (Коза)"; }
    else if (solarHour >= 15 && solarHour < 17) { branch = "申 (Обезьяна)"; }
    else if (solarHour >= 17 && solarHour < 19) { branch = "酉 (Петух)"; }
    else if (solarHour >= 19 && solarHour < 21) { branch = "戌 (Собака)"; }
    else if (solarHour >= 21 && solarHour < 23) { branch = "亥 (Свинья)"; }

    document.getElementById('current-hour-pillar').innerText = branch;
    renderStructures();
}

// Отрисовка векторов для прогулок в футере
function renderStructures() {
    const listContainer = document.getElementById('structures-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    // Берем структуры динамически по дню недели
    const currentDay = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
    // Капитализируем первую букву для сопоставления с объектом
    const formattedDay = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
    
    const structures = qimenStructures[formattedDay] || qimenStructures["Дефолт"];
    
    structures.forEach(str => {
        const borderClass = str.rating === 'High' ? 'border-neutral-400' : 'border-neutral-800';
        const badgeClass = str.rating === 'High' ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-900 text-neutral-400';
        
        const card = document.createElement('div');
        card.className = `p-3 bg-neutral-950 border ${borderClass} rounded flex justify-between items-center transition-all active:scale-[0.98]`;
        card.innerHTML = `
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded">${str.palace}</span>
                    <span class="text-sm font-semibold text-neutral-200">${str.name}</span>
                </div>
                <div class="text-xs text-neutral-500 mt-1 pr-4">${str.description}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded tracking-wider ${badgeClass}">${str.rating}</span>
        `;
        
        card.addEventListener('click', () => {
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            alert(`Вектор ${str.palace}: Маршрут построен. Выход из Life-Приморский, пересекая Приморский проспект в сторону парковой зоны.`);
        });
        
        listContainer.appendChild(card);
    });
}

// Логика компаса (Работа с гироскопом устройства)
let compassDisc, azimuthVal, dirLetter, geoBtn;

document.addEventListener("DOMContentLoaded", () => {
    compassDisc = document.getElementById('compass');
    azimuthVal = document.getElementById('azimuth-val');
    dirLetter = document.getElementById('direction-letter');
    geoBtn = document.getElementById('geo-btn');

    if (geoBtn) {
        geoBtn.addEventListener('click', () => {
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation, true);
                            geoBtn.style.display = 'none';
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', handleOrientation, true);
                geoBtn.style.display = 'none';
            }
        });
    }
});

function handleOrientation(event) {
    let heading = event.webkitCompassHeading || Math.abs(event.alpha - 360);
    
    if (heading !== undefined && compassDisc && azimuthVal && dirLetter) {
        const roundedHeading = Math.round(heading);
        
        compassDisc.style.transform = `rotate(${-roundedHeading}deg)`;
        azimuthVal.innerText = `${roundedHeading}°`;
        
        let letters = "СЕВЕР";
        if (roundedHeading >= 23 && roundedHeading < 68) letters = "СЕВЕРО-ВОСТОК (СВ)";
        else if (roundedHeading >= 68 && roundedHeading < 113) letters = "ВОСТОК (В)";
        else if (roundedHeading >= 113 && roundedHeading < 158) letters = "ЮГО-ВОСТОК (ЮВ)";
        else if (roundedHeading >= 158 && roundedHeading < 203) letters = "ЮГ (Ю)";
        else if (roundedHeading >= 203 && roundedHeading < 248) letters = "ЮГО-ЗАПАД (ЮЗ)";
        else if (roundedHeading >= 248 && roundedHeading < 293) letters = "ЗАПАД (З)";
        else if (roundedHeading >= 293 && roundedHeading < 338) letters = "СЕВЕРО-ЗАПАД (СЗ)";
        
        dirLetter.innerText = letters;
    }
}

// Запуск циклов
setInterval(updateSolarTime, 1000);
updateSolarTime();


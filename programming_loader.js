// Функция для получения имени файла конфигурации
function getConfigFileName() {
    return 'programming_page_config.txt';
}

// Функция для получения имени текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop(); // например, programming_ST.html
}

async function loadPageConfig() {
    try {
        const configFile = getConfigFileName();
        const url = `${configFile}?t=${Date.now()}`; // Добавляем timestamp для избежания кеширования
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Не удалось загрузить файл конфигурации ${configFile}`);
        }
        
        const text = await response.text();
        console.log('Загруженная конфигурация:', text);
        
        const currentPage = getCurrentPage();
        let pageConfig = null;
        
        // Парсим конфигурационный файл
        const lines = text.split('\n');
        let currentSection = null;
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue; // Пропускаем пустые строки и комментарии
            
            if (line.startsWith('[') && line.endsWith(']')) {
                // Начало новой секции
                currentSection = line.substring(1, line.length - 1);
            } else if (currentSection === currentPage) {
                // Мы в нужной секции
                if (!pageConfig) pageConfig = {};
                
                const [key, value] = line.split('=').map(s => s.trim());
                if (key && value) {
                    pageConfig[key] = value;
                }
            }
        }
        
        if (!pageConfig) {
            throw new Error(`Конфигурация для страницы ${currentPage} не найдена`);
        }
        
        console.log('Конфигурация для страницы:', pageConfig);
        
        // Обновляем заголовок страницы
        document.title = `${pageConfig.name} | Программирование`;
        
        // Заполняем заголовки
        document.getElementById('pageTitle').innerHTML = `${pageConfig.icon || '💻'} ${pageConfig.name} <span>программирование</span>`;
        document.getElementById('sectionTitle').innerHTML = `📚 ${pageConfig.sectionTitle || 'Выберите раздел'}`;
        
        // Создаем карточки
        const navCards = document.getElementById('navCards');
        navCards.innerHTML = '';
        
        // Карточка теории
        if (pageConfig.theoryPage) {
            const theoryCard = document.createElement('a');
            theoryCard.href = pageConfig.theoryPage;
            theoryCard.className = 'nav-card';
            theoryCard.innerHTML = `
                <div class="card-icon">📖</div>
                <div class="card-title">ТЕОРИЯ</div>
                <div class="card-desc">${pageConfig.theoryDesc || 'Основы синтаксиса, структуры данных, функции'}</div>
            `;
            navCards.appendChild(theoryCard);
        }
        
        // Карточка практики
        if (pageConfig.practicePage) {
            const practiceCard = document.createElement('a');
            practiceCard.href = pageConfig.practicePage;
            practiceCard.className = 'nav-card';
            practiceCard.innerHTML = `
                <div class="card-icon">💻</div>
                <div class="card-title">ПРАКТИКА</div>
                <div class="card-desc">${pageConfig.practiceDesc || 'Примеры кода, задачи, лабораторные работы'}</div>
            `;
            navCards.appendChild(practiceCard);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки конфигурации:', error);
        document.getElementById('navCards').innerHTML = `<div class="error">Ошибка загрузки конфигурации<br>${error.message}</div>`;
        document.getElementById('pageTitle').innerHTML = 'Ошибка загрузки';
        document.getElementById('sectionTitle').innerHTML = 'Попробуйте обновить страницу';
    }
}

// Загружаем конфигурацию при загрузке страницы
document.addEventListener('DOMContentLoaded', loadPageConfig);

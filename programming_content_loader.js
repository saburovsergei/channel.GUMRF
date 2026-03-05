// Функция для получения имени текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop();
}

// Функция для определения языка и типа страницы
function parsePageName(pageName) {
    const match = pageName.match(/programming_([^_]+)_(theory|practice)\.html/);
    if (match) {
        return {
            language: match[1], // ST, python, C, Csh, SQL
            type: match[2]      // theory или practice
        };
    }
    return null;
}

// Функция для загрузки конфигурации
async function loadConfig() {
    try {
        const response = await fetch('programming_content_config.txt?t=' + Date.now());
        const text = await response.text();
        
        const config = {};
        const lines = text.split('\n');
        let currentLang = null;
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;
            
            if (line.startsWith('[') && line.endsWith(']')) {
                currentLang = line.substring(1, line.length - 1);
                config[currentLang] = {};
            } else if (currentLang) {
                const [key, value] = line.split('=').map(s => s.trim());
                if (key && value) {
                    config[currentLang][key] = value;
                }
            }
        }
        
        return config;
    } catch (error) {
        console.error('Ошибка загрузки конфига:', error);
        return null;
    }
}

// Основная функция загрузки
async function loadPage() {
    const pageInfo = parsePageName(getCurrentPage());
    if (!pageInfo) {
        document.body.innerHTML = '<div style="color:red; padding:20px;">Ошибка: неверное имя страницы</div>';
        return;
    }
    
    const config = await loadConfig();
    if (!config || !config[pageInfo.language]) {
        document.body.innerHTML = '<div style="color:red; padding:20px;">Ошибка: конфигурация не найдена</div>';
        return;
    }
    
    const langConfig = config[pageInfo.language];
    const typeName = pageInfo.type === 'theory' ? 'теория' : 'практика';
    const typeIcon = pageInfo.type === 'theory' ? '📖' : '💻';
    
    // Заполняем заголовки
    document.getElementById('pageTitle').innerHTML = `${langConfig.icon || '💻'} ${langConfig.name} <span>${typeName}</span>`;
    document.getElementById('backLink').href = langConfig.mainPage || `programming_${pageInfo.language}.html`;
    
    // Загружаем файл с темами
    const themesFile = pageInfo.type === 'theory' ? langConfig.theoryThemes : langConfig.practiceThemes;
    if (!themesFile) {
        document.getElementById('theory-list-container').innerHTML = '<div class="error">Файл с темами не указан</div>';
        return;
    }
    
    try {
        const response = await fetch(themesFile + '?t=' + Date.now());
        const text = await response.text();
        
        const lines = text.trim().split('\n');
        const container = document.getElementById('theory-list-container');
        container.innerHTML = '';
        
        window.contentData = {};
        
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const parts = line.split('|');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const id = parts[1].trim();
                const topicKey = `topic${index + 1}`;
                
                window.contentData[topicKey] = { id, name };
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'theory-item';
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'theory-header';
                headerDiv.setAttribute('onclick', `toggleTopic('${topicKey}', this)`);
                headerDiv.innerHTML = `
                    <div class="expand-icon">▶</div>
                    <div class="theory-name">${name}</div>
                `;
                
                const pdfContainer = document.createElement('div');
                pdfContainer.className = 'pdf-container';
                pdfContainer.id = `pdf-${topicKey}`;
                
                const pdfWrapper = document.createElement('div');
                pdfWrapper.className = 'pdf-wrapper';
                
                const pdfViewer = document.createElement('iframe');
                pdfViewer.className = 'pdf-viewer';
                pdfViewer.id = `viewer-${topicKey}`;
                pdfViewer.src = '';
                pdfViewer.setAttribute('seamless', 'seamless');
                pdfViewer.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation');
                
                pdfWrapper.appendChild(pdfViewer);
                pdfContainer.appendChild(pdfWrapper);
                itemDiv.appendChild(headerDiv);
                itemDiv.appendChild(pdfContainer);
                
                container.appendChild(itemDiv);
            }
        });
        
    } catch (error) {
        document.getElementById('theory-list-container').innerHTML = '<div class="error">Ошибка загрузки тем</div>';
    }
}

// Переменные для отслеживания открытых тем
let currentOpenContainer = null;
let currentActiveHeader = null;
let currentTopicKey = null;

// Функция открытия/закрытия темы
function toggleTopic(topicKey, header) {
    const fileData = window.contentData[topicKey];
    
    if (!fileData) {
        alert('Данные не найдены');
        return;
    }
    
    if (!fileData.id || fileData.id.startsWith('ID_')) {
        alert(`Файл для "${fileData.name}" еще не добавлен`);
        return;
    }
    
    const container = document.getElementById(`pdf-${topicKey}`);
    const viewer = document.getElementById(`viewer-${topicKey}`);
    
    if (currentActiveHeader === header && currentTopicKey === topicKey) {
        container.classList.remove('open');
        header.classList.remove('active');
        currentActiveHeader = null;
        currentOpenContainer = null;
        currentTopicKey = null;
        return;
    }
    
    if (currentOpenContainer && currentTopicKey !== topicKey) {
        currentOpenContainer.classList.remove('open');
        if (currentActiveHeader) {
            currentActiveHeader.classList.remove('active');
        }
    }
    
    viewer.src = `https://drive.google.com/file/d/${fileData.id}/preview?rm=minimal&embedded=true`;
    container.classList.add('open');
    header.classList.add('active');
    
    currentOpenContainer = container;
    currentActiveHeader = header;
    currentTopicKey = topicKey;
    
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Функция обновления
function forceReloadThemes() {
    location.reload();
}

// Запуск
document.addEventListener('DOMContentLoaded', loadPage);

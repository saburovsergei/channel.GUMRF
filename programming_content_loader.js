// Функция для получения имени файла конфигурации
function getConfigFileName() {
    return 'programming_content_config.txt';
}

// Функция для получения имени текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop(); // например, programming_ST_theory.html
}

// Функция для определения языка и типа страницы
function parsePageName(pageName) {
    // Пример: programming_ST_theory.html -> { language: 'ST', type: 'theory' }
    const match = pageName.match(/programming_([^_]+)_(theory|practice)\.html/);
    if (match) {
        return {
            language: match[1], // ST, python, C, Csh, SQL
            type: match[2]      // theory или practice
        };
    }
    return null;
}

let currentOpenContainer = null;
let currentActiveHeader = null;
let currentTopicKey = null;
let currentCacheBuster = Date.now();

async function loadContent() {
    try {
        const configFile = getConfigFileName();
        const url = `${configFile}?t=${currentCacheBuster}`;
        
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
        const pageInfo = parsePageName(currentPage);
        
        if (!pageInfo) {
            throw new Error(`Не удалось определить язык и тип страницы из имени ${currentPage}`);
        }
        
        // Парсим конфигурационный файл
        const lines = text.split('\n');
        let currentSection = null;
        let pageConfig = null;
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;
            
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.substring(1, line.length - 1);
            } else if (currentSection === pageInfo.language) {
                // Мы в секции нужного языка
                if (!pageConfig) pageConfig = {};
                
                const [key, value] = line.split('=').map(s => s.trim());
                if (key && value) {
                    pageConfig[key] = value;
                }
            }
        }
        
        if (!pageConfig) {
            throw new Error(`Конфигурация для языка ${pageInfo.language} не найдена`);
        }
        
        console.log('Конфигурация для страницы:', pageConfig);
        
        // Определяем заголовок и тип контента
        const languageName = pageConfig.name || pageInfo.language;
        const typeName = pageInfo.type === 'theory' ? 'теория' : 'практика';
        const typeIcon = pageInfo.type === 'theory' ? '📖' : '💻';
        
        // Обновляем заголовок страницы
        document.title = `${languageName} | ${typeName === 'теория' ? 'Теория' : 'Практика'}`;
        
        // Заполняем заголовки
        document.getElementById('pageTitle').innerHTML = `${pageConfig.icon || '💻'} ${languageName} <span>${typeName}</span>`;
        
        // Устанавливаем ссылку "Назад"
        const backLink = document.getElementById('backLink');
        backLink.href = pageConfig.mainPage || `programming_${pageInfo.language}.html`;
        
        // Получаем темы для данного языка и типа
        const themesKey = `${pageInfo.type}Themes`;
        const themesFile = pageConfig[themesKey];
        
        if (!themesFile) {
            throw new Error(`Не указан файл тем для ${pageInfo.type}`);
        }
        
        // Загружаем файл с темами
        const themesUrl = `${themesFile}?t=${currentCacheBuster}`;
        const themesResponse = await fetch(themesUrl);
        
        if (!themesResponse.ok) {
            throw new Error(`Не удалось загрузить файл тем ${themesFile}`);
        }
        
        const themesText = await themesResponse.text();
        const themeLines = themesText.trim().split('\n');
        
        const contentFiles = {};
        const container = document.getElementById('theory-list-container');
        container.innerHTML = '';
        
        let hasValidLines = false;
        
        themeLines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const [name, id] = line.split('|');
            if (name && id) {
                hasValidLines = true;
                const topicKey = `topic${index + 1}`;
                contentFiles[topicKey] = { 
                    id: id.trim(), 
                    name: name.trim() 
                };
                
                const topicElement = createTopicElement(topicKey, name.trim());
                container.appendChild(topicElement);
                
                console.log(`Добавлена тема: ${name.trim()} с ID: ${id.trim()}`);
            }
        });
        
        window.contentFiles = contentFiles;
        
        if (!hasValidLines) {
            container.innerHTML = '<div class="error">Файл с темами пуст или имеет неверный формат</div>';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const container = document.getElementById('theory-list-container');
        container.innerHTML = `<div class="error">Ошибка загрузки<br>${error.message}</div>`;
    }
}

function forceReloadThemes() {
    currentCacheBuster = Date.now();
    loadContent();
    
    const btn = event.currentTarget;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 200);
}

function createTopicElement(topicKey, topicName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'theory-item';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'theory-header';
    headerDiv.setAttribute('onclick', `toggleContent('${topicKey}', this)`);
    
    headerDiv.innerHTML = `
        <div class="expand-icon">▶</div>
        <div class="theory-name">${topicName}</div>
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
    
    return itemDiv;
}

function toggleContent(topicKey, header) {
    const fileData = window.contentFiles[topicKey];
    
    if (!fileData) {
        alert(`Данные для темы не найдены`);
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

document.addEventListener('DOMContentLoaded', loadContent);

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        forceReloadThemes();
    }
});

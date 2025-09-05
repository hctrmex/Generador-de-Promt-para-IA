document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Variables globales
    let savedConfigs = JSON.parse(localStorage.getItem('savedConfigs')) || [];
    let currentChapters = [];
    
    // Obtener elementos del DOM
    const promptNameInput = document.getElementById('promptName');
    const toneSelect = document.getElementById('toneSelect');
    const otherToneContainer = document.getElementById('otherToneContainer');
    const otherToneInput = document.getElementById('otherToneInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const topPSlider = document.getElementById('topPSlider');
    const topPValue = document.getElementById('topPValue');
    
    // Event listeners
    toneSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            otherToneContainer.style.display = 'block';
        } else {
            otherToneContainer.style.display = 'none';
        }
    });

    temperatureSlider.addEventListener('input', function() {
        temperatureValue.textContent = 'Valor: ' + this.value;
    });
    
    topPSlider.addEventListener('input', function() {
        topPValue.textContent = 'Valor: ' + this.value;
    });
    
    document.getElementById('addChapterBtn').addEventListener('click', addChapter);
    document.getElementById('saveConfig').addEventListener('click', saveConfiguration);
    document.getElementById('resetConfig').addEventListener('click', resetConfiguration);
    document.getElementById('generatePromptBtn').addEventListener('click', generatePrompt);
    document.getElementById('copyPromptBtn').addEventListener('click', copyPrompt);
    document.getElementById('savePromptBtn').addEventListener('click', savePrompt);
    document.getElementById('presetSelect').addEventListener('change', applyPreset);
    
    // Cargar configuraciones guardadas al iniciar
    loadSavedConfigs();
    
    // Funciones
    function addChapter() {
        const chapterList = document.getElementById('chapterList');
        const chapterCount = chapterList.children.length + 1;
        const chapterId = 'chapter-' + Date.now();
        
        const newChapter = document.createElement('div');
        newChapter.className = 'chapter-item';
        newChapter.id = chapterId;
        newChapter.innerHTML = `
            <div class="chapter-actions">
                <button class="btn btn-sm btn-outline-primary me-1 edit-chapter" onclick="moveChapterUp('${chapterId}')">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary me-1 edit-chapter" onclick="moveChapterDown('${chapterId}')">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeChapter('${chapterId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h6 class="mb-1">Capítulo ${chapterCount}</h6>
            <div class="mb-2">
                <input type="text" class="form-control form-control-sm" placeholder="Título del capítulo" 
                    onchange="updateChapterTitle('${chapterId}', this.value)">
            </div>
            <textarea class="form-control form-control-sm" rows="3" 
                placeholder="Objetivos específicos de este capítulo..." 
                onchange="updateChapterContent('${chapterId}', this.value)"></textarea>
        `;
        chapterList.appendChild(newChapter);
        currentChapters.push({
            id: chapterId,
            title: '',
            content: ''
        });
    }
    
    window.removeChapter = function(chapterId) {
        const chapterElement = document.getElementById(chapterId);
        if (chapterElement) {
            chapterElement.remove();
            currentChapters = currentChapters.filter(ch => ch.id !== chapterId);
            renumberChapters();
        }
    };
    
    window.moveChapterUp = function(chapterId) {
        const chapterElement = document.getElementById(chapterId);
        const prevElement = chapterElement.previousElementSibling;
        if (prevElement) {
            chapterElement.parentNode.insertBefore(chapterElement, prevElement);
            renumberChapters();
        }
    };
    
    window.moveChapterDown = function(chapterId) {
        const chapterElement = document.getElementById(chapterId);
        const nextElement = chapterElement.nextElementSibling;
        if (nextElement) {
            chapterElement.parentNode.insertBefore(nextElement, chapterElement);
            renumberChapters();
        }
    };
    
    function renumberChapters() {
        const chapters = document.querySelectorAll('.chapter-item');
        chapters.forEach((chapter, index) => {
            const titleElement = chapter.querySelector('h6');
            if (titleElement) {
                titleElement.textContent = `Capítulo ${index + 1}`;
            }
        });
    }
    
    window.updateChapterTitle = function(chapterId, title) {
        const chapter = currentChapters.find(ch => ch.id === chapterId);
        if (chapter) {
            chapter.title = title;
        }
    };
    
    window.updateChapterContent = function(chapterId, content) {
        const chapter = currentChapters.find(ch => ch.id === chapterId);
        if (chapter) {
            chapter.content = content;
        }
    };
    
    function saveConfiguration() {
        const configName = promptNameInput.value || 'Configuración sin nombre';
        const configDescription = document.getElementById('promptDescription').value;
        const currentTone = toneSelect.value === 'other' ? otherToneInput.value : toneSelect.value;
    
        const config = {
            id: Date.now(),
            name: configName,
            description: configDescription,
            role: document.getElementById('roleInput').value,
            tone: currentTone,
            objective: document.getElementById('objectiveInput').value,
            scope: document.getElementById('scopeInput').value,
            sequentiality: document.getElementById('sequentialityInput').value,
            format: document.getElementById('formatInput').value,
            temperature: temperatureSlider.value,
            seed: document.getElementById('seedInput').value,
            topP: topPSlider.value,
            maxTokens: document.getElementById('maxTokensInput').value,
            globalTitle: document.getElementById('globalAnalysisTitle').value,
            synthesisFocus: document.getElementById('synthesisFocus').value,
            chapters: [...currentChapters],
            timestamp: new Date().toISOString()
        };
        
        savedConfigs = savedConfigs.filter(c => c.name !== config.name);
        savedConfigs.push(config);
        
        localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs));
        showToast('Configuración guardada correctamente', 'success');
        loadSavedConfigs();
    }
    
    function loadSavedConfigs() {
        const configList = document.getElementById('configList');
        if (!configList) return;
        
        configList.innerHTML = '';
        
        if (savedConfigs.length === 0) {
            configList.innerHTML = '<p class="text-center">No hay configuraciones guardadas.</p>';
            return;
        }
        
        savedConfigs.forEach(config => {
            const configElement = document.createElement('div');
            configElement.className = 'saved-config';
            configElement.innerHTML = `
                <h6>${config.name}</h6>
                <p class="small">${config.description || 'Sin descripción'}</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="loadConfiguration(${config.id})">
                        <i class="fas fa-file-import me-1"></i>Cargar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteConfiguration('${config.name}')">
                        <i class="fas fa-trash me-1"></i>Eliminar
                    </button>
                </div>
            `;
            configList.appendChild(configElement);
        });
    }
    
    window.loadConfiguration = function(configId) {
        const config = savedConfigs.find(c => c.id === configId);
        if (!config) return;
        
        promptNameInput.value = config.name;
        document.getElementById('promptDescription').value = config.description || '';
        document.getElementById('roleInput').value = config.role || '';
        toneSelect.value = config.tone;
        if (toneSelect.value !== config.tone) {
            toneSelect.value = 'other';
            otherToneContainer.style.display = 'block';
            otherToneInput.value = config.tone;
        } else {
            otherToneContainer.style.display = 'none';
        }
        document.getElementById('objectiveInput').value = config.objective || '';
        document.getElementById('scopeInput').value = config.scope || '';
        document.getElementById('sequentialityInput').value = config.sequentiality || '';
        document.getElementById('formatInput').value = config.format || '';
        temperatureSlider.value = config.temperature || 0.7;
        document.getElementById('seedInput').value = config.seed || '';
        topPSlider.value = config.topP || 0.9;
        document.getElementById('maxTokensInput').value = config.maxTokens || 500;
        document.getElementById('globalAnalysisTitle').value = config.globalTitle || '';
        document.getElementById('synthesisFocus').value = config.synthesisFocus || '';
        
        temperatureValue.textContent = 'Valor: ' + (config.temperature || 0.7);
        topPValue.textContent = 'Valor: ' + (config.topP || 0.9);
        
        currentChapters = config.chapters || [];
        renderChapters();
        
        showToast('Configuración cargada correctamente', 'success');
    };
    
    function renderChapters() {
        const chapterList = document.getElementById('chapterList');
        chapterList.innerHTML = '';
        currentChapters.forEach((chapter, index) => {
            const newChapter = document.createElement('div');
            newChapter.className = 'chapter-item';
            newChapter.id = chapter.id;
            newChapter.innerHTML = `
                <div class="chapter-actions">
                    <button class="btn btn-sm btn-outline-primary me-1 edit-chapter" onclick="moveChapterUp('${chapter.id}')">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-chapter" onclick="moveChapterDown('${chapter.id}')">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeChapter('${chapter.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h6 class="mb-1">Capítulo ${index + 1}</h6>
                <div class="mb-2">
                    <input type="text" class="form-control form-control-sm" placeholder="Título del capítulo" 
                        value="${chapter.title || ''}" onchange="updateChapterTitle('${chapter.id}', this.value)">
                </div>
                <textarea class="form-control form-control-sm" rows="3" 
                    placeholder="Objetivos específicos de este capítulo..." 
                    onchange="updateChapterContent('${chapter.id}', this.value)">${chapter.content || ''}</textarea>
            `;
            chapterList.appendChild(newChapter);
        });
    }
    
    window.deleteConfiguration = function(configName) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'deleteConfirmModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar Eliminación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ¿Estás seguro de que deseas eliminar la configuración "${configName}"?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const deleteConfirmModal = new bootstrap.Modal(modal);
        deleteConfirmModal.show();
    
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        confirmDeleteBtn.addEventListener('click', function() {
            savedConfigs = savedConfigs.filter(c => c.name !== configName);
            localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs));
            loadSavedConfigs();
            showToast('Configuración eliminada', 'info');
            deleteConfirmModal.hide();
            modal.remove();
        });
    };
    
    function resetConfiguration() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'resetConfirmModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar Reinicio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ¿Estás seguro de que deseas restablecer todos los campos?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirmResetBtn">Restablecer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const resetConfirmModal = new bootstrap.Modal(modal);
        resetConfirmModal.show();
    
        const confirmResetBtn = document.getElementById('confirmResetBtn');
        confirmResetBtn.addEventListener('click', function() {
            promptNameInput.value = '';
            document.getElementById('promptDescription').value = '';
            document.getElementById('roleInput').value = '';
            toneSelect.value = 'profesional';
            otherToneContainer.style.display = 'none';
            otherToneInput.value = '';
            document.getElementById('objectiveInput').value = '';
            document.getElementById('scopeInput').value = '';
            document.getElementById('sequentialityInput').value = '';
            document.getElementById('formatInput').value = '';
            temperatureSlider.value = 0.7;
            document.getElementById('seedInput').value = '';
            topPSlider.value = 0.9;
            document.getElementById('maxTokensInput').value = 500;
            document.getElementById('globalAnalysisTitle').value = '';
            document.getElementById('synthesisFocus').value = '';
            
            temperatureValue.textContent = 'Valor: 0.7';
            topPValue.textContent = 'Valor: 0.9';
            
            currentChapters = [];
            document.getElementById('chapterList').innerHTML = '';
            
            showToast('Campos restablecidos', 'info');
            resetConfirmModal.hide();
            modal.remove();
        });
    };
    
    function applyPreset() {
        const preset = document.getElementById('presetSelect').value;
        otherToneContainer.style.display = 'none';
        
        switch(preset) {
            case 'technical':
                temperatureSlider.value = 0.1;
                topPSlider.value = 0.3;
                toneSelect.value = 'técnico';
                temperatureValue.textContent = 'Valor: 0.1';
                topPValue.textContent = 'Valor: 0.3';
                break;
                
            case 'creative':
                temperatureSlider.value = 0.9;
                topPSlider.value = 1.0;
                toneSelect.value = 'creativo';
                temperatureValue.textContent = 'Valor: 0.9';
                topPValue.textContent = 'Valor: 1.0';
                break;
                
            case 'research':
                temperatureSlider.value = 0.3;
                topPSlider.value = 0.5;
                toneSelect.value = 'académico';
                temperatureValue.textContent = 'Valor: 0.3';
                topPValue.textContent = 'Valor: 0.5';
                break;
            default:
                break;
        }
    }
    
    function generatePrompt() {
        const selectedModel = document.querySelector('.model-btn.active').dataset.model;
        const role = document.getElementById('roleInput').value;
        const tone = toneSelect.value === 'other' ? otherToneInput.value : toneSelect.value;
        const objective = document.getElementById('objectiveInput').value;
        const scope = document.getElementById('scopeInput').value;
        const sequentiality = document.getElementById('sequentialityInput').value;
        const format = document.getElementById('formatInput').value;
        const temperature = temperatureSlider.value;
        const seed = document.getElementById('seedInput').value;
        const topP = topPSlider.value;
        const maxTokens = document.getElementById('maxTokensInput').value;
        
        let promptText = '';
        
        if (currentChapters.length > 0 && document.getElementById('autoSynthesisCheck').checked) {
            const globalTitle = document.getElementById('globalAnalysisTitle').value;
            const synthesisFocus = document.getElementById('synthesisFocus').value;
            
            promptText = `ROL: Experto en síntesis de información compleja y generación de insights estratégicos.

OBJETIVO: Generar un informe final que integre los hallazgos de los ${currentChapters.length} capítulos de investigación sobre ${globalTitle}. El informe debe incluir un Resumen Ejecutivo global, Conclusiones generales que capturen las interrelaciones entre los temas analizados, y Recomendaciones estratégicas desde el enfoque de: ${synthesisFocus}.

DOCUMENTACIÓN DE BASE (Resúmenes Ejecutivos de cada Capítulo):
`;

            currentChapters.forEach((chapter, index) => {
                promptText += `\n- CAPÍTULO ${index + 1}: ${chapter.title || 'Sin título'}\n`;
                promptText += `  ${chapter.content || 'Sin contenido específico'}\n`;
            });

            promptText += `
INSTRUCCIONES:
1. Analiza las interconexiones, tensiones y oportunidades que surgen de la integración de todos los resúmenes.
2. No introduzcas nueva información factual que no esté contenida en los resúmenes proporcionados.
3. Las recomendaciones deben ser accionables, específicas y derivadas directamente del análisis integrado.
${sequentiality ? '\nSECUENCIALIDAD: ' + sequentiality : ''}

TONO: ${tone}.
FORMATO: ${format}.

PARÁMETROS TÉCNICOS:
- Temperature: ${temperature}
- Top P: ${topP}
- ${seed ? 'Seed: ' + seed : ''}
- Max Tokens: ${maxTokens}`;

        } else {
            promptText = `ROL: ${role}

OBJETIVO: ${objective}

ALCANCE: ${scope}
${sequentiality ? '\nSECUENCIALIDAD: ' + sequentiality : ''}

FORMATO DE SALIDA: ${format}

TONO: ${tone}

PARÁMETROS TÉCNICOS:
- Temperature: ${temperature}
- Top P: ${topP}
- ${seed ? 'Seed: ' + seed : ''}
- Max Tokens: ${maxTokens}`;
        }
        
        const generatedPrompt = document.getElementById('generatedPrompt');
        generatedPrompt.textContent = promptText;
        generatedPrompt.classList.remove('d-none');
        generatedPrompt.scrollIntoView({ behavior: 'smooth' });
        showToast('Prompt generado', 'info');
    }
    
    function copyPrompt() {
        const promptText = document.getElementById('generatedPrompt').textContent;
        navigator.clipboard.writeText(promptText).then(() => {
            showToast('Prompt copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error al copiar el texto: ', err);
            showToast('Error al copiar', 'danger');
        });
    }

    function savePrompt() {
        const promptName = promptNameInput.value || 'Prompt';
        const sanitizedName = promptName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        const fileName = `${sanitizedName}.txt`;
        const promptText = document.getElementById('generatedPrompt').textContent;
        const blob = new Blob([promptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Prompt guardado como ${fileName}`, 'success');
    }
    
    function showToast(message, type) {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        toastContainer.appendChild(toastElement);
        const bsToast = new bootstrap.Toast(toastElement);
        bsToast.show();
        setTimeout(() => toastElement.remove(), 3000);
    }
    
    // Asignar funciones a window para que los botones con onclick funcionen
    window.removeChapter = removeChapter;
    window.moveChapterUp = moveChapterUp;
    window.moveChapterDown = moveChapterDown;
    window.updateChapterTitle = updateChapterTitle;
    window.updateChapterContent = updateChapterContent;
    window.loadConfiguration = loadConfiguration;
    window.deleteConfiguration = deleteConfiguration;
});

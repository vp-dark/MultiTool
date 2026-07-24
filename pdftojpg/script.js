document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Dark Mode Logic (Inherited base logic) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    function updateIcon(theme) {
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }

    // --- 2. FAQ Accordion Logic (Inherited base logic) ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });
                if (!isActive) {
                    item.classList.add('active');
                    questionBtn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    // --- 3. PDF to JPG Tool Logic ---
    const uploadArea = document.getElementById('upload-area');
    const pdfInput = document.getElementById('pdf-input');
    
    if (uploadArea && pdfInput) {
        // Initialize PDF.js worker
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // UI Elements
        const settingsArea = document.getElementById('settings-area');
        const outputArea = document.getElementById('output-area');
        const fileNameEl = document.getElementById('fileName');
        const pageCountEl = document.getElementById('page-count');
        const errorMsgEl = document.getElementById('error-message');
        
        // Settings Elements
        const qualityInput = document.getElementById('image-quality');
        const qualityVal = document.getElementById('quality-val');
        const scaleInput = document.getElementById('image-scale');
        const scaleVal = document.getElementById('scale-val');
        const pageSelectionInput = document.getElementById('page-selection');
        
        // Buttons & Progress
        const convertBtn = document.getElementById('convert-btn');
        const resetBtn = document.getElementById('reset-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressBarFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const outputGallery = document.getElementById('output-gallery');
        const downloadZipBtn = document.getElementById('download-zip-btn');
        const convertAnotherBtn = document.getElementById('convert-another-btn');

        let currentPdf = null;
        let generatedImages = []; // Stores { name: string, dataUrl: string }
        let totalPages = 0;

        // Settings Listeners
        qualityInput.addEventListener('input', (e) => qualityVal.textContent = `${Math.round(e.target.value * 100)}%`);
        scaleInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            let label = "Standard";
            if (val < 1.5) label = "Low";
            else if (val > 2.0) label = "High";
            scaleVal.textContent = `${label} (${val}x)`;
        });

        // Upload Event Listeners
        uploadArea.addEventListener('click', () => pdfInput.click());
        uploadArea.addEventListener('keydown', (e) => { if(e.key === 'Enter') pdfInput.click(); });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        pdfInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileSelect(e.target.files[0]);
            }
        });

        resetBtn.addEventListener('click', resetTool);
        convertAnotherBtn.addEventListener('click', resetTool);
        
        // Core Conversion Trigger
        convertBtn.addEventListener('click', processConversion);
        
        // ZIP Download Trigger
        downloadZipBtn.addEventListener('click', downloadAsZip);

        async function handleFileSelect(file) {
            hideError();
            if (file.type !== 'application/pdf') {
                showError("Unsupported format. Please upload a valid PDF file.");
                return;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                
                // Try loading the PDF
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                currentPdf = await loadingTask.promise;
                
                totalPages = currentPdf.numPages;
                document.getElementById('file-name').textContent = file.name;
                pageCountEl.textContent = `${totalPages} Page${totalPages > 1 ? 's' : ''}`;
                
                uploadArea.classList.add('hidden');
                settingsArea.classList.remove('hidden');
                
            } catch (error) {
                console.error("PDF Load Error: ", error);
                if (error.name === 'PasswordException') {
                    showError("This PDF is encrypted with a password. Please unlock it before converting.");
                } else {
                    showError("This file is corrupted or not a valid PDF. Please try a different file.");
                }
            }
        }

        // Parse user input like "1, 3, 5-8" into an array of page numbers
        function parsePageSelection(input, maxPages) {
            if (!input.trim()) return Array.from({length: maxPages}, (_, i) => i + 1);
            
            const pages = new Set();
            const parts = input.split(',');
            
            for (let part of parts) {
                part = part.trim();
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    if (start > 0 && end <= maxPages && start <= end) {
                        for (let i = start; i <= end; i++) pages.add(i);
                    }
                } else {
                    const num = Number(part);
                    if (num > 0 && num <= maxPages) pages.add(num);
                }
            }
            
            return Array.from(pages).sort((a, b) => a - b);
        }

        async function processConversion() {
            hideError();
            generatedImages = [];
            outputGallery.innerHTML = '';
            
            const pagesToConvert = parsePageSelection(pageSelectionInput.value, totalPages);
            if (pagesToConvert.length === 0) {
                showError("Invalid page selection. Please check your page ranges.");
                return;
            }

            // UI State lock
            convertBtn.disabled = true;
            resetBtn.disabled = true;
            progressContainer.classList.remove('hidden');
            
            const quality = parseFloat(qualityInput.value);
            const scale = parseFloat(scaleInput.value);
            const fileNameBase = document.getElementById('file-name').textContent.replace('.pdf', '');

            // Convert Pages
            for (let i = 0; i < pagesToConvert.length; i++) {
                const pageNum = pagesToConvert[i];
                
                // Update Progress UI
                const percent = Math.round(((i) / pagesToConvert.length) * 100);
                progressBarFill.style.width = `${percent}%`;
                progressText.textContent = `Converting page ${pageNum} (${i + 1} of ${pagesToConvert.length})...`;

                try {
                    const page = await currentPdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: scale });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = { canvasContext: context, viewport: viewport };
                    await page.render(renderContext).promise;

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const outputName = `${fileNameBase}_page_${pageNum}.jpg`;
                    
                    generatedImages.push({ name: outputName, dataUrl: dataUrl });
                    createGalleryItem(dataUrl, outputName);

                    // Yield execution to prevent browser freezing during massive conversions
                    await new Promise(resolve => setTimeout(resolve, 10));

                } catch (err) {
                    console.error(`Error rendering page ${pageNum}:`, err);
                    showError(`An error occurred while rendering page ${pageNum}.`);
                }
            }

            // Finalize Progress
            progressBarFill.style.width = `100%`;
            progressText.textContent = "Conversion Complete!";
            
            setTimeout(() => {
                settingsArea.classList.add('hidden');
                outputArea.classList.remove('hidden');
                convertBtn.disabled = false;
                resetBtn.disabled = false;
                progressContainer.classList.add('hidden');
            }, 600);
        }

        function createGalleryItem(dataUrl, filename) {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = filename;
            img.loading = "lazy";
            
            const span = document.createElement('span');
            span.textContent = filename;
            
            const btn = document.createElement('a');
            btn.href = dataUrl;
            btn.download = filename;
            btn.className = 'btn primary-btn mt-2';
            btn.textContent = 'Download JPG';
            
            div.appendChild(img);
            div.appendChild(span);
            div.appendChild(btn);
            outputGallery.appendChild(div);
        }

        async function downloadAsZip() {
            const originalBtnText = downloadZipBtn.textContent;
            downloadZipBtn.textContent = "Generating ZIP...";
            downloadZipBtn.disabled = true;

            try {
                const zip = new JSZip();
                generatedImages.forEach(img => {
                    // Remove the data:image/jpeg;base64, prefix for JSZip
                    const base64Data = img.dataUrl.split(',')[1];
                    zip.file(img.name, base64Data, {base64: true});
                });

                const content = await zip.generateAsync({type: "blob"});
                
                // Create temporary download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${document.getElementById('file-name').textContent.replace('.pdf', '')}_converted.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

            } catch (err) {
                console.error("ZIP Generation Error:", err);
                alert("Failed to generate ZIP file. You can still download images individually.");
            } finally {
                downloadZipBtn.textContent = originalBtnText;
                downloadZipBtn.disabled = false;
            }
        }

        function showError(message) {
            errorMsgEl.textContent = message;
            errorMsgEl.classList.remove('hidden');
        }

        function hideError() {
            errorMsgEl.textContent = '';
            errorMsgEl.classList.add('hidden');
        }

        function resetTool() {
            currentPdf = null;
            generatedImages = [];
            pdfInput.value = '';
            pageSelectionInput.value = '';
            
            outputArea.classList.add('hidden');
            settingsArea.classList.add('hidden');
            uploadArea.classList.remove('hidden');
            hideError();
            
            progressBarFill.style.width = '0%';
        }
    }
});
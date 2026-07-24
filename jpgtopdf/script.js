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

    // --- 3. JPG to PDF Tool Logic ---
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    
    if (uploadArea && imageInput) {
        // UI Elements
        const settingsArea = document.getElementById('settings-area');
        const outputArea = document.getElementById('output-area');
        const fileNameEl = document.getElementById('file-name');
        const pageCountEl = document.getElementById('page-count');
        const errorMsgEl = document.getElementById('error-message');
        
        // Buttons & Progress
        const convertBtn = document.getElementById('convert-btn');
        const resetBtn = document.getElementById('reset-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressBarFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const convertAnotherBtn = document.getElementById('convert-another-btn');

        let selectedFiles = [];
        let generatedPdfBlobUrl = null;

        // Upload Event Listeners
        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('keydown', (e) => { if(e.key === 'Enter') imageInput.click(); });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFileSelect(e.dataTransfer.files);
            }
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileSelect(e.target.files);
            }
        });

        resetBtn.addEventListener('click', resetTool);
        convertAnotherBtn.addEventListener('click', resetTool);
        
        // Core Conversion Trigger
        convertBtn.addEventListener('click', processConversion);
        
        // PDF Download Trigger
        downloadPdfBtn.addEventListener('click', () => {
            if (generatedPdfBlobUrl) {
                const link = document.createElement('a');
                link.href = generatedPdfBlobUrl;
                link.download = 'converted_document.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });

        function handleFileSelect(files) {
            hideError();
            
            // Filter only accepted image formats
            const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            
            if (validFiles.length === 0) {
                showError("Unsupported format. Please upload valid JPG or PNG images.");
                return;
            }

            selectedFiles = validFiles; // Store references to selected files
            
            fileNameEl.textContent = `${selectedFiles.length} image(s) selected`;
            pageCountEl.textContent = `${selectedFiles.length} Page${selectedFiles.length > 1 ? 's' : ''}`;
            
            uploadArea.classList.add('hidden');
            settingsArea.classList.remove('hidden');
        }

        // Helper to read file as Data URL
        function readFileAsDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Helper to load image to get dimensions
        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }

        async function processConversion() {
            hideError();
            if (selectedFiles.length === 0) return;

            // UI State lock
            convertBtn.disabled = true;
            resetBtn.disabled = true;
            progressContainer.classList.remove('hidden');
            
            const pageSizeSetting = document.getElementById('page-size').value; // 'a4' or 'fit'
            const orientationSetting = document.getElementById('page-orientation').value; // 'auto', 'p', 'l'
            const margin = parseInt(document.getElementById('image-margin').value); // 0, 20, 40 (pixels)

            const { jsPDF } = window.jspdf;
            let doc = null;

            try {
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    
                    // Update Progress UI
                    const percent = Math.round((i / selectedFiles.length) * 100);
                    progressBarFill.style.width = `${percent}%`;
                    progressText.textContent = `Adding image ${i + 1} of ${selectedFiles.length}...`;

                    // Process image
                    const imgDataUrl = await readFileAsDataURL(file);
                    const imgObj = await loadImage(imgDataUrl);

                    // Determine Orientation
                    let pageOrientation = orientationSetting;
                    if (orientationSetting === 'auto') {
                        pageOrientation = imgObj.width > imgObj.height ? 'l' : 'p';
                    }

                    // Determine Page Format
                    let pageFormat = pageSizeSetting === 'fit' 
                        ? [imgObj.width + (margin * 2), imgObj.height + (margin * 2)] 
                        : 'a4';

                    // Initialize doc on first iteration, otherwise add new page
                    if (i === 0) {
                        doc = new jsPDF({ orientation: pageOrientation, unit: 'px', format: pageFormat });
                    } else {
                        doc.addPage(pageFormat, pageOrientation);
                    }

                    let finalWidth = imgObj.width;
                    let finalHeight = imgObj.height;
                    let xOffset = margin;
                    let yOffset = margin;

                    // If A4, we need to calculate scaling to fit the image on the page
                    if (pageSizeSetting === 'a4') {
                        const pdfWidth = doc.internal.pageSize.getWidth() - (margin * 2);
                        const pdfHeight = doc.internal.pageSize.getHeight() - (margin * 2);
                        
                        // Calculate ratio to scale image down (or up) to fit A4 bounds
                        const ratio = Math.min(pdfWidth / imgObj.width, pdfHeight / imgObj.height);
                        finalWidth = imgObj.width * ratio;
                        finalHeight = imgObj.height * ratio;
                        
                        // Center the image on the A4 page
                        xOffset = (doc.internal.pageSize.getWidth() - finalWidth) / 2;
                        yOffset = (doc.internal.pageSize.getHeight() - finalHeight) / 2;
                    }

                    // Determine image format for jsPDF
                    const imageType = file.type === 'image/png' ? 'PNG' : 'JPEG';
                    
                    doc.addImage(imgDataUrl, imageType, xOffset, yOffset, finalWidth, finalHeight);

                    // Yield execution slightly to prevent UI freezing on huge batches
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // Finalize Progress
                progressBarFill.style.width = `100%`;
                progressText.textContent = "Conversion Complete!";
                
                // Generate Blob URL for download
                const pdfBlob = doc.output('blob');
                if (generatedPdfBlobUrl) URL.revokeObjectURL(generatedPdfBlobUrl);
                generatedPdfBlobUrl = URL.createObjectURL(pdfBlob);

                setTimeout(() => {
                    settingsArea.classList.add('hidden');
                    outputArea.classList.remove('hidden');
                    convertBtn.disabled = false;
                    resetBtn.disabled = false;
                    progressContainer.classList.add('hidden');
                }, 600);

            } catch (err) {
                console.error("PDF Generation Error:", err);
                showError("An error occurred while generating the PDF. Please try again.");
                convertBtn.disabled = false;
                resetBtn.disabled = false;
                progressContainer.classList.add('hidden');
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
            selectedFiles = [];
            imageInput.value = '';
            
            if (generatedPdfBlobUrl) {
                URL.revokeObjectURL(generatedPdfBlobUrl);
                generatedPdfBlobUrl = null;
            }
            
            outputArea.classList.add('hidden');
            settingsArea.classList.add('hidden');
            uploadArea.classList.remove('hidden');
            hideError();
            
            progressBarFill.style.width = '0%';
        }
    }
});
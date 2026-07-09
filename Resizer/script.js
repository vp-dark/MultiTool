document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    // --- DOM Elements ---
    const imageUpload = document.getElementById('image-upload');
    const uploadContainer = document.getElementById('upload-container');
    const editorContainer = document.getElementById('editor-container');
    const resultsContainer = document.getElementById('results-container');
    
    const imgPreview = document.getElementById('image-preview');
    const scalePercent = document.getElementById('scale-percent');
    const percentVal = document.getElementById('percent-val');
    const inputWidth = document.getElementById('img-width');
    const inputHeight = document.getElementById('img-height');
    const lockRatio = document.getElementById('lock-ratio');
    
    const outputFormat = document.getElementById('output-format');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityVal = document.getElementById('quality-val');
    const qualityGroup = document.getElementById('quality-group');
    
    const applyBtn = document.getElementById('apply-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadLink = document.getElementById('download-link');

    // --- State Variables ---
    let originalImage = new Image();
    let originalFile = null;
    let aspectRatio = 1;

    // --- File Upload Handling ---
    imageUpload.addEventListener('change', handleFileUpload);
    
    // Drag and drop support
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = 'var(--primary-hover)';
    });
    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.style.borderColor = 'var(--primary)';
    });
    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = 'var(--primary)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            imageUpload.files = e.dataTransfer.files;
            handleFileUpload();
        }
    });

    function handleFileUpload() {
        const file = imageUpload.files[0];
        if (!file) return;
        
        originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                // Initialize UI with image data
                aspectRatio = originalImage.width / originalImage.height;
                inputWidth.value = originalImage.width;
                inputHeight.value = originalImage.height;
                imgPreview.src = originalImage.src;
                
                // Show Editor, Hide Upload
                uploadContainer.classList.add('hidden');
                editorContainer.classList.remove('hidden');
                resultsContainer.classList.add('hidden');
                
                // Setup original stats
                document.getElementById('orig-size').textContent = formatBytes(originalFile.size);
                document.getElementById('orig-dim').textContent = `${originalImage.width} x ${originalImage.height}`;
            };
        };
        reader.readAsDataURL(file);
    }

    // --- Editor Controls Logic ---
    
    // Percentage Slider
    scalePercent.addEventListener('input', (e) => {
        const scale = e.target.value / 100;
        percentVal.textContent = `${e.target.value}%`;
        
        inputWidth.value = Math.round(originalImage.width * scale);
        inputHeight.value = Math.round(originalImage.height * scale);
    });

    // Width Input
    inputWidth.addEventListener('input', (e) => {
        if (lockRatio.checked) {
            inputHeight.value = Math.round(e.target.value / aspectRatio);
        }
        updateScalePercentage();
    });

    // Height Input
    inputHeight.addEventListener('input', (e) => {
        if (lockRatio.checked) {
            inputWidth.value = Math.round(e.target.value * aspectRatio);
        }
        updateScalePercentage();
    });

    function updateScalePercentage() {
        const currentScale = Math.round((inputWidth.value / originalImage.width) * 100);
        scalePercent.value = Math.min(Math.max(currentScale, 1), 100);
        percentVal.textContent = `${scalePercent.value}%`;
    }

    // Format selection toggles quality slider (PNG is lossless, so hide quality)
    outputFormat.addEventListener('change', (e) => {
        if (e.target.value === 'image/png') {
            qualityGroup.classList.add('hidden');
        } else {
            qualityGroup.classList.remove('hidden');
        }
    });

    // Quality Slider
    qualitySlider.addEventListener('input', (e) => {
        qualityVal.textContent = `${e.target.value}%`;
    });

    // --- Image Processing (Canvas API) ---
    applyBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const targetWidth = parseInt(inputWidth.value);
        const targetHeight = parseInt(inputHeight.value);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw resized image
        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
        
        const format = outputFormat.value;
        const quality = parseInt(qualitySlider.value) / 100;

        // Convert canvas to Blob for accurate file size and downloading
        canvas.toBlob((blob) => {
            // Update Results UI
            document.getElementById('new-size').textContent = formatBytes(blob.size);
            document.getElementById('new-dim').textContent = `${targetWidth} x ${targetHeight}`;
            
            // Calculate Savings
            const savedBadge = document.getElementById('saved-badge');
            if (blob.size < originalFile.size) {
                const savedPercent = Math.round(((originalFile.size - blob.size) / originalFile.size) * 100);
                savedBadge.textContent = `Saved ${savedPercent}%`;
                savedBadge.style.backgroundColor = 'var(--accent)';
            } else {
                savedBadge.textContent = 'Larger Size';
                savedBadge.style.backgroundColor = '#ef4444'; // red warning
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            
            // Set extension based on format
            const ext = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
            downloadLink.download = `optimized_${Date.now()}.${ext}`;

            // Show results
            resultsContainer.classList.remove('hidden');
            
            // Scroll to results safely
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        }, format, quality);
    });

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        uploadContainer.classList.remove('hidden');
        editorContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        imageUpload.value = ''; // clear input
    });

    // --- Utility Functions ---
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
});
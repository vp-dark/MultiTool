document.addEventListener('DOMContentLoaded', () => {
    
    // --- Core UI Logic (Theme & FAQ) ---
    
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    function updateIcon(theme) {
        if (themeIcon) themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
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

    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(otherItem => otherItem.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        }
    });

    // --- Image Cropper Logic ---

    const imageUpload = document.getElementById('image-upload');
    const uploadArea = document.getElementById('upload-area');
    const cropperInterface = document.getElementById('cropper-interface');
    const imageToCrop = document.getElementById('image-to-crop');
    
    const widthInput = document.getElementById('crop-width');
    const heightInput = document.getElementById('crop-height');
    const ratioButtons = document.querySelectorAll('.ratio-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    let cropper;

    // Handle Drag & Drop styling
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageLoad(e.dataTransfer.files[0]);
        }
    });

    // Handle File Input
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleImageLoad(e.target.files[0]);
            }
        });
    }

    function handleImageLoad(file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            uploadArea.classList.add('hidden');
            cropperInterface.classList.remove('hidden');
            initCropper();
        };
        reader.readAsDataURL(file);
    }

    function initCropper() {
        if (cropper) {
            cropper.destroy();
        }

        cropper = new Cropper(imageToCrop, {
            viewMode: 2, // Restrict crop box to not exceed the canvas size
            dragMode: 'crop',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            
            // This runs constantly as the user drags/resizes the box
            crop(event) {
                // Update input fields with exact pixel values in real-time
                widthInput.value = Math.round(event.detail.width);
                heightInput.value = Math.round(event.detail.height);
            },
        });
    }

    // Handle Ratio Buttons
    ratioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            ratioButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            
            const ratioValue = parseFloat(btn.dataset.ratio);
            cropper.setAspectRatio(isNaN(ratioValue) ? NaN : ratioValue);
        });
    });

    // Handle Manual Typing of Dimensions
    function setManualCropBox() {
        if (!cropper) return;
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);
        
        if (w > 0 && h > 0) {
            cropper.setData({
                width: w,
                height: h
            });
            // Ensure aspect ratio is set to Free when typing custom dimensions
            cropper.setAspectRatio(NaN); 
            ratioButtons.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-ratio="NaN"]').classList.add('active');
        }
    }

    widthInput.addEventListener('change', setManualCropBox);
    heightInput.addEventListener('change', setManualCropBox);

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            cropper.reset();
            cropper.setAspectRatio(NaN);
            ratioButtons.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-ratio="NaN"]').classList.add('active');
        });
    }

    // Download Button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!cropper) return;
            
            // Get the cropped canvas
            const canvas = cropper.getCroppedCanvas({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            // Trigger download
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = 'cropped-image.jpg';
            link.href = dataUrl;
            link.click();
        });
    }
});
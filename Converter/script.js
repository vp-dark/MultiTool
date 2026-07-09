document.addEventListener('DOMContentLoaded', () => {
    
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Apply saved theme on load
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    }

    themeToggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        }
    });

    // --- Image Converter Logic ---
    const fileInput = document.getElementById('fileInput');
    const formatSelect = document.getElementById('formatSelect');
    const convertBtn = document.getElementById('convertBtn');
    const outputArea = document.getElementById('output-area');
    const previewImg = document.getElementById('previewImg');
    const downloadLink = document.getElementById('downloadLink');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    convertBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select an image file first.');
            return;
        }

        // Read the uploaded file
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            
            img.onload = function() {
                // Set canvas dimensions to match the image
                canvas.width = img.width;
                canvas.height = img.height;
                
                const targetFormat = formatSelect.value;
                const mimeType = 'image/' + targetFormat;

                // Handle transparency for JPG conversion
                // If converting to JPG, fill canvas with white first so transparent backgrounds don't turn black
                if (targetFormat === 'jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else {
                    // Clear canvas for formats supporting transparency (PNG, WEBP)
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                // Draw the image onto the canvas
                ctx.drawImage(img, 0, 0);

                // Convert canvas to Data URL of the selected format
                // 0.9 is the quality parameter (90%) for jpeg/webp
                const convertedDataUrl = canvas.toDataURL(mimeType, 0.9);

                // Update UI with preview and download link
                previewImg.src = convertedDataUrl;
                
                // Extract original filename without extension
                const originalName = file.name.split('.').slice(0, -1).join('.');
                downloadLink.href = convertedDataUrl;
                downloadLink.download = `${originalName}-multitool.${targetFormat}`;
                
                outputArea.classList.remove('hidden');
            };
            
            // Trigger image load
            img.src = event.target.result;
        };

        // Trigger file read
        reader.readAsDataURL(file);
    });
});
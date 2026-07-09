// document.addEventListener('DOMContentLoaded', () => {
    
//     // --- Dark Mode Logic ---
//     const themeToggleBtn = document.getElementById('theme-toggle');
//     const themeIcon = document.getElementById('theme-icon');
//     const htmlElement = document.documentElement;

//     // Check for saved user preference in localStorage
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) {
//         htmlElement.setAttribute('data-theme', savedTheme);
//         updateIcon(savedTheme);
//     }

//     // Toggle theme on button click
//     themeToggleBtn.addEventListener('click', () => {
//         const currentTheme = htmlElement.getAttribute('data-theme');
//         const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
//         htmlElement.setAttribute('data-theme', newTheme);
//         localStorage.setItem('theme', newTheme);
//         updateIcon(newTheme);
//     });

//     // Helper to switch the icon
//     function updateIcon(theme) {
//         themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
//     }


//     // --- FAQ Accordion Logic ---
//     const faqItems = document.querySelectorAll('.faq-item');

//     faqItems.forEach(item => {
//         const questionBtn = item.querySelector('.faq-question');
        
//         questionBtn.addEventListener('click', () => {
//             // Check if the clicked item is already active
//             const isActive = item.classList.contains('active');
            
//             // Optional: Close all other open FAQ items (remove this block if you want multiple open at once)
//             faqItems.forEach(otherItem => {
//                 otherItem.classList.remove('active');
//             });

//             // If it wasn't active, open it
//             if (!isActive) {
//                 item.classList.add('active');
//             }
//         });
//     });
// });


document.addEventListener('DOMContentLoaded', () => {
    
    // --- Dark Mode Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    // Helper to switch the icon safely (only runs if the icon exists)
    function updateIcon(theme) {
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    // Check for saved user preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    // Toggle theme on button click (only runs if the toggle button exists)
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        
        // Only add the click event if the question button actually exists
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                // Check if the clicked item is already active
                const isActive = item.classList.contains('active');
                
                // Close all other open FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });

                // If it wasn't active, open it
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // --- NOTE: Add your Resizer and Converter logic below this line! ---
    // Just remember to wrap them in an "if" statement like this:
    // 
    // const uploadBtn = document.getElementById('image-upload');
    // if (uploadBtn) {
    //     uploadBtn.addEventListener('change', () => { ... });
    // }

});
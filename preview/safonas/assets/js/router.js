/**
 * Client-side routing handler for clean URLs
 * This script handles routing when .htaccess is not being processed
 */

(function() {
    'use strict';
    
    // Only run if we're not on a file:// protocol
    if (window.location.protocol === 'file:') {
        return;
    }
    
    // Route mappings
    const routes = {
        '/pages/services': '/pages/services.html',
        '/pages/cookies-policy': '/pages/cookies-policy.html',
        '/pages/mentions-legales': '/pages/mentions-legales.html',
        '/pages': '/pages/index.html',
        '/blog': '/blog/index.html',
        '/legal': '/legal/index.html',
        '/error/404': '/error/404.html',
        '/error/403': '/error/403.html',
        '/error/500': '/error/500.html'
    };
    
    // Function to handle routing
    function handleRoute() {
        const path = window.location.pathname;
        
        // Check if we need to redirect
        if (routes[path]) {
            // If the current path matches a route, load the corresponding HTML file
            const actualPath = routes[path];
            
            // Check if we're already on the HTML file (to prevent infinite loops)
            if (!path.endsWith('.html')) {
                // Use fetch to check if the HTML file exists
                fetch(actualPath, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            // Redirect to the HTML file
                            window.location.replace(actualPath);
                        }
                    })
                    .catch(error => {
                        // Route not found
                    });
            }
        } else if (!path.endsWith('.html') && !path.includes('.')) {
            // Try adding .html to the path
            const htmlPath = path + '.html';
            fetch(htmlPath, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        window.location.replace(htmlPath);
                    }
                })
                .catch(error => {
                    // Path doesn't exist, let it 404 naturally
                });
        }
    }
    
    // Handle routing on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleRoute);
    } else {
        handleRoute();
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRoute);
    
})();
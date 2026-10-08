
    // Initialize blog automator manually with fallback data
    document.addEventListener('DOMContentLoaded', function () {
      // Force immediate fallback rendering
      setTimeout(function () {
        const blogContainer = document.getElementById('blog-posts');
        if (blogContainer && (blogContainer.innerHTML.includes('Blog posts will be dynamically loaded') || blogContainer.children.length === 0)) {
          console.log('Blog posts not loaded, using fallback data...');

          // Fallback blog data including Nano Banana post
          const fallbackPosts = [
            {
              title: "Nano Banana vs Qwen Image Edit 2509 vs Seedream-4 : Le Duel des Géants de l'IA Image 2025",
              excerpt: "🎯 Découvrez les 3 modèles d'IA révolutionnaires qui transforment l'édition d'images en 2025. Analyse comparative complète, benchmarks, et guide d'implémentation pour choisir la solution parfaite pour vos projets.",
              date: "2025-10-05",
              readTime: 15,
              category: "outils",
              url: "blog/nano-banana-qwen-seedream-ia-editing-backup",
              categoryName: "Outils IA",
              categoryIcon: "fas fa-tools"
            },
            {
              title: "Les 17 Meilleurs Outils IA pour Créer un Site Web Gratuitement",
              excerpt: "Créez votre site web professionnel en quelques minutes avec ces outils révolutionnaires d'intelligence artificielle, sans aucune connaissance technique requise. Découvrez notre sélection complète.",
              date: "2025-08-27",
              readTime: 12,
              category: "outils",
              url: "outils-ai-creation-site-gratuit",
              categoryName: "Outils IA",
              categoryIcon: "fas fa-tools"
            }
          ];

          const blogCards = fallbackPosts.map((post, index) => {
            const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const aosDelay = 200 + (index * 100);

            return `
                <article class="blog-card group relative bg-gradient-to-br from-charcoal-light to-charcoal rounded-3xl overflow-hidden border border-graphite/20 hover:border-purple/40 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple/30"  >
                  <!-- Gradient Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-br from-purple/10 to-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <!-- Image Container -->
                  <div class="relative overflow-hidden h-48 md:h-56">
                    <div class="absolute inset-0 bg-gradient-to-br from-purple via-blue to-electric-mint opacity-90"></div>
                    <div class="absolute inset-0 bg-black/20"></div>
                    <div class="relative h-full w-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                      <div class="relative">
                        <div class="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                        <i class="${post.categoryIcon} text-6xl text-white/90 relative z-10"></i>
                      </div>
                    </div>
                    <!-- Category Badge -->
                    <div class="absolute top-4 left-4">
                      <span class="px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/20">
                        <i class="${post.categoryIcon} mr-1.5"></i>${post.categoryName}
                      </span>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="relative p-6 md:p-8">
                    <!-- Date and Reading Time -->
                    <div class="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-5">
                      <span class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-electric-mint/10 to-electric-mint/5 text-electric-mint text-xs font-medium border border-electric-mint/20">
                        <i class="far fa-calendar-alt mr-1.5"></i>${formattedDate}
                      </span>
                      <span class="text-graphite-light text-xs font-medium">
                        <i class="far fa-clock mr-1"></i>${post.readTime} min de lecture
                      </span>
                    </div>

                    <!-- Title -->
                    <h3 class="font-satoshi text-xl md:text-2xl font-bold text-cloud mb-3 md:mb-4 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple group-hover:to-electric-mint transition-all duration-300">
                      ${post.title}
                    </h3>

                    <!-- Description -->
                    <p class="text-graphite-light text-sm md:text-base mb-6 md:mb-8 leading-relaxed line-clamp-3">
                      ${post.excerpt}
                    </p>

                    <!-- CTA Button -->
                    <a href="${post.url}" class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple to-blue text-white font-semibold rounded-full group-hover:shadow-lg group-hover:shadow-purple/30 transition-all duration-300 hover:scale-105">
                      <span>Découvrir l'article</span>
                      <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform duration-300"></i>
                    </a>
                  </div>

                  <!-- Decorative Corner -->
                  <div class="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple/20 to-electric-mint/20 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </article>
              `;
          }).join('');

          blogContainer.innerHTML = blogCards;
        }
      }, 2000);
    });
  
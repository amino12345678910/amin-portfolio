/**
 * Safonas Blog Automated Loading System
 * Inspired by Hugging Face's clean, mobile-first design
 */

class BlogAutomator {
  constructor() {
    this.postsData = null;
    this.config = {
      postsPerPage: 7,
      latestPostsCount: 2,
      mobileBreakpoint: 768,
      useHtmlExtensions: this.detectLocalDevelopment()
    };
    this.init();
  }

  detectLocalDevelopment() {
    // Always use clean URLs when FORCE_CLEAN_URLS is true
    const forceCleanUrls = window.FORCE_CLEAN_URLS === true;

    // Use .html extensions only if NOT forcing clean URLs AND running locally
    const isFileProtocol = window.location.protocol === 'file:';
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('.local');
    const isLocal = isFileProtocol || isLocalhost;

    const useHtmlExtensions = !forceCleanUrls && isLocal;

    console.log('Environment detection:', {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isFileProtocol,
      isLocalhost,
      isLocal,
      forceCleanUrls,
      useHtmlExtensions,
      willUseCleanUrls: forceCleanUrls || !isLocal
    });

    return useHtmlExtensions;
  }

  getCleanUrl(url) {
    // Use .html extension for local development or when configured
    // Use clean URLs for production with .htaccess support
    if (this.config.useHtmlExtensions) {
      return url.endsWith('.html') ? url : `${url}.html`;
    }
    // Remove .html extension for clean URLs
    return url.endsWith('.html') ? url.replace('.html', '') : url;
  }

  handleLinkClick(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    event.preventDefault();

    // Try the clean URL first
    window.location.href = href;
  }

  async init() {
    try {
      await this.loadPostsData();
      this.initializeEventListeners();
      this.renderLatestPosts();
      this.renderBlogIndex();
      this.updateHomepageFooter();
      this.updateHomepageBlogPosts();
      this.fixAosAnimations(); // Fix AOS animations for hover effects
    } catch (error) {
      console.error('Blog automator initialization failed:', error);
      this.showError('Erreur lors du chargement des articles');
    }
  }

  async loadPostsData() {
    try {
      // Try multiple possible paths for JSON data - prioritize blog/posts.json
      const possiblePaths = [
        './posts.json',
        'posts.json',
        './data/posts.json',
        './blog/data/posts.json',
        '../data/posts.json',
        'data/posts.json'
      ];

      let response = null;
      for (const path of possiblePaths) {
        try {
          response = await fetch(path);
          if (response.ok) {
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Could not load posts data from any path`);
      }

      this.postsData = await response.json();
      console.log('Posts data loaded successfully:', this.postsData);
    } catch (error) {
      console.error('Error loading posts data:', error);
      // Try to load from embedded data as fallback
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    // Updated fallback data matching posts.json structure
    this.postsData = {
      posts: [
        {
          id: "prompt-engineering-guide-advanced",
          title: "Guide Complet de Prompt Engineering : Maîtrisez la Communication avec l'IA",
          excerpt: "🎯 Maîtrisez l'art de communiquer avec l'intelligence artificielle grâce au framework RODES et des techniques avancées. Guide expert pour optimiser vos interactions avec l'IA.",
          date: "2025-11-09",
          author: "Équipe Safonas",
          category: "guides",
          tags: ["PromptEngineering", "IA", "RODES", "Communication", "IntelligenceArtificielle"],
          readTime: 15,
          featured: true,
          image: "https://safonas.com/assets/blog-prompt-engineering-social.jpg",
          url: "prompt-engineering-guide-advanced-visual"
        },
        {
          id: "outils-ai-creation-site-gratuit",
          title: "17 Outils IA Gratuits pour Créer un Site Web Professionnel",
          excerpt: "🚀 Découvrez notre sélection exclusive de 17 outils d'IA 100% gratuits pour créer facilement votre site web professionnel, même sans aucune connaissance technique. Économisez des milliers d'euros en frais de développement !",
          date: "2025-08-27",
          author: "Équipe Safonas",
          category: "outils",
          tags: ["OutilsGratuits", "SiteWeb", "NoCode", "IA", "DéveloppementWeb"],
          readTime: 12,
          featured: true,
          image: "https://safonas.com/assets/blog-ai-tools-social.jpg",
          url: "outils-ai-creation-site-gratuit"
        },
        {
          id: "hugging-face-spaces-guide",
          title: "Guide Complet Hugging Face Spaces - 400K+ Apps IA Gratuites",
          excerpt: "🚀 Découvrez la plus grande boutique d'applications d'IA au monde avec plus de 400 000 applications gratuites. Guide complet étape par étape pour maîtriser cette plateforme révolutionnaire et accéder à l'IA sans limites.",
          date: "2025-08-11",
          author: "Équipe Safonas",
          category: "plateformes",
          tags: ["HuggingFace", "PlateformeIA", "AppsGratuites", "MachineLearning", "IA"],
          readTime: 8,
          featured: true,
          image: "https://safonas.com/assets/blog-hugging-face-social.jpg",
          url: "hugging-face-spaces-guide"
        },
        {
          id: "chatbot-whatsapp-tunisie",
          title: "Chatbot WhatsApp Tunisie : Guide Complet pour Entreprises",
          excerpt: "Découvrez comment implémenter un chatbot WhatsApp performant pour votre entreprise tunisienne. Guide complet avec astuces locales, intégration paiement et support client arabe/français.",
          date: "2025-07-22",
          author: "Équipe Safonas",
          category: "guides",
          tags: ["Chatbot", "WhatsApp", "Tunisie", "Automatisation", "SupportClient"],
          readTime: 10,
          featured: false,
          image: "https://safonas.com/assets/blog-whatsapp-chatbot.jpg",
          url: "chatbot-whatsapp-tunisie"
        },
        {
          id: "guide-intelligence-artificielle-tunisie",
          title: "Guide Intelligence Artificielle Tunisie : Transformation Digitale 2025",
          excerpt: "Guide complet pour entreprises tunisiennes sur l'adoption de l'IA. Opportunités, défis réglementaires, solutions locales et retour sur investissement concret.",
          date: "2025-07-15",
          author: "Équipe Safonas",
          category: "guides",
          tags: ["IntelligenceArtificielle", "Tunisie", "TransformationDigitale", "Entreprises", "ROI"],
          readTime: 15,
          featured: false,
          image: "https://safonas.com/assets/blog-ia-tunisie-guide.jpg",
          url: "guide-intelligence-artificielle-tunisie"
        },
        {
          id: "automatisation-pme-tunisie",
          title: "Automatisation pour PME Tunisiennes: Par Où Commencer?",
          excerpt: "Guide pratique pour automatiser vos processus business avec l'IA. Solutions adaptées aux budgets PME tunisiennes, ROI garanti en 3 mois.",
          date: "2025-01-13",
          author: "Équipe Safonas",
          category: "outils",
          tags: ["Automatisation", "PME", "Tunisie", "Productivité", "IA"],
          readTime: 8,
          featured: false,
          image: "https://safonas.com/assets/blog-automatisation-pme.jpg",
          url: "automatisation-pme-tunisie"
        },
        {
          id: "ia-transformation-digitale-tunisie",
          title: "Comment l'IA Transforme les Entreprises en Tunisie",
          excerpt: "Découvrez les secteurs tunisiens révolutionnés par l'intelligence artificielle. Opportunités uniques, stratégies d'implémentation et études de cas locales réussies.",
          date: "2025-06-10",
          author: "Équipe Safonas",
          category: "guides",
          tags: ["IA", "TransformationDigitale", "Tunisie", "Stratégie", "Innovation"],
          readTime: 11,
          featured: false,
          image: "https://safonas.com/assets/blog-ia-transformation.jpg",
          url: "ia-transformation-digitale-tunisie"
        },
        {
          id: "nano-banana-qwen-seedream-ia-editing",
          title: "Nano Banana vs Qwen Image Edit 2509 vs Seedream-4 : Le Duel des Géants de l'IA Image 2025",
          excerpt: "🎯 Découvrez les 3 modèles d'IA révolutionnaires qui transforment l'édition d'images en 2025. Analyse comparative complète, benchmarks, et guide d'implémentation pour choisir la solution parfaite pour vos projets.",
          date: "2025-10-05",
          author: "Équipe Safonas",
          category: "outils",
          tags: ["Nano Banana", "Qwen Image Edit", "Seedream-4", "IA Image", "Benchmark"],
          readTime: 15,
          featured: true,
          image: "https://safonas.com/assets/blog-ia-editing-showdown.jpg",
          url: "nano-banana-qwen-seedream-ia-editing"
        }
      ],
      categories: [
        { id: "outils", name: "Outils IA", icon: "fas fa-tools", color: "#8b5cf6" },
        { id: "plateformes", name: "Plateformes IA", icon: "fas fa-cube", color: "#00ff94" },
        { id: "guides", name: "Guides", icon: "fas fa-book", color: "#3b82f6" }
      ]
    };
    console.log('Using updated fallback data with all 7 articles');
  }

  initializeEventListeners() {
    // Filter functionality
    document.querySelectorAll('.filter-tag').forEach(button => {
      button.addEventListener('click', (e) => this.handleFilterClick(e));
    });

    // Search functionality
    const searchInput = document.getElementById('blog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    // Load more functionality
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
    }

    // Handle blog link clicks
    document.addEventListener('click', (e) => this.handleLinkClick(e));
  }

  generateBlogCard(post, index = 0) {
    const categories = this.postsData.categories;
    const category = categories.find(cat => cat.id === post.category);

    return `
      <article class="blog-card group relative bg-gradient-to-br from-charcoal-light to-charcoal rounded-3xl overflow-hidden border border-graphite/20 hover:border-purple/40 transition-all duration-500 hover-lift" data-category="${post.category}" data-date="${post.date}" data-aos="fade-up" data-aos-delay="${index * 100}">

        <!-- Gradient Overlay on Hover -->
        <div class="absolute inset-0 bg-gradient-to-br from-purple/10 to-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <!-- Featured Image -->
        <div class="relative overflow-hidden h-56">
            <div class="absolute inset-0 bg-gradient-to-br from-purple via-blue to-electric-mint opacity-90"></div>
            <div class="absolute inset-0 bg-black/20"></div>
            <div class="relative h-full w-full flex items-center justify-center">
              <div class="relative">
                <div class="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                <i class="fas ${category?.icon || 'fa-blog'} text-6xl text-white/90 relative z-10"></i>
              </div>
            </div>

            <!-- Category Badge -->
            <div class="absolute top-4 left-4">
              <span class="px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/20">
                <i class="fas ${category?.icon || 'fa-tag'} mr-1.5"></i>${category?.name || 'Article'}
              </span>
            </div>

            <!-- Reading Time -->
            <div class="absolute top-4 right-4">
              <span class="px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-semibold">
                <i class="far fa-clock mr-1"></i>${post.readTime} min
              </span>
            </div>

            <!-- Featured Badge -->
            ${post.featured ? `
              <div class="absolute bottom-4 left-4">
                <span class="px-3 py-1.5 bg-gradient-to-r from-electric-mint to-purple rounded-full text-white text-xs font-semibold border border-white/20">
                  <i class="fas fa-star mr-1"></i>En vedette
                </span>
              </div>
            ` : ''}
          </div>

        <!-- Content -->
        <div class="relative p-6 md:p-8">
            <!-- Date -->
            <div class="flex items-center gap-4 mb-5">
              <span class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-purple/10 to-purple/5 text-purple text-xs font-medium border border-purple/20">
                <i class="far fa-calendar-alt mr-1.5"></i>${this.formatDate(post.date)}
              </span>
              ${this.isRecent(post.date) ? '<span class="text-graphite-light text-xs">Publié récemment</span>' : ''}
            </div>

            <!-- Title -->
            <h2 class="font-display text-2xl font-bold text-cloud mb-4 leading-tight group-hover:text-electric-mint transition-all duration-300">
              ${post.title}
            </h2>

            <!-- Description -->
            <p class="text-graphite-light mb-6 leading-relaxed line-clamp-3">
              ${post.excerpt}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-6">
              ${post.tags.slice(0, 3).map(tag => `
                <span class="px-2 py-1 bg-electric-mint/10 text-electric-mint text-xs rounded-full border border-electric-mint/20">
                  #${tag}
                </span>
              `).join('')}
            </div>

            <!-- CTA -->
            <a href="${this.getCleanUrl(post.url)}" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple to-blue text-white font-semibold rounded-full hover:shadow-lg hover:shadow-purple/30 transition-all duration-300 hover:scale-105 group">
              <span>Lire l'article complet</span>
              <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform duration-300"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  generateFooterPostCard(post, index = 0) {
    return `
      <article class="footer-post-card" data-aos="fade-up" data-aos-delay="${index * 100}">
        <div class="flex items-start space-x-4 p-4 rounded-xl hover:bg-charcoal-light/50 transition-all duration-300 group">
          <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple to-blue rounded-lg flex items-center justify-center">
            <i class="fas fa-blog text-white text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-cloud font-semibold text-sm mb-1 line-clamp-2 group-hover:text-electric-mint transition-colors">
              ${post.title}
            </h4>
            <p class="text-graphite-light text-xs mb-2">
              ${this.formatDate(post.date)} • ${post.readTime} min lecture
            </p>
            <a href="blog/${this.getCleanUrl(post.url)}" class="inline-flex items-center text-electric-mint text-xs font-medium hover:text-purple transition-colors">
              Lire la suite
              <i class="fas fa-arrow-right ml-1 transform group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  renderBlogPosts(posts, container, limit = null) {
    const postsToRender = limit ? posts.slice(0, limit) : posts;
    const html = postsToRender.map((post, index) => this.generateBlogCard(post, index)).join('');
    container.innerHTML = html;
  }

  renderLatestPosts() {
    const container = document.getElementById('latest-posts-container');
    if (!container) return;

    const latestPosts = this.getSortedPosts().slice(0, this.config.latestPostsCount);
    const html = latestPosts.map((post, index) => this.generateFooterPostCard(post, index)).join('');
    container.innerHTML = html;
  }

  renderBlogIndex() {
    const container = document.getElementById('articles-grid');
    if (!container) return;

    const posts = this.getSortedPosts();
    this.renderBlogPosts(posts, container, this.config.postsPerPage);
  }

  updateHomepageFooter() {
    const footerContainer = document.getElementById('footer-blog-posts');
    if (!footerContainer) {
      console.log('Footer blog posts container not found - skipping footer updates');
      return;
    }

    const latestPosts = this.getSortedPosts().slice(0, 3);
    const html = `
      <div class="footer-blog-posts">
        <h3 class="footer-section-title">Derniers Articles</h3>
        <div class="footer-posts-grid">
          ${latestPosts.map((post, index) => this.generateFooterPostCard(post, index)).join('')}
        </div>
        <div class="footer-blog-cta">
          <a href="blog/" class="footer-blog-link">
            Voir tous les articles
            <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </div>
    `;
    footerContainer.innerHTML = html;
  }

  updateHomepageBlogPosts() {
    const homepageContainer = document.getElementById('blog-posts');
    if (!homepageContainer) return;

    // Get more posts for homepage display - show 2 most recent posts
    const latestPosts = this.getSortedPosts().slice(0, this.config.latestPostsCount);

    if (latestPosts.length === 0) {
      homepageContainer.innerHTML = '<div class="col-span-2 text-center text-graphite-light py-8">Aucun article disponible pour le moment.</div>';
      return;
    }

    const html = latestPosts.map((post, index) => this.generateHomepageBlogCard(post, index)).join('');
    homepageContainer.innerHTML = html;
  }

  generateHomepageBlogCard(post, index = 0) {
    const categories = this.postsData.categories;
    const category = categories.find(cat => cat.id === post.category);
    const aosDelay = 200 + (index * 100); // 200ms for first card, 300ms for second

    return `
      <article class="blog-card group relative bg-gradient-to-br from-charcoal-light to-charcoal rounded-3xl overflow-hidden border border-graphite/20 hover:border-purple/40 transition-all duration-500 hover-lift" data-aos="fade-up" data-aos-delay="${aosDelay}" data-title="${post.title}">
        <!-- Gradient Overlay on Hover -->
        <div class="absolute inset-0 bg-gradient-to-br from-purple/10 to-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <!-- Image Container with Parallax Effect -->
        <div class="relative overflow-hidden h-48 md:h-56">
          <div class="absolute inset-0 bg-gradient-to-br from-purple via-blue to-electric-mint opacity-90"></div>
          <div class="absolute inset-0 bg-black/20"></div>
          <div class="relative h-full w-full flex items-center justify-center">
            <div class="relative">
              <div class="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
              <i class="fas ${category?.icon || 'fa-blog'} text-6xl text-white/90 relative z-10"></i>
            </div>
          </div>
          <!-- Category Badge -->
          <div class="absolute top-4 left-4">
            <span class="px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/20">
              <i class="fas ${category?.icon || 'fa-tag'} mr-1.5"></i>${category?.name || 'Article'}
            </span>
          </div>
        </div>

        <!-- Content Container -->
        <div class="relative p-6 md:p-8">
          <!-- Date and Reading Time -->
          <div class="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-5">
            <span class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-electric-mint/10 to-electric-mint/5 text-electric-mint text-xs font-medium border border-electric-mint/20">
              <i class="far fa-calendar-alt mr-1.5"></i>${this.formatDate(post.date)}
            </span>
            <span class="text-graphite-light text-xs font-medium">
              <i class="far fa-clock mr-1"></i>${post.readTime} min de lecture
            </span>
          </div>

          <!-- Title with Hover Effect -->
          <h3 class="font-satoshi text-xl md:text-2xl font-bold text-cloud mb-3 md:mb-4 leading-tight group-hover:text-electric-mint transition-all duration-300">
            ${post.title}
          </h3>

          <!-- Description -->
          <p class="text-graphite-light text-sm md:text-base mb-6 md:mb-8 leading-relaxed line-clamp-3">
            ${post.excerpt}
          </p>

          <!-- CTA Button -->
          <a href="blog/${this.getCleanUrl(post.url)}" class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple to-blue text-white font-semibold rounded-full group-hover:shadow-lg group-hover:shadow-purple/30 transition-all duration-300 hover:scale-105">
            <span>Découvrir l'article</span>
            <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform duration-300"></i>
          </a>
        </div>

        <!-- Decorative Corner Element -->
        <div class="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple/20 to-electric-mint/20 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </article>
    `;
  }

  handleFilterClick(event) {
    const button = event.currentTarget;
    const filter = button.dataset.filter;

    // Update active state
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Filter posts
    const filteredPosts = this.getFilteredPosts(filter);
    const container = document.getElementById('articles-grid');
    this.renderBlogPosts(filteredPosts, container);
  }

  handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredPosts = this.getSearchedPosts(searchTerm);
    const container = document.getElementById('articles-grid');
    this.renderBlogPosts(filteredPosts, container);
  }

  loadMorePosts() {
    const container = document.getElementById('articles-grid');
    const currentPostsCount = container.children.length;
    const allPosts = this.getSortedPosts();
    const remainingPosts = allPosts.slice(currentPostsCount);

    if (remainingPosts.length === 0) {
      document.getElementById('load-more-btn').style.display = 'none';
      return;
    }

    const html = remainingPosts.slice(0, this.config.postsPerPage).map((post, index) =>
      this.generateBlogCard(post, currentPostsCount + index)
    ).join('');

    container.insertAdjacentHTML('beforeend', html);

    if (currentPostsCount + remainingPosts.length <= this.config.postsPerPage) {
      document.getElementById('load-more-btn').style.display = 'none';
    }
  }

  getSortedPosts() {
    if (!this.postsData || !this.postsData.posts) return [];

    return [...this.postsData.posts].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
  }

  getFilteredPosts(category) {
    const posts = this.getSortedPosts();
    if (category === 'all') return posts;
    return posts.filter(post => post.category === category);
  }

  getSearchedPosts(searchTerm) {
    const posts = this.getSortedPosts();
    if (!searchTerm) return posts;

    return posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  isRecent(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  showError(message) {
    const errorHtml = `
      <div class="blog-error">
        <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-3"></i>
          <p class="text-red-400">${message}</p>
        </div>
      </div>
    `;

    const container = document.getElementById('articles-grid');
    if (container) {
      container.innerHTML = errorHtml;
    }
  }

  // Public method for manual updates
  async refreshPosts() {
    try {
      await this.loadPostsData();
      this.renderLatestPosts();
      this.renderBlogIndex();
      this.updateHomepageFooter();
      this.updateHomepageBlogPosts();
      this.fixAosAnimations(); // Re-apply AOS fix after refresh
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  }

  fixAosAnimations() {
    // Fix AOS animations that may be stuck and ensure hover effects work
    setTimeout(() => {
      if (typeof AOS !== 'undefined') {
        // Refresh AOS to ensure proper initialization
        AOS.refresh({
          once: true,
          duration: 800,
          easing: 'ease-out-quart'
        });

        // Manually trigger animation for all blog cards that haven't animated
        const allCards = document.querySelectorAll('.blog-card');
        let animatedCount = 0;

        allCards.forEach((card, index) => {
          if (!card.classList.contains('aos-animate')) {
            setTimeout(() => {
              card.classList.add('aos-animate');
            }, index * 100); // Stagger the animations
          } else {
            animatedCount++;
          }
        });

        console.log(`AOS fix applied: ${animatedCount}/${allCards.length} cards already animated, ${allCards.length - animatedCount} cards manually animated`);

        // Add comprehensive hover styles that work with AOS
        this.addAosCompatibleHoverStyles();

        // Add direct JavaScript hover event listeners
        this.addDirectHoverListeners();
      }
    }, 1000); // Wait 1 second for initial animations to potentially complete
  }

  addAosCompatibleHoverStyles() {
    // Create a style element for hover effects that work with AOS
    const hoverStyle = document.createElement('style');
    hoverStyle.setAttribute('data-aos-fix', 'true');
    hoverStyle.textContent = `
      /* Force hover effects on all blog cards regardless of AOS state */
      .blog-card:hover {
        transform: translateY(-8px) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 20px 40px rgba(0, 255, 148, 0.15) !important;
        border-color: rgba(0, 255, 148, 0.4) !important;
        position: relative !important;
        z-index: 10 !important;
      }

      .blog-card.aos-animate:hover {
        transform: translateY(-8px) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 20px 40px rgba(0, 255, 148, 0.15) !important;
        border-color: rgba(0, 255, 148, 0.4) !important;
        position: relative !important;
        z-index: 10 !important;
      }

      .blog-card.hover-lift:hover {
        transform: translateY(-8px) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 20px 40px rgba(0, 255, 148, 0.15) !important;
        border-color: rgba(0, 255, 148, 0.4) !important;
        position: relative !important;
        z-index: 10 !important;
      }

      /* Ensure cards are in their final position */
      .blog-card.aos-animate {
        transform: translateY(0) !important;
      }

      .blog-card.hover-lift.aos-animate {
        transform: translateY(0) !important;
      }

      /* Ensure cards reset to proper position after AOS animation */
      .blog-card.aos-init.aos-animate {
        transform: translateY(0) !important;
      }

      /* Maximum specificity rule for guaranteed hover effect */
      article.blog-card.hover-lift.aos-init.aos-animate.js-hover-active,
      article.blog-card.hover-lift.aos-init.aos-animate:hover {
        transform: translateY(-8px) !important;
        box-shadow: 0 20px 40px rgba(0, 255, 148, 0.15) !important;
        border-color: rgba(0, 255, 148, 0.4) !important;
        cursor: pointer !important;
        position: relative !important;
        z-index: 10 !important;
      }

      /* Super aggressive override to beat any conflicting rules */
      .blog-card.hover-lift.aos-init.aos-animate.js-hover-active[style*="transform"],
      .blog-card.hover-lift.aos-init.aos-animate:hover[style*="transform"] {
        transform: translateY(-8px) !important;
      }

      /* Override AOS transform reset */
      .blog-card.aos-init.aos-animate {
        transform: translateY(0) !important;
      }

      .blog-card.aos-init.aos-animate:hover {
        transform: translateY(-8px) !important;
      }
    `;
    document.head.appendChild(hoverStyle);
    console.log('Enhanced AOS-compatible hover styles added with maximum specificity rule');
  }

  addDirectHoverListeners() {
    // Add direct JavaScript event listeners for guaranteed hover effects
    const blogCards = document.querySelectorAll('.blog-card');

    blogCards.forEach((card, index) => {
      // Store original transition
      const originalTransition = getComputedStyle(card).transition;

      // Set pointer cursor by default to indicate hoverability
      card.style.cursor = 'pointer';

      // Mouse enter - apply hover effect
      card.addEventListener('mouseenter', () => {
        // Force remove any AOS transform first
        card.style.removeProperty('transform');

        // Apply hover effect with maximum force
        setTimeout(() => {
          card.style.setProperty('transform', 'translateY(-8px)', 'important');
          card.style.setProperty('transition', 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
          card.style.setProperty('box-shadow', '0 20px 40px rgba(0, 255, 148, 0.15)', 'important');
          card.style.setProperty('border-color', 'rgba(0, 255, 148, 0.4)', 'important');
          card.style.setProperty('position', 'relative', 'important');
          card.style.setProperty('z-index', '10', 'important');
          card.classList.add('js-hover-active');
        }, 10); // Small delay to ensure AOS doesn't override
      });

      // Mouse leave - remove hover effect
      card.addEventListener('mouseleave', () => {
        card.style.removeProperty('transform');
        card.style.removeProperty('box-shadow');
        card.style.removeProperty('border-color');
        card.style.removeProperty('position');
        card.style.removeProperty('z-index');
        card.classList.remove('js-hover-active');
      });

      // Touch start/end for mobile
      card.addEventListener('touchstart', () => {
        card.style.setProperty('transform', 'translateY(-8px)', 'important');
        card.style.setProperty('box-shadow', '0 20px 40px rgba(0, 255, 148, 0.15)', 'important');
        card.style.setProperty('position', 'relative', 'important');
        card.style.setProperty('z-index', '10', 'important');
        card.classList.add('js-hover-active');
      });

      card.addEventListener('touchend', () => {
        setTimeout(() => {
          card.style.removeProperty('transform');
          card.style.removeProperty('box-shadow');
          card.style.removeProperty('position');
          card.style.removeProperty('z-index');
          card.classList.remove('js-hover-active');
        }, 300);
      });
    });

    console.log(`Direct hover listeners added to ${blogCards.length} blog cards`);
  }
}

// Initialize the blog automator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.blogAutomator = new BlogAutomator();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogAutomator;
}
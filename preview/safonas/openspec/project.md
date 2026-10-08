# Project Context

## Purpose
Safonas is a leading AI agency in Tunisia specializing in artificial intelligence solutions for businesses. The website serves as a digital showcase and lead generation platform featuring:
- AI-powered chatbot integration for customer engagement
- Comprehensive blog with SEO-optimized content about AI and automation
- Service presentation for chatbots, automation, and predictive analytics
- Contact and quotation system with Supabase backend
- Mobile-first responsive design with advanced animations
- Multi-language support (French primary, Arabic capabilities)

## Tech Stack

### Frontend
- **HTML5** - Semantic markup with accessibility features
- **CSS3** - Custom CSS with CSS Variables, Grid, Flexbox, and animations
- **Vanilla JavaScript** - No frameworks, pure JS with modern ES6+ features
- **Tailwind CSS 2.2.19** - Utility-first CSS framework (CDN)
- **Font Awesome 6.4.0** - Icon library (CDN)
- **Google Fonts (Inter)** - Typography system

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
  - URL: https://ejonogfzwsrmuzgiywge.supabase.co
  - Tables: chatbot_interactions, contact_forms
- **Node.js** - Local development server
- **Custom REST API** - Built-in backend for contact forms and chatbot

### Development Tools
- **SPARC Methodology** - Specification, Pseudocode, Architecture, Refinement, Completion
- **Claude-Flow** - AI-powered development orchestration
- **Local Server** - Node.js server for clean URL testing (port 8080)
- **Git** - Version control with automated commit workflow

### Third-party Integrations
- **Google Analytics (G-32YPLYV9T5)** - Website analytics and tracking
- **Google Tag Manager** - Tag management system
- **Webhook Integration** - For AI chatbot backend communication

## Project Conventions

### Code Style
- **File Organization**: Strict directory structure with `/src`, `/assets`, `/blog`, `/pages`, `/legal`
- **Naming Conventions**:
  - Kebab-case for files and CSS classes
  - camelCase for JavaScript variables and functions
  - PascalCase for JavaScript classes
- **CSS Architecture**: CSS Variables for theming, mobile-first responsive design
- **JavaScript**: Modern ES6+, modular structure, no jQuery dependency
- **Security-First**: All features implement comprehensive security measures

### Architecture Patterns
- **Component-Based**: Modular JavaScript components with clear separation of concerns
- **Mobile-First**: Progressive enhancement from mobile to desktop
- **Progressive Web App**: Service worker capabilities and offline support considerations
- **Security Layer**: CSP headers, XSS protection, CSRF tokens, input sanitization
- **Performance Optimization**: Lazy loading, critical CSS, optimized images

### Testing Strategy
- **Manual Testing**: Cross-browser and device testing
- **Performance Testing**: Core Web Vitals monitoring
- **Security Testing**: OWASP compliance checks
- **Accessibility Testing**: WCAG 2.1 AA compliance verification
- **Mobile Testing**: Responsive design validation across devices

### Git Workflow
- **Automated Commits**: Every change triggers automatic git commit with descriptive messages
- **Commit Format**: `type: description` with detailed body and co-authorship
- **Branch Strategy**: Main branch for production, feature branches for development
- **Commit Categories**: feat, fix, security, style, docs, refactor, config, test
- **Documentation**: All changes include proper git documentation

## Domain Context

### Business Domain
- **AI Agency Services**: Chatbot development, automation solutions, predictive analytics
- **Target Market**: Tunisian and Francophone businesses seeking AI transformation
- **Content Strategy**: Educational blog content about AI tools and implementation
- **Lead Generation**: Contact forms and consultation booking system
- **Local Focus**: Tunisia-specific business context and market understanding

### Technical Domain
- **Chatbot Integration**: Real-time AI-powered customer service
- **SEO Optimization**: Structured data, meta tags, clean URLs, sitemaps
- **Content Management**: JSON-based blog post management system
- **Security Implementation**: Comprehensive security framework with multiple layers
- **Performance**: Optimized for mobile devices and slow connections

## Important Constraints

### Security Constraints
- **CSP Headers**: Strict Content Security Policy implementation
- **Data Privacy**: GDPR-compliant data handling
- **Authentication**: Secure user authentication with Supabase
- **Input Validation**: All user inputs sanitized and validated
- **HTTPS Only**: Production requires SSL/TLS encryption

### Performance Constraints
- **Mobile Performance**: Core Web Vitals scores above 90
- **Load Time**: Pages must load under 3 seconds on 3G
- **Bundle Size**: JavaScript and CSS optimized for minimal file sizes
- **Image Optimization**: WebP format with responsive images
- **Caching Strategy**: Aggressive caching for static assets

### Business Constraints
- **Language Requirements**: Primary French, secondary Arabic support
- **Local Regulations**: Compliance with Tunisian digital laws
- **SEO Requirements**: High ranking for Tunisia-based AI searches
- **Brand Guidelines**: Consistent visual identity and messaging
- **Accessibility**: WCAG 2.1 AA compliance for all users

## External Dependencies

### Critical Services
- **Supabase Database**: Essential for chatbot interactions and contact forms
- **Google Analytics**: Required for website performance tracking
- **CDN Services**: Tailwind CSS and Font Awesome via CDN
- **Google Fonts**: Inter font family for typography
- **Webhook Services**: AI chatbot backend integration

### Development Dependencies
- **Node.js Runtime**: Required for local development server
- **Git Version Control**: Essential for code management
- **Modern Browser Support**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Internet Connection**: Required for CDN dependencies and external services

### Optional Services
- **AI Model APIs**: For enhanced chatbot capabilities
- **Email Services**: For contact form notifications
- **Analytics Platforms**: Alternative to Google Analytics
- **CDN Providers**: For static asset optimization
- **Monitoring Services**: For uptime and performance monitoring

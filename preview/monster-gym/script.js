const hero = document.querySelector(".hero");
const heroVideo = document.querySelector(".hero-video");

if (hero && heroVideo) {
  const markVideoReady = () => {
    hero.classList.add("video-ready");
    hero.classList.remove("video-missing");
  };

  const markVideoMissing = () => {
    if (!hero.classList.contains("video-ready")) {
      hero.classList.add("video-missing");
    }
  };

  heroVideo.addEventListener("canplay", markVideoReady, { once: true });
  heroVideo.addEventListener("error", markVideoMissing);

  for (const source of heroVideo.querySelectorAll("source")) {
    source.addEventListener("error", markVideoMissing);
  }

  heroVideo.play().catch(markVideoMissing);
}

// --- Scroll Entrance Reveal (IntersectionObserver) ---
const animatedElements = document.querySelectorAll(".animate-on-scroll");
if ("IntersectionObserver" in window && animatedElements.length > 0) {
  const observerOptions = {
    root: null,
    threshold: 0.12,
    rootMargin: "0px"
  };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(element => {
    scrollObserver.observe(element);
  });
} else {
  // Fallback if browser doesn't support IntersectionObserver
  animatedElements.forEach(element => {
    element.classList.add("in-view");
  });
}

// --- Dynamic Particle Generator ---
const particlesContainer = document.querySelector(".particles-container");
if (particlesContainer) {
  const particleCount = 25;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    
    const size = Math.random() * 3.5 + 1.5; // 1.5px to 5px
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 14 + 10; // 10s to 24s
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.top = `${top}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    
    particlesContainer.appendChild(particle);
  }
}

// --- Premium 3D Mouse Tilt Interaction ---
const isHoverSupported = window.matchMedia("(hover: hover)").matches;
if (isHoverSupported) {
  const tiltWrappers = document.querySelectorAll(".program-card-wrapper");
  tiltWrappers.forEach(wrapper => {
    wrapper.addEventListener("mousemove", e => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation angle (max 7 degrees for premium, subtle movement)
      const rotateX = ((centerY - y) / centerY) * 7;
      const rotateY = ((x - centerX) / centerX) * 7;
      
      // Get stagger offset if screen is larger than mobile (640px)
      let stagger = 0;
      if (window.innerWidth > 640) {
        stagger = parseFloat(wrapper.getAttribute("data-stagger") || "0");
      }
      
      wrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025) translateY(${stagger - 8}px)`;
    });
    
    wrapper.addEventListener("mouseleave", () => {
      let stagger = 0;
      if (window.innerWidth > 640) {
        stagger = parseFloat(wrapper.getAttribute("data-stagger") || "0");
      }
      wrapper.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(${stagger}px)`;
    });
  });
}

// ==========================================================================
// TRANSLATION DICTIONARIES
// ==========================================================================

const TRANSLATIONS = {
  en: {
    "nav.programs": "Programs",
    "nav.schedule": "Schedule",
    "nav.coaches": "Coaches",
    "nav.membership": "Membership",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.book": "Book a Trial",
    "hero.eyebrow": "Confidence. Energy. Discipline.",
    "hero.title1": "Train hard.",
    "hero.title2": "Move sharp.",
    "hero.title3": "Become a monster.",
    "hero.copy": "Boxing, kickboxing, grappling, and strength training in a world-class facility built for all levels.",
    "hero.trial": "Start Free Trial",
    "hero.explore": "Explore Classes",
    "programs.kicker": "Train Your Way",
    "programs.title": "Choose Your Fight",
    "programs.desc": "From striking to grappling, strength to conditioning. Find the program that pushes your limits.",
    "card.tag_boxing": "STRIKE",
    "card.title_boxing": "Boxing",
    "card.desc_boxing": "Build power, speed and confidence.",
    "card.action": "Enter program",
    "card.tag_kickbox": "POWER",
    "card.title_kickbox": "Kickboxing",
    "card.desc_kickbox": "Striking, combinations and conditioning.",
    "card.tag_grappling": "CONTROL",
    "card.title_grappling": "Grappling",
    "card.desc_grappling": "Control, technique and leverage.",
    "card.tag_strength": "FORCE",
    "card.title_strength": "Strength Training",
    "card.desc_strength": "Get strong. Stay strong. Perform better.",
    "about.kicker": "TEAM MONSTER ///",
    "about.title_part1": "Serious training",
    "about.title_part2": "without",
    "about.title_part3": "the ego.",
    "about.copy": "Monster Gym pairs coach-led technique with conditioning that actually carries over to the mat, ring, and daily life. Show up consistent, leave stronger.",
    "about.gate_top": "EGO STAYS OUTSIDE",
    "about.gate_bottom": "WORK ENTERS HERE",
    "about.panel_kicker": "ACCESS: TRAINING FLOOR //",
    "about.panel_title": "THE ROOM STANDARD",
    "about.panel_status": "STATUS: ACTIVE",
    "about.p1_title": "RESPECT THE ROOM",
    "about.p1_desc": "No showing off. No shortcuts. No wasted rounds.",
    "about.p2_title": "COACHING FIRST",
    "about.p2_desc": "Technique, correction, and feedback every session.",
    "about.p3_title": "PRESSURE WITH PURPOSE",
    "about.p3_desc": "Train hard, but train smart.",
    "about.p4_title": "LEAVE STRONGER",
    "about.p4_desc": "Walk in focused. Walk out better.",
    "about.active_indicator": "ACTIVE",
    "about.panel_footer_label": "NO EGO SYSTEM / 04 PRINCIPLES",
    "features.kicker": "What You Get",
    "features.title": "Technique, sweat, recovery, repeat.",
    "features.c1_title": "Coach-led rounds",
    "features.c1_desc": "Every class has a clear focus, progression, and correction from experienced instructors.",
    "features.c2_title": "Real conditioning",
    "features.c2_desc": "Build power, stamina, mobility, and resilience with combat-ready training blocks.",
    "features.c3_title": "Clean intensity",
    "features.c3_desc": "Hard work, controlled contact, and a team culture that keeps training productive.",
    "schedule.kicker": "Weekly Flow",
    "schedule.title": "Classes that fit real life.",
    "schedule.col_day": "Day",
    "schedule.col_early": "Early",
    "schedule.col_evening": "Evening",
    "schedule.col_focus": "Focus",
    "schedule.day_mon": "Monday",
    "schedule.class_boxing": "Boxing",
    "schedule.class_kickbox": "Kickboxing",
    "schedule.focus_striking": "Striking",
    "schedule.day_tue": "Tuesday",
    "schedule.class_strength": "Strength",
    "schedule.class_grappling": "Grappling",
    "schedule.focus_control": "Control",
    "schedule.day_wed": "Wednesday",
    "schedule.class_sparring": "Sparring Lab",
    "schedule.focus_timing": "Timing",
    "schedule.day_thu": "Thursday",
    "schedule.class_mobility": "Mobility",
    "schedule.focus_power": "Power",
    "schedule.day_sat": "Saturday",
    "schedule.class_open": "Open Mat",
    "schedule.class_kids": "Kids",
    "schedule.focus_team": "Team",
    "coaches.kicker": "COACHES ///",
    "coaches.title": "LED BY FIGHTERS. BUILT FOR MEMBERS.",
    "coaches.subtitle": "Real coaching. Real feedback. No ego. No wasted rounds.",
    "coaches.p1_title": "Coach-led technique",
    "coaches.p1_desc": "Real feedback every session.",
    "coaches.p2_title": "Pressure-tested training",
    "coaches.p2_desc": "Built for the mat, ring, and daily life.",
    "coaches.p3_title": "No ego culture",
    "coaches.p3_desc": "Serious work. Respectful room.",
    "membership.kicker": "Membership",
    "membership.title": "Start with the trial. Stay for the standard.",
    "membership.copy": "Drop in for a coached trial class, meet the team, and find the right program before choosing a plan.",
    "membership.price_label": "Most popular",
    "membership.price_title": "Unlimited Training",
    "membership.price_sub": "/mo",
    "membership.f1": "All adult classes",
    "membership.f2": "Open mat access",
    "membership.f3": "Strength room blocks",
    "membership.f4": "Monthly progress check",
    "membership.cta": "Claim Trial Spot",
    "trial.kicker": "Book In",
    "trial.title": "Your first class is waiting.",
    "trial.label_name": "Name",
    "trial.placeholder_name": "Your name",
    "trial.label_email": "Email",
    "trial.placeholder_email": "you@example.com",
    "trial.label_program": "Program",
    "card.title_kids": "Kids Martial Arts",
    "trial.submit": "Request Trial",
    "footer.tagline": "Confidence. Energy. Discipline.",
    "chat.status": "SYSTEM // ACTIVE",
    "chat.header_title": "MONSTER ASSISTANT",
    "chat.placeholder": "Ask about training...",
    "chat.greeting": "Welcome to **Monster Gym**. I am your tactical training assistant. How can I help you build discipline today?",
    "chat.err_send_failed": "Failed to transmit message. Try again."
  },
  fr: {
    "nav.programs": "Programmes",
    "nav.schedule": "Planning",
    "nav.coaches": "Entraîneurs",
    "nav.membership": "Tarifs",
    "nav.about": "À Propos",
    "nav.contact": "Contact",
    "nav.book": "Réserver un essai",
    "hero.eyebrow": "Confiance. Énergie. Discipline.",
    "hero.title1": "Entraînez-vous dur.",
    "hero.title2": "Bougez avec précision.",
    "hero.title3": "Devenez un monstre.",
    "hero.copy": "Boxe, kickboxing, grappling et musculation dans un espace haut de gamme conçu pour tous les niveaux.",
    "hero.trial": "Essai Gratuit",
    "hero.explore": "Découvrir les cours",
    "programs.kicker": "Entraînez-vous à votre façon",
    "programs.title": "Choisissez votre combat",
    "programs.desc": "Du striking au grappling, de la force au conditionnement. Trouvez le programme qui repousse vos limites.",
    "card.tag_boxing": "STRIKING",
    "card.title_boxing": "Boxe",
    "card.desc_boxing": "Développez votre puissance, votre vitesse et votre confiance.",
    "card.action": "Découvrir le programme",
    "card.tag_kickbox": "PUISSANCE",
    "card.title_kickbox": "Kickboxing",
    "card.desc_kickbox": "Enchaînements, frappes et conditionnement physique.",
    "card.tag_grappling": "CONTRÔLE",
    "card.title_grappling": "Grappling",
    "card.desc_grappling": "Contrôle, technique et effet de levier.",
    "card.tag_strength": "FORCE",
    "card.title_strength": "Musculation & Force",
    "card.desc_strength": "Devenez fort. Restez fort. Soyez plus performant.",
    "about.kicker": "L'EQUIPE MONSTER ///",
    "about.title_part1": "Entraînement sérieux",
    "about.title_part2": "sans",
    "about.title_part3": "l'ego.",
    "about.copy": "Monster Gym associe des techniques guidées par des coachs à un conditionnement physique directement transférable sur le tatami, le ring et au quotidien. Soyez régulier, devenez plus fort.",
    "about.gate_top": "L'EGO RESTE DEHORS",
    "about.gate_bottom": "LE TRAVAIL ENTRE ICI",
    "about.panel_kicker": "ACCÈS : SURFACE D'ENTRAÎNEMENT //",
    "about.panel_title": "LE STANDARD DE LA SALLE",
    "about.panel_status": "STATUT : ACTIF",
    "about.p1_title": "RESPECTER LA SALLE",
    "about.p1_desc": "Pas de frime. Pas de raccourcis. Pas de rounds gâchés.",
    "about.p2_title": "LE COACHING D'ABORD",
    "about.p2_desc": "Technique, correction et retours à chaque séance.",
    "about.p3_title": "L'INTENSITÉ AVEC OBJECTIF",
    "about.p3_desc": "S'entraîner dur, mais s'entraîner intelligemment.",
    "about.p4_title": "REPARTIR PLUS FORT",
    "about.p4_desc": "Entrer concentré. Repartir meilleur.",
    "about.active_indicator": "ACTIF",
    "about.panel_footer_label": "SYSTÈME SANS EGO / 04 PRINCIPLES",
    "features.kicker": "Ce que vous obtenez",
    "features.title": "Technique, sueur, récupération, répétition.",
    "features.c1_title": "Rounds encadrés par un coach",
    "features.c1_desc": "Chaque cours bénéficie d'objectifs clairs, de progressions et de corrections par des instructeurs expérimentés.",
    "features.c2_title": "Vrai conditionnement",
    "features.c2_desc": "Développez votre puissance, endurance, mobilité et résilience grâce à des blocs d'entraînement conçus pour le combat.",
    "features.c3_title": "Intensité maîtrisée",
    "features.c3_desc": "Travail rigoureux, contacts contrôlés et esprit d'équipe garantissant des entraînements productifs.",
    "schedule.kicker": "Emploi du temps",
    "schedule.title": "Des cours adaptés à la vraie vie.",
    "schedule.col_day": "Jour",
    "schedule.col_early": "Matin",
    "schedule.col_evening": "Soir",
    "schedule.col_focus": "Objectif",
    "schedule.day_mon": "Lundi",
    "schedule.class_boxing": "Boxe",
    "schedule.class_kickbox": "Kickboxing",
    "schedule.focus_striking": "Striking",
    "schedule.day_tue": "Mardi",
    "schedule.class_strength": "Force",
    "schedule.class_grappling": "Grappling",
    "schedule.focus_control": "Contrôle",
    "schedule.day_wed": "Mercredi",
    "schedule.class_sparring": "Labo Sparring",
    "schedule.focus_timing": "Timing",
    "schedule.day_thu": "Jeudi",
    "schedule.class_mobility": "Mobilité",
    "schedule.focus_power": "Puissance",
    "schedule.day_sat": "Samedi",
    "schedule.class_open": "Tapis Libre",
    "schedule.class_kids": "Enfants",
    "schedule.focus_team": "Équipe",
    "coaches.kicker": "COACHS ///",
    "coaches.title": "DIRIGÉ PAR DES COMBATTANTS. CONÇU POUR LES MEMBRES.",
    "coaches.subtitle": "Un vrai coaching. De vrais retours. Pas d'ego. Pas de rounds gâchés.",
    "coaches.p1_title": "Technique guidée",
    "coaches.p1_desc": "De vrais retours à chaque séance.",
    "coaches.p2_title": "Entraînement éprouvé",
    "coaches.p2_desc": "Conçu pour le tatami, le ring et le quotidien.",
    "coaches.p3_title": "Culture sans ego",
    "coaches.p3_desc": "Travail sérieux. Respect mutuel.",
    "membership.kicker": "Adhésion",
    "membership.title": "Commencez par l'essai. Adoptez la formule.",
    "membership.copy": "Venez pour un cours d'essai encadré, rencontrez l'équipe et trouvez le bon programme avant de choisir une formule.",
    "membership.price_label": "Le plus populaire",
    "membership.price_title": "Entraînement Illimité",
    "membership.price_sub": "/mois",
    "membership.f1": "Tous les cours adultes",
    "membership.f2": "Accès au tapis libre",
    "membership.f3": "Accès à la salle de musculation",
    "membership.f4": "Suivi mensuel personnalisé",
    "membership.cta": "Réserver mon cours d'essai",
    "trial.kicker": "Réservation",
    "trial.title": "Votre premier cours vous attend.",
    "trial.label_name": "Nom",
    "trial.placeholder_name": "Votre nom",
    "trial.label_email": "E-mail",
    "trial.placeholder_email": "vous@exemple.com",
    "trial.label_program": "Programme",
    "card.title_kids": "Arts Martiaux Enfants",
    "trial.submit": "Demander mon essai",
    "footer.tagline": "Confiance. Énergie. Discipline.",
    "chat.status": "SYSTÈME // ACTIF",
    "chat.header_title": "ASSISTANT MONSTER",
    "chat.placeholder": "Posez une question...",
    "chat.greeting": "Bienvenue chez **Monster Gym**. Je suis votre assistant tactique d'entraînement. Comment puis-je vous aider à forger votre discipline aujourd'hui ?",
    "chat.err_send_failed": "Échec de la transmission du message. Veuillez réessayer."
  }
};

// --- Language State Management ---
let currentLang = localStorage.getItem("monster_gym_lang") || "en";

// --- Active Coach State ---
let activeCoachIndex = 0;

// --- Coaches Dossiers Config Array ---
const COACHES_DATA = {
  en: [
    {
      id: "MENTOR ID // 01",
      name: "Maya Torres",
      role: "Boxing Coach",
      specialty: "Fundamentals / Footwork / Composure",
      description: "Boxing coach focused on fundamentals, footwork, and composure under pressure.",
      quote: "Clean basics beat chaos.",
      tags: ["Boxing", "Footwork", "Defense", "Confidence"],
      stats: {
        technique: 95,
        conditioning: 88,
        discipline: 96,
        fightIq: 92
      },
      image: "assets/coach_maya.png",
      disciplineCode: "boxing",
      accentColor: "#8bd23f"
    },
    {
      id: "MENTOR ID // 02",
      name: "Karim Haddad",
      role: "Kickboxing Coach",
      specialty: "Combinations / Timing / Conditioning",
      description: "Kickboxing coach building sharp combinations, rhythm, and full-body fight conditioning.",
      quote: "Power means nothing without rhythm.",
      tags: ["Kickboxing", "Timing", "Power", "Cardio"],
      stats: {
        technique: 90,
        conditioning: 96,
        discipline: 89,
        fightIq: 88
      },
      image: "assets/coach_karim.png",
      disciplineCode: "kickboxing",
      accentColor: "#ff453a"
    },
    {
      id: "MENTOR ID // 03",
      name: "Youssef Ben Salah",
      role: "Grappling Coach",
      specialty: "Control / Leverage / Pressure",
      description: "Grappling coach focused on control, transitions, pressure, and calm decision-making.",
      quote: "Control first. Finish second.",
      tags: ["Grappling", "Pressure", "Leverage", "Control"],
      stats: {
        technique: 94,
        conditioning: 86,
        discipline: 93,
        fightIq: 97
      },
      image: "assets/coach_youssef.png",
      disciplineCode: "grappling",
      accentColor: "#ffd60a"
    },
    {
      id: "MENTOR ID // 04",
      name: "Lina Mansour",
      role: "Strength Coach",
      specialty: "Strength / Mobility / Performance",
      description: "Strength coach helping members build power, resilience, mobility, and long-term athletic performance.",
      quote: "Strong is built rep by rep.",
      tags: ["Strength", "Mobility", "Power", "Resilience"],
      stats: {
        technique: 87,
        conditioning: 90,
        discipline: 95,
        fightIq: 84
      },
      image: "assets/coach_lina.png",
      disciplineCode: "strength",
      accentColor: "#0a84ff"
    }
  ],
  fr: [
    {
      id: "ID MENTOR // 01",
      name: "Maya Torres",
      role: "Coach de Boxe",
      specialty: "Fondamentaux / Jeu de jambes / Calme",
      description: "Coach de boxe spécialisée dans les fondamentaux, le déplacement et le sang-froid sous pression.",
      quote: "Les bases propres surclassent le chaos.",
      tags: ["Boxe", "Jeu de jambes", "Défense", "Confiance"],
      stats: {
        technique: 95,
        conditioning: 88,
        discipline: 96,
        fightIq: 92
      },
      image: "assets/coach_maya.png",
      disciplineCode: "boxing",
      accentColor: "#8bd23f"
    },
    {
      id: "ID MENTOR // 02",
      name: "Karim Haddad",
      role: "Coach de Kickboxing",
      specialty: "Enchaînements / Timing / Conditionnement",
      description: "Coach de kickboxing focalisé sur les combinaisons rapides, le rythme et le conditionnement physique.",
      quote: "La puissance n'est rien sans rythme.",
      tags: ["Kickboxing", "Timing", "Puissance", "Cardio"],
      stats: {
        technique: 90,
        conditioning: 96,
        discipline: 89,
        fightIq: 88
      },
      image: "assets/coach_karim.png",
      disciplineCode: "kickboxing",
      accentColor: "#ff453a"
    },
    {
      id: "ID MENTOR // 03",
      name: "Youssef Ben Salah",
      role: "Coach de Grappling",
      specialty: "Contrôle / Effet de levier / Pression",
      description: "Coach de grappling axé sur le contrôle positionnel, les transitions, la pression et le calme au sol.",
      quote: "Contrôler d'abord. Finaliser ensuite.",
      tags: ["Grappling", "Pression", "Effet de levier", "Contrôle"],
      stats: {
        technique: 94,
        conditioning: 86,
        discipline: 93,
        fightIq: 97
      },
      image: "assets/coach_youssef.png",
      disciplineCode: "grappling",
      accentColor: "#ffd60a"
    },
    {
      id: "ID MENTOR // 04",
      name: "Lina Mansour",
      role: "Coach de Force & Musculation",
      specialty: "Force / Mobilité / Performance",
      description: "Coach de musculation aidant les membres à développer force, résilience et performance athlétique.",
      quote: "La force se construit répétition après répétition.",
      tags: ["Force", "Mobilité", "Puissance", "Résilience"],
      stats: {
        technique: 87,
        conditioning: 90,
        discipline: 95,
        fightIq: 84
      },
      image: "assets/coach_lina.png",
      disciplineCode: "strength",
      accentColor: "#0a84ff"
    }
  ]
};

const renderCoaches = () => {
  const coaches = COACHES_DATA[currentLang];
  const activeCoach = coaches[activeCoachIndex];
  
  // Populate selectors list
  const selectorList = document.getElementById("coach-selector-list");
  if (selectorList) {
    selectorList.innerHTML = coaches.map((coach, index) => {
      const isActive = index === activeCoachIndex;
      return `
        <div class="selector-card ${isActive ? 'active' : ''}" data-index="${index}" style="--coach-theme: ${coach.accentColor};">
          <div class="selector-thumb">
            <img src="${coach.image}" alt="${coach.name}" />
          </div>
          <div class="selector-info">
            <h4>${coach.name}</h4>
            <span class="selector-role">${coach.role}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click event listeners to selectors
    selectorList.querySelectorAll(".selector-card").forEach(card => {
      card.addEventListener("click", () => {
        const index = parseInt(card.getAttribute("data-index"));
        selectCoach(index);
      });
    });
  }

  // Populate active coach panel
  const panel = document.getElementById("active-coach-panel");
  if (panel && activeCoach) {
    panel.style.setProperty("--active-accent", activeCoach.accentColor);

    const labels = currentLang === 'en' ? {
      technique: "Technique",
      conditioning: "Conditioning",
      discipline: "Discipline",
      fightIq: "Fight IQ",
      trainWith: "Train With"
    } : {
      technique: "Technique",
      conditioning: "Conditionnement",
      discipline: "Discipline",
      fightIq: "QI de Combat",
      trainWith: "S'entraîner avec"
    };

    panel.innerHTML = `
      <div class="coach-portrait-wrap">
        <img src="${activeCoach.image}" alt="${activeCoach.name}" />
        <div class="coach-portrait-overlay"></div>
        <div class="coach-scan-line"></div>
      </div>
      <div class="coach-details-wrap">
        <div class="dossier-header">
          <span>${activeCoach.id}</span>
          <span class="dossier-id">SYS // ACTIVE</span>
        </div>
        <div class="coach-meta-info">
          <span class="coach-title-label">${activeCoach.role}</span>
          <h3>${activeCoach.name}</h3>
          <span class="coach-specialty">${activeCoach.specialty}</span>
        </div>
        <p class="coach-description">${activeCoach.description}</p>
        <p class="coach-quote">“${activeCoach.quote}”</p>
        <div class="coach-stats-list">
          <div class="stat-row">
            <div class="stat-info">
              <span>${labels.technique}</span>
              <span class="stat-num">${activeCoach.stats.technique}%</span>
            </div>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" data-value="${activeCoach.stats.technique}"></div>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-info">
              <span>${labels.conditioning}</span>
              <span class="stat-num">${activeCoach.stats.conditioning}%</span>
            </div>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" data-value="${activeCoach.stats.conditioning}"></div>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-info">
              <span>${labels.discipline}</span>
              <span class="stat-num">${activeCoach.stats.discipline}%</span>
            </div>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" data-value="${activeCoach.stats.discipline}"></div>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-info">
              <span>${labels.fightIq}</span>
              <span class="stat-num">${activeCoach.stats.fightIq}%</span>
            </div>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" data-value="${activeCoach.stats.fightIq}"></div>
            </div>
          </div>
        </div>
        <div class="coach-tags-wrap">
          ${activeCoach.tags.map(tag => `<span class="coach-tag">${tag}</span>`).join('')}
        </div>
        <button class="button primary coach-cta-btn">${labels.trainWith} ${activeCoach.name.split(' ')[0]}</button>
      </div>
    `;

    // Trigger stats progression animation
    setTimeout(() => {
      panel.querySelectorAll(".stat-bar-fill").forEach(fill => {
        const val = fill.getAttribute("data-value");
        fill.style.width = `${val}%`;
      });
    }, 50);

    // Wire booking CTA button
    const ctaBtn = panel.querySelector(".coach-cta-btn");
    if (ctaBtn) {
      ctaBtn.addEventListener("click", () => {
        const targetForm = document.getElementById("trial");
        if (targetForm) {
          targetForm.scrollIntoView({ behavior: "smooth" });
          const selectBox = targetForm.querySelector("select[name='program']");
          if (selectBox) {
            const indexMap = {
              boxing: 0,
              kickboxing: 1,
              grappling: 2,
              strength: 2
            };
            if (indexMap[activeCoach.disciplineCode] !== undefined) {
              selectBox.selectedIndex = indexMap[activeCoach.disciplineCode];
            }
          }
        }
      });
    }
  }
};

const selectCoach = (index) => {
  if (index === activeCoachIndex) return;
  activeCoachIndex = index;
  
  renderCoaches();

  const panel = document.getElementById("active-coach-panel");
  if (panel) {
    panel.classList.remove("scanning");
    void panel.offsetWidth;
    panel.classList.add("scanning");
  }

  const coach = COACHES_DATA[currentLang][activeCoachIndex];
  const decorText = document.querySelector(".coaches-bg-decorations .decor-giant-text");
  if (decorText && coach) {
    decorText.textContent = coach.disciplineCode.toUpperCase();
  }
};

const translatePage = (lang) => {
  document.documentElement.setAttribute("lang", lang);

  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
  placeholders.forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.setAttribute("placeholder", TRANSLATIONS[lang][key]);
    }
  });

  const programsLink = document.querySelector('.site-header .nav-links a[href="#programs"]');
  if (programsLink && TRANSLATIONS[lang]?.["nav.programs"]) {
    programsLink.innerHTML = `${TRANSLATIONS[lang]["nav.programs"]} <span aria-hidden="true">&darr;</span>`;
  }

  const headerCta = document.querySelector(".site-header .header-cta");
  if (headerCta && TRANSLATIONS[lang]?.["nav.book"]) {
    headerCta.innerHTML = `${TRANSLATIONS[lang]["nav.book"]} <span aria-hidden="true">&rarr;</span>`;
  }

  // Update active state in landing page language switchers
  const langBtns = document.querySelectorAll(".lang-switcher .lang-btn");
  langBtns.forEach(btn => {
    if (btn.getAttribute("data-lang") === lang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Re-render coaches list
  renderCoaches();

  // Update chatbot translations if defined
  if (typeof updateChatbotLanguage === "function") {
    updateChatbotLanguage(lang);
  }
};

const setLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem("monster_gym_lang", lang);
  translatePage(lang);
  
  // Re-render the program page instantly if it is open
  if (document.body.classList.contains("in-program-view")) {
    const hash = window.location.hash.substring(1);
    const validPrograms = ["boxing", "kickboxing", "grappling", "strength"];
    if (validPrograms.includes(hash)) {
      renderProgramPage(hash);
    }
  }
};

// ==========================================================================
// PROGRAMS DESTINATION DATA, ROUTING, AND TEMPLATES
// ==========================================================================

const PROGRAMS_DATA = {
  en: {
    boxing: {
      title: "Boxing",
      tag: "PROGRAM 01 / STRIKE",
      statement: "Precision. Speed. Composure.",
      subtext: "Master the sweet science. Learn clean punching mechanics, rhythmic head movement, ring control, and conditioning built for the 12th round.",
      stats: {
        skill: "Striking Mechanics",
        conditioning: "Aerobic Capacity",
        intensity: "High Speed",
        focus: "Accuracy & Timing"
      },
      why: [
        {
          title: "Precision Striking",
          desc: "Learn to transfer weight from the ground up, delivering maximum force with perfect alignment.",
          icon: "&#129354;"
        },
        {
          title: "Defensive Composure",
          desc: "Build muscle memory for slips, rolls, and parries. Move comfortably under pressure.",
          icon: "&#128737;"
        },
        {
          title: "Combat Conditioning",
          desc: "Build fight-specific endurance using heavy bag rounds, pad work, and agility drills.",
          icon: "&#9889;"
        }
      ],
      train: [
        { title: "Punch Mechanics", desc: "Developing power, speed, and safety in jabs, crosses, hooks, and uppercuts." },
        { title: "Footwork & Angles", desc: "Pivoting, cutting the ring, and maintaining perfect balance while striking." },
        { title: "Slipping & Rolling", desc: "Avoiding punches by inches, staying ready to counter-attack instantly." },
        { title: "Heavy Bag Work", desc: "Building power, structural alignment, and sustained physical output." }
      ],
      ideal: [
        { title: "Skill Seekers", desc: "Anyone wanting to learn real combat mechanics without the ego." },
        { title: "Conditioning Focus", desc: "Individuals looking to burn calories and build real athletic speed." }
      ],
      experience: {
        title: "Focused & Composed",
        desc: "Boxing at Monster Gym is about brain and precision, not just throwing hooks. Classes are structured, coach-led, and run in an ego-free environment where safety and technique come first."
      },
      schedule: [
        { day: "Monday / Wednesday", times: "07:00 Early / 18:30 Evening" },
        { day: "Friday", times: "18:30 Sparring Lab" },
        { day: "Saturday", times: "10:00 Open Ring Rounds" }
      ]
    },
    kickboxing: {
      title: "Kickboxing",
      tag: "PROGRAM 02 / POWER",
      statement: "Relentless. Explosive. Full-Body.",
      subtext: "Blend Western boxing with dynamic kicking styles. Build relentless high-intensity cardio, power combinations, and sharp reflexes.",
      stats: {
        skill: "8-Point Striking",
        conditioning: "Anaerobic Power",
        intensity: "Maximum Output",
        focus: "Combinations"
      },
      why: [
        {
          title: "8-Point Weapons",
          desc: "Unleash punches, kicks, knees, and elbows. Develop full-body coordination and timing.",
          icon: "&#128293;"
        },
        {
          title: "Relentless Cardio",
          desc: "High-power intervals that push your heart rate and build explosive physical recovery.",
          icon: "&#129505;"
        },
        {
          title: "Rhythm & Coordination",
          desc: "Learn to chain punches into heavy low kicks and high kicks fluidly.",
          icon: "&#127926;"
        }
      ],
      train: [
        { title: "Kicking Dynamics", desc: "Mastering roundhouse kicks, teeps, and front kicks with speed and leverage." },
        { title: "Punch-Kick Chains", desc: "Chaining boxing combinations with heavy leg strikes seamlessly." },
        { title: "Reflex & Pad Drill", desc: "Sharpening reaction times and defensive guards using focus mitts and Thai pads." },
        { title: "Core & Stamina", desc: "Building lower body power, rotational core stability, and intense recovery." }
      ],
      ideal: [
        { title: "High-Energy Trainees", desc: "People seeking a massive sweat combined with highly technical striking skills." },
        { title: "Explosive Athletes", desc: "Martial artists wanting to add leg coordination and distance control to their game." }
      ],
      experience: {
        title: "Relentless Energy",
        desc: "Kickboxing classes are high-tempo and kinetic. You will sweat, kick pads, throw combinations, and learn distance control in a supportive and high-vibe group setting led by active fighters."
      },
      schedule: [
        { day: "Monday / Wednesday", times: "19:30 Evening Strike" },
        { day: "Tuesday / Thursday", times: "07:00 Early Kick / 19:00 Evening" },
        { day: "Saturday", times: "11:00 Pad Work Clinic" }
      ]
    },
    grappling: {
      title: "Grappling",
      tag: "PROGRAM 03 / CONTROL",
      statement: "Leverage. Intelligence. Mastery.",
      subtext: "Learn submission grappling and wrestling. Control larger opponents using body position, mechanics, and mental composure under pressure.",
      stats: {
        skill: "Position Control",
        conditioning: "Isometric Strength",
        intensity: "Controlled Pace",
        focus: "Mental Composure"
      },
      why: [
        {
          title: "Leverage over Force",
          desc: "Learn to use skeletal structure and gravity to control weight, making strength secondary.",
          icon: "&#128504;"
        },
        {
          title: "Mat Intelligence",
          desc: "Treat the mat like a chess game. Read traps, control positions, and execute submissions.",
          icon: "&#129504;"
        },
        {
          title: "Pressure Testing",
          desc: "Build absolute composure in difficult situations, learning to breath and think under load.",
          icon: "&#9994;"
        }
      ],
      train: [
        { title: "Guard & Takedowns", desc: "Learning double-legs, clinch work, and sweeping from the guard position." },
        { title: "Positional Hierarchy", desc: "Securing mount, side control, and back control to nullify threats." },
        { title: "Escapes & Reversals", desc: "Wriggling out of pinning positions and reversing bad situations safely." },
        { title: "Joint Locks & Chokes", desc: "Executing submissions with control and absolute respect for your partner." }
      ],
      ideal: [
        { title: "Tacticians", desc: "People who love mental problem-solving, leverage physics, and close combat." },
        { title: "Functional Wrestlers", desc: "Martial artists looking to build elite ground control and submission defense." }
      ],
      experience: {
        title: "Cerebral & Coached",
        desc: "Our grappling floor is a laboratory. Classes focus on slow, step-by-step technical drilling, followed by structured situational sparring where you apply logic, breathing, positioning to solve problems."
      },
      schedule: [
        { day: "Tuesday / Thursday", times: "19:00 Submission Wrestling" },
        { day: "Friday", times: "19:30 Positional Drilling" },
        { day: "Saturday", times: "10:00 Open Mat Flow" }
      ]
    },
    strength: {
      title: "Strength",
      tag: "PROGRAM 04 / FORCE",
      statement: "Power. Resilience. Progression.",
      subtext: "Build functional strength and athletic capacity. Focus on compound lifts, core stability, and bulletproofing your joints for life and combat.",
      stats: {
        skill: "Barbell & Kettlebell",
        conditioning: "Power Endurance",
        intensity: "Heavy Force",
        focus: "Progressive Load"
      },
      why: [
        {
          title: "Compound Power",
          desc: "Focus on deadlifts, squats, and presses. Build a solid physical armor that carries over everywhere.",
          icon: "&#127947;"
        },
        {
          title: "Joint Resilience",
          desc: "Bulletproof your knees, shoulders, and back to stay injury-free in training and life.",
          icon: "&#128170;"
        },
        {
          title: "Progressive Overload",
          desc: "Track every lift. Make consistent, calculated gains under coach supervision.",
          icon: "&#128200;"
        }
      ],
      train: [
        { title: "Barbell Lifts", desc: "Refining squats, deadlifts, and bench presses with safe, optimal technique." },
        { title: "Kettlebell Ballistics", desc: "Building explosive hips, rotational power, and grip endurance with swings." },
        { title: "Mobility & Flow", desc: "Opening up tight hips and shoulders to allow deep, safe ranges of movement." },
        { title: "Core Stiffening", desc: "Developing heavy anti-rotational core strength to shield the spine under load." }
      ],
      ideal: [
        { title: "Strength Builders", desc: "Anyone wanting to lift safely, correct bad postures, and pack on physical armor." },
        { title: "Combat Athletes", desc: "Fighters seeking to add explosive power and physical resilience to their game." }
      ],
      experience: {
        title: "Structured & Progressive",
        desc: "There are no random workouts here. Strength training at Monster Gym is structured in blocks, tracked carefully, and coached with a heavy emphasis on form, breathing, and safe progression."
      },
      schedule: [
        { day: "Mon / Wed / Fri", times: "06:30 Early Strength / 12:00 Lunch / 17:30 Evening" },
        { day: "Tuesday / Thursday", times: "06:30 Kettlebell Flow / 18:00 Athletic Power" },
        { day: "Saturday", times: "09:00 Heavy Lifting Lab" }
      ]
    }
  },
  fr: {
    boxing: {
      title: "Boxe",
      tag: "PROGRAMME 01 / STRIKING",
      statement: "Précision. Vitesse. Sang-froid.",
      subtext: "Maîtrisez le noble art. Apprenez les techniques de frappe précises, le jeu de jambes rythmé, les esquives, le contrôle du ring et une préparation physique conçue pour le 12e round.",
      stats: {
        skill: "Technique de Frappe",
        conditioning: "Capacité Aérobie",
        intensity: "Grande Vitesse",
        focus: "Précision & Timing"
      },
      why: [
        {
          title: "Frappes de Précision",
          desc: "Apprenez à transférer l'énergie du sol vers vos poings, avec un alignement parfait pour un impact maximal.",
          icon: "&#129354;"
        },
        {
          title: "Sang-Froid Défensif",
          desc: "Développez vos réflexes d'esquives et de parades. Apprenez à rester serein et lucide sous la pression.",
          icon: "&#128737;"
        },
        {
          title: "Préparation Combat",
          desc: "Développez une endurance spécifique au combat grâce au travail au sac de frappe, aux leçons aux paos et aux exercices d'agilité.",
          icon: "&#9889;"
        }
      ],
      train: [
        { title: "Mécanique des Coups", desc: "Développement de la puissance, de la vitesse et de la sécurité sur les directs, crochets et uppercuts." },
        { title: "Déplacements et Angles", desc: "Pivots, cadrage du ring et maintien d'un équilibre parfait pendant les enchaînements." },
        { title: "Esquives et Retraits", desc: "Éviter les coups à quelques millimètres près tout en restant en position idéale de contre-attaque." },
        { title: "Travail au Sac Lourd", desc: "Renforcement de l'impact, de l'alignement corporel et de la puissance de frappe continue." }
      ],
      ideal: [
        { title: "En quête de technique", desc: "Pour tous ceux qui souhaitent apprendre de réelles techniques de combat sans ego." },
        { title: "Focus Conditionnement", desc: "Pour les personnes voulant brûler des calories et développer une vraie vitesse athlétique." }
      ],
      experience: {
        title: "Précis & Concentré",
        desc: "La boxe chez Monster Gym est une affaire de stratégie et de précision, pas simplement de force brute. Nos cours sont structurés, encadrés par des coachs et se déroulent dans un environnement sans ego où priment la sécurité et la technique."
      },
      schedule: [
        { day: "Lundi / Mercredi", times: "07:00 Matin / 18:30 Soir" },
        { day: "Vendredi", times: "18:30 Labo Sparring" },
        { day: "Samedi", times: "10:00 Assauts Libres" }
      ]
    },
    kickboxing: {
      title: "Kickboxing",
      tag: "PROGRAMME 02 / PUISSANCE",
      statement: "Implacable. Explosif. Complet.",
      subtext: "Associez la boxe anglaise aux techniques de kick dynamiques. Développez un cardio à haute intensité, des enchaînements puissants et des réflexes affûtés.",
      stats: {
        skill: "Frappes 8-Points",
        conditioning: "Puissance Anaérobie",
        intensity: "Intensité Maximale",
        focus: "Enchaînements"
      },
      why: [
        {
          title: "Arsenal 8-Points",
          desc: "Utilisez vos poings, pieds, genoux et coudes. Développez une coordination et un timing de tout le corps.",
          icon: "&#128293;"
        },
        {
          title: "Cardio Intensif",
          desc: "Des intervalles à haute intensité qui stimulent votre fréquence cardiaque et renforcent votre capacité de récupération.",
          icon: "&#129505;"
        },
        {
          title: "Rythme & Fluidité",
          desc: "Apprenez à enchaîner naturellement les coups de poing avec des low-kicks et des high-kicks puissants.",
          icon: "&#127926;"
        }
      ],
      train: [
        { title: "Dynamique des Kicks", desc: "Maîtrise des coups de pied circulaires, directs (teeps) et fouettés avec vitesse et effet de levier." },
        { title: "Liaisons Poings-Pieds", desc: "Enchaînements fluides combinant la boxe anglaise et des frappes de jambes lourdes." },
        { title: "Exercices de Réflexes", desc: "Amélioration des temps de réaction et de la garde de protection avec paos de boxe et pattes d'ours." },
        { title: "Gainage & Endurance", desc: "Développement de la puissance du bas du corps, de la stabilité du buste et de la récupération." }
      ],
      ideal: [
        { title: "Passionnés d'intensité", desc: "Pour les personnes recherchant une dépense calorique massive combinée à des techniques de frappe pointues." },
        { title: "Athlètes Explosifs", desc: "Pour les pratiquants voulant intégrer le travail des jambes et le contrôle de la distance dans leur style." }
      ],
      experience: {
        title: "Énergie Explosive",
        desc: "Les cours de kickboxing sont rythmés et dynamiques. Vous allez transpirer, frapper dans les paos, enchaîner les rounds et apprendre la gestion de distance dans un groupe motivant encadré par des compétiteurs actifs."
      },
      schedule: [
        { day: "Lundi / Mercredi", times: "19:30 Soir Striking" },
        { day: "Mardi / Jeudi", times: "07:00 Matin / 19:00 Soir" },
        { day: "Samedi", times: "11:00 Clinique Travail aux Paos" }
      ]
    },
    grappling: {
      title: "Grappling",
      tag: "PROGRAMME 03 / CONTRÔLE",
      statement: "Levier. Intelligence. Maîtrise.",
      subtext: "Apprenez la lutte et le combat de soumission au sol. Contrôlez des adversaires plus lourds grâce à la précision géométrique de votre corps et votre calme.",
      stats: {
        skill: "Contrôle de Position",
        conditioning: "Force Isométrique",
        intensity: "Rythme Contrôlé",
        focus: "Calme Mental"
      },
      why: [
        {
          title: "Technique vs Force",
          desc: "Apprenez à utiliser l'alignement squelettique et la gravité pour contrôler le poids adverse, rendant la force secondaire.",
          icon: "&#128504;"
        },
        {
          title: "Jeu d'Échecs Physique",
          desc: "Considérez le tapis comme un échiquier. Anticipez les pièges, verrouillez les positions et finalisez avec précision.",
          icon: "&#129504;"
        },
        {
          title: "Gestion du Stress",
          desc: "Gardez votre sang-froid dans des positions inconfortables. Apprenez à respirer et à réfléchir sous la contrainte.",
          icon: "&#9994;"
        }
      ],
      train: [
        { title: "Lutte & Amenées au Sol", desc: "Maîtrise des projections, du travail au corps à corps (clinch) et des renversements depuis la garde." },
        { title: "Hiérarchie des Positions", desc: "Sécuriser les positions clés (montée, contrôle latéral, prise de dos) pour neutraliser les menaces." },
        { title: "Dégagements & Sorties", desc: "Se libérer des contrôles au sol et inverser des situations difficiles en toute sécurité." },
        { title: "Clés d'Articulations & Étranglements", desc: "Apprendre à soumettre avec contrôle et respect absolu de l'intégrité du partenaire." }
      ],
      ideal: [
        { title: "Profils Tactiques", desc: "Pour ceux qui aiment la résolution de problèmes, la physique des leviers et le combat rapproché." },
        { title: "Lutteurs Fonctionnels", desc: "Pour les pratiquants souhaitant développer un excellent contrôle au sol et une défense solide contre les soumissions." }
      ],
      experience: {
        title: "Cérébral & Technique",
        desc: "Notre surface de combat est un véritable laboratoire. Les cours se concentrent sur un apprentissage technique progressif et rigoureux, suivi de sparring à thèmes où vous appliquez logique et calme pour résoudre chaque situation."
      },
      schedule: [
        { day: "Mardi / Jeudi", times: "19:00 Lutte de Soumission" },
        { day: "Vendredi", times: "19:30 Forage Positionnel" },
        { day: "Samedi", times: "10:00 Tapis Libre / Roulades" }
      ]
    },
    strength: {
      title: "Musculation",
      tag: "PROGRAMME 04 / FORCE",
      statement: "Puissance. Résilience. Progression.",
      subtext: "Bâtissez une force fonctionnelle et une condition physique athlétique. Priorité aux mouvements polyarticulaires, à la stabilité du tronc et au renforcement articulaire.",
      stats: {
        skill: "Barre & Kettlebells",
        conditioning: "Endurance de Force",
        intensity: "Charges Lourdes",
        focus: "Surcharge Progressive"
      },
      why: [
        {
          title: "Mouvements de Base",
          desc: "Concentrez-vous sur le soulevé de terre, le squat et les développés. Bâtissez une armure physique utile partout.",
          icon: "&#127947;"
        },
        {
          title: "Articulations Fortes",
          desc: "Renforcez vos genoux, vos épaules et votre dos pour éviter les blessures au quotidien et à l'entraînement.",
          icon: "&#128170;"
        },
        {
          title: "Surcharge Progressive",
          desc: "Suivez précisément chaque charge soulevée. Faites des progrès constants et mesurés sous l'œil attentif du coach.",
          icon: "&#128200;"
        }
      ],
      train: [
        { title: "Mouvements de Force", desc: "Perfectionnement du squat, du soulevé de terre et du développé couché en toute sécurité." },
        { title: "Balistique Kettlebell", desc: "Développement de l'explosivité des hanches, de la force de rotation et du grip avec les swings." },
        { title: "Mobilité & Souplesse", desc: "Libérer les hanches et les épaules pour permettre des mouvements profonds et fluides sans douleur." },
        { title: "Renforcement du Tronc", desc: "Gainage lourd pour protéger la colonne vertébrale sous charge." }
      ],
      ideal: [
        { title: "Bâtisseurs de Force", desc: "Pour tous ceux qui veulent soulever lourd en sécurité, corriger leur posture et se forger un physique solide." },
        { title: "Athlètes de Combat", desc: "Pour les combattants cherchant à ajouter de l'explosivité et de la robustesse à leur préparation." }
      ],
      experience: {
        title: "Structuré & Progressif",
        desc: "Pas d'entraînements aléatoires ici. La musculation chez Monster Gym est programmée par blocs, notée méticuleusement et encadrée en insistant sur la forme, la respiration et la progression sécuritaire."
      },
      schedule: [
        { day: "Lun / Mer / Ven", times: "06:30 Matin / 12:00 Midi / 17:30 Soir" },
        { day: "Mardi / Jeudi", times: "06:30 Circuit Kettlebell / 18:00 Puissance Athlétique" },
        { day: "Samedi", times: "09:00 Labo Soulevé de Terre" }
      ]
    }
  }
};

const transitionOverlay = document.getElementById("transition-overlay");
const overlayTitle = transitionOverlay ? transitionOverlay.querySelector(".overlay-title") : null;
const programView = document.getElementById("program-view");

const openProgramPage = (programKey, instant = false) => {
  const data = PROGRAMS_DATA[currentLang][programKey];
  if (!data) return;

  if (instant) {
    renderProgramPage(programKey);
    document.body.classList.add("in-program-view");
    window.scrollTo({ top: 0 });
    return;
  }

  // Set overlay title
  if (overlayTitle) overlayTitle.textContent = data.title.toUpperCase();

  // Trigger panels and scanline reveal
  if (transitionOverlay) {
    transitionOverlay.className = `transition-active theme-${programKey}`;
    transitionOverlay.setAttribute("aria-hidden", "false");
  }

  // Swap pages midway when screen is fully covered
  setTimeout(() => {
    renderProgramPage(programKey);
    document.body.classList.add("in-program-view");
    window.scrollTo({ top: 0 });
  }, 500);

  // Transition panels out
  setTimeout(() => {
    if (transitionOverlay) transitionOverlay.className = `transition-out theme-${programKey}`;
  }, 1000);

  // Reset overlay to idle
  setTimeout(() => {
    if (transitionOverlay) {
      transitionOverlay.className = "transition-idle";
      transitionOverlay.setAttribute("aria-hidden", "true");
    }
  }, 1600);
};

const closeProgramPage = (instant = false) => {
  if (instant) {
    document.body.classList.remove("in-program-view");
    window.scrollTo({ top: 0 });
    return;
  }

  if (overlayTitle) {
    overlayTitle.textContent = currentLang === 'fr' ? "SELECTEUR D'ARENE" : "ARENA SELECTOR";
  }
  if (transitionOverlay) {
    transitionOverlay.className = "transition-active";
    transitionOverlay.setAttribute("aria-hidden", "false");
  }

  setTimeout(() => {
    document.body.classList.remove("in-program-view");
    const targetSection = document.getElementById("programs");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "instant" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, 500);

  setTimeout(() => {
    if (transitionOverlay) transitionOverlay.className = "transition-out";
  }, 1000);

  setTimeout(() => {
    if (transitionOverlay) {
      transitionOverlay.className = "transition-idle";
      transitionOverlay.setAttribute("aria-hidden", "true");
    }
  }, 1600);
};

const renderProgramPage = (programKey) => {
  const data = PROGRAMS_DATA[currentLang][programKey];
  if (!data) return;

  const labels = currentLang === 'en' ? {
    skill: "SKILL",
    conditioning: "CONDITIONING",
    intensity: "INTENSITY",
    focus: "FOCUS",
    bookBtn: "Book a Trial",
    viewSchedule: "View Schedule",
    whyKicker: "WHY THIS PROGRAM ///",
    whyTitle: "THE STANDARD OF TRAINING",
    trainKicker: "WHAT YOU'LL TRAIN ///",
    trainTitle: "CURRICULUM BREAKDOWN",
    idealKicker: "SUITABLE FOR ///",
    idealTitle: "IDEAL FOR",
    experienceKicker: "CULTURE ///",
    experienceTitle: "TRAINING EXPERIENCE",
    scheduleKicker: "AVAILABILITY ///",
    scheduleTitle: "WEEKLY SCHEDULE",
    scheduleDayCol: "TRAINING DAY",
    scheduleTimeCol: "CLASS TIME",
    readyTitle: "READY TO BEGIN?",
    readyDesc: "Schedule your free coached trial session and meet the team.",
    readyBtn: "Book a Trial Session",
    switchLabel: "CHOOSE ANOTHER DISCIPLINE",
    backHome: "&larr; BACK TO ARENA",
    boxing: "BOXING",
    kickboxing: "KICKBOXING",
    grappling: "GRAPPLING",
    strength: "STRENGTH"
  } : {
    skill: "COMPÉTENCE",
    conditioning: "CONDITIONNEMENT",
    intensity: "INTENSITÉ",
    focus: "OBJECTIF",
    bookBtn: "Réserver un essai",
    viewSchedule: "Voir le planning",
    whyKicker: "POURQUOI CE PROGRAMME ///",
    whyTitle: "LE STANDARD D'ENTRAÎNEMENT",
    trainKicker: "CE QUE VOUS APPRENDREZ ///",
    trainTitle: "DÉTAIL DU PROGRAMME",
    idealKicker: "POUR QUI ///",
    idealTitle: "IDÉAL POUR",
    experienceKicker: "CULTURE ///",
    experienceTitle: "L'EXPÉRIENCE D'ENTRAÎNEMENT",
    scheduleKicker: "DISPONIBILITÉS ///",
    scheduleTitle: "PLANNING HEBDOMADAIRE",
    scheduleDayCol: "JOUR D'ENTRAÎNEMENT",
    scheduleTimeCol: "HORAIRE DU COURS",
    readyTitle: "PRÊT À COMMENCER ?",
    readyDesc: "Réservez votre séance d'essai gratuite encadrée et rencontrez l'équipe.",
    readyBtn: "Réserver ma séance d'essai",
    switchLabel: "CHOISIR UNE AUTRE DISCIPLINE",
    backHome: "&larr; RETOUR À L'ARÈNE",
    boxing: "BOXE",
    kickboxing: "KICKBOXING",
    grappling: "GRAPPLING",
    strength: "MUSCULATION"
  };

  const statsHtml = `
    <div class="program-stats-strip reveal-element">
      <div class="stat-box">
        <span class="stat-label">${labels.skill}</span>
        <span class="stat-value">${data.stats.skill}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">${labels.conditioning}</span>
        <span class="stat-value">${data.stats.conditioning}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">${labels.intensity}</span>
        <span class="stat-value">${data.stats.intensity}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">${labels.focus}</span>
        <span class="stat-value">${data.stats.focus}</span>
      </div>
    </div>
  `;

  const whyHtml = data.why.map(item => `
    <div class="why-card">
      <div class="why-card-icon">${item.icon}</div>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
    </div>
  `).join('');

  const trainHtml = data.train.map(item => `
    <div class="train-item">
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
    </div>
  `).join('');

  const idealHtml = data.ideal.map(item => `
    <div class="ideal-item">
      <div class="ideal-item-bullet"></div>
      <div>
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
    </div>
  `).join('');

  const scheduleHtml = data.schedule.map(item => `
    <div class="schedule-preview-row">
      <span>${item.day}</span>
      <span>${item.times}</span>
    </div>
  `).join('');

  const pageHtml = `
    <div class="program-page-container theme-${programKey}" style="position: relative;">
      <!-- Language Switcher -->
      <div class="program-lang-switcher">
        <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        <span class="lang-divider">|</span>
        <button class="lang-btn ${currentLang === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
      </div>

      <!-- Hero Section -->
      <header class="program-hero">
        <div class="hero-bg-effect"></div>
        <div class="hero-content-wrapper">
          <div class="program-meta-tag">${data.tag}</div>
          <h1 class="program-hero-title">${data.title}</h1>
          <p class="program-hero-statement">${data.statement}</p>
          <p class="program-hero-subtext">${data.subtext}</p>
          <div class="program-hero-actions">
            <button class="button primary cta-booking-btn">${labels.bookBtn}</button>
            <a href="#schedule" class="button secondary">${labels.viewSchedule}</a>
          </div>
        </div>
        ${statsHtml}
      </header>

      <!-- Why This Program -->
      <section class="program-why">
        <div class="section-kicker">${labels.whyKicker}</div>
        <h2 class="section-title">${labels.whyTitle}</h2>
        <div class="why-grid reveal-element reveal-stagger">
          ${whyHtml}
        </div>
      </section>

      <!-- What You'll Train -->
      <section class="program-train">
        <div class="section-kicker">${labels.trainKicker}</div>
        <h2 class="section-title">${labels.trainTitle}</h2>
        <div class="train-list reveal-element reveal-stagger">
          ${trainHtml}
        </div>
      </section>

      <!-- Ideal For & Experience (Split) -->
      <section class="program-split">
        <div class="split-column ideal-column reveal-element">
          <div class="section-kicker">${labels.idealKicker}</div>
          <h2 class="section-title">${labels.idealTitle}</h2>
          <div class="ideal-list">
            ${idealHtml}
          </div>
        </div>
        
        <div class="split-column experience-column reveal-element">
          <div class="section-kicker">${labels.experienceKicker}</div>
          <h2 class="section-title">${labels.experienceTitle}</h2>
          <div class="experience-card">
            <h3>${data.experience.title}</h3>
            <p>${data.experience.desc}</p>
          </div>
        </div>
      </section>

      <!-- Schedule Preview -->
      <section class="program-schedule" id="schedule">
        <div class="section-kicker">${labels.scheduleKicker}</div>
        <h2 class="section-title">${labels.scheduleTitle}</h2>
        <div class="schedule-preview-box reveal-element">
          <div class="schedule-preview-row header">
            <span>${labels.scheduleDayCol}</span>
            <span>${labels.scheduleTimeCol}</span>
          </div>
          ${scheduleHtml}
        </div>
      </section>

      <!-- Bottom Nav / Switcher / CTA -->
      <footer class="program-cta-footer">
        <div class="footer-cta-content reveal-element">
          <h2>${labels.readyTitle}</h2>
          <p>${labels.readyDesc}</p>
          <button class="button primary cta-booking-btn">${labels.readyBtn}</button>
        </div>
        
        <!-- Program Switcher -->
        <div class="program-switcher-wrap reveal-element">
          <span class="switcher-label">${labels.switchLabel}</span>
          <div class="switcher-links">
            <button data-switch="boxing" class="switch-btn">${labels.boxing}</button>
            <button data-switch="kickboxing" class="switch-btn">${labels.kickboxing}</button>
            <button data-switch="grappling" class="switch-btn">${labels.grappling}</button>
            <button data-switch="strength" class="switch-btn">${labels.strength}</button>
          </div>
        </div>

        <!-- Back to home link -->
        <div class="back-home-wrap reveal-element">
          <button class="back-home-btn">${labels.backHome}</button>
        </div>
      </footer>
    </div>
  `;

  if (programView) {
    programView.innerHTML = pageHtml;
    programView.setAttribute("aria-hidden", "false");

    // Wire switcher controls
    const switchBtns = programView.querySelectorAll(".switch-btn");
    switchBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const switchKey = btn.getAttribute("data-switch");
        window.location.hash = switchKey;
      });
    });

    // Wire program language switcher buttons
    const progLangBtns = programView.querySelectorAll(".program-lang-switcher .lang-btn");
    progLangBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedLang = btn.getAttribute("data-lang");
        setLanguage(selectedLang);
      });
    });

    // Wire back to home control
    const backHomeBtn = programView.querySelector(".back-home-btn");
    if (backHomeBtn) {
      backHomeBtn.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    // Wire book trial buttons
    const ctaBtns = programView.querySelectorAll(".cta-booking-btn");
    ctaBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        closeProgramPage();
        setTimeout(() => {
          const targetForm = document.getElementById("trial");
          if (targetForm) {
            targetForm.scrollIntoView({ behavior: "smooth" });
            const selectBox = targetForm.querySelector("select[name='program']");
            if (selectBox) {
              const indexMap = {
                boxing: 0,
                kickboxing: 1,
                grappling: 2,
                strength: 2
              };
              if (indexMap[programKey] !== undefined) {
                selectBox.selectedIndex = indexMap[programKey];
              }
            }
          }
        }, 700);
      });
    });

    // Initialize observers
    initProgramScrollReveals();
  }
};

const initProgramScrollReveals = () => {
  const revealElements = document.querySelectorAll("#program-view .reveal-element");
  if ("IntersectionObserver" in window && revealElements.length > 0) {
    const observerOptions = {
      root: null,
      threshold: 0.08,
      rootMargin: "0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add("in-view"));
  }
};

// --- SPA Router and History Management ---
let isInitialLoad = true;

const handleHashRoute = () => {
  const hash = window.location.hash.substring(1);
  const validPrograms = ["boxing", "kickboxing", "grappling", "strength"];

  if (validPrograms.includes(hash)) {
    openProgramPage(hash, isInitialLoad);
  } else {
    if (document.body.classList.contains("in-program-view")) {
      closeProgramPage(isInitialLoad);
    }
  }
  isInitialLoad = false;
};

window.addEventListener("hashchange", handleHashRoute);

const scheduleDays = [
  {
    id: "mon",
    short: "Mon",
    full: "Monday",
    focus: "Striking",
    sessions: [
      { time: "07:00", period: "AM", name: "Boxing", desc: "Builds fundamentals. Sharpens focus." },
      { time: "18:30", period: "PM", name: "Kickboxing", desc: "Power. Technique. Confidence." }
    ]
  },
  {
    id: "tue",
    short: "Tue",
    full: "Tuesday",
    focus: "Control",
    sessions: [
      { time: "06:30", period: "AM", name: "Strength", desc: "Build engine, posture, and repeatable force." },
      { time: "19:00", period: "PM", name: "Grappling", desc: "Position. Pressure. Calm decisions." }
    ]
  },
  {
    id: "wed",
    short: "Wed",
    full: "Wednesday",
    focus: "Timing",
    sessions: [
      { time: "07:00", period: "AM", name: "Boxing", desc: "Footwork, rhythm, and clean combinations." },
      { time: "18:30", period: "PM", name: "Sparring Lab", desc: "Controlled rounds with coach feedback." }
    ]
  },
  {
    id: "thu",
    short: "Thu",
    full: "Thursday",
    focus: "Power",
    sessions: [
      { time: "06:30", period: "AM", name: "Mobility", desc: "Move better. Recover faster. Stay ready." },
      { time: "19:00", period: "PM", name: "Kickboxing", desc: "Explosive strikes and defensive flow." }
    ]
  },
  {
    id: "sat",
    short: "Sat",
    full: "Saturday",
    focus: "Team",
    sessions: [
      { time: "10:00", period: "AM", name: "Open Mat", desc: "Drill, roll, reset, and sharpen together." },
      { time: "12:00", period: "PM", name: "Kids", desc: "Confidence, movement, and discipline." }
    ]
  }
];

const createFeatureClassMarkup = session => `
  <div class="feature-class">
    <span class="time-badge"><strong>${session.time}</strong><small>${session.period}</small></span>
    <div>
      <h3>${session.name}</h3>
      <p>${session.desc}</p>
    </div>
  </div>
`;

const createScheduleRowMarkup = day => `
  <article class="schedule-row" role="listitem" data-day-row="${day.id}">
    <strong>${day.short}</strong>
    <span class="mini-session"><i aria-hidden="true"></i><b>${day.sessions[0].time}</b><small>${day.sessions[0].period}</small><em>${day.sessions[0].name}</em></span>
    <span class="mini-session"><i aria-hidden="true"></i><b>${day.sessions[1].time}</b><small>${day.sessions[1].period}</small><em>${day.sessions[1].name}</em></span>
    <span class="row-focus">Focus: <em>${day.focus}</em></span>
    <button class="schedule-toggle" type="button" aria-label="Expand ${day.full}">+</button>
  </article>
`;

const initInteractiveSchedule = () => {
  const board = document.querySelector(".schedule-board");
  const list = board?.querySelector(".schedule-list");
  const dayButtons = board ? Array.from(board.querySelectorAll(".schedule-day[data-day]")) : [];
  const cta = list?.querySelector(".schedule-cta");

  if (!board || !list || dayButtons.length === 0 || !cta) {
    return;
  }

  const renderSchedule = selectedDayId => {
    const selectedDay = scheduleDays.find(day => day.id === selectedDayId) || scheduleDays[0];

    dayButtons.forEach(button => {
      const isActive = button.dataset.day === selectedDay.id;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const featureMarkup = `
      <article class="schedule-feature" role="listitem" data-day-feature="${selectedDay.id}">
        <div class="feature-day">
          <span class="today-dot"></span>
          <span class="today-label">${selectedDay.id === "mon" ? "Today" : "Selected"}</span>
          <strong>${selectedDay.full}</strong>
          <small>Focus: <em>${selectedDay.focus}</em></small>
        </div>
        ${selectedDay.sessions.map(createFeatureClassMarkup).join("")}
        <button class="schedule-toggle" type="button" aria-label="Collapse ${selectedDay.full}">-</button>
      </article>
    `;

    const rowMarkup = scheduleDays
      .filter(day => day.id !== selectedDay.id)
      .map(createScheduleRowMarkup)
      .join("");

    list.innerHTML = `${featureMarkup}${rowMarkup}`;
    list.appendChild(cta);

    list.querySelectorAll(".schedule-row[data-day-row]").forEach(row => {
      row.addEventListener("click", () => renderSchedule(row.dataset.dayRow));
    });
  };

  dayButtons.forEach(button => {
    button.addEventListener("click", () => renderSchedule(button.dataset.day));
  });

  list.querySelectorAll(".schedule-row[data-day-row], .schedule-row").forEach(row => {
    const dayLabel = row.querySelector("strong")?.textContent?.trim().toLowerCase();
    const day = scheduleDays.find(item => item.short.toLowerCase() === dayLabel);
    if (day) {
      row.dataset.dayRow = day.id;
      row.addEventListener("click", () => renderSchedule(day.id));
    }
  });
};

window.addEventListener("DOMContentLoaded", () => {
  // Wire landing page language switcher buttons
  document.querySelectorAll(".lang-switcher .lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedLang = btn.getAttribute("data-lang");
      setLanguage(selectedLang);
    });
  });

  translatePage(currentLang);
  
  // Set initial coaches background giant text decoration
  const initialCoach = COACHES_DATA[currentLang][activeCoachIndex];
  const decorText = document.querySelector(".coaches-bg-decorations .decor-giant-text");
  if (decorText && initialCoach) {
    decorText.textContent = initialCoach.disciplineCode.toUpperCase();
  }

  // Wire Room Standard Panel Mouse Glow Effect
  const standardPanel = document.querySelector(".room-standard-panel");
  if (standardPanel) {
    standardPanel.addEventListener("mousemove", e => {
      const rect = standardPanel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      standardPanel.style.setProperty("--mouse-x", `${x}px`);
      standardPanel.style.setProperty("--mouse-y", `${y}px`);
    });
  }

  initInteractiveSchedule();

  // Initialize AI Chatbot
  if (typeof initChatbot === "function") {
    initChatbot();
  }

  handleHashRoute();
});

// ==========================================================================
// TACTICAL AI CHATBOT INTERACTIVITY AND LOGIC
// ==========================================================================

const SYSTEM_PROMPT = `You are the Monster Gym AI Assistant, a premium, tactical, and motivating training coordinator for Monster Gym.
Your tone is sharp, elite, disciplined, respectful, and professional—reflecting the brand value "Serious training without the ego".
You help users with their training questions, gym details, and class inquiries.
Monster Gym offers 4 core programs:
1. Boxing (led by Maya Torres) - focuses on fundamentals, footwork, and composure under pressure.
2. Kickboxing (led by Lina Tremblay) - focuses on striking flow, combination variety, and structural power.
3. Grappling (led by Karim Bensaid) - focuses on positioning, submission defence, and transitions.
4. Strength Training (led by Youssef Al-Fayed) - focuses on explosive power, compound lifts, and durability.

The gym rules are:
- Leave your ego at the door.
- Respect the room (no showing off, no shortcuts).
- Coached rounds first (technique and correction every session).
- Train hard, train smart.

Guide users to book a trial spot (using the "Book a Trial" section on the page), view the schedule, or learn more about the classes.
Respond concisely. Match the language of the user (English or French). Keep your answers formatting clean with bold text and lists where appropriate.`;

let chatHistory = [];
let isGeneratingResponse = false;
let typingIndicatorEl = null;

const formatMarkdown = (text) => {
  // Escape HTML tags to prevent XSS
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const inlineFormat = (str) => {
    return str
      .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");
  };

  const blocks = escaped.split(/\n\n+/);
  const formattedBlocks = blocks.map(block => {
    if (block.trim().startsWith("- ") || block.trim().startsWith("* ")) {
      const items = block.split(/\n/).map(line => {
        const content = line.trim().replace(/^[-*]\s+/, "");
        return content ? `<li>${inlineFormat(content)}</li>` : "";
      }).filter(Boolean).join("");
      return `<ul>${items}</ul>`;
    }
    if (/^\d+\.\s+/.test(block.trim())) {
      const items = block.split(/\n/).map(line => {
        const content = line.trim().replace(/^\d+\.\s+/, "");
        return content ? `<li>${inlineFormat(content)}</li>` : "";
      }).filter(Boolean).join("");
      return `<ol>${items}</ol>`;
    }
    
    const lines = block.split(/\n/).join("<br>");
    return `<p>${inlineFormat(lines)}</p>`;
  });

  return formattedBlocks.join("");
};

const appendMessageToDOM = (role, content, animate = true) => {
  const chatbotHistory = document.getElementById("chatbot-history");
  if (!chatbotHistory) return null;

  const msgEl = document.createElement("div");
  msgEl.classList.add("chat-msg", role === "user" ? "msg-user" : "msg-assistant");
  
  if (role === "assistant") {
    msgEl.innerHTML = formatMarkdown(content);
  } else {
    msgEl.textContent = content;
  }
  
  if (!animate) {
    msgEl.style.animation = "none";
  }
  
  chatbotHistory.appendChild(msgEl);
  chatbotHistory.scrollTop = chatbotHistory.scrollHeight;
  return msgEl;
};

const showTypingIndicator = () => {
  const chatbotHistory = document.getElementById("chatbot-history");
  if (!chatbotHistory || typingIndicatorEl) return;
  
  typingIndicatorEl = document.createElement("div");
  typingIndicatorEl.classList.add("chat-msg", "msg-assistant");
  typingIndicatorEl.innerHTML = `
    <div class="typing-indicator" aria-label="Assistant is typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatbotHistory.appendChild(typingIndicatorEl);
  chatbotHistory.scrollTop = chatbotHistory.scrollHeight;
};

const hideTypingIndicator = () => {
  if (typingIndicatorEl) {
    typingIndicatorEl.remove();
    typingIndicatorEl = null;
  }
};

const getChatSuggestions = (lang) => {
  if (lang === "fr") {
    return [
      { text: "Réserver un essai", prompt: "Comment puis-je réserver un essai gratuit ?" },
      { text: "Planning des cours", prompt: "Quel est le planning des cours cette semaine ?" },
      { text: "Programmes", prompt: "Quels sont les différents programmes proposés ?" },
      { text: "Rencontrer les coachs", prompt: "Qui sont les entraîneurs de Monster Gym ?" }
    ];
  }
  return [
    { text: "Book a Free Trial", prompt: "How do I book a free trial spot?" },
    { text: "Class Schedule", prompt: "What is the weekly class schedule?" },
    { text: "Explore Programs", prompt: "Tell me about the training programs." },
    { text: "Meet the Coaches", prompt: "Who are the coaches at Monster Gym?" }
  ];
};

const renderSuggestions = () => {
  const chatbotSuggestions = document.getElementById("chatbot-suggestions");
  if (!chatbotSuggestions) return;

  chatbotSuggestions.innerHTML = "";
  const suggestions = getChatSuggestions(currentLang);
  
  suggestions.forEach(item => {
    const btn = document.createElement("button");
    btn.classList.add("suggestion-chip");
    btn.textContent = item.text;
    btn.addEventListener("click", () => handleSend(item.prompt));
    chatbotSuggestions.appendChild(btn);
  });
};

const renderChatHistory = () => {
  const chatbotHistory = document.getElementById("chatbot-history");
  if (!chatbotHistory) return;

  chatbotHistory.innerHTML = "";
  chatHistory.forEach(msg => {
    appendMessageToDOM(msg.role, msg.content, false);
  });
  if (chatHistory.length === 0) {
    const greeting = TRANSLATIONS[currentLang]["chat.greeting"];
    appendMessageToDOM("assistant", greeting, false);
  }
  chatbotHistory.scrollTop = chatbotHistory.scrollHeight;
};

const toggleChat = (forceState) => {
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotInput = document.getElementById("chatbot-input");
  
  if (!chatbotWindow || !chatbotToggle) return;

  const nextOpen = typeof forceState === "boolean" ? forceState : chatbotWindow.classList.contains("chatbot-hidden");
  
  if (nextOpen) {
    chatbotWindow.classList.remove("chatbot-hidden");
    chatbotToggle.setAttribute("aria-expanded", "true");
    chatbotToggle.querySelector(".chat-icon").style.display = "none";
    chatbotToggle.querySelector(".close-icon").style.display = "block";
    
    if (window.innerWidth > 768 && chatbotInput) {
      chatbotInput.focus();
    }
  } else {
    chatbotWindow.classList.add("chatbot-hidden");
    chatbotToggle.setAttribute("aria-expanded", "false");
    chatbotToggle.querySelector(".chat-icon").style.display = "block";
    chatbotToggle.querySelector(".close-icon").style.display = "none";
  }
};

const getMockResponse = (query, lang, debugPrefix = "") => {
  const q = query.toLowerCase();
  
  if (lang === "fr") {
    let response = debugPrefix;
    if (q.includes("essai") || q.includes("réserver") || q.includes("reserver") || q.includes("gratuit") || q.includes("trial") || q.includes("book")) {
      response += "Pour réserver votre **cours d'essai gratuit**, faites défiler vers le bas jusqu'à la section **Réservation** au bas de la page. Remplissez le formulaire avec votre nom, e-mail et le programme souhaité. Notre équipe vous contactera sous 24h.";
    } else if (q.includes("planning") || q.includes("cours") || q.includes("horaire") || q.includes("schedule")) {
      response += "Le planning hebdomadaire de Monster Gym :\n- **Lundi / Mercredi** : Boxe (Matin/Soir) & Labo Sparring\n- **Mardi / Jeudi** : Grappling (Soir) & Musculation/Force\n- **Samedi** : Tapis Libre et Cours Enfants\n\nVous pouvez voir tous les détails dans la section **Planning** ci-dessus.";
    } else if (q.includes("programme") || q.includes("explore") || q.includes("boxing") || q.includes("boxe") || q.includes("kick") || q.includes("grapp") || q.includes("force") || q.includes("muscu")) {
      response += "Nous proposons 4 programmes d'élite :\n1. **Boxe** : Travail de jambes et puissance.\n2. **Kickboxing** : Enchaînements et conditionnement.\n3. **Grappling** : Soumissions et contrôle au sol.\n4. **Force** : Musculation et explosivité.\n\nCliquez sur les cartes dans la section **Choisissez votre combat** pour en savoir plus.";
    } else if (q.includes("coach") || q.includes("entraineur") || q.includes("prof")) {
      response += "Nos cours sont dispensés par des combattants professionnels :\n- **Maya Torres** (Boxe)\n- **Lina Tremblay** (Kickboxing)\n- **Karim Bensaid** (Grappling)\n- **Youssef Al-Fayed** (Force)\n\nExplorez la section **Coaches** ci-dessus pour consulter leurs fiches.";
    } else {
      response += "Je suis votre assistant tactique d'entraînement. Pour poser une question au modèle Mistral AI en direct, veuillez déployer ce projet sur Netlify ou Vercel avec votre variable d'environnement `MISTRAL_API_KEY` configurée.";
    }
    return response;
  } else {
    let response = debugPrefix;
    if (q.includes("trial") || q.includes("book") || q.includes("free") || q.includes("reserve")) {
      response += "To book your **free trial spot**, scroll down to the **Book a Trial** section at the bottom of this page. Complete the form with your name, email, and preferred program. We will confirm your session shortly!";
    } else if (q.includes("schedule") || q.includes("hour") || q.includes("time") || q.includes("class")) {
      response += "Monster Gym Class Schedule:\n- **Monday / Wednesday**: Boxing (Early/Evening) & Sparring Lab\n- **Tuesday / Thursday**: Grappling (Evening) & Strength Training\n- **Saturday**: Open Mat & Kids Martial Arts\n\nCheck the **Weekly Flow** section above for details.";
    } else if (q.includes("program") || q.includes("explore") || q.includes("boxing") || q.includes("kick") || q.includes("grapp") || q.includes("strength") || q.includes("class")) {
      response += "We offer 4 premium training programs:\n1. **Boxing** - Fundamentals and footwork.\n2. **Kickboxing** - Striking flow and power.\n3. **Grappling** - Submission control.\n4. **Strength Training** - Compound lifts and stamina.\n\nClick on the program cards above to learn more.";
    } else if (q.includes("coach") || q.includes("instructor") || q.includes("trainer")) {
      response += "Our elite coaches are active competitors:\n- **Maya Torres** (Boxing)\n- **Lina Tremblay** (Kickboxing)\n- **Karim Bensaid** (Grappling)\n- **Youssef Al-Fayed** (Strength)\n\nCheck out the **Coaches** section above to view their dossiers.";
    } else {
      response += "I am your tactical training coordinator. To chat with the live Mistral AI model, deploy this site to Netlify or Vercel and configure your `MISTRAL_API_KEY` environment variable.";
    }
    return response;
  }
};

const handleSend = async (customText) => {
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  const chatbotSuggestions = document.getElementById("chatbot-suggestions");
  
  if (!chatbotInput || !chatbotSend) return;

  const text = (customText || chatbotInput.value).trim();
  if (!text || isGeneratingResponse) return;

  // Hide suggestion chips after the user initiates contact
  if (chatbotSuggestions) {
    chatbotSuggestions.style.display = "none";
  }

  chatbotInput.value = "";
  chatbotSend.disabled = true;
  isGeneratingResponse = true;

  // Add User Message
  chatHistory.push({ role: "user", content: text });
  appendMessageToDOM("user", text);

  showTypingIndicator();

  let response;
  try {
    const messagesToSend = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory
    ];

    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: messagesToSend })
    });

    if (!response.ok) {
      throw new Error(`Gateway returned status ${response.status}`);
    }

    const data = await response.json();
    hideTypingIndicator();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const assistantMsg = data.choices[0].message;
      chatHistory.push({ role: "assistant", content: assistantMsg.content });
      appendMessageToDOM("assistant", assistantMsg.content);
    } else {
      throw new Error("Invalid format");
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Check if we are running locally (localhost, LAN IPs like 192.168.* / 10.*, .local suffix, or file://)
    const hostname = window.location.hostname;
    const isLocal = !hostname || 
                    hostname === "localhost" || 
                    hostname === "127.0.0.1" || 
                    hostname.startsWith("192.168.") || 
                    hostname.startsWith("10.") || 
                    hostname.startsWith("172.") || 
                    hostname.endsWith(".local") || 
                    window.location.protocol === "file:";
                    
    const is404 = error.message.includes("status 404") || (response && response.status === 404);
                    
    // Always fall back to mock responses for ANY failure to provide a bulletproof UX
    await new Promise(resolve => setTimeout(resolve, 850));
    hideTypingIndicator();
    
    let debugPrefix = "";
    if (isLocal || is404) {
      debugPrefix = currentLang === "fr" ? "**[SIMULATION LOCALE]**\n\n" : "**[LOCAL SIMULATION]**\n\n";
    } else {
      // Deployed endpoint failed (e.g. 500 error due to missing API key in Netlify/Vercel settings)
      debugPrefix = currentLang === "fr" 
        ? "**[SIMULATION DE DÉMO]**\n*(Note : Connexion au modèle Mistral impossible. Veuillez configurer MISTRAL_API_KEY dans vos paramètres Netlify/Vercel.)*\n\n" 
        : "**[DEMO SIMULATION]**\n*(Note: Secure Mistral connection failed. Make sure MISTRAL_API_KEY is configured in your Netlify/Vercel settings.)*\n\n";
    }
    
    const mockReply = getMockResponse(text, currentLang, debugPrefix);
    chatHistory.push({ role: "assistant", content: mockReply });
    appendMessageToDOM("assistant", mockReply);
  } finally {
    chatbotSend.disabled = false;
    isGeneratingResponse = false;
    if (chatbotInput && window.innerWidth > 768) {
      chatbotInput.focus();
    }
  }
};

const updateChatbotLanguage = (lang) => {
  const chatbotSuggestions = document.getElementById("chatbot-suggestions");
  if (chatHistory.length <= 1) {
    chatHistory = [{ role: "assistant", content: TRANSLATIONS[lang]["chat.greeting"] }];
    if (chatbotSuggestions) {
      chatbotSuggestions.style.display = "flex";
    }
    renderChatHistory();
  }
  renderSuggestions();
};

const initChatbot = () => {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotCloseBtn = document.getElementById("chatbot-close-btn");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");

  if (!chatbotToggle || !chatbotCloseBtn || !chatbotInput || !chatbotSend) return;

  chatHistory = [{ role: "assistant", content: TRANSLATIONS[currentLang]["chat.greeting"] }];
  renderChatHistory();
  renderSuggestions();

  // Wire UI event listeners
  chatbotToggle.addEventListener("click", () => toggleChat());
  chatbotCloseBtn.addEventListener("click", () => toggleChat(false));

  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  });

  chatbotSend.addEventListener("click", () => handleSend());
};

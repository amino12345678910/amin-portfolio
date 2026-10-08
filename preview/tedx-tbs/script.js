// ================= NAVBAR DYNAMICS =================
const navWrapper = document.querySelector(".navbar-wrapper");
const nav = document.getElementById("mainNav");

function handleNavScroll() {
  const isScrolled = window.scrollY > 30;
  if (navWrapper) navWrapper.classList.toggle("scrolled", isScrolled);
  if (nav) nav.classList.toggle("scrolled", isScrolled);
}

window.addEventListener("scroll", handleNavScroll, { passive: true });
handleNavScroll();

// Close the mobile Bootstrap menu after clicking a navigation link
document.querySelectorAll("#navMenu .nav-link, #navMenu .register-nav-modern, #navMenu .register-nav").forEach(link => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("navMenu");
    if (menu && menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});

// ================= ACTIVE NAV LINK =================
const sections = document.querySelectorAll("section[id], header[id]");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  let current = "home";

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 140;
    if (window.scrollY >= sectionTop) current = section.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}, { passive: true });

// ================= HERO VIDEO AUTOPLAY =================
const heroVideo = document.getElementById("heroVideo");

if (heroVideo) {
  // Ensure video autoplays safely
  const startAutoplay = () => {
    heroVideo.play().catch(() => {
      // If browser prevents autoplay until first interaction
      document.addEventListener("click", () => heroVideo.play(), { once: true });
      document.addEventListener("touchstart", () => heroVideo.play(), { once: true });
    });
  };
  startAutoplay();
}

// ================= COUNTDOWN & HERO METRICS =================
// Official Event Date: December 12, 2026
const eventDate = new Date("December 12, 2026 09:00:00").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = eventDate - now;

  const heroLiveDaysEl = document.getElementById("heroLiveDays");
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (distance <= 0) {
    if (daysEl) daysEl.textContent = "00";
    if (hoursEl) hoursEl.textContent = "00";
    if (minutesEl) minutesEl.textContent = "00";
    if (secondsEl) secondsEl.textContent = "00";
    if (heroLiveDaysEl) heroLiveDaysEl.textContent = "LIVE";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
  if (heroLiveDaysEl) heroLiveDaysEl.textContent = String(days);
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ================= BENTO & CARDS SPOTLIGHT INTERACTION =================
// Dynamic cursor-following radiant crimson spotlight
document.querySelectorAll(".bento-card, .board-3d-card, .speakers-monolith-card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  });
});

// ================= $15K 3D EXECUTIVE PODIUM CONTROLLER =================
const cylinder = document.getElementById("carouselCylinder");
const stageCards = document.querySelectorAll(".board-3d-card");
const dialTabs = document.querySelectorAll(".dial-role-tab");
const dialSlider = document.getElementById("dialSlider");
const prevBtn = document.getElementById("stagePrevBtn");
const nextBtn = document.getElementById("stageNextBtn");
const stageViewport = document.getElementById("carouselViewport");

if (cylinder && stageCards.length > 0) {
  const totalCards = stageCards.length;
  const stepAngle = 360 / totalCards; // 72 deg
  let currentStep = 0;
  let isThrottled = false;

  function updateSliderPosition(activeTab) {
    if (!dialSlider || !activeTab) return;
    dialSlider.style.left = `${activeTab.offsetLeft}px`;
    dialSlider.style.width = `${activeTab.offsetWidth}px`;

    // Auto scroll tab on mobile screens if needed
    const rail = document.getElementById("dialRail");
    if (rail && rail.scrollWidth > rail.clientWidth) {
      const scrollTarget = activeTab.offsetLeft - (rail.clientWidth / 2) + (activeTab.offsetWidth / 2);
      rail.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }

  function getActiveIndex() {
    return ((currentStep % totalCards) + totalCards) % totalCards;
  }

  function rotateStage() {
    const rotationAngle = -currentStep * stepAngle;
    cylinder.style.transform = `rotateY(${rotationAngle}deg)`;

    const activeIndex = getActiveIndex();

    // Update active classes on cards
    stageCards.forEach((card, index) => {
      const isActive = index === activeIndex;
      card.classList.toggle("active", isActive);
      // Reset any manual tilt on inactive cards
      if (!isActive) {
        card.style.transform = "";
      }
    });

    // Update role tabs
    dialTabs.forEach((tab, index) => {
      const isActive = index === activeIndex;
      tab.classList.toggle("active", isActive);
      if (isActive) {
        updateSliderPosition(tab);
      }
    });
  }

  function nextMember() {
    currentStep++;
    rotateStage();
  }

  function prevMember() {
    currentStep--;
    rotateStage();
  }

  function goToIndex(targetIndex) {
    const activeIndex = getActiveIndex();
    let diff = (targetIndex - activeIndex) % totalCards;
    if (diff > totalCards / 2) diff -= totalCards;
    if (diff < -totalCards / 2) diff += totalCards;

    currentStep += diff;
    rotateStage();
  }

  // Navigation Arrow clicks
  if (prevBtn) prevBtn.addEventListener("click", prevMember);
  if (nextBtn) nextBtn.addEventListener("click", nextMember);

  // Dial Tabs clicks
  dialTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => goToIndex(index));
  });

  // Clicking flanking cards rotates them to center
  stageCards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (!card.classList.contains("active")) {
        goToIndex(index);
      }
    });
  });

  // Keyboard navigation when hovering or focusing stage
  window.addEventListener("keydown", (e) => {
    const stageRect = stageViewport ? stageViewport.getBoundingClientRect() : null;
    if (!stageRect) return;
    const isVisible = stageRect.top < window.innerHeight && stageRect.bottom > 0;
    if (!isVisible) return;

    if (e.key === "ArrowLeft") {
      prevMember();
    } else if (e.key === "ArrowRight") {
      nextMember();
    }
  });

  // Mouse wheel rotation over viewport
  if (stageViewport) {
    stageViewport.addEventListener("wheel", (e) => {
      // If user is scrolling over the 3D stage, smooth-cycle members
      if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
        if (isThrottled) return;
        isThrottled = true;

        if (e.deltaY > 0 || e.deltaX > 0) {
          nextMember();
        } else {
          prevMember();
        }

        setTimeout(() => {
          isThrottled = false;
        }, 550);
      }
    }, { passive: true });

    // Touch swipe / Mouse drag gestures
    let startX = 0;
    let isDragging = false;

    stageViewport.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      isDragging = true;
    });

    stageViewport.addEventListener("pointerup", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          nextMember();
        } else {
          prevMember();
        }
      }
    });

    stageViewport.addEventListener("pointercancel", () => {
      isDragging = false;
    });
  }

  // Active card 3D holographic tilt parallax on mouse move
  stageCards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      if (!card.classList.contains("active")) return;
      const rect = card.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
      const cardAngle = card.style.getPropertyValue("--card-angle") || "0deg";
      const tiltX = -yNorm * 12; // deg
      const tiltY = xNorm * 14; // deg

      card.style.transform = `rotateY(${cardAngle}) translateZ(var(--card-radius, 380px)) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      if (card.classList.contains("active")) {
        card.style.transform = "";
      }
    });
  });

  // Initial stage alignment & slider position
  window.addEventListener("load", () => {
    rotateStage();
  });
  setTimeout(rotateStage, 150);

  window.addEventListener("resize", () => {
    const activeTab = dialTabs[getActiveIndex()];
    if (activeTab) updateSliderPosition(activeTab);
  });
}

// ================= PRIORITY NOTIFY FORM =================
const notifyForm = document.getElementById("notifyForm");
const notifyBtn = document.getElementById("notifyBtn");
const notifyMessage = document.getElementById("notifyMessage");
const notifyEmail = document.getElementById("notifyEmail");

function handlePrioritySubmit(e) {
  if (e) e.preventDefault();
  if (notifyEmail && !notifyEmail.checkValidity()) {
    notifyEmail.reportValidity();
    return;
  }
  if (notifyBtn && notifyMessage) {
    const emailVal = notifyEmail && notifyEmail.value ? notifyEmail.value.trim() : "";
    notifyMessage.textContent = emailVal 
      ? `✓ Priority status confirmed for ${emailVal}. Early access dispatch incoming!`
      : "✓ You're officially on the priority access list. We will notify you first!";
    notifyBtn.innerHTML = `<span>YOU'RE ON THE LIST ✓</span>`;
    notifyBtn.disabled = true;
    if (notifyEmail) notifyEmail.disabled = true;
  }
}

if (notifyForm) {
  notifyForm.addEventListener("submit", handlePrioritySubmit);
} else if (notifyBtn) {
  notifyBtn.addEventListener("click", handlePrioritySubmit);
}

// ================= $15K VIP TICKET PASS GENERATOR =================
(function initTicketGenerator() {
  const codeForm = document.getElementById("codeVerifyForm");
  const codeInput = document.getElementById("accessCodeInput");
  const btnVerify = document.getElementById("btnVerifyCode");
  const errorMsg = document.getElementById("codeErrorMsg");
  const stepCode = document.getElementById("ticketStepCode");
  const stepPreview = document.getElementById("ticketStepPreview");
  const btnChangeCode = document.getElementById("btnChangeCode");
  const nameInput = document.getElementById("attendeeNameInput");
  const ticketCardName = document.getElementById("ticketCardName");
  const ticketStubName = document.getElementById("ticketStubName");
  const ticketCardTier = document.getElementById("ticketCardTier");
  const ticketStubCode = document.getElementById("ticketStubCode");
  const ticketCardSerial = document.getElementById("ticketCardSerial");
  const validatedTierText = document.getElementById("validatedPassTier");
  const stage = document.getElementById("ticketDisplayStage");
  const wrapper = document.getElementById("ticket3DWrapper");
  const glare = document.getElementById("ticketGlare");
  const btnDownload = document.getElementById("btnDownloadTicket");
  const demoChips = document.querySelectorAll(".demo-code-chip");

  if (!codeForm || !codeInput || !stepCode || !stepPreview) return;

  // Pre-approved valid access codes & tier metadata
  const PASS_TIERS = {
    "TEDXTBS2026": {
      tier: "VIP ALL-ACCESS PASS",
      badge: "VIP PASS",
      prefix: "TBS-VIP",
      accent: "#eb0028"
    },
    "INNOVATE2026": {
      tier: "STUDENT INNOVATOR PASS",
      badge: "INNOVATOR",
      prefix: "TBS-INN",
      accent: "#eb0028"
    },
    "CS50TBS": {
      tier: "CS50 SPECIAL GUEST PASS",
      badge: "CS50 GUEST",
      prefix: "TBS-CS50",
      accent: "#eb0028"
    },
    "TBSGUEST": {
      tier: "HONORED GUEST PASS",
      badge: "GUEST PASS",
      prefix: "TBS-GST",
      accent: "#eb0028"
    },
    "TEDXPASS26": {
      tier: "GENERAL DELEGATE PASS",
      badge: "GENERAL PASS",
      prefix: "TBS-GEN",
      accent: "#eb0028"
    },
    "ORGANISER26": {
      tier: "EXECUTIVE BOARD PASS",
      badge: "ORGANISER",
      prefix: "TBS-EXEC",
      accent: "#eb0028"
    },
    "SPEAKER2026": {
      tier: "OFFICIAL SPEAKER PASS",
      badge: "SPEAKER",
      prefix: "TBS-SPK",
      accent: "#eb0028"
    },
    "TBS2026": {
      tier: "COMMUNITY PASS",
      badge: "DELEGATE",
      prefix: "TBS-DEL",
      accent: "#eb0028"
    }
  };

  let currentTierData = null;
  let currentSerial = "";
  let currentStubCode = "";

  // Generate deterministic serial number based on code or random
  function generatePassCredentials(code) {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const prefix = (PASS_TIERS[code] && PASS_TIERS[code].prefix) || "TBS-PASS";
    const serial = `NO. #${prefix}-2026-${randomHex}`;
    const stub = `#${prefix}-${randomHex}`;
    return { serial, stub };
  }

  function verifyCode(enteredCode) {
    const cleanCode = (enteredCode || "").trim().toUpperCase();
    if (!cleanCode) {
      showError("Please enter an access code to proceed.");
      triggerShake();
      return false;
    }

    if (!PASS_TIERS[cleanCode]) {
      showError("Invalid access code. Please check credentials or select one of the demo codes above.");
      triggerShake();
      return false;
    }

    // Valid code verified!
    clearError();
    currentTierData = PASS_TIERS[cleanCode];
    const creds = generatePassCredentials(cleanCode);
    currentSerial = creds.serial;
    currentStubCode = creds.stub;

    // Apply tier metadata to DOM elements
    if (validatedTierText) validatedTierText.textContent = currentTierData.tier;
    if (ticketCardTier) ticketCardTier.textContent = currentTierData.badge;
    if (ticketCardSerial) ticketCardSerial.textContent = currentSerial;
    if (ticketStubCode) ticketStubCode.textContent = currentStubCode;

    // Switch step views with smooth animation
    stepCode.classList.add("d-none");
    stepPreview.classList.remove("d-none");
    stepPreview.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Focus name input for instant personalization
    if (nameInput) {
      nameInput.value = "";
      nameInput.focus();
    }
    updateTicketHolder("GUEST ATTENDEE");
    return true;
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }
  }

  function clearError() {
    if (errorMsg) {
      errorMsg.textContent = "";
      errorMsg.style.display = "none";
    }
  }

  function triggerShake() {
    const inputGroup = document.querySelector(".code-input-group");
    if (inputGroup) {
      inputGroup.classList.remove("shake-anim");
      void inputGroup.offsetWidth; // Force CSS reflow
      inputGroup.classList.add("shake-anim");
      setTimeout(() => {
        inputGroup.classList.remove("shake-anim");
      }, 500);
    }
  }

  function updateTicketHolder(rawName) {
    const trimmed = (rawName || "").trim();
    const displayName = trimmed.length > 0 ? trimmed.toUpperCase() : "GUEST ATTENDEE";
    const stubName = trimmed.length > 0 ? trimmed.toUpperCase() : "GUEST";

    if (ticketCardName) ticketCardName.textContent = displayName;
    if (ticketStubName) ticketStubName.textContent = stubName;
  }

  // Event Listeners
  if (codeForm) {
    codeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      verifyCode(codeInput.value);
    });
  }

  if (btnVerify) {
    btnVerify.addEventListener("click", () => {
      verifyCode(codeInput.value);
    });
  }

  // Demo chips click-to-verify
  demoChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const code = chip.getAttribute("data-code");
      if (codeInput) codeInput.value = code;
      verifyCode(code);
    });
  });

  // Change code button
  if (btnChangeCode) {
    btnChangeCode.addEventListener("click", () => {
      stepPreview.classList.add("d-none");
      stepCode.classList.remove("d-none");
      clearError();
      if (codeInput) {
        codeInput.value = "";
        codeInput.focus();
      }
    });
  }

  // Live Name Embossing
  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      updateTicketHolder(e.target.value);
    });
  }

  // 3D Mouse Parallax Tilt & Reactive Hologram Foil Glare
  if (stage && wrapper) {
    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const tiltX = -y * 14; // deg
      const tiltY = x * 16;  // deg

      wrapper.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        const glareX = ((x + 0.5) * 100).toFixed(1);
        const glareY = ((y + 0.5) * 100).toFixed(1);
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.24) 0%, rgba(235,0,40,0.18) 35%, transparent 70%)`;
        glare.style.opacity = "1";
      }
    });

    stage.addEventListener("mouseleave", () => {
      wrapper.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      if (glare) {
        glare.style.opacity = "0";
      }
    });
  }

  // High-Resolution Client-side HTML5 Canvas PNG Generator & Downloader
  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      downloadTicketPNG();
    });
  }

  function downloadTicketPNG() {
    const originalContent = btnDownload.innerHTML;
    btnDownload.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style="width: 1rem; height: 1rem; border-width: 0.15em;"></span>
      <span>GENERATING HIGH-RES PASS...</span>
    `;
    btnDownload.disabled = true;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = "assets/ticket-base.png";

    baseImg.onload = () => {
      try {
        // High-res 2x canvas for crisp print-grade quality (2048 x 1152)
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = (baseImg.naturalWidth || 1024) * scale;
        canvas.height = (baseImg.naturalHeight || 576) * scale;
        const ctx = canvas.getContext("2d");

        // 1. Draw base official artwork
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

        // 2. Dynamic Text Data
        const attendeeRaw = (nameInput && nameInput.value) ? nameInput.value.trim() : "";
        const attendeeName = (attendeeRaw || "GUEST ATTENDEE").toUpperCase();
        const badgeName = (currentTierData && currentTierData.badge) ? currentTierData.badge : "VIP PASS";
        const serialNo = currentSerial || "NO. #TBS-2026-8942";
        const stubCode = currentStubCode || "#TBS-8942";

        // Proportional coordinates calibrated to canvas
        const leftX = canvas.width * 0.07;
        const nameY = canvas.height * 0.77;

        // A. Draw "OFFICIAL DELEGATE" caption
        ctx.save();
        ctx.font = "bold 20px 'Space Grotesk', monospace, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fillText("OFFICIAL DELEGATE", leftX, nameY - 44);
        ctx.restore();

        // B. Draw Attendee Name with Red Neon Glow
        ctx.save();
        ctx.font = "900 52px 'Montserrat', sans-serif";
        ctx.shadowColor = "rgba(235, 0, 40, 0.9)";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(attendeeName, leftX, nameY);
        // Second pass for crisp inner white core
        ctx.shadowBlur = 0;
        ctx.fillText(attendeeName, leftX, nameY);
        ctx.restore();

        // C. Draw Pass Tier Pill Box
        const pillY = nameY + 22;
        ctx.font = "bold 22px 'Space Grotesk', monospace, sans-serif";
        const pillTextWidth = ctx.measureText(badgeName).width;
        const pillPaddingX = 20;
        const pillHeight = 36;

        ctx.fillStyle = "#eb0028";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(leftX, pillY, pillTextWidth + (pillPaddingX * 2), pillHeight, 8);
        } else {
          ctx.rect(leftX, pillY, pillTextWidth + (pillPaddingX * 2), pillHeight);
        }
        ctx.fill();

        // Pill text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(badgeName, leftX + pillPaddingX, pillY + 26);

        // D. Draw Serial Number
        const serialX = leftX + pillTextWidth + (pillPaddingX * 2) + 24;
        ctx.font = "bold 20px 'Space Grotesk', monospace, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(serialNo, serialX, pillY + 26);

        // E. Draw Right Stub Information (right-aligned)
        const stubRightX = canvas.width * 0.945;
        const stubY = canvas.height * 0.57;

        ctx.textAlign = "right";
        ctx.font = "bold 18px 'Space Grotesk', monospace, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText("HOLDER: " + (attendeeRaw.toUpperCase() || "GUEST"), stubRightX, stubY);

        ctx.font = "bold 20px 'Space Grotesk', monospace, sans-serif";
        ctx.fillStyle = "#eb0028";
        ctx.fillText(stubCode, stubRightX, stubY + 30);

        // F. Trigger Instant Download via data URL
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const downloadLink = document.createElement("a");
        const safeName = attendeeName.replace(/[^a-zA-Z0-9_-]/g, "_");
        downloadLink.download = `TEDxTBS-2026-Pass-${safeName}.png`;
        downloadLink.href = dataUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        btnDownload.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>PASS DOWNLOADED ✓</span>
        `;
        setTimeout(() => {
          btnDownload.innerHTML = originalContent;
          btnDownload.disabled = false;
        }, 2500);

      } catch (err) {
        console.error("Ticket generation error:", err);
        btnDownload.innerHTML = originalContent;
        btnDownload.disabled = false;
        alert("Unable to generate pass image. Please try again.");
      }
    };

    baseImg.onerror = () => {
      console.error("Failed to load ticket base image.");
      btnDownload.innerHTML = originalContent;
      btnDownload.disabled = false;
      alert("Ticket artwork could not be loaded.");
    };
  }
})();

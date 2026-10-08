
faq_content = r"""  <!-- FAQ Section -->
  <section class="py-24 bg-charcoal relative overflow-hidden">
    <div class="container mx-auto px-6 max-w-7xl relative">
      <div class="text-center mb-20" data-aos="fade-up">
        <div
          class="inline-flex items-center px-4 py-2 rounded-full bg-electric-mint bg-opacity-10 border border-electric-mint border-opacity-20 mb-6">
          <span class="text-electric-mint text-sm font-medium">❓ Questions fréquentes</span>
        </div>
        <h2 class="font-display text-4xl lg:text-5xl font-bold text-cloud mb-6">
          Vos questions, nos <span class="gradient-text">réponses</span>
        </h2>
        <p class="text-graphite-light text-xl max-w-2xl mx-auto">
          Tout ce que vous devez savoir avant de démarrer.
        </p>
      </div>

      <div class="max-w-3xl mx-auto">
        <!-- FAQ Item 1: Cost -->
        <div class="faq-item mb-4" data-aos="fade-up" data-aos-delay="100">
          <div class="faq-question glass-effect p-6 rounded-lg cursor-pointer hover:border-electric-mint/50 transition-colors border border-white/5">
            <div class="flex justify-between items-center">
              <h3 class="font-satoshi text-lg font-semibold text-cloud">
                Est-ce que l'IA coûte cher ?
              </h3>
              <i class="fas fa-chevron-down text-electric-mint transition-transform duration-300"></i>
            </div>
          </div>
          <div class="faq-answer bg-charcoal-light p-6 rounded-lg mt-2 hidden border border-white/5">
            <p class="text-graphite-light">
              Non, car nos solutions <strong>s'autofinancent</strong>. Nos clients voient un retour sur investissement positif (ROI) dès le 1er mois grâce aux économies réalisées sur le support et à l'augmentation des ventes. C'est un investissement, pas une dépense.
            </p>
          </div>
        </div>

        <!-- FAQ Item 2: Complexity -->
        <div class="faq-item mb-4" data-aos="fade-up" data-aos-delay="200">
          <div class="faq-question glass-effect p-6 rounded-lg cursor-pointer hover:border-electric-mint/50 transition-colors border border-white/5">
            <div class="flex justify-between items-center">
              <h3 class="font-satoshi text-lg font-semibold text-cloud">
                Est-ce compliqué à installer ?
              </h3>
              <i class="fas fa-chevron-down text-electric-mint transition-transform duration-300"></i>
            </div>
          </div>
          <div class="faq-answer bg-charcoal-light p-6 rounded-lg mt-2 hidden border border-white/5">
            <p class="text-graphite-light">
              <strong>Zéro technique pour vous.</strong> Notre équipe d'ingénieurs s'occupe de tout : configuration, intégration à vos outils, tests et lancement. Vous n'avez qu'à valider le résultat final.
            </p>
          </div>
        </div>

        <!-- FAQ Item 3: Time -->
        <div class="faq-item mb-4" data-aos="fade-up" data-aos-delay="300">
          <div class="faq-question glass-effect p-6 rounded-lg cursor-pointer hover:border-electric-mint/50 transition-colors border border-white/5">
            <div class="flex justify-between items-center">
              <h3 class="font-satoshi text-lg font-semibold text-cloud">
                Combien de temps ça prend ?
              </h3>
              <i class="fas fa-chevron-down text-electric-mint transition-transform duration-300"></i>
            </div>
          </div>
          <div class="faq-answer bg-charcoal-light p-6 rounded-lg mt-2 hidden border border-white/5">
            <p class="text-graphite-light">
              Nous sommes rapides. Votre agent IA personnalisé peut être en ligne et opérationnel en <strong>5 à 7 jours ouvrés</strong> après notre audit initial.
            </p>
          </div>
        </div>

        <!-- FAQ Item 4: AI Replacement -->
        <div class="faq-item mb-4" data-aos="fade-up" data-aos-delay="400">
          <div class="faq-question glass-effect p-6 rounded-lg cursor-pointer hover:border-electric-mint/50 transition-colors border border-white/5">
            <div class="flex justify-between items-center">
              <h3 class="font-satoshi text-lg font-semibold text-cloud">
                L'IA va-t-elle remplacer mes employés ?
              </h3>
              <i class="fas fa-chevron-down text-electric-mint transition-transform duration-300"></i>
            </div>
          </div>
          <div class="faq-answer bg-charcoal-light p-6 rounded-lg mt-2 hidden border border-white/5">
            <p class="text-graphite-light">
              <strong>Pas du tout.</strong> Elle les libère des tâches ingrates et répétitives (comme répondre 50 fois à la même question "prix ?"). Vos équipes peuvent enfin se concentrer sur des tâches à haute valeur ajoutée : le  conseil client, la stratégie et la vente complexe.
            </p>
          </div>
        </div>
        
        <!-- FAQ Item 5: Security (Bonus) -->
        <div class="faq-item mb-4" data-aos="fade-up" data-aos-delay="500">
          <div class="faq-question glass-effect p-6 rounded-lg cursor-pointer hover:border-electric-mint/50 transition-colors border border-white/5">
            <div class="flex justify-between items-center">
              <h3 class="font-satoshi text-lg font-semibold text-cloud">
                 Mes données sont-elles en sécurité ?
              </h3>
              <i class="fas fa-chevron-down text-electric-mint transition-transform duration-300"></i>
            </div>
          </div>
          <div class="faq-answer bg-charcoal-light p-6 rounded-lg mt-2 hidden border border-white/5">
            <p class="text-graphite-light">
              Absolument. La confidentialité est notre priorité. Nous utilisons des protocoles de chiffrement avancés et nous ne partageons jamais vos données.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
"""

# Read the file
with open(r'c:\Users\Rogue\Desktop\dsa web\safonas\index2.html', 'r', encoding='utf-8') as file:
    lines = file.readlines()

# Replace lines 1180 to 1345 (indices 1179 to 1345)
# Check context: Line 1180 is <section class="py-24 bg-charcoal relative overflow-hidden">
start_line = 1180
end_line = 1345

lines[1180-1:1345] = [faq_content + "\n"]

# Write back
with open(r'c:\Users\Rogue\Desktop\dsa web\safonas\index2.html', 'w', encoding='utf-8') as file:
    file.writelines(lines)

print("Successfully updated FAQs in index2.html")

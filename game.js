// --- Variables Globales ---
// Ces variables stockent l'état actuel de votre jeu.
let score = 0; // Le nombre total de vues accumulées par le joueur
let baseViewsPerClick = 1; // Le nombre de vues de base obtenues par un simple clic
let clickMultiplier = 1; // Multiplicateur appliqué aux vues par clic (ex: x2, x3)
let clickBonus = 0; // Bonus direct ajouté aux vues par clic (ex: +5 vues)
let globalVPSBonus = 0; // Bonus global en pourcentage appliqué à toutes les vues par seconde (VPS)
let viewsPerSecond = 0; // Le nombre total de vues produites automatiquement par seconde
let prodPaused = false; // Drapeau pour mettre en pause temporairement toute la production automatique (pour les événements aléatoires)
let tempGlobalVPSBonus = 0; // Bonus temporaire global en pourcentage appliqué aux vues par seconde (pour les événements ou boosts)

// --- NOUVELLES Variables pour l'animation de Didier ---
let didierPool = []; // Tableau pour stocker les éléments Didier actifs
const MAX_DIDIER_DISPLAY = 10; // Nombre maximum de Didiers affichés simultanément (ajustez à votre goût)
const DIDIER_VISUAL_TRIGGER_VPS = 1; // Nombre de VPS nécessaire pour qu'un Didier apparaisse et "clique" (ajustez)


// --- Fonctions de Calcul de Base ---

// Calcule le nombre total de vues obtenues à chaque clic.
function getViewsPerClick() {
    return baseViewsPerClick * clickMultiplier + clickBonus;
}

// Calcule le nouveau coût d'un élément (usine ou amélioration) après un achat.
// Le coût augmente de manière exponentielle pour encourager la progression.
const COST_MULTIPLIER = 1.5; // Chaque nouvel achat coûte 15% plus cher que le précédent (du coût initial)
function calculateNewCost(initialCost, count) {
    return Math.floor(initialCost * Math.pow(COST_MULTIPLIER, count));
}

// --- Données du Jeu : Usines et Améliorations ---

// Tableau des usines : Chaque objet représente une source de production automatique de vues.
const factories = [
    { id: 'didierFactory', name: "Didier, le Vieux Fan", description: "Didier, votre fan le plus fidèle, relance vos anciennes vidéos en boucle.", initialCost: 20, cost: 20, production: 0.1, count: 0 },
    { id: 'miniStudio', name: "Mini-Studio Portable", description: "Un petit setup pour des vlogs improvisés.", initialCost: 150, cost: 150, production: 1, count: 0 },
    { id: 'studio', name: "Studio d'Enregistrement", description: "Un studio professionnel pour une production de masse.", initialCost: 1000, cost: 1000, production: 5, count: 0 },
    { id: 'equipeMontage', name: "Équipe de Montage", description: "Des monteurs dédiés pour des vidéos toujours prêtes.", initialCost: 8000, cost: 8000, production: 25, count: 0 },
    { id: 'chaineSecondaire', name: "Chaîne Secondaire", description: "Une chaîne parallèle pour du contenu additionnel.", initialCost: 50000, cost: 50000, production: 100, count: 0 },
    { id: 'reseauChaines', name: "Réseau de Chaînes", description: "Un empire de chaînes thématiques et de niches.", initialCost: 350000, cost: 350000, production: 500, count: 0 },
    { id: 'agencePub', name: "Agence de Publicité", description: "Une agence qui promeut vos vidéos 24h/24.", initialCost: 2500000, cost: 2500000, production: 2500, count: 0 },
    { id: 'centreData', name: "Centre de Data Média", description: "Analyse les tendances pour créer du contenu viral.", initialCost: 15000000, cost: 15000000, production: 10000, count: 0 },
    { id: 'fuzeAI', name: 'Intelligence Artificielle "FuzeAI"', description: "Une IA génère et optimise des vidéos pour vous.", initialCost: 100000000, cost: 100000000, production: 50000, count: 0 }
];

// Tableau des améliorations : Chaque objet représente un bonus permanent au jeu.
const upgrades = [
    { id: 'micro', name: "Micro de Qualité", description: "Améliore la clarté audio pour plus d'impact.", initialCost: 100, cost: 100, effect: () => { clickBonus += 1; }, effectDescription: "+1 vue par clic", bought: 0 },
    { id: 'seo', name: "Optimisation SEO", description: "Votre vidéo est mieux référencée.", initialCost: 500, cost: 500, effect: () => { multiplyFactoryProduction('didierFactory', 2); }, effectDescription: "Production de Didier x2", bought: 0 },
    { id: 'miniature', name: "Miniature Attrayante", description: "Attire plus de regards sur vos vidéos.", initialCost: 2500, cost: 2500, effect: () => { clickBonus += 2; }, effectDescription: "+2 vues par clic", bought: 0 },
    { id: 'montageDynamique', name: "Montage Dynamique", description: "Votre contenu est plus engageant.", initialCost: 10000, cost: 10000, effect: () => { multiplyFactoryProduction('studio', 2); }, effectDescription: "Production du studio x2", bought: 0 },
    { id: 'sponsor', name: "Sponsor Exclusif", description: "Un gros sponsor booste votre visibilité.", initialCost: 50000, cost: 50000, effect: () => { clickBonus += 5; }, effectDescription: "+5 vues par clic", bought: 0 },
    { id: 'partenariatYT', name: "Partenariat YouTube", description: "Accès à des outils premium de la plateforme.", initialCost: 150000, cost: 150000, effect: () => { multiplyFactoryProduction('chaineSecondaire', 2); }, effectDescription: "Production des chaînes secondaires x2", bought: 0 },
    { id: 'videosVirales', name: "Vidéos Virales", description: "Le contenu se propage à vitesse grand V.", initialCost: 500000, cost: 500000, effect: () => { clickMultiplier *= 2; }, effectDescription: "Toutes les vues par clic x2", bought: 0 },
    { id: 'reseauInfluenceurs', name: "Réseau d'Influenceurs", description: "Une collaboration massive avec d'autres créateurs.", initialCost: 1500000, cost: 1500000, effect: () => { multiplyFactoryProduction('reseauChaines', 2); }, effectDescription: "Production des réseaux de chaînes x2", bought: 0 },
    { id: 'evenementLive', name: "Événement Spécial Live", description: "Un live exceptionnel pour une audience massive.", initialCost: 5000000, cost: 5000000, effect: () => { activateTemporaryBoost(5, 60); }, effectDescription: "Boost x5 pendant 60 secondes", bought: 0 },
    { id: 'serveurs', name: "Serveurs Dédiés", description: "Gère mieux l'afflux de spectateurs.", initialCost: 15000000, cost: 15000000, effect: () => { globalVPSBonus += 0.10; }, effectDescription: "+10% de production automatique", bought: 0 },
    { id: 'algorithmeUltime', name: "Algorithme Ultime", description: "Manipule l'algorithme pour une portée maximale.", initialCost: 50000000, cost: 50000000, effect: () => { clickMultiplier *= 3; }, effectDescription: "Toutes les vues par clic x3", bought: 0 },
    { id: 'marketingGlobal', name: "Marketing Global", description: "Vos vidéos touchent le monde entier.", initialCost: 150000000, cost: 150000000, effect: () => { globalVPSBonus += 0.25; }, effectDescription: "+25% de production automatique", bought: 0 }
];

// --- Éléments du DOM (Document Object Model) ---
// Références aux éléments HTML avec lesquels le JavaScript va interagir.
const scoreDisplay = document.getElementById('score'); // Affiche le score actuel
const fuzeHead = document.getElementById('fuzeHead'); // La tête de Fuze cliquable
const upgradesList = document.getElementById('upgrades-list'); // Conteneur des boutons d'améliorations
const factoriesList = document.getElementById('factories-list'); // Conteneur des boutons d'usines
const popSound = document.getElementById('popSound'); // Élément audio pour le son de clic
if (popSound) popSound.volume = 0.2; // Ajuste le volume du son si l'élément existe

// --- NOUVEAU : Conteneur pour les Didiers ---
const didierContainer = document.getElementById('didier-container');

// --- Fonctions de Mise à Update de l'UI (Interface Utilisateur) ---

// Met à jour l'affichage du score sur la page.
function updateScore() {
    // Le score est un nombre flottant pour la précision, mais on l'arrondit pour l'affichage.
    scoreDisplay.textContent = `${formatNumber(Math.floor(score))} vues`;
}


// Multiplie la production d'une usine spécifique. Utilisé par certaines améliorations.
function multiplyFactoryProduction(id, multiplier) {
    const factory = factories.find(f => f.id === id);
    if (factory) {
        factory.production *= multiplier;
    }
}

// Active un bonus temporaire à la production automatique.
function activateTemporaryBoost(multiplier, duration) {
    tempGlobalVPSBonus = (multiplier - 1);
    const boostMessage = document.createElement('div');
    boostMessage.className = 'boost-message';
    boostMessage.textContent = `BOOST ACTIF : Production x${multiplier} pendant ${duration} secondes !`;
    document.body.appendChild(boostMessage);

    setTimeout(() => {
        tempGlobalVPSBonus = 0;
        boostMessage.remove();
        alert("Le boost temporaire est terminé !");
        updateVPSDisplay();
    }, duration * 1000);

    updateVPSDisplay();
}

// Construit initialement les boutons des améliorations dans le DOM.
function renderUpgradesHTML() {
    upgradesList.innerHTML = '';
    upgrades.forEach(upg => {
        const btn = document.createElement('button');
        btn.className = 'upgrade';
        btn.setAttribute('data-id', upg.id);
        btn.innerHTML = `
            <span class="name">${upg.name} (x${upg.bought})</span>
            <span class="desc">${upg.description}</span>
            <span class="cost">${formatNumber(upg.cost)} vues</span>
            <span class="effect">${upg.effectDescription}</span>
        `;
        upgradesList.appendChild(btn);
    });
}

// Construit initialement les boutons des usines dans le DOM.
function renderFactoriesHTML() {
    factoriesList.innerHTML = '';
    factories.forEach(factory => {
        const btn = document.createElement('button');
        btn.className = 'factory';
        btn.setAttribute('data-id', factory.id);
        btn.innerHTML = `
            <span class="name">${factory.name} (x${factory.count})</span>
            <span class="desc">${factory.description}</span>
            <span class="cost">Coût : ${formatNumber(factory.cost)} vues</span>
            <span class="production">Prod : ${formatNumber(factory.production)} vue${factory.production === 0 || factory.production > 1 ? 's' : ''} / s</span>
        `;
        factoriesList.appendChild(btn);
    });
}

// Met à jour l'état (activé/désactivé) de tous les boutons en fonction du score actuel du joueur.
function updateButtonStates() {
    upgrades.forEach(upg => {
        const btn = document.querySelector(`.upgrade[data-id="${upg.id}"]`);
        if (btn) btn.disabled = score < upg.cost;
    });
    factories.forEach(factory => {
        const btn = document.querySelector(`.factory[data-id="${factory.id}"]`);
        if (btn) btn.disabled = score < factory.cost;
    });
}

// Fonction de rendu combinée : appelée pour initialiser l'UI et la mettre à jour ensuite.
function renderAll() {
    if (upgradesList.children.length === 0) {
        renderUpgradesHTML();
    }
    if (factoriesList.children.length === 0) {
        renderFactoriesHTML();
    }

    upgrades.forEach(upg => {
        const btn = document.querySelector(`.upgrade[data-id="${upg.id}"]`);
        if (btn) {
            btn.querySelector('.name').textContent = `${upg.name} (x${upg.bought})`;
            btn.querySelector('.cost').textContent = `${formatNumber(upg.cost)} vues`;
        }
    });

    factories.forEach(factory => {
        const btn = document.querySelector(`.factory[data-id="${factory.id}"]`);
        if (btn) {
            btn.querySelector('.name').textContent = `${factory.name} (x${factory.count})`;
            btn.querySelector('.cost').textContent = `Coût : ${formatNumber(factory.cost)} vues`;
            btn.querySelector('.production').textContent = `Prod : ${formatNumber(factory.production)} vue${factory.production === 0 || factory.production > 1 ? 's' : ''} / s`;
        }
    });

    updateButtonStates();
}

// --- Gestion des Événements Clic ---

// Écouteur d'événements pour les améliorations.
if (upgradesList) {
    upgradesList.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.upgrade');
        if (clickedButton && !clickedButton.disabled) {
            const upgradeId = clickedButton.getAttribute('data-id');
            const upg = upgrades.find(u => u.id === upgradeId);

            if (upg && score >= upg.cost) {
                score -= upg.cost;
                upg.effect();
                upg.bought++;
                upg.cost = calculateNewCost(upg.initialCost, upg.bought);
                updateScore();
                renderAll();
                updateVPSDisplay();
            }
        }
    });
}

// Écouteur d'événements pour les usines.
if (factoriesList) {
    factoriesList.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.factory');
        if (clickedButton && !clickedButton.disabled) {
            const factoryId = clickedButton.getAttribute('data-id');
            const factory = factories.find(f => f.id === factoryId);

            if (factory && score >= factory.cost) {
                score -= factory.cost;
                factory.count++;
                factory.cost = calculateNewCost(factory.initialCost, factory.count);
                updateScore();
                renderAll();
                updateVPSDisplay();
            }
        }
    });
}

// Écouteur d'événements pour le clic sur la tête de Fuze.
if (fuzeHead) {
    fuzeHead.addEventListener('click', () => {
        score += getViewsPerClick();
        // score = Math.round(score); // L'arrondi est maintenant géré dans updateScore pour l'affichage
        updateScore();
        if (popSound) {
            popSound.currentTime = 0;
            popSound.play();
        }
        updateButtonStates();
    });

    // Effet visuel au clic (texte "+X" qui apparaît et disparaît).
    fuzeHead.addEventListener('click', (e) => {
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.textContent = `+${formatNumber(getViewsPerClick())}`;
        const rect = fuzeHead.getBoundingClientRect();
        const clickerSection = document.getElementById('clicker-section');
        if (clickerSection) {
            const containerRect = clickerSection.getBoundingClientRect();
            const x = rect.left - containerRect.left + rect.width / 2;
            const y = rect.top - containerRect.top;
            feedback.style.left = `${x}px`;
            feedback.style.top = `${y}px`;
            feedback.style.transform = 'translate(-50%, 0)';
            clickerSection.appendChild(feedback);
            setTimeout(() => { feedback.remove(); }, 1000);
        }
    });
}

// --- Boucle de Jeu Principale (Production Automatique) ---

setInterval(() => {
    if (!prodPaused) {
        let currentProductionVPS = 0; // Renommé pour plus de clarté
        factories.forEach(factory => {
            currentProductionVPS += factory.production * factory.count;
        });
        currentProductionVPS *= (1 + globalVPSBonus + tempGlobalVPSBonus);
        score += currentProductionVPS / 10; // Ajout de 1/10 de la production par seconde toutes les 100ms

        updateScore();
        updateButtonStates();

        // --- NOUVEAU : Appel pour l'animation de Didier ---
        animateDidiers(currentProductionVPS);
    }
}, 100); // Exécuté toutes les 100 millisecondes

// --- NOUVELLE FONCTION POUR L'ANIMATION DE DIDIER ---
function animateDidiers(currentProductionVPS) {
    if (!didierContainer || !fuzeHead) return; // S'assure que les conteneurs existent

    // Calcule le nombre de Didiers à afficher en fonction de la production VPS.
    // Un Didier s'affiche par DIDIER_VISUAL_TRIGGER_VPS (ex: 10) de production.
    const numDidiersDesired = Math.min(Math.floor(currentProductionVPS / DIDIER_VISUAL_TRIGGER_VPS), MAX_DIDIER_DISPLAY);

    // Supprime les Didiers en trop
    while (didierPool.length > numDidiersDesired && didierPool.length > 0) {
        const didierToRemove = didierPool.shift(); // Supprime le plus ancien Didier du tableau
        // Applique une animation de disparition avant de le supprimer du DOM
        didierToRemove.style.animation = 'fadeOutAndUp 0.5s forwards';
        setTimeout(() => didierToRemove.remove(), 500);
    }

    // Ajoute de nouveaux Didiers si nécessaire
    while (didierPool.length < numDidiersDesired) {
        const didier = document.createElement('div');
        didier.className = 'didier-clicker';

        // Positionne Didier aléatoirement autour de la tête de Fuze
        const fuzeRect = fuzeHead.getBoundingClientRect();
        const containerRect = didierContainer.getBoundingClientRect();

        // Calcule la position relative à didierContainer
        // On prend le centre de fuzeHead et on ajoute/retire un offset aléatoire
        const x = fuzeRect.left - containerRect.left + fuzeRect.width / 2 + (Math.random() - 0.5) * 120; // ±60px autour du centre
        const y = fuzeRect.top - containerRect.top + fuzeRect.height / 2 + (Math.random() - 0.5) * 120; // ±60px autour du centre

        didier.style.left = `${x}px`;
        didier.style.top = `${y}px`;
        didier.style.transform = `translate(-50%, -50%)`; // Centre le Didier sur son point (x,y)

        didierContainer.appendChild(didier);
        didierPool.push(didier); // Ajoute le nouveau Didier au tableau
    }

    // Pour les Didiers qui restent, réinitialise leur animation de "clic" pour qu'elle se relance.
    didierPool.forEach(didier => {
        didier.style.animation = 'none'; // Stoppe l'animation
        void didier.offsetWidth; // Force un reflow pour permettre la relance de l'animation
        didier.style.animation = 'didierClick 0.5s infinite alternate'; // Relance l'animation
    });
}


// --- Initialisation du Jeu ---

document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    updateScore();
    updateVPSDisplay();
    showStep(currentStep);
});

// --- Système de Tutoriel ---

const tutorialSteps = [
    "👋 Bienvenue sur <strong>Fuze View Clicker </strong> !<br>Tu vas incarner Fuze III, un YouTubeur en devenir.",
    "🖱️ Clique sur ta tête pour gagner des <strong>vues</strong>. Chaque clic te rapporte des vues .",
    "🧠 Utilise ces vues pour acheter des <strong>améliorations</strong> qui boostent tes vues par clic.",
    "🏭 Investis ensuite dans des <strong>usines</strong> (monteurs, IA, bots...) qui produisent des vues automatiquement.",
    "🎯 Ton objectif : devenir le plus grand créateur de contenu du monde en explosant ton compteur de vues !",
    "🚀 Bonne chance, créateur. Clique sur <strong>Commencer</strong> pour te lancer !"
];

let currentStep = 0;
const tutorialDiv = document.getElementById("tutorial");
const stepElement = document.getElementById("tutorial-step");
const nextBtn = document.getElementById("next-btn");

function showStep(index) {
    if (stepElement) {
        stepElement.innerHTML = tutorialSteps[index];
    }
    if (nextBtn) {
        nextBtn.textContent = (index === tutorialSteps.length - 1) ? "Commencer" : "Suivant";
    }
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        currentStep++;
        if (currentStep < tutorialSteps.length) {
            showStep(currentStep);
        } else {
            if (tutorialDiv) {
                tutorialDiv.style.display = "none";
            }
        }
    });
}

// --- Mise à Jour des Vues Par Seconde (VPS) ---

setInterval(() => {
    updateVPSDisplay();
}, 1000);

function updateVPSDisplay() {
    let production = 0;
    factories.forEach(factory => {
        production += factory.production * factory.count;
    });
    viewsPerSecond = production * (1 + globalVPSBonus + tempGlobalVPSBonus);

    const vpsDisplay = document.getElementById("vps");
    if (vpsDisplay) {
        vpsDisplay.textContent = `Vues/s : ${formatNumber(viewsPerSecond)}`;
    }
}

// --- Fonction Utilitaire : Formatage des Nombres ---

function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    if (n > 0 && n < 1) return n.toFixed(1);
    if (n === 0) return '0';
    return Math.floor(n).toString();
}

// --- Événements Aléatoires ---

const randomEvents = [
    { name: "Vue Express", description: "Augmente le gain du clic principal.", type: "immediate", effect: () => { clickBonus += 5; }, duration: 0 },
    { name: "Flop Vidéo", description: "Toutes les sources de vues automatiques (VPS) -50%.", type: "temporary", effect: () => { globalVPSBonus -= 0.5; }, revert: () => { globalVPSBonus += 0.5; }, duration: 30 },
    { name: "Vidéos en Tendance", description: "Prod clics + auto x2.", type: "temporary", effect: () => { clickMultiplier *= 2; tempGlobalVPSBonus += 1; }, revert: () => { clickMultiplier /= 2; tempGlobalVPSBonus -= 1; }, duration: 60 },
    { name: "Bug YouTube", description: "Toutes productions arrêtées.", type: "temporary", effect: () => { prodPaused = true; }, revert: () => { prodPaused = false; }, duration: 10 },
    { name: "Fuze III en Live !", description: "Prod clics x7.", type: "temporary", effect: () => { clickMultiplier *= 7; }, revert: () => { clickMultiplier /= 7; }, duration: 20 },
    { name: "Défis Absurdes", description: "Gain instantané = 15 min de VPS.", type: "immediate", effect: () => { score += viewsPerSecond * 60 * 15; }, duration: 0 },
    { name: "Rivalité Fraternelle", description: 'Prod "Didier" x4.', type: "temporary", effect: () => { multiplyFactoryProduction('didierFactory', 4); }, revert: () => { multiplyFactoryProduction('didierFactory', 0.25); }, duration: 45 },
    { name: "Mise à Jour de l'Algo", description: 'Prod "Agence Pub" & "Centre Data" x3.', type: "temporary", effect: () => { multiplyFactoryProduction('agencePub', 3); multiplyFactoryProduction('centreData', 3); }, revert: () => { multiplyFactoryProduction('agencePub', 1 / 3); multiplyFactoryProduction('centreData', 1 / 3); }, duration: 60 },
    { name: "Spam de Commentaires", description: "Prod auto -25%.", type: "temporary", effect: () => { globalVPSBonus -= 0.25; }, revert: () => { globalVPSBonus += 0.25; }, duration: 45 },
    { name: "Don de Streamer", description: "Gain instantané = 1% du total.", type: "immediate", effect: () => { score += score * 0.01; }, duration: 0 },
    { name: "Fuze s'endort !", description: "Prod clics -80%.", type: "temporary", effect: () => { clickMultiplier *= 0.2; }, revert: () => { clickMultiplier /= 0.2; }, duration: 30 },
    { name: "Collaboration Mystère", description: 'Prod "Chaîne Secondaire" & "Réseaux" x2.5.', type: "temporary", effect: () => { multiplyFactoryProduction('chaineSecondaire', 2.5); multiplyFactoryProduction('reseauChaines', 2.5); }, revert: () => { multiplyFactoryProduction('chaineSecondaire', 1 / 2.5); multiplyFactoryProduction('reseauChaines', 1 / 2.5); }, duration: 75 },
    { name: "Fuze en Pixel Art", description: "TOUT x7. (TRÈS RARE)", type: "temporary", effect: () => { clickMultiplier *= 7; tempGlobalVPSBonus += 6; }, revert: () => { clickMultiplier /= 7; tempGlobalVPSBonus -= 6; }, duration: 60 }
];

function triggerRandomEvent() {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    alert(`📣 Événement : ${event.name}\n${event.description}`);

    event.effect();

    if (event.type === "temporary") {
        setTimeout(() => {
            event.revert();
            alert(`⏳ Fin de l'événement : ${event.name}`);
            updateButtonStates();
            updateVPSDisplay();
            renderAll();
        }, event.duration * 1000);
    }
    updateButtonStates();
    renderAll();
    updateVPSDisplay();
}

setInterval(() => {
    const delay = 90000 + Math.random() * 90000;
    setTimeout(triggerRandomEvent, delay);
}, 90000);

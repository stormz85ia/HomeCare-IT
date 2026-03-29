# HomeCare IT — Design Spec
**Date :** 2026-03-29
**Statut :** Approuvé
**Slogan :** "L'appli qui diagnostique, l'humain qui dépanne."

---

## 1. Vue d'ensemble

HomeCare IT est un service de conciergerie informatique premium basé dans le canton de Vaud (Suisse), accessible via deux canaux :
- **Telegram Mini App (TMA)** — intégrée dans un bot Telegram via `window.Telegram.WebApp`
- **URL standalone** — accessible directement (SMS, QR code carte de visite, lien web)

L'application guide l'utilisateur à travers un diagnostic N1 automatisé (gratuit), puis propose une offre premium si le diagnostic échoue, et gère le choix de paiement (TWINT ou sur place).

**Langue :** Français, vouvoiement obligatoire, ton conciergerie premium.
**Design system :** Mobile First, bleu marine (`#0a1628`) et blanc, bordures fines, ombres douces.

---

## 2. Décisions architecturales

| Décision | Choix retenu | Justification |
|----------|-------------|---------------|
| Déploiement | TMA + URL standalone | Portée maximale (SMS, QR, web) ; coût architectural nul (un hook) |
| Backend | Edge API route unique (`/api/notify`) | Token Telegram sécurisé côté serveur ; pas de DB pour le MVP |
| State | Zustand + localStorage | Persistance session légère, pas de PII |
| Arbres N1 | `checklists.ts` tronc commun + branches FAI | Extensible, zéro hardcode dans les composants |
| Paiement | TWINT QR placeholder + confirmation "sur place" | MVP fonctionnel, architecture prête pour vraie intégration |

---

## 3. Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui |
| State | Zustand |
| Validation | Zod |
| XSS protection | DOMPurify |
| PWA | next-pwa |
| Deploy | Vercel (Edge runtime) |

---

## 4. Structure du projet

```
homecare-it/
├── app/
│   ├── layout.tsx              # Root layout : TMA init, PWA meta, theme bleu marine
│   ├── page.tsx                # Redirect → /onboarding ou /chat selon session Zustand
│   ├── onboarding/
│   │   └── page.tsx            # Phase 1 : consent + technologie + FAI
│   ├── chat/
│   │   └── page.tsx            # Phase 2→3→4 : diagnostic → upsell → paiement
│   └── api/
│       └── notify/
│           └── route.ts        # Edge API : notif Telegram Bot API
├── components/
│   ├── ui/                     # shadcn/ui (Button, Card, Checkbox, Badge, ScrollArea, Separator)
│   ├── chat/
│   │   ├── ChatBubble.tsx      # Bulle bot (gauche) ou user (droite)
│   │   ├── QuickReplyButtons.tsx  # Boutons de réponse rapide (shadcn/ui Button)
│   │   └── UpsellCard.tsx      # Card "Pack Annuel Tranquillité"
│   ├── onboarding/
│   │   ├── ConsentCheckbox.tsx # Case RGPD/LPD avec lien politique
│   │   ├── TechSelector.tsx    # Sélection Fibre OTO / VDSL / Câble
│   │   └── FaiSelector.tsx     # Sélection Swisscom / Salt / Sunrise / Net+ / Autre
│   └── payment/
│       ├── TwintQR.tsx         # QR placeholder + texte TWINT
│       └── PayOnSite.tsx       # Confirmation statut VIP pré-activé
├── data/
│   └── checklists.ts           # Source de vérité des arbres de décision N1
├── hooks/
│   ├── useTelegramContext.ts   # Détecte TMA vs standalone + helpers WebApp
│   └── useDiagnosticEngine.ts  # Navigue dans l'arbre JSON, expose nœud courant
├── store/
│   └── useSessionStore.ts      # Zustand store, persisté en localStorage
├── lib/
│   ├── sanitize.ts             # DOMPurify : sanitise tout texte rendu en chat
│   └── telegram.ts             # Wrappers window.Telegram.WebApp (safe pour SSR)
└── types/
    └── index.ts                # DiagnosticNode, Checklist, SessionState, ChatMessage
```

---

## 5. Data Architecture — `checklists.ts`

### Types

```typescript
type NodeResult = 'RESOLVED' | 'ESCALATE' | string // string = id du prochain nœud

interface DiagnosticOption {
  label: string       // Texte affiché dans le bouton de réponse rapide
  next: NodeResult    // Prochain nœud, RESOLVED (problème résolu) ou ESCALATE (intervention requise)
}

interface DiagnosticNode {
  id: string
  question: string                // Question affichée dans la bulle bot
  options: DiagnosticOption[]     // Boutons de réponse rapide
}

interface Checklist {
  fai: 'swisscom' | 'salt' | 'sunrise' | 'netplus' | 'autre'
  technology: 'fibre_oto' | 'vdsl' | 'cable'
  entry: string                   // ID du nœud de départ
  nodes: Record<string, DiagnosticNode>
}
```

### Exemple (Swisscom VDSL)

```typescript
{
  fai: 'swisscom',
  technology: 'vdsl',
  entry: 'q1',
  nodes: {
    q1: {
      id: 'q1',
      question: 'Votre connexion est-elle totalement coupée ou simplement lente ?',
      options: [
        { label: 'Totalement coupée', next: 'q2' },
        { label: 'Simplement lente', next: 'q_slow' },
      ]
    },
    q2: {
      id: 'q2',
      question: 'Les voyants de votre box Swisscom sont-ils allumés ?',
      options: [
        { label: '✅ Oui, tous allumés', next: 'q3' },
        { label: '⚠️ Partiellement allumés', next: 'q_partial' },
        { label: '❌ Éteints ou rouges', next: 'q_reboot' },
      ]
    },
    q_reboot: {
      id: 'q_reboot',
      question: 'Débranchez votre box 30 secondes, puis rebranchez-la. Les voyants s\'allument-ils ?',
      options: [
        { label: 'Oui, connexion rétablie', next: 'RESOLVED' },
        { label: 'Non, toujours éteints', next: 'ESCALATE' },
      ]
    },
    // ... autres nœuds
  }
}
```

### Principe de navigation

- `useDiagnosticEngine` charge le bon `Checklist` selon `{ fai, technology }` depuis le store
- Chaque réponse de l'utilisateur fait avancer le curseur vers `option.next`
- `RESOLVED` → message de succès + bouton "Retour à l'accueil"
- `ESCALATE` → déclenchement Phase 3 (upsell)

---

## 6. State Management (Zustand)

```typescript
interface SessionState {
  // Onboarding
  consentGiven: boolean
  technology: 'fibre_oto' | 'vdsl' | 'cable' | null
  fai: 'swisscom' | 'salt' | 'sunrise' | 'netplus' | 'autre' | null

  // Chat
  messages: ChatMessage[]
  currentNodeId: string | null
  phase: 'onboarding' | 'diagnostic' | 'upsell' | 'payment'

  // Payment
  paymentMethod: 'twint' | 'on_site' | null

  // Actions
  setConsent: (v: boolean) => void
  setProfile: (tech: Technology, fai: FAI) => void
  addMessage: (msg: ChatMessage) => void
  advanceNode: (nodeId: string) => void
  setPhase: (phase: Phase) => void
  resetSession: () => void
}
```

**Persistance localStorage :** uniquement `consentGiven`, `technology`, `fai` — pas les messages (session éphémère, minimisation des données LPD).

---

## 7. User Flow détaillé

### Phase 1 — Onboarding (`/onboarding`)

1. Écran d'accueil : logo, slogan, fond bleu marine
2. Case à cocher : *"J'accepte le traitement local de mes données pour le diagnostic (LPD/RGPD)"* — **obligatoire** pour continuer
3. Sélection technologie : Fibre OTO / VDSL / Câble (toggle buttons)
4. Sélection FAI : Swisscom / Salt / Sunrise / Net+ / Autre (grid 2×2 + 1)
5. CTA : *"Démarrer le diagnostic →"* → navigate `/chat`

### Phase 2 — Diagnostic N1 (`/chat`, phase: 'diagnostic')

1. Header : avatar bot + "HomeCare IT" + indicateur "● En ligne"
2. Première bulle bot : question depuis `nodes[checklist.entry]`
3. Boutons de réponse rapide (shadcn/ui `Button`, variant outline) — champ texte libre **désactivé**
4. À chaque réponse : bulle user + nouvelle bulle bot avec question suivante
5. Animation "typing" (3 points) pendant 600ms avant chaque réponse bot
6. `RESOLVED` → bulle de succès + bouton reset → fin de session
7. `ESCALATE` → transition vers Phase 3

### Phase 3 — Upsell (`/chat`, phase: 'upsell')

1. Bulle bot : *"Nous avons épuisé les solutions à distance. Une intervention sur place est nécessaire dans votre secteur (Oron et environs)."*
2. Card "Pack Annuel Tranquillité" (shadcn/ui `Card`) :
   - Prix : **89 CHF/an**
   - Avantages : Support N1 illimité · Déplacement offert · Tarif VIP 70 CHF/h
   - Barré : *"Sans pack : 120 CHF/h + frais de déplacement"*
   - CTA : *"Activer le Pack VIP à 89 CHF →"*
3. CTA secondaire (texte discret) : *"Réserver une intervention sans pack (120 CHF/h)"*
   - Clic → bulle bot : *"Entendu. Le technicien vous contactera pour convenir d'un rendez-vous au tarif standard de 120 CHF/h."* + appel `/api/notify` avec `paymentMethod: 'on_site_no_pack'` → fin de session

### Phase 4 — Paiement (`/chat`, phase: 'payment')

**Si clic "Activer le Pack VIP" :**

Option A — TWINT :
- QR code placeholder (image statique)
- Texte : *"Scannez avec TWINT pour régler 89 CHF"*
- Appel à `/api/notify` en arrière-plan → notification Telegram au technicien

Option B — Sur place :
- Message : *"Statut VIP pré-activé. Le technicien encaissera la somme à son arrivée."*
- Appel à `/api/notify` → notification Telegram au technicien

---

## 8. Edge API — `/api/notify`

**Runtime :** Edge (Vercel Edge Functions)

**Requête :**
```typescript
POST /api/notify
{
  technology: Technology,
  fai: FAI,
  summary: string,       // Concaténation des paires question→réponse du store messages[], ex: "Connexion coupée → Totalement | Voyants → Éteints"
  paymentMethod: 'twint' | 'on_site'
}
```

**Traitement :**
1. Validation Zod du body
2. Construction du message Telegram (Markdown) :
   ```
   🔔 *Nouvelle demande d'intervention*

   👤 Opérateur : Swisscom | Technologie : VDSL
   💳 Paiement : TWINT
   📋 Parcours : [résumé]
   ```
3. `fetch` vers `https://api.telegram.org/bot{TOKEN}/sendMessage`
4. Réponse : `{ success: true }` ou erreur 400/500

**Sécurité :**
- `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` en variables d'env Vercel (jamais exposées client)
- Rate limiting : non implémenté côté Edge pour le MVP (volume local faible) — à ajouter via Upstash Redis si besoin en V2
- Validation stricte Zod — rejection 400 si payload invalide

---

## 9. Sécurité & Conformité LPD/RGPD

| Risque | Mitigation |
|--------|-----------|
| XSS dans les bulles de chat | DOMPurify sur tout `innerHTML` — préférer `textContent` |
| Token Telegram exposé | Jamais côté client — Edge API route uniquement |
| Stockage de PII | Aucun nom, email, adresse — localStorage = `{consentGiven, technology, fai}` uniquement |
| Consentement | Case explicite en Phase 1, bloquante si non cochée |
| Secrets en clair | `.env.local` pour dev, variables Vercel pour prod — jamais dans le code |
| CSP | Headers Next.js : `Content-Security-Policy` restrictif |

---

## 10. Contexte Telegram vs Standalone

```typescript
// hooks/useTelegramContext.ts
const isTMA = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData

// En TMA :
// - WebApp.expand() au montage pour plein écran
// - WebApp.setHeaderColor('#0a1628')
// - WebApp.MainButton pour le CTA principal (optionnel, Phase 2+)

// En standalone :
// - Layout plein viewport (100dvh)
// - Pas de dépendance Telegram
```

Les deux contextes partagent **100% de la logique métier**. Seule la présentation du header et du bouton principal diffèrent.

---

## 11. PWA

- `next-pwa` avec `skipWaiting()` + `clientsClaim()` (voir règle globale)
- `manifest.json` : `name: "HomeCare IT"`, `theme_color: "#0a1628"`, icône 512×512
- Installable sur iOS et Android depuis le navigateur

---

## 12. Composants shadcn/ui requis

| Composant | Usage |
|-----------|-------|
| `Button` | Boutons de réponse rapide, CTA onboarding, CTA upsell |
| `Card` | Card upsell "Pack Annuel Tranquillité" |
| `Checkbox` | Consentement RGPD/LPD |
| `Badge` | Label "Offre recommandée" sur la card |
| `ScrollArea` | Zone de chat scrollable |
| `Separator` | Séparateurs visuels (ex: "ou" entre options de paiement) |

---

## 13. Variables d'environnement

```bash
# .env.local
TELEGRAM_BOT_TOKEN=         # Token du bot HomeCare IT
TELEGRAM_CHAT_ID=           # Chat ID du technicien (votre compte Telegram)
NEXT_PUBLIC_APP_URL=        # URL de l'app (pour les redirects TMA)
```

---

## 14. Hors scope (MVP)

- Authentification utilisateur
- Base de données (aucune persistance serveur)
- Paiement TWINT réel (intégration Twint API)
- Dashboard admin
- Multilingue (FR uniquement)
- Arbres de décision pour tous les FAI (Swisscom en priorité, autres à compléter)

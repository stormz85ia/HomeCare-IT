import type { Checklist, FAI, Technology } from '@/types'

export const checklists: Checklist[] = [
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
        ],
      },
      q2: {
        id: 'q2',
        question: 'Les voyants de votre box Swisscom sont-ils allumés ?',
        options: [
          { label: '✅ Oui, tous allumés', next: 'q3' },
          { label: '⚠️ Partiellement allumés', next: 'q_partial' },
          { label: '❌ Éteints ou rouges', next: 'q_reboot' },
        ],
      },
      q3: {
        id: 'q3',
        question: 'Vos appareils sont-ils connectés au Wi-Fi ou par câble ?',
        options: [
          { label: 'Oui, connectés', next: 'q_cable_check' },
          { label: 'Je ne sais pas', next: 'q_cable_check' },
        ],
      },
      q_cable_check: {
        id: 'q_cable_check',
        question: 'Branchez votre ordinateur directement à la box par câble Ethernet. La connexion fonctionne-t-elle ?',
        options: [
          { label: 'Oui, ça marche en câble', next: 'RESOLVED' },
          { label: 'Non, toujours pas', next: 'ESCALATE' },
        ],
      },
      q_partial: {
        id: 'q_partial',
        question: 'Le voyant "Internet" (globe ou @) est-il éteint ou rouge ?',
        options: [
          { label: 'Oui, éteint ou rouge', next: 'q_reboot' },
          { label: 'Il est allumé', next: 'q3' },
        ],
      },
      q_reboot: {
        id: 'q_reboot',
        question: 'Débranchez votre box 30 secondes, puis rebranchez-la. Attendez 2 minutes. La connexion est-elle rétablie ?',
        options: [
          { label: '✅ Oui, connexion rétablie', next: 'RESOLVED' },
          { label: '❌ Non, toujours éteints', next: 'q_line_check' },
        ],
      },
      q_line_check: {
        id: 'q_line_check',
        question: 'Y a-t-il des travaux dans votre quartier ou une panne signalée sur myswisscom.ch ?',
        options: [
          { label: 'Oui, panne signalée', next: 'RESOLVED' },
          { label: 'Non, rien de signalé', next: 'ESCALATE' },
        ],
      },
      q_slow: {
        id: 'q_slow',
        question: 'Votre connexion est-elle lente sur tous vos appareils ou seulement sur un ?',
        options: [
          { label: 'Sur tous les appareils', next: 'q_slow_all' },
          { label: 'Sur un seul appareil', next: 'RESOLVED' },
        ],
      },
      q_slow_all: {
        id: 'q_slow_all',
        question: 'Redémarrez votre box (débranchez 30s). La vitesse s\'améliore-t-elle ?',
        options: [
          { label: 'Oui, c\'est mieux', next: 'RESOLVED' },
          { label: 'Non, toujours lent', next: 'ESCALATE' },
        ],
      },
    },
  },
  {
    fai: 'autre',
    technology: 'vdsl',
    entry: 'q1',
    nodes: {
      q1: {
        id: 'q1',
        question: 'Votre connexion est-elle totalement coupée ou simplement lente ?',
        options: [
          { label: 'Totalement coupée', next: 'q_reboot' },
          { label: 'Simplement lente', next: 'q_slow' },
        ],
      },
      q_reboot: {
        id: 'q_reboot',
        question: 'Débranchez votre box 30 secondes, puis rebranchez-la. La connexion revient-elle ?',
        options: [
          { label: 'Oui, connexion rétablie', next: 'RESOLVED' },
          { label: 'Non, toujours hors ligne', next: 'ESCALATE' },
        ],
      },
      q_slow: {
        id: 'q_slow',
        question: 'Le problème de lenteur concerne-t-il tous vos appareils ?',
        options: [
          { label: 'Oui, tous', next: 'q_reboot' },
          { label: 'Non, un seul', next: 'RESOLVED' },
        ],
      },
    },
  },
]

export function getChecklist(fai: FAI, technology: Technology): Checklist | null {
  const exact = checklists.find((c) => c.fai === fai && c.technology === technology)
  if (exact) return exact
  const fallback = checklists.find((c) => c.fai === 'autre' && c.technology === technology)
  if (fallback) return fallback
  return checklists.find((c) => c.fai === 'autre') ?? null
}

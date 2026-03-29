// types/index.ts

export type FAI = 'swisscom' | 'salt' | 'sunrise' | 'netplus' | 'autre'
export type Technology = 'fibre_oto' | 'vdsl' | 'cable'
export type Phase = 'onboarding' | 'diagnostic' | 'upsell' | 'payment'
export type PaymentMethod = 'twint' | 'on_site' | 'on_site_no_pack'

/** 'RESOLVED' | 'ESCALATE' | '<node_id>' */
export type NodeResult = string

export interface DiagnosticOption {
  /** Text displayed in the quick reply button */
  label: string
  /** Next node id, or 'RESOLVED' / 'ESCALATE' */
  next: NodeResult
}

export interface DiagnosticNode {
  id: string
  /** Bot question displayed in a chat bubble */
  question: string
  options: DiagnosticOption[]
}

export interface Checklist {
  fai: FAI
  technology: Technology
  /** ID of the entry node */
  entry: string
  nodes: Record<string, DiagnosticNode>
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: number
}

export interface NotifyPayload {
  technology: Technology
  fai: FAI
  /** Human-readable Q→A pairs joined by ' | ' */
  summary: string
  paymentMethod: PaymentMethod
}

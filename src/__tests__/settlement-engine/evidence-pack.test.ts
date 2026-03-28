/**
 * Evidence Pack — Unit Tests (US-20.3)
 *
 * AC-1  Section shows only when pathway = EE (FSW/FSTP) or study-permit
 * AC-2  EE pack contains exactly 6 bank letter items
 * AC-3  Document naming convention block present for EE pack
 * AC-4  Source citation links to IRCC canada.ca page
 * AC-5  Study permit pack contains exactly 6 different items
 */

import { generateEvidencePack } from '@/lib/settlement-engine/consultant-advisory'

describe('generateEvidencePack', () => {

  // ── Express Entry FSW ─────────────────────────────────────────────────────

  describe('express-entry-fsw', () => {
    const pack = generateEvidencePack('express-entry-fsw')

    it('AC-1: returns items (not null) for FSW', () => {
      expect(pack.items).not.toBeNull()
    })

    it('AC-2: contains exactly 6 bank letter requirements', () => {
      expect(pack.items).toHaveLength(6)
    })

    it('AC-2: includes account holder name item', () => {
      expect(pack.items!.some(i => i.key === 'holder-name')).toBe(true)
    })

    it('AC-2: includes account numbers item', () => {
      expect(pack.items!.some(i => i.key === 'account-numbers')).toBe(true)
    })

    it('AC-2: includes open-dates item', () => {
      expect(pack.items!.some(i => i.key === 'open-dates')).toBe(true)
    })

    it('AC-2: includes current balance item', () => {
      expect(pack.items!.some(i => i.key === 'current-balance')).toBe(true)
    })

    it('AC-2: includes 6-month average balance item', () => {
      expect(pack.items!.some(i => i.key === 'avg-balance')).toBe(true)
    })

    it('AC-2: includes outstanding debts item', () => {
      expect(pack.items!.some(i => i.key === 'outstanding-debts')).toBe(true)
    })

    it('AC-3: naming convention block is present and has 3 entries', () => {
      expect(pack.namingConvention).not.toBeNull()
      expect(pack.namingConvention).toHaveLength(3)
    })

    it('AC-3: naming convention includes BankLetter pattern', () => {
      expect(pack.namingConvention!.some(l => l.includes('BankLetter'))).toBe(true)
    })

    it('AC-4: source URL links to canada.ca', () => {
      expect(pack.sourceUrl).toContain('canada.ca')
    })

    it('AC-4: source label is non-empty', () => {
      expect(pack.sourceLabel.length).toBeGreaterThan(0)
    })

    it('each item has a unique key', () => {
      const keys = pack.items!.map(i => i.key)
      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  // ── Express Entry FSTP ────────────────────────────────────────────────────

  describe('express-entry-fstp', () => {
    const pack = generateEvidencePack('express-entry-fstp')

    it('AC-1: returns items (not null) for FSTP', () => {
      expect(pack.items).not.toBeNull()
    })

    it('AC-2: contains exactly 6 items', () => {
      expect(pack.items).toHaveLength(6)
    })

    it('returns same 6 items as FSW', () => {
      const fswPack  = generateEvidencePack('express-entry-fsw')
      const fstpPack = generateEvidencePack('express-entry-fstp')
      expect(fstpPack.items!.map(i => i.key)).toEqual(fswPack.items!.map(i => i.key))
    })
  })

  // ── Study Permit ──────────────────────────────────────────────────────────

  describe('study-permit', () => {
    const pack = generateEvidencePack('study-permit')

    it('AC-1: returns items (not null) for study-permit', () => {
      expect(pack.items).not.toBeNull()
    })

    it('AC-5: contains exactly 6 items', () => {
      expect(pack.items).toHaveLength(6)
    })

    it('AC-5: includes bank-statements item', () => {
      expect(pack.items!.some(i => i.key === 'bank-statements')).toBe(true)
    })

    it('AC-5: includes GIC certificate item', () => {
      expect(pack.items!.some(i => i.key === 'gic-certificate')).toBe(true)
    })

    it('AC-5: includes scholarship item', () => {
      expect(pack.items!.some(i => i.key === 'scholarship')).toBe(true)
    })

    it('AC-5: includes loan-approval item', () => {
      expect(pack.items!.some(i => i.key === 'loan-approval')).toBe(true)
    })

    it('AC-5: includes tuition-receipt item', () => {
      expect(pack.items!.some(i => i.key === 'tuition-receipt')).toBe(true)
    })

    it('AC-5: includes housing-proof item', () => {
      expect(pack.items!.some(i => i.key === 'housing-proof')).toBe(true)
    })

    it('AC-5: items are different from EE items', () => {
      const eePack = generateEvidencePack('express-entry-fsw')
      const eeKeys = new Set(eePack.items!.map(i => i.key))
      const spKeys = pack.items!.map(i => i.key)
      // No study permit key should appear in EE pack
      expect(spKeys.some(k => eeKeys.has(k))).toBe(false)
    })

    it('AC-4: source URL links to canada.ca', () => {
      expect(pack.sourceUrl).toContain('canada.ca')
    })

    it('naming convention is present', () => {
      expect(pack.namingConvention).not.toBeNull()
      expect(pack.namingConvention!.length).toBeGreaterThan(0)
    })
  })

  // ── Exempt / non-applicable pathways ─────────────────────────────────────

  describe('pathways that do not require proof of funds', () => {
    const exemptPathways = [
      'express-entry-cec',
      'work-permit',
      'family-sponsorship',
      'pnp',
      'other',
    ]

    it.each(exemptPathways)('AC-1: %s returns null items (section hidden)', (pathway) => {
      const pack = generateEvidencePack(pathway)
      expect(pack.items).toBeNull()
    })

    it.each(exemptPathways)('AC-1: %s returns null naming convention', (pathway) => {
      const pack = generateEvidencePack(pathway)
      expect(pack.namingConvention).toBeNull()
    })
  })
})

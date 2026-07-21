/**
 * Repair source files whose UTF-8 was round-tripped through CP1252 — the result
 * of editing them with PowerShell's Get-Content/Set-Content on Windows
 * PowerShell 5.1. Do not edit source with PowerShell; this is the cleanup.
 *
 *   node scripts/fix-encoding.mjs <file...>
 */
import fs from 'node:fs'

const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
}
const toByte = (cp) => (cp < 0x100 ? cp : CP1252_HIGH[cp])

for (const file of process.argv.slice(2)) {
  const chars = [...fs.readFileSync(file, 'utf8')]
  let out = ''
  let i = 0
  let repaired = 0

  while (i < chars.length) {
    if (chars[i] === 'â' || chars[i] === 'Ã' || chars[i] === 'Â') {
      let j = i
      const bytes = []
      while (j < chars.length) {
        const b = toByte(chars[j].codePointAt(0))
        if (b === undefined) break
        bytes.push(b)
        j++
      }
      const decoded = Buffer.from(bytes).toString('utf8')
      if (!decoded.includes('�')) {
        out += decoded
        repaired += j - i
        i = j
        continue
      }
    }
    out += chars[i]
    i++
  }

  fs.writeFileSync(file, out, 'utf8')
  console.log(`${file}: repaired ${repaired} · clean: ${!/[âÃÂ]/.test(out)}`)
}

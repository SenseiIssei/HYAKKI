import { TREE, TRUNKS, type TreeNode } from '../content/tree'
import { BALANCE as B } from '../content/balance'
import { fmt, fmtInt } from '../format'
import {
  buyTree,
  doRecant,
  game,
  treeBuyCount,
  treeCost,
  useUI,
} from '../store/gameStore'

function nextKeystone(node: TreeNode, level: number) {
  return node.keystones.find((k) => k.level > level)
}

function NodeCard({ node }: { node: TreeNode }) {
  const g = game()
  const buyMode = useUI((s) => s.buyMode)
  const level = g.treeLevels[node.id] ?? 0
  const count = Math.max(1, treeBuyCount(node.id, buyMode))
  const cost = treeCost(node.id, count)
  const afford = g.ash.gte(cost) && treeBuyCount(node.id, buyMode) > 0
  const next = nextKeystone(node, level)
  const earned = node.keystones.filter((k) => level >= k.level)

  return (
    <div className="node">
      <div className="node-head">
        <span className="node-name">{node.label}</span>
        <span className="node-level">L{fmtInt(level)}</span>
      </div>
      <div className="node-blurb">{node.blurb} per level</div>

      <div className="pips">
        {node.keystones.map((k) => (
          <span
            key={k.id}
            className={`pip ${level >= k.level ? 'on' : ''}`}
            title={`L${k.level} — ${k.text}`}
          />
        ))}
      </div>

      {next ? (
        <div className="node-key">
          <span className="node-key-at">Keystone at L{next.level}</span>
          <span className="node-key-text">{next.text}</span>
        </div>
      ) : (
        <div className="node-key">
          <span className="node-key-at">All keystones held</span>
        </div>
      )}

      {earned.length > 0 && (
        <details className="node-earned">
          <summary>{earned.length} held</summary>
          {earned.map((k) => (
            <div key={k.id} className="node-earned-line">
              L{k.level} · {k.text}
            </div>
          ))}
        </details>
      )}

      <button
        className="node-buy"
        disabled={!afford}
        aria-label={`Buy ${node.label}${count > 1 ? ` times ${count}` : ''} for ${fmt(cost)} ash`}
        onClick={() => buyTree(node.id, buyMode)}
      >
        <span>{count > 1 ? `BUY ×${count}` : 'BUY'}</span>
        <span className={afford ? 'afford' : 'poor'}>◈ {fmt(cost)}</span>
      </button>
    </div>
  )
}

export function Tree() {
  useUI((s) => s.frame)
  const g = game()
  const close = useUI((s) => s.setTree)
  const buyMode = useUI((s) => s.buyMode)
  const setBuyMode = useUI((s) => s.setBuyMode)

  // OMEN is hidden until relics exist. A node that does nothing is worse than
  // a node that isn't there yet.
  const visible = TREE.filter((n) => !n.requires)

  return (
    <div className="drawer-scrim" onClick={() => close(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>The Cairn</h2>
            <span className="drawer-sub">
              what the stones were for ·{' '}
              {fmtInt(Object.values(g.treeLevels).reduce((a, b) => a + b, 0))} stones set
            </span>
          </div>
          <div className="drawer-head-right">
            <span className="ash-total">◈ {fmt(g.ash)}</span>
            <span className="buymode">
              {([1, 10, 'max'] as const).map((m) => (
                <button key={String(m)} data-on={buyMode === m} onClick={() => setBuyMode(m)}>
                  {m === 'max' ? 'MAX' : `×${m}`}
                </button>
              ))}
            </span>
            <button className="small-btn" onClick={() => close(false)}>
              Close
            </button>
          </div>
        </header>

        <div className="trunks">
          {TRUNKS.map((t) => (
            <section key={t.id} className="trunk">
              <div className="trunk-head">
                <span className="trunk-name">
                  <span className="kanji">{t.kanji}</span> {t.label}
                </span>
                <span className="trunk-blurb">{t.blurb}</span>
              </div>
              {visible
                .filter((n) => n.trunk === t.id)
                .map((n) => (
                  <NodeCard key={n.id} node={n} />
                ))}
            </section>
          ))}
        </div>

        <footer className="drawer-foot">
          <span className="hint">
            Every node has infinite levels at ×{B.TREE_NODE_SCALE} per level. A keystone every{' '}
            {B.KEYSTONE_EVERY}.
          </span>
          <button
            className="small-btn danger"
            onClick={() => {
              if (confirm('Recant? Every level is unmade and every Ash returned. The run restarts.'))
                doRecant()
            }}
          >
            Recant — refund all
          </button>
        </footer>
      </div>
    </div>
  )
}

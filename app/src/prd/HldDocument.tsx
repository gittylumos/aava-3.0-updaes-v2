/* The Sample I/O document for the HLD Architecture Builder — what a run of the
 * golden process takes in and what it produces. Opened as a tab in the agent
 * workspace, alongside the Canvas. A hand-built document (not markdown) because
 * the output carries C4 diagram blocks the plain renderer can't draw. */

/* A section heading with a small index. */
function H({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
      <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-[10px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{n}</span>
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[12.5px] leading-[1.65]" style={{ color: 'var(--text-dim)' }}>{children}</p>
}

/* A boxed C4 diagram — a titled frame around an inline SVG so the three C4
   levels read as one family. */
function C4Frame({ level, title, children }: { level: string; title: string; children: React.ReactNode }) {
  return (
    <figure className="my-3 overflow-hidden rounded-[var(--r-md)]" style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}>
      <figcaption className="flex items-center gap-2 px-3 py-2 text-[11px]" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
        <span className="rounded-full px-2 py-[1px] text-[9.5px] font-bold uppercase tracking-[.06em]" style={{ background: 'color-mix(in srgb, var(--zone-canvas-accent) 18%, transparent)', color: 'var(--zone-canvas-accent)' }}>{level}</span>
        <span className="font-medium" style={{ color: 'var(--text-dim)' }}>{title}</span>
      </figcaption>
      <div className="overflow-x-auto p-3">{children}</div>
    </figure>
  )
}

/* C4 box + label helpers, drawn to one small coordinate scale. */
const box = (x: number, y: number, w: number, h: number, fill: string, stroke: string) => (
  <rect x={x} y={y} width={w} height={h} rx={7} fill={fill} stroke={stroke} strokeWidth={1.2} />
)
function C4Label({ x, y, name, sub }: { x: number; y: number; name: string; sub?: string }) {
  return (
    <>
      <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{name}</text>
      {sub && <text x={x} y={y + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{sub}</text>}
    </>
  )
}
const arrow = (d: string) => <path d={d} fill="none" stroke="var(--muted-deep)" strokeWidth={1.2} strokeDasharray="4 3" markerEnd="url(#c4arrow)" />

function Arrowhead() {
  return (
    <defs>
      <marker id="c4arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-deep)" />
      </marker>
    </defs>
  )
}

export function HldDocument() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--slab-raised)' }}>
      <div className="mx-auto max-w-[720px] px-6 py-6">
        {/* Title block */}
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: 'var(--muted-deep)' }}>
          <span className="rounded-full px-2 py-[2px]" style={{ background: 'var(--wash-3)', color: 'var(--zone-canvas-accent)' }}>Sample Run</span>
          HLD Architecture Builder · v2.1
        </div>
        <h2 className="text-[19px] font-bold tracking-[-.01em]" style={{ color: 'var(--text)' }}>High-Level Design — Checkout Payments Service</h2>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>A representative run: the input brief the process consumes, and the HLD it drafts.</p>

        {/* INPUT */}
        <div className="mt-5 rounded-[var(--r-md)] p-3.5" style={{ background: 'var(--wash-1)', border: '1px solid var(--glass-line-soft)' }}>
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--ok)' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            Input · Requirement brief
          </div>
          <P>“Design an HLD for a new <strong style={{ color: 'var(--text-dim)' }}>checkout payments service</strong> that authorises card payments, supports Apple/Google Pay, and emits events for the billing and analytics pipelines. It must sustain 1,200 req/s at p99 &lt; 250 ms and fail closed on the payment gateway.”</P>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {['Card auth', 'Wallets', 'Event stream', '1,200 req/s', 'p99 < 250 ms', 'Fail-closed'].map((t) => (
              <span key={t} className="mono rounded-[6px] px-1.5 py-[2px] text-[10.5px]" style={{ background: 'var(--wash-2)', color: 'var(--muted)' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* OUTPUT */}
        <div className="mt-6 mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.1em]" style={{ color: 'var(--zone-canvas-accent)' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          Output · Drafted HLD
        </div>

        <H n="1">Overview</H>
        <P>The Checkout Payments Service is a stateless authorisation gateway fronting the card processor and wallet providers. It exposes a synchronous authorise/capture API to the checkout front-end and publishes domain events (<span className="mono">payment.authorised</span>, <span className="mono">payment.failed</span>) to the shared event bus for billing reconciliation and analytics.</P>

        <H n="2">Architecture Analysis</H>
        <P>Traffic is read-light and write-heavy with a hard latency budget, so the design favours a thin stateless service, an idempotency store keyed on the client token, and an async fan-out for downstream consumers. The payment gateway is the only hard external dependency; a circuit breaker fails closed to avoid double-charges.</P>

        <H n="3">C4 Diagrams</H>
        <C4Frame level="Level 1" title="System Context">
          <svg viewBox="0 0 520 150" width="520" height="150" role="img" aria-label="C4 system context diagram">
            <Arrowhead />
            {box(20, 55, 90, 44, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={65} y={73} name="Shopper" sub="Person" />
            {box(210, 45, 110, 60, 'color-mix(in srgb, var(--zone-canvas-accent) 16%, var(--slab))', 'var(--zone-canvas-accent)')}
            <C4Label x={265} y={72} name="Payments Svc" sub="This system" />
            {box(410, 20, 92, 44, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={456} y={38} name="Card Gateway" sub="External" />
            {box(410, 90, 92, 44, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={456} y={108} name="Event Bus" sub="External" />
            {arrow('M112 77 L206 76')}
            {arrow('M322 66 L406 46')}
            {arrow('M322 84 L406 108')}
          </svg>
        </C4Frame>
        <C4Frame level="Level 2" title="Containers">
          <svg viewBox="0 0 520 160" width="520" height="160" role="img" aria-label="C4 container diagram">
            <Arrowhead />
            {box(20, 60, 96, 46, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={68} y={79} name="Web App" sub="Checkout UI" />
            {box(170, 30, 104, 46, 'color-mix(in srgb, var(--zone-canvas-accent) 16%, var(--slab))', 'var(--zone-canvas-accent)')}
            <C4Label x={222} y={49} name="Auth API" sub="Node · REST" />
            {box(170, 96, 104, 46, 'color-mix(in srgb, var(--zone-canvas-accent) 16%, var(--slab))', 'var(--zone-canvas-accent)')}
            <C4Label x={222} y={115} name="Ledger Worker" sub="consumer" />
            {box(330, 30, 96, 46, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={378} y={49} name="Idempotency" sub="Redis" />
            {box(330, 96, 96, 46, 'var(--wash-3)', 'var(--glass-line)')}
            <C4Label x={378} y={115} name="Payments DB" sub="Postgres" />
            {arrow('M118 80 L168 55')}
            {arrow('M274 53 L328 53')}
            {arrow('M274 119 L328 119')}
            {arrow('M222 78 L222 94')}
          </svg>
        </C4Frame>
        <C4Frame level="Level 3" title="Auth API — Components">
          <svg viewBox="0 0 520 130" width="520" height="130" role="img" aria-label="C4 component diagram">
            <Arrowhead />
            {box(16, 48, 96, 44, 'color-mix(in srgb, var(--brand) 14%, var(--slab))', 'var(--brand)')}
            <C4Label x={64} y={66} name="Controller" sub="/authorise" />
            {box(160, 48, 96, 44, 'color-mix(in srgb, var(--brand) 14%, var(--slab))', 'var(--brand)')}
            <C4Label x={208} y={66} name="Auth Service" sub="orchestration" />
            {box(304, 14, 96, 44, 'color-mix(in srgb, var(--brand) 14%, var(--slab))', 'var(--brand)')}
            <C4Label x={352} y={32} name="Gateway Client" sub="circuit breaker" />
            {box(304, 80, 96, 44, 'color-mix(in srgb, var(--brand) 14%, var(--slab))', 'var(--brand)')}
            <C4Label x={352} y={98} name="Event Emitter" />
            {arrow('M114 70 L158 70')}
            {arrow('M256 62 L302 40')}
            {arrow('M256 78 L302 100')}
          </svg>
        </C4Frame>

        <H n="4">API Contract</H>
        <pre className="overflow-x-auto rounded-[var(--r-md)] p-3 text-[11.5px] leading-[1.6]" style={{ background: 'var(--code-bg)', border: '1px solid var(--glass-line-soft)', color: '#CBD5E1' }}>
{`POST /api/v1/payments/authorise
Idempotency-Key: <client token>
{
  "amount": 4200, "currency": "USD",
  "method": "card" | "apple_pay" | "google_pay",
  "instrument": { ... }
}
→ 201 { "id": "pay_…", "status": "authorised", "authCode": "…" }
→ 402 { "status": "failed", "reason": "gateway_declined" }`}
        </pre>

        <H n="5">Design Review</H>
        <P>Fails closed on gateway timeout; idempotency guarantees exactly-once authorise per token; events are published after commit. Open question flagged for the architect: retention window for the idempotency store under the 1,200 req/s peak.</P>

        <div className="mt-6 border-t pt-3 text-[10.5px]" style={{ borderColor: 'var(--glass-line-soft)', color: 'var(--muted-deep)' }}>
          Generated by HLD Architecture Builder v2.1 · sample run · read-only
        </div>
      </div>
    </div>
  )
}

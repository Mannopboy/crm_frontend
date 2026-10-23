import React from "react";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

// Grafiklar uchun umumiy ranglar (indigo, zumrad, sariq, osmon, qizil, binafsha, ...)
export const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#8b5cf6", "#14b8a6", "#64748b", "#ec4899", "#84cc16"];

export const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

// ▲ / ▼ — o'tgan davrga nisbatan o'zgarish
export function Delta({ now, prev, invert = false }) {
    if (prev === null || prev === undefined || now === null || now === undefined) return null;
    if (!prev && !now) return <span className="ost-delta ost-delta--flat">o'zgarishsiz</span>;
    if (!prev) return <span className="ost-delta ost-delta--up">yangi</span>;
    const pct = Math.round(((now - prev) / prev) * 100);
    if (pct === 0) return <span className="ost-delta ost-delta--flat">o'zgarishsiz</span>;
    const good = invert ? pct < 0 : pct > 0;
    const Icon = pct > 0 ? TrendingUp : TrendingDown;
    return (
        <span className={`ost-delta ${good ? "ost-delta--up" : "ost-delta--down"}`} title={`O'tgan davrda: ${prev}`}>
            <Icon size={12} /> {pct > 0 ? "+" : ""}{pct}%
        </span>
    );
}

export function KpiCard({ icon: Icon, label, value, color, delta, hint }) {
    return (
        <div className="ost-kpi" style={{ "--accent": color }}>
            <div className="ost-kpi__icon"><Icon size={20} /></div>
            <div className="ost-kpi__body">
                <div className="ost-kpi__label">{label}</div>
                <div className="ost-kpi__value">{value ?? "—"}</div>
                <div className="ost-kpi__foot">
                    {delta}
                    {hint && <span className="ost-kpi__hint">{hint}</span>}
                </div>
            </div>
        </div>
    );
}

export function Panel({ icon: Icon, title, note, color = "#6366f1", className = "", aside, children }) {
    return (
        <section className={`ost-panel ${className}`} style={{ "--accent": color }}>
            <header className="ost-panel__head">
                {Icon && <span className="ost-panel__icon"><Icon size={18} /></span>}
                <div className="ost-panel__titles">
                    <h2 className="ost-panel__title">{title}</h2>
                    {note && <p className="ost-panel__note">{note}</p>}
                </div>
                {aside && <div className="ost-panel__aside">{aside}</div>}
            </header>
            {children}
        </section>
    );
}

// Torayib boruvchi voronka: har bosqich — lead'lardan ulush va oldingi bosqichdan o'tish foizi
export function Funnel({ stages }) {
    const total = stages[0]?.count || 0;
    if (!total) return <p className="ost-empty">Bu davrda lead yo'q</p>;
    return (
        <div className="ost-funnel">
            {stages.map((s, i) => {
                const width = Math.max(16, (s.count / total) * 100);
                const prev = i > 0 ? stages[i - 1].count : null;
                return (
                    <React.Fragment key={s.key}>
                        {i > 0 && (
                            <div className="ost-funnel__step">
                                <ArrowRight size={12} /> {prev ? Math.round((s.count / prev) * 100) : 0}% o'tdi
                            </div>
                        )}
                        <div className="ost-funnel__row">
                            <div className="ost-funnel__bar" style={{ width: `${width}%`, background: PALETTE[i % PALETTE.length] }}>
                                <span className="ost-funnel__count">{s.count}</span>
                            </div>
                            <div className="ost-funnel__label">
                                {s.name} <small>{s.rate}%</small>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// Bitta chiziq — ulushlar segmentlarda, ostida rangli izoh
export function StackedBar({ items, colorOf }) {
    const total = items.reduce((a, i) => a + i.count, 0);
    if (!total) return <p className="ost-empty">Ma'lumot yo'q</p>;
    return (
        <div className="ost-stack">
            <div className="ost-stack__bar">
                {items.filter((i) => i.count).map((i, idx) => (
                    <span
                        key={i.name}
                        title={`${i.name}: ${i.count}`}
                        style={{ width: `${(i.count / total) * 100}%`, background: colorOf(i, idx) }}
                    />
                ))}
            </div>
            <div className="ost-stack__legend">
                {items.map((i, idx) => (
                    <div key={i.name} className={`ost-stack__item ${i.count ? "" : "is-empty"}`}>
                        <span className="ost-dot" style={{ background: colorOf(i, idx) }} />
                        <span className="ost-stack__name" title={i.name}>{i.name}</span>
                        <strong>{i.count}</strong>
                        <small>{Math.round((i.count / total) * 100)}%</small>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Faollik xaritasi: hafta kuni × soat, rang to'qligi — qo'ng'iroqlar soni
export function Heatmap({ cells, max }) {
    return (
        <div className="ost-heat">
            <div className="ost-heat__grid">
                <span />
                {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} className="ost-heat__hour">{h % 3 === 0 ? h : ""}</span>
                ))}
                {cells.map((row, d) => (
                    <React.Fragment key={d}>
                        <span className="ost-heat__day">{WEEKDAYS[d]}</span>
                        {row.map((v, h) => (
                            <span
                                key={h}
                                className="ost-heat__cell"
                                title={`${WEEKDAYS[d]} ${String(h).padStart(2, "0")}:00 — ${v} ta qo'ng'iroq`}
                                style={{ background: v ? `rgba(99, 102, 241, ${0.15 + 0.85 * (v / (max || 1))})` : undefined }}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
            <div className="ost-heat__scale">
                kam <span className="ost-heat__ramp" /> ko'p
            </div>
        </div>
    );
}

// Siz va jamoa: ikki chiziq + eng yaxshi natija belgisi
export function CompareBars({ metrics }) {
    return (
        <div className="ost-compare">
            {metrics.map((m) => {
                const top = Math.max(m.me || 0, m.team_avg || 0, m.best || 0, 1);
                return (
                    <div key={m.key} className="ost-compare__row">
                        <div className="ost-compare__label">
                            {m.label}
                            {m.me != null && m.team_avg != null && m.me >= m.team_avg && m.me > 0 && (
                                <span className="ost-badge ost-badge--good">o'rtachadan yuqori</span>
                            )}
                        </div>
                        <div className="ost-compare__bars">
                            <div className="ost-compare__line">
                                <span className="ost-compare__who">Siz</span>
                                <span className="ost-compare__track">
                                    <span className="ost-compare__me" style={{ width: `${((m.me || 0) / top) * 100}%` }} />
                                    {m.best != null && <i className="ost-compare__best" style={{ left: `${(m.best / top) * 100}%` }} title={`Eng yaxshi: ${m.format(m.best)}`} />}
                                </span>
                                <strong>{m.me == null ? "—" : m.format(m.me)}</strong>
                            </div>
                            <div className="ost-compare__line">
                                <span className="ost-compare__who">Jamoa</span>
                                <span className="ost-compare__track">
                                    <span className="ost-compare__team" style={{ width: `${((m.team_avg || 0) / top) * 100}%` }} />
                                </span>
                                <span>{m.team_avg == null ? "—" : m.format(m.team_avg)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Yarim doira o'lchagich (0–100)
export function Gauge({ value, color = "#6366f1", label, sub }) {
    const data = [{ value: value ?? 0, fill: color }];
    return (
        <div className="ost-gauge">
            <ResponsiveContainer width="100%" height={150}>
                <RadialBarChart data={data} startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" cy="80%">
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" background={{ fill: "#eef2ff" }} cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="ost-gauge__center">
                <div className="ost-gauge__value" style={{ color }}>{label}</div>
                {sub && <div className="ost-gauge__sub">{sub}</div>}
            </div>
        </div>
    );
}

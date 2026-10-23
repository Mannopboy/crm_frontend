import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
    UserPlus, PhoneCall, FileCheck, DoorOpen, Percent, Clock, Activity, Trophy, Filter, Zap,
    Megaphone, ListChecks, AlarmClock, CalendarClock, Headphones, Users, ArrowLeftRight, Bot,
    TriangleAlert, Flame, Snowflake, ShieldAlert, Star,
} from "lucide-react";
import PeriodFilter from "../../pages/adminDashboard/components/PeriodFilter";
import { getMyStats, formatDuration } from "../../api/statsService";
import { CRITERIA_LABELS, scoreClass, scoreColor } from "../../api/aiService";
import {
    PALETTE, WEEKDAYS, Delta, KpiCard, Panel, Funnel, StackedBar, Heatmap, CompareBars, Gauge,
} from "./widgets";
import "../ai.css";
import "./operator-stats.css";

const PERIOD_TEXT = { today: "bugun", week: "shu hafta", month: "shu oy", all: "butun davr" };
const PREV_TEXT = { today: "kechaga", week: "o'tgan haftaga", month: "o'tgan oyga" };

const ACTION_LABELS = {
    create: "Lead yaratildi",
    status_change: "Status o'zgartirildi",
    call: "Qo'ng'iroq",
    contract: "Shartnoma",
    uncontract: "Shartnoma bekor qilindi",
    come: "«Keldi» belgisi",
    transfer: "Boshqa operatorga o'tkazildi",
    delete: "O'chirildi",
    comment: "Izoh",
    temperature: "Issiq/sovuq belgisi",
    sla_breach: "SLA buzilishi",
    import: "Import",
};

const STATUS_COLORS = {
    "Yangi": "#6366f1",
    "Telifon o’chiq / Ko'tarmadi": "#94a3b8",
    "Hozir vaqtim yo'q": "#f59e0b",
    "Keladi": "#10b981",
    "O'ylab ko'radi": "#8b5cf6",
    "Shartnoma qiladi": "#14b8a6",
    "Sifatsiz": "#f43f5e",
};

const ATS_STATUS = {
    Success: { label: "Javob berildi", color: "#10b981" },
    missed: { label: "Javobsiz", color: "#f43f5e" },
    Busy: { label: "Band", color: "#f59e0b" },
    Cancel: { label: "Bekor qilindi", color: "#94a3b8" },
    NotAvailable: { label: "Mavjud emas", color: "#8b5cf6" },
    NotFound: { label: "Topilmadi", color: "#64748b" },
};

const TEAM_LABELS = {
    calls: ["Qo'ng'iroqlar", (v) => Math.round(v)],
    new_leads: ["Yangi leadlar", (v) => Math.round(v)],
    contracts: ["Shartnomalar", (v) => Math.round(v * 10) / 10],
    conversion_rate: ["Konversiya", (v) => `${Math.round(v * 10) / 10}%`],
    talk_time_sec: ["Suhbat vaqti", (v) => formatDuration(v)],
    ai_score: ["AI ball", (v) => Math.round(v * 10) / 10],
};

const LEAD_STATUS_LABELS = { hot: "🔥 Issiq", warm: "🌤 Iliq", cold: "❄️ Sovuq", unknown: "—" };
const SENTIMENT_LABELS = { positive: "🙂 Ijobiy", neutral: "😐 Neytral", negative: "🙁 Salbiy", unknown: "—" };

// KPI kartasi uchun qisqa: "1.6 soat" / "45 daq" (bir qatorga sig'sin)
function compactDuration(sec) {
    if (sec === null || sec === undefined) return "—";
    if (sec >= 3600) return `${Math.round((sec / 3600) * 10) / 10} soat`;
    return `${Math.round(sec / 60)} daq`;
}

function formatMinutes(min) {
    if (min === null || min === undefined) return "—";
    return formatDuration(min * 60);
}

function shortDate(iso) {
    if (!iso) return "—";
    const [, m, d] = iso.split("-");
    return `${d}.${m}`;
}

function initials(name = "") {
    return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

function Rank({ place, of }) {
    if (!place) return <span className="ost-rank ost-rank--none">—</span>;
    const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : `#${place}`;
    return <span className="ost-rank">{medal}<small> / {of}</small></span>;
}

// 📣 Lead manbalari: donut + jadval
function Sources({ sources }) {
    if (!sources.length) return <p className="ost-empty">Manbalar yo'q</p>;
    const sum = (key) => sources.reduce((acc, s) => acc + (s[key] || 0), 0);
    const total = sum("total");
    const totalContracts = sum("contracts");
    const colored = sources.map((s, i) => ({ ...s, color: PALETTE[i % PALETTE.length] }));
    const top = colored[0];
    return (
        <div className="ost-sources">
            <div className="ost-donut">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie data={colored.filter((s) => s.total)} dataKey="total" nameKey="name"
                             innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                            {colored.filter((s) => s.total).map((s) => <Cell key={s.name} fill={s.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} ta lead`, n]} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="ost-donut__center">
                    <strong>{total}</strong>
                    <span>lead</span>
                </div>
                {top?.total > 0 && (
                    <p className="ost-donut__caption">
                        Eng ko'p: <b style={{ color: top.color }}>{top.name}</b> — {Math.round((top.total / total) * 100)}%
                    </p>
                )}
            </div>
            <div className="ost-table-wrap">
                <table className="ost-table">
                    <thead>
                        <tr>
                            <th>Manba</th>
                            <th>Jami lead</th>
                            <th>Davrda yangi</th>
                            <th>Shartnoma</th>
                            <th>Keldi</th>
                            <th>Sifatsiz</th>
                            <th>Konversiya</th>
                        </tr>
                    </thead>
                    <tbody>
                        {colored.map((s) => (
                            <tr key={s.id ?? "none"} className={s.total ? "" : "ost-table__row--empty"}>
                                <td className="ost-table__name">
                                    <span className="ost-dot" style={{ background: s.color }} />{s.name}
                                </td>
                                <td>
                                    <div className="ost-table__share">
                                        <span className="ost-barlist__bar">
                                            <span style={{ width: `${total ? (s.total / total) * 100 : 0}%`, background: s.color }} />
                                        </span>
                                        <strong>{s.total}</strong>
                                        <small>{total ? Math.round((s.total / total) * 100) : 0}%</small>
                                    </div>
                                </td>
                                <td>{s.new}</td>
                                <td className="ost-table__green">{s.contracts}</td>
                                <td className="ost-table__blue">{s.came}</td>
                                <td className="ost-table__red">{s.bad}</td>
                                <td><span className="ost-pill">{s.conversion_rate}%</span></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Jami</td>
                            <td><strong>{total}</strong></td>
                            <td>{sum("new")}</td>
                            <td>{totalContracts}</td>
                            <td>{sum("came")}</td>
                            <td>{sum("bad")}</td>
                            <td>{total ? Math.round((totalContracts / total) * 1000) / 10 : 0}%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// 📊 Operatorning to'liq statistikasi. `userId` berilsa — admin boshqa operatorni ko'radi.
export default function OperatorStats({ userId = null }) {
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getMyStats(period, userId);
            if (!cancelled) {
                setData(res);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period, userId]);

    const hero = (
        <div className="ost-hero">
            <div className="ost-hero__who">
                <div className="ost-hero__avatar">{initials(data?.operator?.name)}</div>
                <div>
                    <h1 className="ost-hero__name">{data?.operator?.name || "Statistika"}</h1>
                    <p className="ost-hero__meta">
                        {data?.operator?.system ? `${data.operator.system} · ` : ""}
                        Davr: {PERIOD_TEXT[period]}
                        {data?.rank?.operators ? ` · ${data.rank.operators} ta operator` : ""}
                    </p>
                </div>
            </div>
            <div className="ost-hero__side">
                {data?.rank && (
                    <div className="ost-hero__ranks">
                        <span className="ost-hero__chip"><PhoneCall size={14} /> Qo'ng'iroq: <Rank place={data.rank.by_calls} of={data.rank.operators} /></span>
                        <span className="ost-hero__chip"><FileCheck size={14} /> Shartnoma: <Rank place={data.rank.by_contracts} of={data.rank.operators} /></span>
                    </div>
                )}
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>
        </div>
    );

    if (loading && !data) return <div className="ost">{hero}<p className="ost-empty">⏳ Yuklanmoqda...</p></div>;
    if (!data) return <div className="ost">{hero}<p className="ost-empty">Statistikani yuklab bo'lmadi</p></div>;

    const { pipeline, period_stats: ps, activity, calls, ats, ai } = data;
    const cur = data.compare?.current || {};
    const prev = data.compare?.previous || null;
    const d = (key, invert) => prev && <Delta now={cur[key]} prev={prev[key]} invert={invert} />;
    const prevHint = prev ? `${PREV_TEXT[period]} nisbatan` : null;

    const chartData = (data.daily || []).map((x) => ({ ...x, day: shortDate(x.date) }));
    const statuses = (pipeline.by_status || []).map((s) => ({ name: s.name, count: s.count }));
    const temperature = [
        { name: "Issiq", count: pipeline.temperature?.issiq || 0, color: "#f97316" },
        { name: "Sovuq", count: pipeline.temperature?.sovuq || 0, color: "#38bdf8" },
        { name: "Belgilanmagan", count: pipeline.temperature?.none || 0, color: "#cbd5e1" },
    ];
    const actions = Object.entries(activity.by_action || {})
        .map(([k, v]) => ({ key: k, name: ACTION_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count);
    const atsStatuses = (ats.statuses || []).map((s) => ({
        name: ATS_STATUS[s.status]?.label || s.status,
        count: s.count,
        color: ATS_STATUS[s.status]?.color,
    }));
    const answeredRate = ats.total ? Math.round((ats.answered / ats.total) * 100) : 0;
    const team = (data.team?.metrics || []).map((m) => ({
        ...m, label: TEAM_LABELS[m.key]?.[0] || m.key, format: TEAM_LABELS[m.key]?.[1] || ((v) => v),
    }));
    const radar = Object.entries(ai.criteria_avg || {}).map(([key, avg]) => ({
        criterion: CRITERIA_LABELS[key] || key,
        value: Math.round((avg / (ai.criteria_max?.[key] || 1)) * 100),
    }));
    const speed = data.speed;
    const heat = data.heatmap;
    const rec = data.records;

    return (
        <div className={`ost ${loading ? "ost--loading" : ""}`}>
            {hero}

            {/* ── Asosiy ko'rsatkichlar (o'tgan davr bilan solishtirib) ── */}
            <div className="ost-kpis">
                <KpiCard icon={UserPlus} color="#6366f1" label="Yangi leadlar" value={ps.new_leads} delta={d("new_leads")} hint={prevHint} />
                <KpiCard icon={PhoneCall} color="#0ea5e9" label="Qo'ng'iroqlar" value={calls.total} delta={d("calls")} hint={`${calls.unique_leads} ta leadga`} />
                <KpiCard icon={FileCheck} color="#10b981" label="Shartnoma" value={ps.contracts} delta={d("contracts")} hint={prevHint} />
                <KpiCard icon={DoorOpen} color="#14b8a6" label="Keldi" value={ps.came} delta={d("came")} hint={prevHint} />
                <KpiCard icon={Percent} color="#8b5cf6" label="Konversiya" value={`${ps.conversion_rate}%`} delta={d("conversion_rate")} hint="shartnoma / yangi lead" />
                <KpiCard icon={Clock} color="#f59e0b" label="Suhbat vaqti" value={ats.available ? compactDuration(ats.talk_time_sec) : "—"} delta={d("talk_time_sec")} hint={ats.available ? formatDuration(ats.talk_time_sec) : "ATS logini yo'q"} />
            </div>

            <div className="ost-row ost-row--wide">
                <Panel icon={Activity} title="Kunlik dinamika" note="Oxirgi 31 kundan oshmaydi" color="#6366f1">
                    <div className="ost-chart">
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="ostCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="calls" name="Qo'ng'iroq" stroke="#6366f1" strokeWidth={2} fill="url(#ostCalls)" />
                                <Bar dataKey="contracts" name="Shartnoma" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="came" name="Keldi" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={8} />
                                <Line type="monotone" dataKey="new_leads" name="Yangi lead" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel icon={Trophy} title="Rekordlar" color="#f59e0b" className="ost-panel--warm">
                    <ul className="ost-records">
                        <li>
                            <span>Eng ko'p qo'ng'iroq</span>
                            <strong>{rec?.best_calls_day ? `${rec.best_calls_day.count} ta` : "—"}</strong>
                            <small>{rec?.best_calls_day ? shortDate(rec.best_calls_day.date) : ""}</small>
                        </li>
                        <li>
                            <span>Eng ko'p shartnoma</span>
                            <strong>{rec?.best_contracts_day ? `${rec.best_contracts_day.count} ta` : "—"}</strong>
                            <small>{rec?.best_contracts_day ? shortDate(rec.best_contracts_day.date) : ""}</small>
                        </li>
                        <li>
                            <span>Faol kunlar</span>
                            <strong>{rec?.active_days ?? "—"}</strong>
                            <small>qo'ng'iroq bo'lgan</small>
                        </li>
                        <li>
                            <span>Kuniga o'rtacha</span>
                            <strong>{rec?.avg_calls_per_active_day ?? "—"}</strong>
                            <small>qo'ng'iroq</small>
                        </li>
                    </ul>
                </Panel>
            </div>

            <div className="ost-row">
                <Panel icon={Filter} title="Voronka" note="Davrda kelgan leadlar qaysi bosqichgacha yetgan" color="#8b5cf6">
                    <Funnel stages={data.funnel || []} />
                </Panel>

                <Panel icon={Zap} title="Javob tezligi" note="Lead kelgandan birinchi qo'ng'iroqqacha" color="#0ea5e9">
                    {speed?.leads ? (
                        <div className="ost-speed">
                            <Gauge
                                value={speed.within_hour_rate}
                                color={speed.within_hour_rate >= 70 ? "#10b981" : speed.within_hour_rate >= 40 ? "#f59e0b" : "#f43f5e"}
                                label={`${speed.within_hour_rate}%`}
                                sub="1 soat ichida"
                            />
                            <div className="ost-speed__facts">
                                <div><span>Median</span><strong>{formatMinutes(speed.median_minutes)}</strong></div>
                                <div><span>O'rtacha</span><strong>{formatMinutes(speed.avg_minutes)}</strong></div>
                                <div className={speed.not_called ? "is-alert" : ""}>
                                    <span>Hali qo'ng'iroq qilinmagan</span><strong>{speed.not_called} ta</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="ost-empty">Bu davrda lead yo'q</p>
                    )}
                </Panel>
            </div>

            <Panel
                icon={Megaphone}
                title="Lead manbalari"
                color="#ec4899"
                note="Leadlar qayerdan kelgan va har manbadan nechtasi natija bergan. «Davrda yangi» — tanlangan davrda kelganlari, qolgan ustunlar — barcha leadlar bo'yicha"
            >
                <Sources sources={data.sources || []} />
            </Panel>

            <div className="ost-row">
                <Panel icon={ListChecks} title="Leadlar — joriy holat" note="Davrga bog'liq emas: hozir operatorda turgan leadlar" color="#10b981">
                    <div className="ost-minis">
                        <div><strong>{pipeline.total}</strong><span>jami</span></div>
                        <div><strong>{pipeline.active}</strong><span>faol</span></div>
                        <div className="is-green"><strong>{pipeline.contracts}</strong><span>shartnoma · {pipeline.conversion_rate}%</span></div>
                        <div className="is-blue"><strong>{pipeline.came}</strong><span>keldi · {pipeline.came_rate}%</span></div>
                        <div><strong>{pipeline.avg_attempts ?? "—"}</strong><span>o'rtacha urinish</span></div>
                        <div><strong>{pipeline.deleted}</strong><span>o'chirilgan</span></div>
                    </div>
                    <h3 className="ost-subtitle-sm">Statuslar bo'yicha (faol)</h3>
                    <StackedBar items={statuses} colorOf={(i, idx) => STATUS_COLORS[i.name] || PALETTE[idx % PALETTE.length]} />
                </Panel>

                <Panel icon={AlarmClock} title="Eslatmalar va harorat" color="#f43f5e">
                    <div className="ost-alerts">
                        <div className={`ost-alert ${pipeline.reminders.overdue ? "ost-alert--red" : ""}`}>
                            <TriangleAlert size={18} />
                            <strong>{pipeline.reminders.overdue}</strong>
                            <span>O'tib ketgan</span>
                        </div>
                        <div className="ost-alert ost-alert--amber">
                            <AlarmClock size={18} />
                            <strong>{pipeline.reminders.today}</strong>
                            <span>Bugun</span>
                        </div>
                        <div className="ost-alert ost-alert--slate">
                            <CalendarClock size={18} />
                            <strong>{pipeline.reminders.upcoming}</strong>
                            <span>Keyingi kunlar</span>
                        </div>
                        <div className={`ost-alert ${activity.sla_breaches ? "ost-alert--red" : ""}`}>
                            <ShieldAlert size={18} />
                            <strong>{activity.sla_breaches}</strong>
                            <span>SLA buzilishi (davrda)</span>
                        </div>
                    </div>
                    <h3 className="ost-subtitle-sm">Harorat (faol leadlar)</h3>
                    <div className="ost-temp">
                        {temperature.map((t) => (
                            <div key={t.name} className="ost-temp__item" style={{ "--c": t.color }}>
                                {t.name === "Issiq" ? <Flame size={16} /> : t.name === "Sovuq" ? <Snowflake size={16} /> : <span className="ost-dot" style={{ background: t.color }} />}
                                <strong>{t.count}</strong>
                                <span>{t.name}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            {heat && (
                <Panel
                    icon={CalendarClock}
                    title="Faollik xaritasi"
                    note="Qo'ng'iroqlar hafta kuni va soat bo'yicha (Toshkent vaqti)"
                    color="#6366f1"
                    aside={heat.busiest && (
                        <span className="ost-badge">
                            Eng faol: {WEEKDAYS[heat.busiest.weekday]} {String(heat.busiest.hour).padStart(2, "0")}:00 — {heat.busiest.count} ta
                        </span>
                    )}
                >
                    <Heatmap cells={heat.cells} max={heat.max} />
                </Panel>
            )}

            <div className="ost-row">
                <Panel icon={Headphones} title="Qo'ng'iroqlar" color="#0ea5e9">
                    <div className="ost-calls">
                        <div className="ost-calls__crm">
                            <div><strong>{calls.total}</strong><span>CRM qo'ng'iroqlari</span></div>
                            <div><strong>{calls.with_audio}</strong><span>yozuvi bor</span></div>
                            <div><strong>{calls.with_comment}</strong><span>izohli</span></div>
                            <div><strong>{calls.unique_leads}</strong><span>turli lead</span></div>
                        </div>
                        {ats.available ? (
                            <div className="ost-calls__ats">
                                <div className="ost-donut ost-donut--small">
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie data={atsStatuses.filter((s) => s.count)} dataKey="count" nameKey="name"
                                                 innerRadius="65%" outerRadius="95%" stroke="none">
                                                {atsStatuses.filter((s) => s.count).map((s, i) => (
                                                    <Cell key={s.name} fill={s.color || PALETTE[i % PALETTE.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="ost-donut__center">
                                        <strong>{answeredRate}%</strong>
                                        <span>javob</span>
                                    </div>
                                </div>
                                <ul className="ost-facts">
                                    {atsStatuses.map((s, i) => (
                                        <li key={s.name}>
                                            <span className="ost-dot" style={{ background: s.color || PALETTE[i % PALETTE.length] }} />
                                            {s.name}<strong>{s.count}</strong>
                                        </li>
                                    ))}
                                    <li className="ost-facts__sep">Kiruvchi / chiquvchi<strong>{ats.inbound} / {ats.outbound}</strong></li>
                                    <li>O'rtacha suhbat<strong>{formatDuration(ats.avg_duration_sec)}</strong></li>
                                    <li>O'rtacha kutish<strong>{formatDuration(ats.avg_wait_sec)}</strong></li>
                                    <li><Star size={13} /> Mijoz bahosi<strong>{ats.avg_rating ?? "—"} <small>({ats.rated_calls})</small></strong></li>
                                </ul>
                            </div>
                        ) : (
                            <p className="ost-empty">ATS logini biriktirilmagan — sip.uz tarixi yo'q</p>
                        )}
                    </div>
                </Panel>

                <Panel icon={Users} title="Jamoa bilan solishtirish" note="Siz va operatorlar o'rtachasi · | — eng yaxshi natija" color="#14b8a6">
                    {team.length ? <CompareBars metrics={team} /> : <p className="ost-empty">Ma'lumot yo'q</p>}
                </Panel>
            </div>

            <div className="ost-row">
                <Panel icon={ArrowLeftRight} title="Faoliyat (davrda)" note="Audit jurnali 2026-07-28 dan yuritiladi" color="#64748b">
                    <div className="ost-minis ost-minis--3">
                        <div><strong>{activity.status_changes}</strong><span>status o'zgartirish</span></div>
                        <div><strong>{activity.transfers}</strong><span>o'tkazildi</span></div>
                        <div><strong>{activity.uncontracts}</strong><span>shartnoma bekor</span></div>
                    </div>
                    <h3 className="ost-subtitle-sm">Qaysi statusga o'tkazilgan</h3>
                    <StackedBar
                        items={(activity.moved_to || []).map((m) => ({ name: m.name, count: m.count }))}
                        colorOf={(i, idx) => STATUS_COLORS[i.name] || PALETTE[idx % PALETTE.length]}
                    />
                    <h3 className="ost-subtitle-sm">Barcha amallar</h3>
                    <div className="ost-chips">
                        {actions.length ? actions.map((a) => (
                            <span key={a.key} className="ost-chip">{a.name}<b>{a.count}</b></span>
                        )) : <p className="ost-empty">Amallar yo'q</p>}
                    </div>
                </Panel>

                <Panel icon={Bot} title="AI qo'ng'iroq tahlili" color="#8b5cf6"
                       note={ai.enabled ? null : "AI tahlil hozir o'chiq — oldingi natijalar ko'rsatilmoqda"}>
                    {ai.analyzed_calls === 0 ? (
                        <p className="ost-empty">Bu davrda tahlil qilingan qo'ng'iroq yo'q</p>
                    ) : (
                        <div className="ost-ai">
                            <div className="ost-ai__gauge">
                                <Gauge value={ai.avg_score} color={scoreColor(ai.avg_score)} label={ai.avg_score} sub={`${ai.analyzed_calls} ta qo'ng'iroq`} />
                                {ai.rank && <div className="ost-ai__rank">Jamoada <Rank place={ai.rank} of={ai.ranked_operators} /></div>}
                            </div>
                            <div className="ost-ai__radar">
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={radar} outerRadius="70%">
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="criterion" fontSize={10} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar dataKey="value" name="Mezon, %" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                <div className="ost-sr-only">
                                    {radar.map((r) => <span key={r.criterion}>{r.criterion}: {r.value}%</span>)}
                                </div>
                            </div>
                            <div className="ost-ai__tags">
                                {Object.entries(ai.lead_status || {}).map(([k, v]) => (
                                    <span key={k} className="ost-tag">{LEAD_STATUS_LABELS[k] || k}: {v}</span>
                                ))}
                                {Object.entries(ai.sentiment || {}).map(([k, v]) => (
                                    <span key={k} className="ost-tag">{SENTIMENT_LABELS[k] || k}: {v}</span>
                                ))}
                            </div>
                            {ai.recent?.length > 0 && (
                                <div className="ost-ai__recent">
                                    <h3 className="ost-subtitle-sm">Oxirgi tahlillar</h3>
                                    <div className="ost-ai__pills">
                                        {ai.recent.map((r) => (
                                            <span key={r.id} className="ost-ai__recent-item" title={r.created_at || ""}>
                                                <span className={`ost-ai__pill ${scoreClass(r.total_score)}`}>{r.total_score ?? "—"}</span>
                                                {LEAD_STATUS_LABELS[r.lead_status] || ""}
                                                <small>{r.created_at ? `${shortDate(r.created_at.slice(0, 10))} ${r.created_at.slice(11, 16)}` : ""}</small>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}

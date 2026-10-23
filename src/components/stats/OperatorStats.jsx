import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import PeriodFilter from "../../pages/adminDashboard/components/PeriodFilter";
import { getMyStats, formatDuration } from "../../api/statsService";
import { CRITERIA_LABELS, scoreClass } from "../../api/aiService";
import "../ai.css";
import "./operator-stats.css";

const PERIOD_TEXT = { today: "bugun", week: "shu hafta", month: "shu oy", all: "butun davr" };

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

const LEAD_STATUS_LABELS = { hot: "🔥 Issiq", warm: "🌤 Iliq", cold: "❄️ Sovuq", unknown: "—" };
const SENTIMENT_LABELS = { positive: "🙂 Ijobiy", neutral: "😐 Neytral", negative: "🙁 Salbiy", unknown: "—" };

function Card({ label, value, hint, tone }) {
    return (
        <div className={`ost-card ${tone ? `ost-card--${tone}` : ""}`}>
            <div className="ost-card__value">{value ?? "—"}</div>
            <div className="ost-card__label">{label}</div>
            {hint && <div className="ost-card__hint">{hint}</div>}
        </div>
    );
}

function Section({ title, note, children }) {
    return (
        <section className="ost-section">
            <h2 className="ost-section__title">{title}</h2>
            {note && <p className="ost-section__note">{note}</p>}
            {children}
        </section>
    );
}

function BarList({ items, total, empty = "Ma'lumot yo'q" }) {
    const max = Math.max(1, ...items.map((i) => i.count));
    if (!items.length) return <p className="ost-empty">{empty}</p>;
    return (
        <div className="ost-barlist">
            {items.map((i) => (
                <div key={i.name} className="ost-barlist__row">
                    <span className="ost-barlist__name">{i.name}</span>
                    <span className="ost-barlist__bar">
                        <span style={{ width: `${(i.count / max) * 100}%` }} />
                    </span>
                    <span className="ost-barlist__count">
                        {i.count}
                        {total ? <small> · {Math.round((i.count / total) * 100)}%</small> : null}
                    </span>
                </div>
            ))}
        </div>
    );
}

function Rank({ place, of }) {
    if (!place) return <span className="ost-rank ost-rank--none">—</span>;
    const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : `#${place}`;
    return <span className="ost-rank">{medal}<small> / {of}</small></span>;
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

    const toolbar = (
        <div className="ost-toolbar">
            <div>
                <h1 className="ost-title">📊 {data?.operator?.name || "Statistika"}</h1>
                <p className="ost-subtitle">
                    {data?.operator?.system ? `${data.operator.system} · ` : ""}
                    Davr ko'rsatkichlari: {PERIOD_TEXT[period]}
                </p>
            </div>
            <PeriodFilter value={period} onChange={setPeriod} />
        </div>
    );

    if (loading && !data) return <div className="ost">{toolbar}<p className="ost-empty">⏳ Yuklanmoqda...</p></div>;
    if (!data) return <div className="ost">{toolbar}<p className="ost-empty">Statistikani yuklab bo'lmadi</p></div>;

    const { pipeline, period_stats: ps, activity, calls, ats, ai, rank, daily } = data;
    const moved = activity.moved_to || [];
    const actions = Object.entries(activity.by_action || {})
        .map(([k, v]) => ({ name: ACTION_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count);
    const statuses = (pipeline.by_status || []).map((s) => ({ name: s.name, count: s.count }));
    const temperature = [
        { name: "🔥 Issiq", count: pipeline.temperature?.issiq || 0 },
        { name: "❄️ Sovuq", count: pipeline.temperature?.sovuq || 0 },
        { name: "Belgilanmagan", count: pipeline.temperature?.none || 0 },
    ];
    const chartData = (daily || []).map((d) => ({ ...d, day: d.date.slice(5) }));

    return (
        <div className={`ost ${loading ? "ost--loading" : ""}`}>
            {toolbar}

            {/* ── Davr bo'yicha asosiy ko'rsatkichlar ── */}
            <div className="ost-cards">
                <Card label="Yangi leadlar" value={ps.new_leads} />
                <Card label="Qo'ng'iroqlar (CRM)" value={calls.total} hint={`${calls.unique_leads} ta leadga`} />
                <Card label="Shartnoma" value={ps.contracts} tone="green" />
                <Card label="Keldi" value={ps.came} tone="blue" />
                <Card label="Konversiya" value={`${ps.conversion_rate}%`} hint="shartnoma / yangi lead" />
                <Card label="Suhbat vaqti" value={ats.available ? formatDuration(ats.talk_time_sec) : "—"} />
                <Card label="Reyting (qo'ng'iroq)" value={<Rank place={rank.by_calls} of={rank.operators} />} />
                <Card label="Reyting (shartnoma)" value={<Rank place={rank.by_contracts} of={rank.operators} />} />
            </div>

            <Section title="📈 Kunlik dinamika" note="Oxirgi 31 kundan oshmaydi">
                <div className="ost-chart">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="day" fontSize={11} />
                            <YAxis allowDecimals={false} fontSize={11} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="calls" name="Qo'ng'iroq" fill="#6366f1" />
                            <Bar dataKey="new_leads" name="Yangi lead" fill="#94a3b8" />
                            <Bar dataKey="contracts" name="Shartnoma" fill="#16a34a" />
                            <Bar dataKey="came" name="Keldi" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            <div className="ost-grid">
                <Section title="🗂 Leadlar — joriy holat" note="Davrga bog'liq emas: hozir operatorda turgan leadlar">
                    <div className="ost-cards ost-cards--small">
                        <Card label="Jami" value={pipeline.total} />
                        <Card label="Faol" value={pipeline.active} />
                        <Card label="Shartnoma" value={pipeline.contracts} hint={`${pipeline.conversion_rate}%`} tone="green" />
                        <Card label="Keldi" value={pipeline.came} hint={`${pipeline.came_rate}%`} tone="blue" />
                        <Card label="O'rtacha urinish" value={pipeline.avg_attempts ?? "—"} />
                        <Card label="O'chirilgan" value={pipeline.deleted} />
                    </div>
                    <h3 className="ost-subtitle-sm">Statuslar bo'yicha (faol)</h3>
                    <BarList items={statuses} total={pipeline.active} />
                </Section>

                <Section title="⏰ Eslatmalar va harorat">
                    <div className="ost-cards ost-cards--small">
                        <Card label="O'tib ketgan" value={pipeline.reminders.overdue} tone={pipeline.reminders.overdue ? "red" : null} />
                        <Card label="Bugun" value={pipeline.reminders.today} />
                        <Card label="Keyingi kunlar" value={pipeline.reminders.upcoming} />
                        <Card label="SLA buzilishi" value={activity.sla_breaches} tone={activity.sla_breaches ? "red" : null} hint="davrda" />
                    </div>
                    <h3 className="ost-subtitle-sm">Issiq / sovuq (faol leadlar)</h3>
                    <BarList items={temperature} total={pipeline.active} />
                    <h3 className="ost-subtitle-sm">Manbalar bo'yicha</h3>
                    <BarList items={pipeline.by_source || []} total={pipeline.total} />
                </Section>
            </div>

            <div className="ost-grid">
                <Section title="📞 Qo'ng'iroqlar">
                    <div className="ost-cards ost-cards--small">
                        <Card label="CRM qo'ng'iroqlari" value={calls.total} />
                        <Card label="Yozuvi bor" value={calls.with_audio} />
                        <Card label="Izohli" value={calls.with_comment} />
                        <Card label="Turli leadlar" value={calls.unique_leads} />
                    </div>
                    {ats.available ? (
                        <>
                            <h3 className="ost-subtitle-sm">ATS (sip.uz) tarixi</h3>
                            <div className="ost-cards ost-cards--small">
                                <Card label="Jami" value={ats.total} />
                                <Card label="Kiruvchi" value={ats.inbound} />
                                <Card label="Chiquvchi" value={ats.outbound} />
                                <Card label="Javob berilgan" value={ats.answered} tone="green" />
                                <Card label="Javobsiz" value={ats.missed} hint={`${ats.missed_rate}%`} tone={ats.missed ? "red" : null} />
                                <Card label="O'rtacha suhbat" value={formatDuration(ats.avg_duration_sec)} />
                                <Card label="O'rtacha kutish" value={formatDuration(ats.avg_wait_sec)} />
                                <Card label="Mijoz bahosi" value={ats.avg_rating ? `⭐ ${ats.avg_rating}` : "—"} hint={`${ats.rated_calls} ta baho`} />
                            </div>
                        </>
                    ) : (
                        <p className="ost-empty">ATS logini biriktirilmagan — sip.uz tarixi yo'q</p>
                    )}
                </Section>

                <Section title="🧾 Faoliyat (davrda)" note="Audit jurnali 2026-07-28 dan yuritiladi">
                    <div className="ost-cards ost-cards--small">
                        <Card label="Status o'zgartirish" value={activity.status_changes} />
                        <Card label="O'tkazildi" value={activity.transfers} />
                        <Card label="Shartnoma bekor" value={activity.uncontracts} />
                    </div>
                    <h3 className="ost-subtitle-sm">Qaysi statusga o'tkazilgan</h3>
                    <BarList items={moved} total={activity.status_changes} />
                    <h3 className="ost-subtitle-sm">Barcha amallar</h3>
                    <BarList items={actions} />
                </Section>
            </div>

            <Section title="🤖 AI qo'ng'iroq tahlili" note={ai.enabled ? null : "AI tahlil hozir o'chiq — oldingi natijalar ko'rsatilmoqda"}>
                {ai.analyzed_calls === 0 ? (
                    <p className="ost-empty">Bu davrda tahlil qilingan qo'ng'iroq yo'q</p>
                ) : (
                    <div className="ost-ai">
                        <div className="ost-ai__score">
                            <span className={`ost-ai__big ${scoreClass(ai.avg_score)}`}>{ai.avg_score}</span>
                            <span>o'rtacha ball · {ai.analyzed_calls} ta qo'ng'iroq</span>
                            {ai.rank && <span>Jamoada <Rank place={ai.rank} of={ai.ranked_operators} /></span>}
                        </div>
                        <div className="ost-ai__criteria">
                            {Object.entries(ai.criteria_avg).map(([key, avg]) => {
                                const max = ai.criteria_max?.[key] || 1;
                                return (
                                    <div key={key} className="ost-barlist__row">
                                        <span className="ost-barlist__name">{CRITERIA_LABELS[key] || key}</span>
                                        <span className="ost-barlist__bar"><span style={{ width: `${(avg / max) * 100}%` }} /></span>
                                        <span className="ost-barlist__count">{avg} / {max}</span>
                                    </div>
                                );
                            })}
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
                                {ai.recent.map((r) => (
                                    <div key={r.id} className="ost-ai__row">
                                        <span className={`ost-ai__pill ${scoreClass(r.total_score)}`}>{r.total_score ?? "—"}</span>
                                        <span>{LEAD_STATUS_LABELS[r.lead_status] || ""}</span>
                                        <span className="ost-ai__date">{r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : ""}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Section>
        </div>
    );
}

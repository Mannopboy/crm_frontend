import React, { useCallback, useEffect, useState } from "react";
import { getLeaderboard } from "../../api/leadService";

const PERIODS = [
    { k: "today", t: "Bugun" },
    { k: "week", t: "Hafta" },
    { k: "month", t: "Oy" },
    { k: "all", t: "Hammasi" },
];

// 🏆 Operatorlar reytingi (qo'ng'iroqlar bo'yicha)
export default function LeaderboardModal({ onClose }) {
    const [period, setPeriod] = useState("all");
    const [rows, setRows] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (p) => {
        setLoading(true);
        const res = await getLeaderboard(p);
        const list = res?.leaderboard || [];
        // rank kelmasa — o'zimiz total_calls bo'yicha tartiblaymiz
        const ranked = [...list]
            .sort((a, b) => (b.total_calls || 0) - (a.total_calls || 0))
            .map((r, i) => ({ ...r, rank: r.rank ?? i + 1 }));
        setRows(ranked);
        setMyRank(res?.my_rank ?? ranked.find((r) => r.is_me)?.rank ?? null);
        setLoading(false);
    }, []);

    useEffect(() => {
        load(period);
    }, [period, load]);

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3 className="custom-modal-title">🏆 Operatorlar reytingi (qo‘ng‘iroqlar bo‘yicha)</h3>

                <div className="leader-period">
                    {PERIODS.map((p) => (
                        <button
                            key={p.k}
                            className={`leader-period-btn ${period === p.k ? "active" : ""}`}
                            onClick={() => setPeriod(p.k)}
                            disabled={loading}
                            type="button"
                        >
                            {p.t}
                        </button>
                    ))}
                </div>

                {myRank && (
                    <p className="leader-myrank">
                        Sizning o‘rningiz: <strong>#{myRank}</strong>
                    </p>
                )}

                {loading ? (
                    <p style={{ textAlign: "center", padding: 16 }}>⏳ Yuklanmoqda...</p>
                ) : rows.length === 0 ? (
                    <p style={{ textAlign: "center", padding: 16 }}>Ma'lumot yo‘q</p>
                ) : (
                    <div className="leader-list">
                        {rows.map((r) => (
                            <div key={r.id ?? r.rank} className={`leader-row ${r.is_me ? "me" : ""}`}>
                                <span className={`leader-rank rank-${r.rank}`}>
                                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                                </span>
                                <span className="leader-name">
                                    {r.name}
                                    {r.is_me ? " (siz)" : ""}
                                </span>
                                <span className="leader-calls">📞 {r.total_calls ?? 0}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="custom-modal-actions">
                    <button onClick={onClose} className="btn-close" type="button">
                        Yopish
                    </button>
                </div>
            </div>
        </div>
    );
}

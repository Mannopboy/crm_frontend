import React, { useEffect, useRef, useState } from "react";
import { Upload, FileDown } from "lucide-react";
import { importLeads, downloadImportTemplate } from "../../../api/adminService";
import { getUsers } from "../../../api/leadService";
import { toast } from "../../../utils/toast";
import styles from "../styles.module.css";
import "./analytics.css";
import "./operators-manage.css";

const MAX_SIZE = 5 * 1024 * 1024; // backend cheklovi: 5MB
const ALLOWED = [".csv", ".xlsx"];

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 📥 Lead import — POST /leads/import
export default function ImportLeads() {
    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [assign, setAssign] = useState("round_robin");
    const [userId, setUserId] = useState("");
    const [users, setUsers] = useState([]);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const list = await getUsers();
                setUsers(Array.isArray(list) ? list : []);
            } catch {
                setUsers([]);
            }
        })();
    }, []);

    const pickFile = (f) => {
        if (!f) return;
        const lower = f.name.toLowerCase();
        if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
            toast.warning("Faqat .csv yoki .xlsx fayl qabul qilinadi");
            return;
        }
        if (f.size > MAX_SIZE) {
            toast.warning(`Fayl juda katta (${formatSize(f.size)}). Maksimum 5 MB`);
            return;
        }
        setFile(f);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        pickFile(e.dataTransfer.files?.[0]);
    };

    const handleImport = async () => {
        if (!file) return;
        setBusy(true);
        const options = assign === "user" ? { user_id: Number(userId) } : { assign: "round_robin" };
        const res = await importLeads(file, options);
        setBusy(false);
        setResult(res);

        if (res?.status) {
            toast.success(`✅ ${res.created} ta lead qo‘shildi`);
        } else {
            toast.error(res?.message || "Import qilinmadi");
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const canImport = file && !busy && (assign !== "user" || userId);

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Lead import</h1>
                    <p className={styles.subtitle}>CSV yoki Excel fayldan leadlarni yuklash</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="op-add-btn" onClick={() => downloadImportTemplate("xlsx")} type="button">
                        <FileDown size={16} /> Namuna (.xlsx)
                    </button>
                    <button className="op-add-btn" onClick={() => downloadImportTemplate("csv")} type="button">
                        <FileDown size={16} /> Namuna (.csv)
                    </button>
                </div>
            </div>

            <div className="analytics-chart-card">
                <div
                    className={`import-drop ${dragOver ? "is-over" : ""}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload size={28} />
                    {file ? (
                        <>
                            <strong>{file.name}</strong>
                            <span>{formatSize(file.size)}</span>
                        </>
                    ) : (
                        <>
                            <strong>Faylni shu yerga tashlang</strong>
                            <span>yoki bosing — .csv / .xlsx, maksimum 5 MB</span>
                        </>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        hidden
                        onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                </div>

                <div className="import-options">
                    <label>
                        <input
                            type="radio"
                            name="assign"
                            checked={assign === "round_robin"}
                            onChange={() => setAssign("round_robin")}
                        />
                        Operatorlarga navbat bilan taqsimlash (round-robin)
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="assign"
                            checked={assign === "user"}
                            onChange={() => setAssign("user")}
                        />
                        Bitta operatorga berish
                    </label>
                    {assign === "user" && (
                        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">Operatorni tanlang</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} {u.surname || ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="import-actions">
                    <button className="op-btn-save" onClick={handleImport} disabled={!canImport} type="button">
                        {busy ? "Yuklanmoqda..." : "📥 Import qilish"}
                    </button>
                    {file && (
                        <button className="op-btn-cancel" onClick={reset} disabled={busy} type="button">
                            Tozalash
                        </button>
                    )}
                </div>

                <p className="import-hint">
                    Ustun sarlavhalari 1-qatorda bo‘lsin. Qabul qilinadi:{" "}
                    <code>name / ism / fio / mijoz</code>, <code>phone / telefon / tel / raqam</code> (majburiy),{" "}
                    <code>source / manba</code>. Telefon formati avtomatik <code>998901234567</code> ga keltiriladi.
                </p>
            </div>

            {result?.status && (
                <div className="analytics-chart-card">
                    <h3 className="analytics-chart-title">Natija</h3>

                    <div className="funnel-summary">
                        <div className="funnel-pill">
                            <span>Yaratildi</span>
                            {result.created}
                        </div>
                        <div className="funnel-pill">
                            <span>Dublikat</span>
                            {result.duplicates}
                        </div>
                        <div className="funnel-pill">
                            <span>Xato</span>
                            {result.error_count ?? result.errors?.length ?? 0}
                        </div>
                    </div>

                    {result.assigned_to?.length > 0 && (
                        <p className="import-hint" style={{ marginTop: 14 }}>
                            Taqsimlandi: {result.assigned_to.map((u) => u.name).join(", ")}
                        </p>
                    )}

                    {result.errors?.length > 0 && (
                        <>
                            <h3 className="analytics-chart-title" style={{ marginTop: 20 }}>
                                Xatolar
                                {result.error_count > result.errors.length &&
                                    ` (${result.errors.length} / ${result.error_count} ko‘rsatilmoqda)`}
                            </h3>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th>Qator</th>
                                    <th>Sabab</th>
                                </tr>
                                </thead>
                                <tbody>
                                {result.errors.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.row}</td>
                                        <td>{e.reason}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

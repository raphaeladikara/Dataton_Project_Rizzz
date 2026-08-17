"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./admin.module.css";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (response.ok) window.location.reload();
    else {
      const body = await response.json().catch(() => ({ error: "Login gagal." })) as { error?: string };
      setError(body.error ?? "Login gagal.");
      setBusy(false);
    }
  }

  return <main className={styles.loginPage}>
    <section className={styles.loginCard}>
      <div className={styles.loginHeader}>
        <span className={styles.brandMark}>◉</span>
        <Link className={styles.backLink} href="/">Kembali ke beranda</Link>
      </div>
      <span className={styles.kicker}>Neurogaze · akses terbatas</span>
      <h1>Konsol validasi</h1>
      <p>Halaman ini dipakai administrator untuk meninjau Gate A–D dan membandingkan data riset. Halaman peserta tetap terpisah.</p>
      {!configured ? <div className={styles.errorBox} role="alert">Admin belum dikonfigurasi. Isi dua variabel rahasia server sebelum login.</div> : <form onSubmit={submit}>
        <label><span>Kode akses administrator</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></label>
        {error && <div className={styles.errorBox} role="alert">{error}</div>}
        <button type="submit" disabled={busy || !password}>{busy ? "Memeriksa…" : "Masuk ke konsol"}</button>
      </form>}
      <small>Sesi admin berakhir otomatis setelah 8 jam. Cookie bersifat HttpOnly dan tidak dapat dibaca JavaScript halaman.</small>
    </section>
  </main>;
}

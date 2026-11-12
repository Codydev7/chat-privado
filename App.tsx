import React, { useEffect, useMemo, useRef, useState } from "react";
import { Users, Shield, Send, Trash2, Search, X, Lock, Unlock, KeyRound, Eye, Radio, MessageCircle, ChevronLeft, ImagePlus, Globe, MapPin, Wifi, Crown, Plus, Activity, AlertTriangle, CheckCircle2, Ban, UserX, HeartHandshake, RefreshCw, Loader2, Cloud, History } from "lucide-react";

type MsgRecord = { id: string; value: any; created_at: string };
type DemoUser = { name: string; country: string; flag: string; city: string; ip: string; mood: string; last: string; unread?: number };

const DEMO_USERS: DemoUser[] = [
  { name: "La Flaca", country: "Rep. Dominicana", flag: "🇩🇴", city: "Santo Domingo", ip: "190.12.44.8", mood: "siempre activa", last: "ahora", unread: 3 },
  { name: "El Duro RD", country: "Rep. Dominicana", flag: "🇩🇴", city: "Santiago", ip: "190.88.21.4", mood: "en la calle", last: "ahora" },
  { name: "Yailin Flow", country: "Puerto Rico", flag: "🇵🇷", city: "San Juan", ip: "184.23.91.12", mood: "grabando", last: "ahora", unread: 1 },
  { name: "Papi Chulo", country: "Colombia", flag: "🇨🇴", city: "Medellín", ip: "181.44.77.2", mood: "duro", last: "1 min" },
  { name: "Mami Dembow", country: "Rep. Dominicana", flag: "🇩🇴", city: "La Vega", ip: "190.55.19.33", mood: "dembow 24/7", last: "2 min" },
  { name: "El Bori", country: "Puerto Rico", flag: "🇵🇷", city: "Ponce", ip: "184.90.31.7", mood: "tranquilo", last: "2 min" },
  { name: "Karol G Fan", country: "Colombia", flag: "🇨🇴", city: "Bogotá", ip: "181.12.66.9", mood: "bichota", last: "3 min" },
  { name: "Chapiadora 01", country: "Rep. Dominicana", flag: "🇩🇴", city: "Boca Chica", ip: "190.77.02.18", mood: "online", last: "3 min", unread: 2 },
  { name: "El Menor", country: "México", flag: "🇲🇽", city: "CDMX", ip: "189.33.45.21", mood: "en el barrio", last: "4 min" },
  { name: "La Bebé", country: "Venezuela", flag: "🇻🇪", city: "Caracas", ip: "190.200.11.5", mood: "activa", last: "4 min" },
  { name: "Dembow King", country: "Rep. Dominicana", flag: "🇩🇴", city: "San Pedro", ip: "190.41.88.6", mood: "productor", last: "5 min" },
  { name: "La Gringa", country: "Estados Unidos", flag: "🇺🇸", city: "Miami", ip: "172.18.90.14", mood: "spanglish", last: "5 min" },
  { name: "El Primo", country: "España", flag: "🇪🇸", city: "Madrid", ip: "91.44.22.8", mood: "desde Europa", last: "6 min" },
  { name: "Flow Latino", country: "Chile", flag: "🇨🇱", city: "Santiago", ip: "200.11.73.3", mood: "duro", last: "7 min" },
  { name: "La Reina", country: "Perú", flag: "🇵🇪", city: "Lima", ip: "190.99.30.2", mood: "reina del grupo", last: "8 min" },
  { name: "El Tiguere", country: "Rep. Dominicana", flag: "🇩🇴", city: "Higüey", ip: "190.66.12.9", mood: "tiguere", last: "9 min" },
  { name: "Baby Dembow", country: "Argentina", flag: "🇦🇷", city: "Buenos Aires", ip: "200.55.41.7", mood: "nuevo flow", last: "10 min" },
  { name: "La Dura", country: "Panamá", flag: "🇵🇦", city: "Panamá", ip: "190.34.78.1", mood: "dura", last: "11 min" },
  { name: "El Gato", country: "Ecuador", flag: "🇪🇨", city: "Guayaquil", ip: "190.22.55.4", mood: "gato", last: "12 min" },
  { name: "Mami Flow", country: "Cuba", flag: "🇨🇺", city: "La Habana", ip: "190.18.90.3", mood: "flow", last: "13 min" },
];

const DEMO_GROUP = [
  { id: "d1", sender: "La Flaca", text: "Llegaron los duros 🔥 ¿quién está activo?", time: "21:02", color: "#ff1a1a" },
  { id: "d2", sender: "El Duro RD", text: "Yo aquí desde temprano. Este grupo no duerme.", time: "21:03", color: "#ffffff" },
  { id: "d3", sender: "Mami Dembow", text: "Suban el dembow nuevo que salió hoy, está duro duro", time: "21:04", color: "#999999" },
  { id: "d4", sender: "El Bori", text: "Ya lo escuché 3 veces. El coro se pega solo.", time: "21:05", color: "#ff1a1a" },
  { id: "d5", sender: "Yailin Flow", text: "Mañana hacemos live en el grupo? Voten", time: "21:07", color: "#ffffff" },
  { id: "d6", sender: "Papi Chulo", text: "Yo voto que sí. Que se arme el corito.", time: "21:08", color: "#999999" },
  { id: "d7", sender: "La Flaca", text: "Admin, ¿vas a dejar la llave abierta esta noche?", time: "21:10", color: "#ff1a1a" },
];

const DEMO_DMS: Record<string, { sender: string; text: string; time: string }[]> = {
  "La Flaca ↔ El Duro RD": [
    { sender: "La Flaca", text: "Oye, ¿viste lo que pusieron en el grupo?", time: "20:41" },
    { sender: "El Duro RD", text: "Sí, se pasó. Te escribo por aquí mejor.", time: "20:42" },
    { sender: "La Flaca", text: "Exacto, por aquí hablamos tranquilos.", time: "20:43" },
  ],
  "Mami Dembow ↔ Papi Chulo": [
    { sender: "Papi Chulo", text: "¿Me pasas el tema que sonó ayer?", time: "20:18" },
    { sender: "Mami Dembow", text: "Te lo mando ahora mismo, está duro.", time: "20:19" },
  ],
  "Yailin Flow ↔ Chapiadora 01": [
    { sender: "Chapiadora 01", text: "¿Vas para el corito mañana?", time: "19:58" },
    { sender: "Yailin Flow", text: "Claro que sí, no me lo pierdo.", time: "19:59" },
  ],
  "El Bori ↔ Karol G Fan": [
    { sender: "El Bori", text: "Ese coro está para repetirlo mil veces.", time: "19:30" },
    { sender: "Karol G Fan", text: "Total. Ya lo tengo en loop.", time: "19:31" },
  ],
};

async function api(action: string, args: any) {
  const r = await fetch("actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Error ${r.status}`);
  return j.data;
}
// ABASTHAN GRATIS — límites ligeros para no tumbar el plan gratuito.
// Un solo almacén ligero en el servidor + caché en memoria en el teléfono.
// Sin base de datos pesada, sin videos pesados en el servidor.
const MAX_GROUP_HISTORY = 500;
const MAX_DM_HISTORY = 200;
const MAX_MEDIA_MB = 30;
const FREE_PLAN_NOTE = "Plan gratis: el servidor puede dormirse si nadie lo usa. La app reconecta sola.";
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function normName(v: any) { return String(v || "").trim().toLowerCase(); }
function banKeyFor(name: string) { return `ban-${normName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "usuario"}`; }

// Carga TODAS las páginas de una colección. El servidor manda el historial
// completo, no solo la primera página.
async function listAll(collection: string) {
  const out: MsgRecord[] = [];
  let cursor: string | null | undefined = undefined;
  for (let page = 0; page < 20; page++) {
    const data: any = await api("records.list", { collection, limit: 100, ...(cursor ? { cursor } : {}) });
    out.push(...(data.records || []));
    cursor = data.next_cursor || data.nextCursor || null;
    if (!cursor) break;
  }
  return out;
}

function ChatApp() {
  const [view, setView] = useState<"login" | "chat">("login");
  const [name, setName] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [usedKey, setUsedKey] = useState("");
  const [tab, setTab] = useState<"grupo" | "privados">("grupo");
  const [showUsers, setShowUsers] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [spyTarget, setSpyTarget] = useState<string | null>(null);
  const [spyMode, setSpyMode] = useState(false);
  const [text, setText] = useState("");
  const [newKeyCode, setNewKeyCode] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [recordsMsgs, setRecordsMsgs] = useState<MsgRecord[]>([]);
  const [keyRecords, setKeyRecords] = useState<MsgRecord[]>([]);
  const [deletedDemo, setDeletedDemo] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [apiDown, setApiDown] = useState(false);
  const [sessionRecords, setSessionRecords] = useState<MsgRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoError, setVideoError] = useState("");
  const [cloudName, setCloudName] = useState("");
  const [uploadPreset, setUploadPreset] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [storageUrl, setStorageUrl] = useState("");
  const [videoConfig, setVideoConfig] = useState<any>(null);
  const [searchUser, setSearchUser] = useState("");
  const [banRecords, setBanRecords] = useState<MsgRecord[]>([]);
  const [confirmExpel, setConfirmExpel] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<string | null>(null);
  const [readMsgIds, setReadMsgIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [wakingUp, setWakingUp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bannedNames = useMemo(() => new Set(banRecords.map(r => normName(r.value?.name))), [banRecords]);
  const isBannedName = (n: string) => bannedNames.has(normName(n));
  const banRecordFor = (n: string) => banRecords.find(r => normName(r.value?.name) === normName(n));

  const builtInKeys = useMemo(() => [
    { code: "FAITH-ADMIN-2026", label: "Llave ADMIN · Faith", admin: true },
    { code: "GRUPO-DURO-1", label: "Llave Grupo Principal", admin: false },
  ], []);

  const allKeys = useMemo(() => {
    const map = new Map<string, { code: string; label: string; isOpen: boolean; admin: boolean; recordId?: string; isDeleted?: boolean }>();
    builtInKeys.forEach(k => map.set(k.code, { ...k, isOpen: true, isDeleted: false }));
    keyRecords.forEach(r => {
      const v = r.value || {};
      if (v.code) map.set(String(v.code).toUpperCase(), { code: String(v.code).toUpperCase(), label: v.label || "Llave creada", isOpen: v.isOpen !== false && !v.deleted, admin: !!v.admin, recordId: r.id, isDeleted: !!v.deleted });
    });
    return Array.from(map.values());
  }, [keyRecords, builtInKeys]);

  async function reloadRecords() {
    const [m, k, s, b, vc] = await Promise.all([
      listAll("duro_messages"),
      listAll("duro_keys"),
      listAll("duro_sessions"),
      listAll("duro_bans"),
      listAll("duro_video_config"),
    ]);
    setRecordsMsgs(m);
    setKeyRecords(k);
    setSessionRecords(s);
    setBanRecords(b);
    setSyncedCount(m.length);
    const latestConfig = [...(vc || [])].sort((a: any, b2: any) => String(b2.value?.updatedAt || b2.created_at || "").localeCompare(String(a.value?.updatedAt || a.created_at || "")))[0];
    if (latestConfig?.value) {
      setVideoConfig({ id: latestConfig.id, ...latestConfig.value });
      setCloudName(String(latestConfig.value.cloudName || ""));
      setUploadPreset(String(latestConfig.value.uploadPreset || ""));
      setApiKey(String(latestConfig.value.apiKey || ""));
      setStorageUrl(String(latestConfig.value.storageUrl || ""));
    }
    return { messages: m, keys: k, sessions: s, bans: b, videoConfig: latestConfig?.value || null };
  }

  // Sincronización estilo WhatsApp: pide TODO al servidor y solo marca
  // éxito cuando la lectura completa termina.
  async function syncFromServer(label = "") {
    setSyncing(true);
    setSyncError("");
    try {
      const data = await reloadRecords();
      setApiDown(false);
      setLastSyncAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return data;
    } catch (e: any) {
      setApiDown(true);
      setSyncError(e?.message || "No se pudo sincronizar con el servidor.");
      throw e;
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    (async () => {
      setSyncing(true);
      try {
        const { keys, sessions, bans } = await reloadRecords();
        setApiDown(false);
        setLastSyncAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        const banned = new Set((bans || []).map((r: any) => normName(r.value?.name)));
        const sorted = [...(sessions || [])].sort((a: any, b: any) => String(b.value?.createdAt || b.created_at || "").localeCompare(String(a.value?.createdAt || a.created_at || "")));
        const latest = sorted[0];
        if (latest?.value?.name && latest?.value?.key) {
          if (banned.has(normName(latest.value.name))) {
            try { await api("records.delete", { collection: "duro_sessions", id: latest.id }); } catch {}
            setLoginError("Fuiste expulsado por el admin. No puedes entrar con esa llave.");
            setView("login");
          } else {
            setName(String(latest.value.name));
            setUsedKey(String(latest.value.key).toUpperCase());
            setIsAdmin(!!latest.value.admin);
            setSessionId(latest.id);
            setView("chat");
          }
        } else {
          setView("login");
        }
      } catch {
        setApiDown(true);
        setSyncError("Sin conexión con el servidor. No se mostró historial guardado porque no hay caché local: vuelve a intentar al recuperar internet.");
        setView("login");
      } finally {
        setCheckingSession(false);
        setSyncing(false);
      }
    })();
  }, []);

  // RECONEXIÓN AUTOMÁTICA — ABASTHAN GRATIS
  // Si el plan gratis se duerme, la app reintenta sola sin que el usuario
  // tenga que recargar: espera creciente y vuelve a pedir el historial.
  useEffect(() => {
    if (!apiDown) { setReconnectAttempts(0); setWakingUp(false); return; }
    setWakingUp(true);
    const delay = Math.min(15000, 3000 * Math.pow(2, Math.min(reconnectAttempts, 2)));
    const id = window.setTimeout(() => {
      setReconnectAttempts(a => a + 1);
      syncFromServer().catch(() => {});
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiDown, reconnectAttempts]);

  // Al volver a la app (pestaña visible o ventana con foco), sincroniza de nuevo.
  useEffect(() => {
    if (view !== "chat") return;
    const onReturn = () => {
      if (document.visibilityState === "visible") syncFromServer().catch(() => {});
    };
    const onFocus = () => { syncFromServer().catch(() => {}); };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onFocus);
    };
  }, [view]);

  useEffect(() => {
    if (view !== "chat" || !name.trim()) return;
    const id = window.setInterval(async () => {
      try {
        const data = await api("records.list", { collection: "duro_bans" });
        const bans = data.records || [];
        setBanRecords(bans);
        const hit = bans.some((r: any) => normName(r.value?.name) === normName(name));
        if (hit) {
          if (sessionId) { try { await api("records.delete", { collection: "duro_sessions", id: sessionId }); } catch {} }
          setSessionId(null);
          setView("login");
          setSelectedDM(null); setSpyMode(false); setSpyTarget(null);
          setIsAdmin(false); setUsedKey(""); setKeyInput("");
          setLoginError("Fuiste expulsado por el admin. No puedes entrar con esa llave.");
        }
      } catch {}
    }, 8000);
    return () => window.clearInterval(id);
  }, [view, name, sessionId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: "auto" }); }, [recordsMsgs, tab, selectedDM, spyTarget]);

  const currentUser = name.trim() || "Tú";
  const cloudinaryConfigured = Boolean((videoConfig?.cloudName && videoConfig?.uploadPreset) || (cloudName.trim() && uploadPreset.trim()));
  const cloudinaryPresetLabel = videoConfig?.uploadPreset || uploadPreset.trim() || "grupo-secreto-privado";
  const cloudinaryFolder = "grupo-secreto";

  function goToGroup() {
    setSelectedDM(null);
    setSpyMode(false);
    setSpyTarget(null);
    setProfileUser(null);
    setTab("grupo");
  }
  function openProfile(userName: string) {
    if (!userName || normName(userName) === normName(currentUser)) return;
    if (isBannedName(userName)) return;
    setProfileUser(userName);
  }
  function openPrivate(other: string) {
    if (!other) return;
    setProfileUser(null);
    setShowUsers(false);
    setSpyMode(false);
    setSpyTarget(null);
    setTab("privados");
    setSelectedDM(other);
  }
  function markRoomRead(room: string) {
    const ids: string[] = [];
    recordsMsgs.forEach(r => { if (r.value?.kind === "dm" && r.value?.room === room) ids.push(r.id); });
    if (ids.length === 0) return;
    setReadMsgIds(prev => {
      const set = new Set(prev);
      let changed = false;
      ids.forEach(id => { if (!set.has(id)) { set.add(id); changed = true; } });
      return changed ? Array.from(set) : prev;
    });
  }
  useEffect(() => {
    if (!selectedDM) return;
    const room = [currentUser, selectedDM].sort().join(" ↔ ");
    markRoomRead(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDM, recordsMsgs]);

  async function handleLogin() {
    const n = name.trim(); const k = keyInput.trim().toUpperCase();
    if (!n) { setLoginError("Escribe tu nombre para entrar al grupo."); return; }
    if (!k) { setLoginError("Escribe la llave de acceso."); return; }
    if (isBannedName(n)) { setLoginError("Fuiste expulsado por el admin. No puedes entrar con esa llave."); return; }
    const found = allKeys.find(x => x.code === k);
    if (!found) { setLoginError("Llave no válida. Pide una llave activa al admin."); return; }
    if (found.isDeleted) { setLoginError("Esta llave fue eliminada. Llave cerrada, pide una nueva al admin."); return; }
    if (!found.isOpen) { setLoginError("Llave cerrada, pide una nueva al admin. Esta llave ya no deja entrar a gente nueva."); return; }
    setLoginError(""); setIsAdmin(found.admin); setUsedKey(k); setView("chat");
    try {
      const created = await api("records.create", { collection: "duro_sessions", value: { name: n, key: k, admin: found.admin, createdAt: new Date().toISOString() }, idempotency_key: `session-${Date.now().toString(36)}-${uid()}` });
      if (created?.id) {
        setSessionId(created.id);
        for (const old of sessionRecords) {
          if (old.id !== created.id) { try { await api("records.delete", { collection: "duro_sessions", id: old.id }); } catch {} }
        }
      }
    } catch {
      setSaveMsg("Entraste, pero la sesión no quedó guardada — el servicio no respondió.");
    }
    // Al entrar, sincroniza TODO el historial antes de darlo por listo.
    syncFromServer().catch(() => {});
  }

  async function handleLogout() {
    const id = sessionId;
    setSessionId(null);
    setView("login");
    setSelectedDM(null); setSpyMode(false); setSpyTarget(null);
    setIsAdmin(false); setUsedKey(""); setKeyInput(""); setName(""); setLoginError("");
    if (id) {
      try { await api("records.delete", { collection: "duro_sessions", id }); } catch {}
      try { await reloadRecords(); } catch {}
    }
  }

  async function expelUser(target: string) {
    const t = target.trim();
    if (!t) return;
    if (normName(t) === normName(currentUser)) { setSaveMsg("No puedes expulsarte a ti mismo."); setConfirmExpel(null); return; }
    if (isBannedName(t)) { setSaveMsg(`${t} ya está en la lista de expulsados.`); setConfirmExpel(null); return; }
    setBusy(true); setSaveMsg("");
    try {
      await api("records.create", { collection: "duro_bans", value: { name: t, bannedBy: currentUser, bannedAt: new Date().toISOString() }, idempotency_key: banKeyFor(t) });
      const fresh = await reloadRecords();
      for (const s of (fresh.sessions || [])) {
        if (normName(s.value?.name) === normName(t)) { try { await api("records.delete", { collection: "duro_sessions", id: s.id }); } catch {} }
      }
      await reloadRecords();
      setConfirmExpel(null);
      setSaveMsg(`${t} fue expulsado. Salió del chat al instante y no puede volver a entrar con esa llave hasta que lo perdones. Sus mensajes viejos quedan en el grupo.`);
    } catch (e: any) {
      setSaveMsg(e.message || "No se pudo expulsar a ese usuario.");
    } finally { setBusy(false); }
  }

  async function pardonUser(target: string) {
    const rec = banRecordFor(target);
    if (!rec) { setSaveMsg(`${target} no está en la lista de expulsados.`); return; }
    setBusy(true);
    try {
      await api("records.delete", { collection: "duro_bans", id: rec.id });
      await reloadRecords();
      setSaveMsg(`${target} fue perdonado. Ya puede volver a entrar con una llave abierta.`);
    } catch (e: any) { setSaveMsg(e.message || "No se pudo perdonar a ese usuario."); }
    finally { setBusy(false); }
  }

  async function createRow(row: any) {
    await api("records.create", { collection: "duro_messages", value: row, idempotency_key: `msg-${row._key}` });
  }

  async function sendMessage() {
    const t = text.trim(); if (!t || busy) return;
    if (isBannedName(currentUser)) { setLoginError("Fuiste expulsado por el admin. No puedes entrar con esa llave."); setView("login"); return; }
    const base: any = { sender: currentUser, text: t, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), createdAt: new Date().toISOString(), _key: uid() };
    let row: any;
    if (tab === "grupo" && !selectedDM && !spyMode) row = { ...base, kind: "group" };
    else if (selectedDM) row = { ...base, kind: "dm", room: [currentUser, selectedDM].sort().join(" ↔ ") };
    else if (spyMode && spyTarget) row = { ...base, kind: "dm", room: spyTarget, spyNote: true };
    else row = { ...base, kind: "group" };
    setBusy(true); setSaveMsg("");
    try {
      await createRow(row);
      // Solo después de que el servidor confirma, vuelve a pedir el historial.
      await reloadRecords();
      setLastSyncAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSaveMsg("Mensaje guardado en el servidor ✓"); setText("");
    } catch (e: any) {
      // No se inventa un mensaje guardado: si el servidor no confirma,
      // el texto se queda en la caja para reintentar.
      setSaveMsg(e.message || "No se guardó en el servidor. Tu mensaje no se envió — inténtalo de nuevo.");
    } finally { setBusy(false); }
  }

  async function deletePersisted(id: string) {
    try { await api("records.delete", { collection: "duro_messages", id }); await reloadRecords(); setSaveMsg("Mensaje borrado para todos."); }
    catch { setSaveMsg("No se pudo borrar en el servidor."); }
  }

  function isSafeVideoLink(v: string) {
    const t = String(v || "").trim();
    if (!t.toLowerCase().startsWith("https://")) return false;
    if (t.toLowerCase().startsWith("data:") || t.includes("container:")) return false;
    try { const u = new URL(t); return u.protocol === "https:"; } catch { return false; }
  }

  async function saveVideoConfig() {
    if (!cloudName.trim() || !uploadPreset.trim()) { setSaveMsg("Completa Cloud Name y Upload Preset para conectar la nube privada."); return; }
    setBusy(true); setSaveMsg("");
    const value = { cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim(), apiKey: apiKey.trim(), storageUrl: storageUrl.trim(), folder: "grupo-secreto", type: "authenticated", signed: true, updatedAt: new Date().toISOString(), updatedBy: currentUser };
    try {
      if (videoConfig?.id) await api("records.replace", { collection: "duro_video_config", id: videoConfig.id, value });
      else {
        const created = await api("records.create", { collection: "duro_video_config", value, idempotency_key: `video-config-${uid()}` });
        if (created?.id) setVideoConfig({ id: created.id, ...value });
      }
      setSaveMsg(`Cloudinary privado conectado: ${uploadPreset.trim()} / carpeta grupo-secreto / Signed. El chat seguirá guardando solo el link, no el archivo.`);
    } catch (e: any) { setSaveMsg(e.message || "No se pudo guardar la configuración de videos."); }
    finally { setBusy(false); }
  }

  async function sendVideoLink() {
    const link = videoUrl.trim();
    if (!isSafeVideoLink(link)) { setVideoError("Pega un link https:// válido de tu almacenamiento externo (por ejemplo, el link que te da Cloudinary o Supabase). No se sube ningún archivo desde esta app."); return; }
    if (isBannedName(currentUser)) { setLoginError("Fuiste expulsado por el admin. No puedes entrar con esa llave."); setView("login"); return; }
    const title = videoTitle.trim() || "Video compartido";
    const cloudinaryMode = Boolean((videoConfig?.cloudName && videoConfig?.uploadPreset) || (cloudName.trim() && uploadPreset.trim()));
    let row: any = { sender: currentUser, text: title, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), createdAt: new Date().toISOString(), _key: uid(), kind: "group", videoUrl: link, videoTitle: title, videoMode: cloudinaryMode ? "cloudinary-privado" : "local-demo", cloudinary: cloudinaryMode ? { cloudName: videoConfig?.cloudName || cloudName.trim(), uploadPreset: videoConfig?.uploadPreset || uploadPreset.trim(), folder: "grupo-secreto", type: "authenticated", signed: true, publicId: "auto-generado" } : null };
    if (tab === "privados" && selectedDM) row = { ...row, kind: "dm", room: [currentUser, selectedDM].sort().join(" ↔ ") };
    else if (spyMode && spyTarget) row = { ...row, kind: "dm", room: spyTarget, spyNote: true };
    setBusy(true); setVideoError(""); setSaveMsg("");
    try {
      await createRow(row);
      await reloadRecords();
      setLastSyncAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setVideoUrl(""); setVideoTitle(""); setShowImageInfo(false);
      setSaveMsg(cloudinaryMode ? "Video compartido desde Cloudinary privado: carpeta grupo-secreto / Signed. En el servidor solo quedó guardado el link, no el archivo ✓" : "Configura Cloudinary en Panel Admin para videos privados. Video compartido en modo local demo: en el servidor solo quedó guardado el link, no el archivo.");
    } catch (e: any) { setVideoError(e.message || "Sin conexión, video no enviado. El link no se guardó."); }
    finally { setBusy(false); }
  }

  async function createKey() {
    const code = newKeyCode.trim().toUpperCase(); if (!code) { setSaveMsg("Escribe el código de la nueva llave."); return; }
    setBusy(true);
    try { await api("records.create", { collection: "duro_keys", value: { code, label: newKeyLabel.trim() || "Llave creada por admin", isOpen: true, admin: false, createdAt: new Date().toISOString() }, idempotency_key: `key-${code}` }); await reloadRecords(); setNewKeyCode(""); setNewKeyLabel(""); setSaveMsg(`Llave ${code} creada y abierta.`); }
    catch (e: any) { setSaveMsg(e.message || "No se pudo crear la llave."); }
    finally { setBusy(false); }
  }

  async function toggleKey(k: any) {
    setBusy(true);
    try {
      const nextOpen = k.isDeleted ? true : !k.isOpen;
      if (k.recordId) await api("records.replace", { collection: "duro_keys", id: k.recordId, value: { code: k.code, label: k.label, isOpen: nextOpen, admin: k.admin, deleted: false, createdAt: new Date().toISOString() } });
      else await api("records.create", { collection: "duro_keys", value: { code: k.code, label: k.label, isOpen: nextOpen, admin: k.admin, deleted: false, createdAt: new Date().toISOString() }, idempotency_key: `key-toggle-${k.code}` });
      await reloadRecords(); setSaveMsg(nextOpen ? `Llave ${k.code} ABIERTA. Gente nueva puede entrar. Los que están dentro se quedan.` : `Llave ${k.code} CERRADA. Cerrada - nadie nuevo entra, los que están dentro se quedan.`);
    } catch (e: any) { setSaveMsg(e.message || "No se pudo cambiar la llave."); }
    finally { setBusy(false); }
  }

  async function deleteKey(k: any) {
    setBusy(true);
    try {
      if (k.recordId) await api("records.replace", { collection: "duro_keys", id: k.recordId, value: { code: k.code, label: k.label, isOpen: false, admin: k.admin, deleted: true, createdAt: new Date().toISOString() } });
      else await api("records.create", { collection: "duro_keys", value: { code: k.code, label: k.label, isOpen: false, admin: k.admin, deleted: true, createdAt: new Date().toISOString() }, idempotency_key: `key-delete-${k.code}` });
      await reloadRecords(); setSaveMsg(`Llave ${k.code} eliminada. Nadie nuevo entra con ella. Los que están dentro se quedan.`);
    } catch (e: any) { setSaveMsg(e.message || "No se pudo eliminar la llave."); }
    finally { setBusy(false); }
  }

  // Historial acotado para el plan gratis: se muestran solo los últimos
  // 500 del grupo y los últimos 200 de cada privado. Nada se borra del
  // servidor desde aquí; el recorte es solo de vista para no llenar RAM/disco.
  const groupPersisted = recordsMsgs.filter(r => r.value?.kind === "group").slice(-MAX_GROUP_HISTORY);
  const dmPersistedFor = (room: string) => recordsMsgs.filter(r => r.value?.kind === "dm" && r.value?.room === room).slice(-MAX_DM_HISTORY);
  const dmCount = recordsMsgs.filter(r => r.value?.kind === "dm").length;

  const filteredUsers = DEMO_USERS.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()));
  const unreadTotal = DEMO_USERS.reduce((a, u) => a + (u.unread || 0), 0);
  const dmPairs = useMemo(() => {
    const pairs = Object.keys(DEMO_DMS).map(p => ({ pair: p, last: DEMO_DMS[p][DEMO_DMS[p].length - 1].text, time: DEMO_DMS[p][DEMO_DMS[p].length - 1].time, count: DEMO_DMS[p].length }));
    recordsMsgs.filter(r => r.value?.kind === "dm").forEach(r => {
      const room = r.value.room; if (!pairs.find(x => x.pair === room)) pairs.push({ pair: room, last: r.value.text, time: r.value.time, count: 1 });
      else { const ex = pairs.find(x => x.pair === room)!; ex.last = r.value.text; ex.time = r.value.time; ex.count += 1; }
    });
    return pairs;
  }, [recordsMsgs]);

  const conversations = useMemo(() => {
    const map = new Map<string, { other: string; lastText: string; lastTime: string; lastSender: string; sortKey: string; unread: number }>();
    const read = new Set(readMsgIds);
    const add = (v: any, id: string, sortKey: string) => {
      if (!v || v.kind !== "dm" || !v.room) return;
      const parts = String(v.room).split(" ↔ ");
      if (!parts.includes(currentUser)) return;
      const other = parts.find((p: string) => p !== currentUser) || parts[0];
      if (!other) return;
      const prev = map.get(other);
      const isUnread = v.sender !== currentUser && !read.has(id);
      if (!prev || sortKey >= prev.sortKey) {
        map.set(other, { other, lastText: String(v.text || ""), lastTime: String(v.time || ""), lastSender: String(v.sender || ""), sortKey, unread: (prev?.unread || 0) + (isUnread ? 1 : 0) });
      } else if (isUnread) {
        prev.unread += 1;
      }
    };
    recordsMsgs.forEach(r => add(r.value, r.id, String(r.value?.createdAt || r.created_at || r.value?.time || "")));
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [recordsMsgs, currentUser, readMsgIds]);
  const conversationsUnread = conversations.reduce((a, c) => a + c.unread, 0);
  const profileData = profileUser ? (DEMO_USERS.find(u => u.name === profileUser) || { name: profileUser, country: "", flag: "", city: "", ip: "", mood: "Miembro del Grupo Secreto", last: "hoy", unread: 0 }) : null;

  const spyMessages = spyTarget ? [...(DEMO_DMS[spyTarget] || []).map((m, i) => ({ ...m, id: `spy-${i}`, demo: true })), ...dmPersistedFor(spyTarget).map(r => ({ sender: r.value.sender, text: r.value.text, time: r.value.time, id: r.id, demo: false }))] : [];

  if (checkingSession) {
    return (
      <div style={{ boxSizing: "border-box", minHeight: "100vh", background: "#000" }} className="overflow-x-clip">
        <div className="min-h-[100vh] flex flex-col items-center justify-center px-5">
          <div className="w-[56px] h-[56px] rounded-lg bg-[#ff0000] grid place-items-center text-[22px] font-black text-white">GS</div>
          <p className="text-white font-bold mt-4 text-[15px] flex items-center gap-2"><Loader2 size={16} className="animate-spin text-[#ff1a1a]" /> Cargando mensajes…</p>
          <p className="text-[#999] text-[12px] mt-1 text-center">Entrando directo con tu sesión guardada y pidiendo<br />todo el historial al servidor: grupo + privados.</p>
        </div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div style={{ boxSizing: "border-box", minHeight: "100vh", background: "#000" }} className="overflow-x-clip">
        <div className="min-h-[100vh] flex flex-col items-center justify-center px-5 py-8 relative overflow-x-clip">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(520px 320px at 50% 0%, rgba(255,0,0,.14), transparent 65%), radial-gradient(400px 300px at 90% 90%, rgba(139,0,0,.18), transparent 60%)" }} />
          <div className="relative w-full max-w-[440px]">
            <div className="flex items-center gap-2 justify-center mb-5"><span className="bg-[#111] border border-[#222] text-[#999] text-[11px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-md">SIN LLAMADAS · SOLO TEXTO</span></div>
            <div className="text-center">
              <div className="mx-auto w-[72px] h-[72px] rounded-lg bg-[#ff0000] grid place-items-center text-[28px] font-black text-white tracking-tight">GS</div>
              <div className="h-[2px] w-[64px] bg-[#ff0000] mx-auto mt-5" />
              <h1 className="font-display font-black uppercase leading-[0.92] mt-4 text-[clamp(38px,10vw,56px)] tracking-tight text-white">Grupo<br /><span className="text-[#ff0000]">Secreto</span></h1>
              <p className="text-[#999] mt-3 text-[15px] leading-snug">El chat grupal donde hablan todos.<br />Privados y acceso con llave.</p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5 mt-5">
              <label className="text-[12px] font-bold tracking-widest text-[#999]">TU NOMBRE</label>
              <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Pon cualquier nombre" className="mt-2 w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3.5 outline-none focus:border-[#ff0000] text-[16px] text-white placeholder:text-[#666]" />
              <label className="text-[12px] font-bold tracking-widest text-[#999] mt-4 block">LLAVE DE ACCESO</label>
              <input value={keyInput} onChange={e => setKeyInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Tu llave de acceso" className="mt-2 w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3.5 outline-none focus:border-[#ff0000] text-[16px] font-mono uppercase text-white placeholder:text-[#666]" />
              {loginError && <div className="mt-3 flex gap-2 bg-[#1a0000] border border-[#ff0000] text-white text-[13px] p-3 rounded-lg"><AlertTriangle size={16} className="shrink-0 mt-[1px] text-[#ff1a1a]" />{loginError}</div>}
              <button onClick={handleLogin} className="w-full mt-4 bg-[#ff0000] hover:bg-[#e00000] font-black uppercase tracking-wide py-3.5 rounded-lg text-[16px] text-white">Entrar al grupo →</button>
              <p className="text-center text-[12px] text-[#666] mt-3">Al entrar aceptas las reglas del grupo. Sin llamadas, sin audio, sin video.</p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 mt-3">
              <div className="flex gap-2 items-center text-[13px] font-bold text-white"><Cloud size={16} className="text-[#ff1a1a]" /> Guardado en el servidor — como WhatsApp</div>
              <p className="text-[12px] text-[#999] leading-snug mt-1.5">Si te vas y vuelves, al entrar se descarga el historial guardado: últimos 500 del grupo + últimos 200 por privado. Si mientras estabas fuera te enviaron mensajes, los ves al volver. Si Abasthan gratis se duerme, la app reconecta sola al despertar.</p>
              <div className="mt-3 bg-[#111] border border-[#222] rounded-lg px-3 py-2.5"><div className="text-[11px] font-black tracking-widest text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff0000] inline-block" /> MODO ABASTHAN GRATIS</div><ul className="text-[11px] text-[#999] leading-snug mt-1.5 list-disc pl-4 space-y-0.5"><li>Guardado ligero: un solo almacén en el servidor, sin base de datos pesada.</li><li>Historial: últimos 500 grupo · últimos 200 por privado.</li><li>Videos: NUNCA se guardan en Abasthan. El chat solo guarda texto + link. El archivo vive en tu almacenamiento externo gratis.</li><li>Si el servidor se duerme, reconexión automática — no recargues.</li></ul></div>
              <div className="mt-3 bg-[#1a0000] border border-[#ff0000] rounded-lg px-3 py-2.5"><div className="text-[11px] font-black tracking-widest text-white">VIDEOS FUERA DE ABASTHAN</div><p className="text-[11px] text-[#999] leading-snug mt-1">Sube tu video en tu cuenta gratis externa (Cloudinary 25 GB o Supabase Storage), copia su link https:// y pégalo en el chat con el botón de video. En el chat aparece con reproductor / link y botón Guardar / Descargar. Sin internet: “Sin conexión, video no enviado”. Esta app no sube archivos ni usa cámara o selector de archivos.</p></div>
              {syncError && <p className="text-[12px] text-[#ff1a1a] mt-2">{syncError}</p>}
            </div>

            <p className="text-center text-[11px] text-[#666] mt-4">Usa tu nombre y tu llave para entrar. Los mensajes se guardan.<br />Tu sesión queda guardada para entrar directo la próxima vez.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentRoom = selectedDM ? [currentUser, selectedDM].sort().join(" ↔ ") : "";
  const isSpyView = spyMode && !!spyTarget;

  return (
    <div style={{ boxSizing: "border-box", minHeight: "100vh", background: "#000" }} className="overflow-x-clip">
      <div className="max-w-[1100px] mx-auto min-h-[100vh] flex flex-col">
        {/* HEADER */}
        <header data-safe-area-sticky-top style={{ top: "var(--safe-area-inset-top)", borderBottom: "1px solid #ff0000" }} className="sticky z-30 bg-black">
          <div className="flex items-center gap-3 px-3 sm:px-5 py-3">
            <div className="relative shrink-0"><div className="w-11 h-11 rounded-md bg-[#ff0000] grid place-items-center text-[20px] font-black text-white">S</div><span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#ff0000] border-2 border-black rounded-full" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap"><h1 className="font-display font-black uppercase tracking-tight text-[18px] sm:text-[20px] leading-none truncate text-white">Grupo Secreto</h1>{isAdmin && <span className="bg-[#ff0000] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-wide">ADMIN</span>}</div>
              <div className="flex items-center gap-2 mt-1"><span className="flex items-center gap-1 text-[#ff1a1a] text-[12px] font-bold"><span className="w-2 h-2 rounded-full bg-[#ff0000]" />20 online</span><span className="text-[#666] text-[12px] hidden sm:inline">· {currentUser} · {isAdmin ? "modo admin" : "miembro"}</span></div>
            </div>
            <button onClick={() => syncFromServer().catch(() => {})} disabled={syncing} className="flex items-center gap-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] px-3 py-2 rounded-lg text-[13px] font-bold text-white disabled:opacity-60"><RefreshCw size={15} className={syncing ? "animate-spin text-[#ff1a1a]" : ""} /><span className="hidden sm:inline">{syncing ? "Cargando…" : "Sincronizar"}</span></button>
            <button onClick={() => { setShowUsers(true); setShowAdmin(false); }} className="flex items-center gap-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] px-3 py-2 rounded-lg text-[13px] font-bold text-white"><Users size={16} /> <span className="hidden sm:inline">Usuarios</span> <span className="bg-[#ff0000] px-1.5 rounded-full text-[11px] text-white">20</span></button>
            {isAdmin && <button onClick={() => { setShowAdmin(!showAdmin); setShowUsers(false); }} className="flex items-center gap-1.5 bg-[#ff0000] hover:bg-[#e00000] px-3 py-2 rounded-lg text-[13px] font-bold text-white"><Shield size={16} /> Admin {showAdmin ? "×" : ""}</button>}
            <button onClick={handleLogout} className="text-[#999] hover:text-white text-[12px] font-bold px-2">Salir</button>
          </div>
          <div className="flex px-3 sm:px-5 gap-2 pb-3">
            <button onClick={goToGroup} className={`flex-1 py-2.5 rounded-lg font-black uppercase text-[13px] tracking-wide ${tab === "grupo" && !isSpyView && !selectedDM ? "bg-[#ff0000] text-white" : "bg-[#111] text-[#999] hover:text-white"}`}>Grupo Secreto</button>
            <button onClick={() => { setTab("privados"); setSelectedDM(null); setSpyMode(false); setSpyTarget(null); }} className={`flex-1 py-2.5 rounded-lg font-black uppercase text-[13px] tracking-wide relative ${tab === "privados" && !isSpyView ? "bg-[#ff0000] text-white" : "bg-[#111] text-[#999] hover:text-white"}`}>Privados ({conversations.length}) {conversationsUnread > 0 && <span className="absolute -top-1 -right-1 bg-[#ff0000] text-[11px] px-1.5 rounded-full text-white">{conversationsUnread}</span>}</button>
            {isSpyView && <button onClick={() => setSpyMode(true)} className="flex-1 py-2.5 rounded-lg font-black uppercase text-[13px] bg-[#1a0000] border border-[#ff0000] text-white flex items-center justify-center gap-1"><Eye size={14} /> Espiando</button>}
          </div>
        </header>

        {/* SYNC STATUS — estilo WhatsApp */}
        {syncing && <div className="mx-3 sm:mx-5 mt-3 bg-[#1a0000] border border-[#ff0000] text-white text-[13px] px-3 py-2.5 rounded-lg flex gap-2 items-center"><Loader2 size={16} className="animate-spin shrink-0 text-[#ff1a1a]" /><span><strong>Cargando mensajes…</strong> Sincronizando el historial completo desde el servidor: grupo + cada privado.</span></div>}
        {!syncing && syncError && <div className="mx-3 sm:mx-5 mt-3 bg-[#1a0000] border border-[#ff0000] text-white text-[13px] px-3 py-2.5 rounded-lg flex gap-2 items-center flex-wrap"><AlertTriangle size={16} className="shrink-0 text-[#ff1a1a]" /><span className="flex-1 min-w-[180px]">Sin conexión con el servidor. No se mostró historial nuevo. Pulsa Sincronizar al volver internet.</span><button onClick={() => syncFromServer().catch(() => {})} className="bg-[#ff0000] px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0">Reintentar</button></div>}
        {!syncing && !syncError && <div className="mx-3 sm:mx-5 mt-3 bg-[#0a0a0a] border border-[#222] text-[#999] text-[12px] px-3 py-2 rounded-lg flex gap-2 items-center flex-wrap"><History size={14} className="text-[#ff1a1a] shrink-0" /><span>Abasthan gratis · Historial en vista{lastSyncAt ? ` · Sincronizado ${lastSyncAt}` : ""} · Grupo: {groupPersisted.length} / {MAX_GROUP_HISTORY} · Privados: {dmCount} mostrados (máx. {MAX_DM_HISTORY} por chat)</span><button onClick={() => syncFromServer().catch(() => {})} className="ml-auto text-white font-bold text-[12px] underline underline-offset-2">Actualizar</button></div>}
        {apiDown && <div className="mx-3 sm:mx-5 mt-3 bg-[#1a0000] border border-[#ff0000] text-white text-[12px] px-3 py-2 rounded-lg flex gap-2 items-center flex-wrap"><Loader2 size={14} className="animate-spin shrink-0 text-[#ff1a1a]" /><span className="flex-1 min-w-[180px]">{wakingUp ? "Abasthan gratis se durmió — despertándolo… reconexión automática en curso, no recargues." : "Sin conexión con el servidor. Reintentando solo."}{reconnectAttempts > 0 ? ` · Intento ${reconnectAttempts}` : ""}</span><button onClick={() => syncFromServer().catch(() => {})} className="bg-[#ff0000] px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0">Reintentar ahora</button></div>}
        {saveMsg && <div className="mx-3 sm:mx-5 mt-3 bg-[#0a0a0a] border border-[#ff0000] text-white text-[12px] px-3 py-2 rounded-lg flex gap-2"><CheckCircle2 size={14} className="text-[#ff1a1a]" />{saveMsg} <button onClick={() => setSaveMsg("")} className="ml-auto text-[#999] hover:text-white">×</button></div>}

        {/* ADMIN PANEL */}
        {showAdmin && isAdmin && (
          <section className="mx-3 sm:mx-5 mt-3 bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-display font-black uppercase tracking-tight text-[19px] flex gap-2 items-center text-white"><Shield className="text-[#ff1a1a]" /> Panel Admin</h2><p className="text-[12px] text-[#999]">Solo tú ves esto. Los usuarios no saben cuando espías.</p></div><button onClick={() => setShowAdmin(false)} className="bg-[#111] border border-[#222] p-2 rounded-lg text-white"><X size={16} /></button></div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div className="bg-black border border-[#222] rounded-xl p-3">
                <h3 className="font-bold uppercase tracking-wide flex gap-2 items-center text-[14px] text-white"><KeyRound size={16} className="text-[#ff1a1a]" /> Llaves de acceso</h3>
                <p className="text-[11px] text-[#999] mt-1">Llave solo para entrar, no para sacar. Cerrar o eliminar no saca a quienes ya están dentro.</p>
                <div className="space-y-2 mt-3">{allKeys.map(k => (
                  <div key={k.code} className="bg-[#111] border border-[#222] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1"><div className="font-mono font-bold text-[12px] break-words text-white">{k.code}</div><div className="text-[11px] text-[#999] truncate">{k.label} · {k.admin ? "Admin" : "Grupo"}</div></div>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-sm shrink-0 ${k.isDeleted ? "bg-[#111] text-[#999] border border-[#222]" : k.isOpen ? "bg-[#1a0000] text-[#ff1a1a] border border-[#ff0000]" : "bg-[#111] text-[#999] border border-[#222]"}`}>{k.isDeleted ? "● ELIMINADA" : k.isOpen ? "● ABIERTA" : "● CERRADA"}</span>
                    </div>
                    <p className="text-[11px] text-[#999] mt-1.5 leading-snug">{k.isDeleted ? "Eliminada — nadie nuevo entra. Los que están dentro se quedan." : k.isOpen ? "Abierta - gente nueva puede entrar" : "Cerrada - nadie nuevo entra, los que están dentro se quedan"}</p>
                    <div className="flex gap-2 mt-2">
                      <button disabled={busy} onClick={() => toggleKey(k)} className="bg-[#1a1a1a] hover:bg-[#222] border border-[#222] px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex gap-1 items-center shrink-0 text-white">{k.isDeleted || !k.isOpen ? <><Unlock size={12} /> {k.isDeleted ? "Reabrir" : "Abrir"}</> : <><Lock size={12} /> Cerrar</>}</button>
                      {!k.isDeleted && <button disabled={busy} onClick={() => deleteKey(k)} className="bg-[#1a1a1a] hover:bg-[#222] border border-[#222] px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex gap-1 items-center shrink-0 text-white"><Trash2 size={12} /> Eliminar</button>}
                    </div>
                  </div>))}
                </div>
                <div className="flex gap-2 mt-3"><input value={newKeyCode} onChange={e => setNewKeyCode(e.target.value)} placeholder="NUEVA-LLAVE-1" className="flex-1 min-w-0 bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[13px] font-mono uppercase outline-none text-white placeholder:text-[#666] focus:border-[#ff0000]" /><input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="Etiqueta" className="w-[110px] bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[13px] outline-none text-white placeholder:text-[#666] focus:border-[#ff0000]" /></div>
                <button disabled={busy} onClick={createKey} className="w-full mt-2 bg-[#ff0000] hover:bg-[#e00000] py-2.5 rounded-lg font-bold text-[13px] text-white flex items-center justify-center gap-1"><Plus size={15} /> Crear llave</button>
                <p className="text-[11px] text-[#666] mt-2">Si una llave está cerrada o eliminada, nadie nuevo entra con ella. Los que están dentro se quedan.</p>
              </div>

              <div className="bg-black border border-[#222] rounded-xl p-3">
                <h3 className="font-bold uppercase tracking-wide flex gap-2 items-center text-[14px] text-white"><Eye size={16} className="text-[#ff1a1a]" /> Quién habla con quién · Espía</h3>
                <p className="text-[11px] text-[#999] mt-1 flex gap-1 items-center"><Radio size={12} className="text-[#ff1a1a]" /> Feed espía en vivo — ellos no ven que estás dentro.</p>
                <div className="space-y-2 mt-3 max-h-[260px] overflow-auto pr-1">{dmPairs.map(d => (
                  <div key={d.pair} className="bg-[#111] border border-[#222] rounded-lg p-3">
                    <div className="flex justify-between gap-2"><span className="font-bold text-[13px] text-white">{d.pair}</span><span className="text-[11px] text-[#999] shrink-0">{d.time} · {d.count} msgs</span></div>
                    <p className="text-[12px] text-[#999] line-clamp-2 mt-1">Último: “{d.last}”</p>
                    <button onClick={() => { setSpyTarget(d.pair); setSpyMode(true); setShowAdmin(false); setTab("privados"); }} className="mt-2 w-full bg-[#1a0000] hover:bg-[#ff0000] border border-[#ff0000] py-2 rounded-lg font-black uppercase text-[12px] text-white flex items-center justify-center gap-1.5"><Eye size={14} /> Espiar este DM — Invisible</button>
                  </div>))}
                </div>
              </div>
            </div>

            <div className="bg-black border border-[#ff0000] rounded-xl p-3 mt-3">
              <h3 className="font-bold uppercase tracking-wide flex gap-2 items-center text-[14px] text-white"><Ban size={16} className="text-[#ff1a1a]" /> Expulsados · Baneados <span className="bg-[#ff0000] text-[11px] px-1.5 py-0.5 rounded-sm">{banRecords.length}</span></h3>
              <p className="text-[11px] text-[#999] mt-1 leading-snug">Expulsar NO es lo mismo que cerrar una llave. Llave cerrada = nadie nuevo entra, pero los de dentro se quedan. Expulsar = saca a ESA persona aunque ya esté dentro, borra su sesión y no puede volver a entrar con esa llave hasta que la perdones.</p>
              {banRecords.length === 0 ? (
                <p className="text-[12px] text-[#666] mt-3 bg-[#111] border border-[#222] rounded-lg px-3 py-3">Nadie expulsado todavía.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 mt-3">{banRecords.map(r => (
                  <div key={r.id} className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2.5">
                    <span className="w-8 h-8 rounded-md bg-[#ff0000] grid place-items-center font-black shrink-0 text-white text-[13px]">{String(r.value?.name || "?")[0]}</span>
                    <div className="min-w-0 flex-1"><div className="font-bold text-[13px] truncate text-white">{r.value?.name}</div><div className="text-[11px] text-[#999] truncate">Expulsado por {r.value?.bannedBy || "admin"}</div></div>
                    <button disabled={busy} onClick={() => pardonUser(String(r.value?.name || ""))} className="bg-[#ff0000] hover:bg-[#e00000] px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex gap-1 items-center shrink-0 text-white"><HeartHandshake size={12} /> Perdonar</button>
                  </div>
                ))}</div>
              )}
            </div>

            <div className="bg-black border border-[#ff0000] rounded-xl p-3 mt-3">
              <h3 className="font-bold uppercase tracking-wide flex gap-2 items-center text-[14px] text-white"><Cloud size={16} className="text-[#ff1a1a]" /> ☁️ VIDEOS - NUBE PRIVADA</h3>
              {cloudinaryConfigured ? (
                <div className="mt-2 bg-[#0a0a0a] border border-[#ff0000] rounded-lg px-3 py-2.5"><div className="text-[13px] font-bold text-white">✅ Conectado: {cloudinaryPresetLabel} / carpeta {cloudinaryFolder} / Signed</div><p className="text-[11px] text-[#999] mt-1">Nube: {videoConfig?.cloudName || cloudName} · Tipo: authenticated · Carpeta fija: {cloudinaryFolder}</p></div>
              ) : (
                <div className="mt-2 bg-[#1a0000] border border-[#222] rounded-lg px-3 py-2.5"><div className="text-[13px] font-bold text-white">Sin conectar</div><p className="text-[11px] text-[#999] mt-1">Configura Cloudinary en Panel Admin para videos privados. Mientras tanto el chat usa modo local demo.</p></div>
              )}
              <p className="text-[12px] text-[#999] leading-snug mt-3">Videos se guardan en Cloudinary privado con ID imposible de adivinar + link firmado. No quedan en Abasthan gratis, no salen en Google, solo los del grupo con llave pueden verlos.</p>
              <label className="text-[11px] font-bold tracking-widest text-[#999] mt-3 block">CLOUD NAME</label>
              <input value={cloudName} onChange={e => setCloudName(e.target.value)} placeholder="Ej: ykv5u6uq" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 outline-none focus:border-[#ff0000] text-[14px] text-white placeholder:text-[#666]" />
              <label className="text-[11px] font-bold tracking-widest text-[#999] mt-3 block">UPLOAD PRESET</label>
              <input value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} placeholder="Ej: grupo-secreto-privado" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 outline-none focus:border-[#ff0000] text-[14px] text-white placeholder:text-[#666]" />
              <label className="text-[11px] font-bold tracking-widest text-[#999] mt-3 block">API KEY</label>
              <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key de tu cuenta Cloudinary" autoComplete="off" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 outline-none focus:border-[#ff0000] text-[14px] font-mono text-white placeholder:text-[#666]" />
              <label className="text-[11px] font-bold tracking-widest text-[#999] mt-3 block">SUPABASE URL (ALTERNATIVA, OPCIONAL)</label>
              <input value={storageUrl} onChange={e => setStorageUrl(e.target.value)} placeholder="https://tu-proyecto.supabase.co" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 outline-none focus:border-[#ff0000] text-[14px] text-white placeholder:text-[#666]" />
              <div className="mt-3 bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[11px] text-[#999] leading-snug"><strong className="text-white">Ajustes fijos al compartir:</strong> folder = {cloudinaryFolder} · type = authenticated · public_id = auto-generado, imposible de adivinar · link firmado (Signed).</div>
              <button disabled={busy} onClick={saveVideoConfig} className="w-full mt-3 bg-[#ff0000] hover:bg-[#e00000] disabled:opacity-60 py-2.5 rounded-lg font-bold text-[13px] text-white">Guardar configuración</button>
              <p className="text-[11px] text-[#999] mt-2 leading-snug">Se guarda en el servidor para todo el grupo. La subida de archivos desde esta app no está disponible todavía: comparte el link firmado de Cloudinary y el video se reproduce aquí.</p>
            </div>

            <div className="bg-black border border-[#222] rounded-xl p-3 mt-3">
              <h3 className="font-bold uppercase tracking-wide flex gap-2 items-center text-[14px] text-white"><Globe size={16} className="text-[#ff1a1a]" /> Usuarios + País · Ciudad · IP</h3>
              <div className="grid sm:grid-cols-2 gap-2 mt-3">{DEMO_USERS.map(u => {
                const banned = isBannedName(u.name);
                const isMe = normName(u.name) === normName(currentUser);
                return (
                <div key={u.name} className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2">
                  <span className="text-[20px]">{u.flag}</span>
                  <div className="min-w-0 flex-1"><div className="font-bold text-[13px] truncate text-white">{u.name} {banned && <span className="text-[#ff1a1a] text-[11px]">· EXPULSADO</span>}</div><div className="text-[11px] text-[#999] truncate">{u.country} · {u.city}</div></div>
                  <span className="font-mono text-[11px] text-[#666] shrink-0 hidden sm:inline">{u.ip}</span>
                  {banned ? (
                    <button disabled={busy} onClick={() => pardonUser(u.name)} className="bg-[#111] hover:bg-[#1a1a1a] border border-[#222] px-2 py-1.5 rounded-lg text-[11px] font-bold shrink-0 text-white">Perdonar</button>
                  ) : isMe ? (
                    <span className="text-[11px] text-[#666] font-bold shrink-0 px-1">Tú</span>
                  ) : confirmExpel === u.name ? (
                    <span className="flex gap-1 shrink-0">
                      <button disabled={busy} onClick={() => expelUser(u.name)} className="bg-[#ff0000] px-2 py-1.5 rounded-lg text-[11px] font-bold text-white">¿Seguro?</button>
                      <button onClick={() => setConfirmExpel(null)} className="bg-[#1a1a1a] border border-[#222] px-2 py-1.5 rounded-lg text-[11px] font-bold text-white">No</button>
                    </span>
                  ) : (
                    <button disabled={busy} onClick={() => setConfirmExpel(u.name)} className="bg-[#ff0000] hover:bg-[#e00000] px-2 py-1.5 rounded-lg text-[11px] font-bold flex gap-1 items-center shrink-0 text-white"><UserX size={12} /> Expulsar</button>
                  )}
                </div>);
              })}</div>
              <p className="text-[11px] text-[#666] mt-2">Solo el admin ve los botones Expulsar / Perdonar. Expulsar saca a esa persona aunque ya esté dentro.</p>
            </div>
          </section>
        )}

        {/* USERS DRAWER */}
        {showUsers && (
          <section className="mx-3 sm:mx-5 mt-3 bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
            <div className="flex justify-between items-center"><h2 className="font-display font-black uppercase tracking-tight text-[18px] text-white">Usuarios en línea <span className="text-[#ff1a1a]">· 20 online</span></h2><button onClick={() => setShowUsers(false)} className="bg-[#111] border border-[#222] p-2 rounded-lg text-white"><X size={16} /></button></div>
            <div className="relative mt-3"><Search size={16} className="absolute left-3 top-3 text-[#666]" /><input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Buscar usuario…" className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-3 py-2.5 outline-none text-[14px] text-white placeholder:text-[#666] focus:border-[#ff0000]" /></div>
            {isAdmin && <p className="text-[12px] text-[#ff1a1a] font-bold mt-3 flex gap-1 items-center"><Ban size={13} /> Modo admin: puedes expulsar a cualquier usuario. El usuario normal no ve estos botones.</p>}
            <div className="grid sm:grid-cols-2 gap-2 mt-3 max-h-[340px] overflow-auto">{filteredUsers.map(u => {
              const banned = isBannedName(u.name);
              const isMe = normName(u.name) === normName(currentUser);
              return (
              <div key={u.name} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-lg p-2 text-left">
                <button onClick={() => { if (banned) return; openProfile(u.name); }} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <span className="w-10 h-10 rounded-md bg-[#ff0000] grid place-items-center font-black shrink-0 text-white">{u.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="font-bold text-[14px] block truncate text-white">{u.name} {u.flag} {banned && <span className="text-[#ff1a1a] text-[11px]">· EXPULSADO</span>}</span><span className="text-[12px] text-[#999] block truncate">{banned ? "Expulsado por el admin" : `${u.mood} · ${u.city}`}</span></span>
                  {u.unread && !banned ? <span className="bg-[#ff0000] text-[11px] px-1.5 py-0.5 rounded-full font-bold text-white">{u.unread}</span> : null}
                  <span className="text-[#666] text-[12px]">›</span>
                </button>
                {isAdmin && !isMe && !banned && (confirmExpel === `users-${u.name}` ? (
                  <span className="flex gap-1 shrink-0">
                    <button disabled={busy} onClick={() => expelUser(u.name)} className="bg-[#ff0000] px-2 py-1.5 rounded-lg text-[11px] font-bold text-white">¿Seguro?</button>
                    <button onClick={() => setConfirmExpel(null)} className="bg-[#1a1a1a] border border-[#222] px-2 py-1.5 rounded-lg text-[11px] font-bold text-white">No</button>
                  </span>
                ) : (
                  <button disabled={busy} onClick={() => setConfirmExpel(`users-${u.name}`)} className="bg-[#ff0000] hover:bg-[#e00000] px-2 py-1.5 rounded-lg text-[11px] font-bold flex gap-1 items-center shrink-0 text-white"><UserX size={12} /> Expulsar</button>
                ))}
                {isAdmin && !isMe && banned && <button disabled={busy} onClick={() => pardonUser(u.name)} className="bg-[#111] border border-[#222] px-2 py-1.5 rounded-lg text-[11px] font-bold shrink-0 text-white">Perdonar</button>}
                {isAdmin && isMe && <span className="text-[11px] text-[#666] font-bold shrink-0 px-1">Tú</span>}
              </div>);
            })}</div>
            <p className="text-[12px] text-[#666] mt-3">Toca un usuario para ver su perfil y hablar en privado.</p>
            <button onClick={handleLogout} className="mt-3 w-full bg-[#111] border border-[#222] hover:border-[#ff0000] py-2.5 rounded-lg text-[12px] font-bold text-[#999] hover:text-white">Salir / Cerrar sesión</button>
            <p className="text-[11px] text-[#666] mt-2 text-center">Borra tu sesión guardada y vuelve al login.</p>
          </section>
        )}

        {/* MAIN CHAT */}
        <main className="flex-1 flex flex-col px-3 sm:px-5 py-3 min-h-0">
          {isSpyView ? (
            <div className="flex-1 flex flex-col min-h-[420px]">
              <div className="bg-[#0a0a0a] border border-[#ff0000] rounded-t-xl px-4 py-3 flex items-center gap-3"><Eye className="text-[#ff1a1a]" /><div className="flex-1 min-w-0"><div className="font-black uppercase tracking-tight text-[15px] truncate text-white">Espiando: {spyTarget} <span className="bg-[#ff0000] text-[10px] px-1.5 py-0.5 rounded-sm ml-1 text-white">Invisible</span></div><div className="text-[12px] text-[#999]">Ellos NO ven que estás aquí · Modo solo lectura + feed en vivo</div></div><button onClick={() => { setSpyMode(false); setSpyTarget(null); }} className="bg-[#111] border border-[#222] hover:border-[#ff0000] px-3 py-2 rounded-lg text-[12px] font-bold shrink-0 text-white">Salir del espionaje</button></div>
              <div ref={scrollRef} className="flex-1 overflow-auto bg-black border-x border-[#222] px-3 py-4 space-y-3">
                {spyMessages.length === 0 && <p className="text-center text-[#999] text-[13px] py-10">Sin mensajes en este DM todavía.</p>}
                {spyMessages.map((m: any) => (<div key={m.id} className={`max-w-[82%] px-3 py-2 rounded-lg text-[14px] leading-snug ${m.sender === spyTarget?.split(" ↔ ")[0] ? "bg-[#111] border border-[#222] ml-0" : "bg-[#1a0000] border border-[#222] ml-auto"}`}><div className="text-[11px] font-bold text-[#ff1a1a]">{m.sender} · {m.time}</div><div className="mt-0.5 text-white">{m.text}</div></div>))}
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-b-xl px-4 py-3 flex gap-2 items-center text-[13px] text-[#999]"><Activity size={16} className="text-[#ff1a1a]" /> Feed espía en vivo · {spyMessages.length} mensajes · Actualizado al entrar al DM</div>
            </div>
          ) : tab === "grupo" && !selectedDM ? (
            <div className="flex-1 flex flex-col min-h-[420px]">
              <div className="bg-[#0a0a0a] border border-[#222] rounded-t-xl px-4 py-3 flex items-center gap-3"><div className="w-10 h-10 rounded-md bg-[#ff0000] grid place-items-center font-black shrink-0 text-white">S</div><div className="min-w-0 flex-1"><div className="font-black uppercase tracking-tight text-white">Grupo Secreto <span className="text-[#ff1a1a] text-[12px]">● 20 online</span></div><div className="text-[12px] text-[#999] truncate">Todos hablan aquí · {DEMO_USERS.slice(0, 3).map(u => u.name).join(", ")} y 17 más</div></div><button onClick={() => setShowUsers(true)} className="text-[12px] font-bold bg-[#111] hover:bg-[#1a1a1a] border border-[#222] px-3 py-2 rounded-lg shrink-0 text-white">Ver usuarios</button></div>
              <div ref={scrollRef} className="flex-1 overflow-auto bg-black border-x border-[#222] px-3 sm:px-4 py-4 space-y-3">
                <div className="text-center"><span className="bg-[#111] border border-[#222] text-[11px] text-[#999] px-3 py-1.5 rounded-full">Los mensajes están guardados en el servidor · Hoy</span></div>
                {DEMO_GROUP.filter(m => !deletedDemo.includes(m.id)).map(m => (
                  <div key={m.id} className="flex gap-2 group"><span className="w-8 h-8 rounded-md grid place-items-center text-[13px] font-black shrink-0" style={{ background: "#111", color: m.color, border: "1px solid #222" }}>{m.sender[0]}</span><div className="bubble-in max-w-[86%] sm:max-w-[78%] px-3 py-2 rounded-lg"><div className="flex gap-2 items-baseline"><span className="font-bold text-[12px]" style={{ color: m.color }}>{m.sender}</span><span className="text-[10px] text-[#666]">{m.time}</span></div><p className="text-[14px] leading-snug mt-0.5 break-words text-white">{m.text}</p></div>{(isAdmin) && <button onClick={() => setDeletedDemo(p => [...p, m.id])} title="Borrar (admin)" className="opacity-0 group-hover:opacity-100 self-center text-[#666] hover:text-[#ff1a1a] p-1"><Trash2 size={15} /></button>}</div>))}
                {groupPersisted.map(r => {
                  const v = r.value; const mine = v.sender === currentUser;
                  return (<div key={r.id} className={`flex gap-2 group ${mine ? "justify-end" : ""}`}>{!mine && <span className="w-8 h-8 rounded-md bg-[#ff0000] grid place-items-center text-[13px] font-black shrink-0 text-white">{v.sender?.[0]}</span>}<div className={`max-w-[86%] sm:max-w-[78%] px-3 py-2 rounded-lg ${mine ? "bubble-out" : "bubble-in"}`}><div className="flex gap-2 items-baseline"><span className="font-bold text-[12px] text-white">{v.sender}</span><span className="text-[10px] opacity-70 text-white">{v.time}</span></div><p className="text-[14px] leading-snug mt-0.5 break-words text-white">{v.text}</p>{v.videoUrl && <div className="mt-2 bg-black/30 border border-white/20 rounded-lg p-2.5"><div className="text-[12px] font-bold text-white">▶ Video · {cloudinaryConfigured ? `Cloudinary privado · ${cloudinaryFolder} / Signed` : "Modo local demo"}</div><p className="text-[11px] text-white/80 break-words mt-1">{v.videoTitle || "Video compartido"}</p><video controls preload="metadata" src={v.videoUrl} className="w-full rounded-lg mt-2 bg-black max-h-[320px]" /><div className="flex gap-2 mt-2 flex-wrap"><a href={v.videoUrl} target="_blank" rel="noopener" className="bg-white text-black px-3 py-1.5 rounded-lg text-[12px] font-bold">Ver video</a><a href={v.videoUrl} target="_blank" rel="noopener" download className="bg-black/60 border border-white/30 text-white px-3 py-1.5 rounded-lg text-[12px] font-bold">Guardar / Descargar</a></div><p className="text-[10px] text-white/60 mt-1.5 break-all">{String(v.videoUrl).slice(0, 80)}…</p></div>}</div>{(mine || isAdmin) && <button onClick={() => deletePersisted(r.id)} title="Borrar mensaje para todos" className="opacity-0 group-hover:opacity-100 self-center text-[#666] hover:text-[#ff1a1a] p-1"><Trash2 size={15} /></button>}</div>);
                })}
                {groupPersisted.length === 0 && <p className="text-center text-[12px] text-[#666] pt-2">Sé el primero en romper el hielo. Tu mensaje quedará guardado en el servidor.</p>}
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-b-xl px-3 py-3"><InputBar text={text} setText={setText} onSend={sendMessage} busy={busy} onImage={() => setShowImageInfo(true)} /></div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-[420px]">
              {!selectedDM ? (
                <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
                  <h2 className="font-display font-black uppercase tracking-tight text-[20px] flex gap-2 items-center flex-wrap text-white"><MessageCircle /> Privados ({conversations.length}) {conversationsUnread > 0 && <span className="bg-[#ff0000] text-[12px] px-2 py-0.5 rounded-sm text-white">{conversationsUnread} nuevos</span>}</h2>
                  <p className="text-[13px] text-[#999] mt-1">Cada fila es un chat SEPARADO por persona, como WhatsApp. Hablar con 2 usuarios crea 2 chats, con 5 usuarios crea 5 chats. Cada uno tiene su propio historial y su propio contador de no leídos — nada se mezcla. Al volver, se sincroniza la lista con el último mensaje de cada privado.</p>
                  {conversations.length === 0 ? (
                    <div className="mt-4 bg-[#111] border border-[#222] rounded-xl p-5 text-center">
                      <p className="text-[14px] text-white font-bold">Sin conversaciones privadas.</p>
                      <p className="text-[13px] text-[#999] mt-1">Toca un usuario en línea para hablar en privado.</p>
                      <button onClick={() => setShowUsers(true)} className="mt-3 bg-[#ff0000] hover:bg-[#e00000] px-4 py-2.5 rounded-lg font-bold text-[13px] text-white">Ver usuarios en línea</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4">{conversations.map(c => {
                      return (
                      <button key={c.other} onClick={() => openPrivate(c.other)} aria-label={`Abrir chat privado separado con ${c.other}`} className="flex gap-3 bg-[#111] border border-[#222] hover:border-[#ff0000] rounded-xl p-3 text-left w-full">
                        <span className="relative shrink-0"><span className="w-11 h-11 rounded-md bg-[#ff0000] grid place-items-center font-black text-white">{c.other[0]}</span><span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22c55e] border-2 border-black rounded-full" /></span>
                        <span className="min-w-0 flex-1"><span className="font-bold text-[14px] block truncate text-white">{c.other}</span><span className="text-[12px] text-[#999] block truncate">{c.lastSender === currentUser ? `Tú: ${c.lastText}` : `${c.lastSender}: ${c.lastText}`}</span></span>
                        <span className="flex flex-col items-end gap-1 shrink-0"><span className="text-[11px] text-[#999]">{c.lastTime}</span>{c.unread > 0 ? <span className="bg-[#ff0000] text-[11px] h-6 min-w-[24px] px-2 rounded-full grid place-items-center font-bold text-white">{c.unread}</span> : null}</span>
                      </button>);
                    })}</div>
                  )}
                  <button onClick={goToGroup} className="mt-4 w-full bg-[#111] border border-[#222] hover:border-[#ff0000] py-3 rounded-lg font-bold text-[13px] text-white flex items-center justify-center gap-2"><ChevronLeft size={16} /> Volver al Grupo Secreto</button>
                  {isAdmin && <button onClick={() => { setShowAdmin(true); }} className="mt-2 w-full bg-[#1a0000] border border-[#ff0000] hover:bg-[#ff0000] py-3 rounded-lg font-bold text-[13px] text-white flex items-center justify-center gap-2"><Eye size={16} /> ADMIN: ver quién habla con quién</button>}
                </div>
              ) : (
                <>
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-t-xl px-3 py-3 flex items-center gap-3"><button onClick={goToGroup} aria-label="Volver al Grupo Secreto" title="Volver al Grupo Secreto" className="bg-[#111] border border-[#222] hover:border-[#ff0000] p-2 rounded-lg text-white shrink-0"><ChevronLeft size={18} /></button><span className="relative shrink-0"><span className="w-10 h-10 rounded-md bg-[#ff0000] grid place-items-center font-black text-white">{selectedDM[0]}</span><span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22c55e] border-2 border-black rounded-full" /></span><div className="flex-1 min-w-0"><div className="font-black truncate text-white">{selectedDM}</div><div className="text-[12px] text-[#22c55e] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" /> En línea · privado</div></div><button onClick={goToGroup} className="text-[12px] bg-[#111] border border-[#222] hover:border-[#ff0000] px-2 py-1 rounded-full text-[#999] hover:text-white shrink-0">Grupo</button></div>
                  <div className="bg-[#1a0000] border-x border-b border-[#ff0000] px-3 py-2 text-[12px] text-white">Chat separado · Solo tú y <strong>{selectedDM}</strong> ven estos mensajes. Lo que escribas aquí no aparece en otro privado ni en el grupo.</div>
                  <div ref={scrollRef} className="flex-1 overflow-auto bg-black border-x border-[#222] px-3 py-4 space-y-3">
                    {dmPersistedFor(currentRoom).map(r => { const v = r.value; const mine = v.sender === currentUser; return (<div key={r.id} className={`flex ${mine ? "justify-end" : ""}`}><div className={`max-w-[82%] px-3 py-2 rounded-lg text-[14px] text-white ${mine ? "bubble-out" : "bubble-in"}`}><div className="text-[11px] font-bold opacity-80">{v.sender} · {v.time}</div><div className="mt-0.5 break-words">{v.text}</div>{v.videoUrl && <div className="mt-2 bg-black/30 border border-white/20 rounded-lg p-2.5"><div className="text-[12px] font-bold">▶ Video · {cloudinaryConfigured ? `Cloudinary privado · ${cloudinaryFolder} / Signed` : "Modo local demo"}</div><video controls preload="metadata" src={v.videoUrl} className="w-full rounded-lg mt-2 bg-black max-h-[320px]" /><div className="flex gap-2 mt-2 flex-wrap"><a href={v.videoUrl} target="_blank" rel="noopener" className="bg-white text-black px-3 py-1.5 rounded-lg text-[12px] font-bold">Ver video</a><a href={v.videoUrl} target="_blank" rel="noopener" download className="bg-black/60 border border-white/30 text-white px-3 py-1.5 rounded-lg text-[12px] font-bold">Guardar / Descargar</a></div></div>}</div>{(mine || isAdmin) && <button onClick={() => deletePersisted(r.id)} className="self-center ml-1 text-[#666] hover:text-[#ff1a1a] p-1"><Trash2 size={14} /></button>}</div>); })}
                    {dmPersistedFor(currentRoom).length === 0 && <p className="text-center text-[13px] text-[#999] py-8">Sin mensajes todavía.<br />Escríbele a {selectedDM} — queda guardado en el servidor.</p>}
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-b-xl px-3 py-3"><InputBar text={text} setText={setText} onSend={sendMessage} busy={busy} onImage={() => setShowImageInfo(true)} /></div>
                </>
              )}
            </div>
          )}
          {showImageInfo && <div className="mt-3 bg-[#0a0a0a] border border-[#ff0000] rounded-xl p-4"><div className="flex gap-3"><ImagePlus className="text-[#ff1a1a] shrink-0" /><div className="flex-1"><div className="font-bold uppercase tracking-wide text-[14px] text-white">Compartir video · Solo link</div><p className="text-[13px] text-[#999] mt-1">Videos fuera de Abasthan: el archivo NO se guarda aquí. Copia el link firmado https:// de tu video en Cloudinary privado y pégalo abajo. En el chat solo queda texto + link, que pesa casi nada. Sin internet: “Sin conexión, video no enviado”. La subida de archivos desde esta app no está disponible todavía: no hay cámara, grabadora o selector de archivos.</p>{cloudinaryConfigured ? <p className="text-[12px] text-white mt-2 font-bold">✅ Conectado: {cloudinaryPresetLabel} / carpeta {cloudinaryFolder} / Signed · folder = grupo-secreto · type = authenticated · public_id auto-generado</p> : <p className="text-[12px] text-[#ff1a1a] mt-2 font-bold">Configura Cloudinary en Panel Admin para videos privados — ahora estás en modo local demo.</p>}{videoConfig?.cloudName && <p className="text-[12px] text-[#999] mt-2">Config guardada: Cloudinary {videoConfig.cloudName}{videoConfig?.uploadPreset ? ` · Preset ${videoConfig.uploadPreset}` : ""}</p>}{videoConfig?.storageUrl && <p className="text-[12px] text-[#999] mt-1">Supabase: {videoConfig.storageUrl}</p>}</div><button onClick={() => { setShowImageInfo(false); setVideoError(""); }} className="bg-[#111] border border-[#222] hover:border-[#ff0000] px-3 py-1.5 rounded-lg text-[12px] font-bold h-fit text-white shrink-0">Cerrar</button></div><label className="text-[11px] font-bold tracking-widest text-[#999] mt-4 block">TÍTULO DEL VIDEO (OPCIONAL)</label><input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Ej: Dembow nuevo" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-3 outline-none focus:border-[#ff0000] text-[15px] text-white placeholder:text-[#666]" /><label className="text-[11px] font-bold tracking-widest text-[#999] mt-3 block">LINK HTTPS:// DEL VIDEO</label><input value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setVideoError(""); }} placeholder="https://… link de Cloudinary o Supabase" className="mt-1.5 w-full bg-[#111] border border-[#222] rounded-lg px-3 py-3 outline-none focus:border-[#ff0000] text-[15px] text-white placeholder:text-[#666]" />{videoError && <p className="text-[13px] text-[#ff1a1a] mt-2">{videoError}</p>}<div className="flex gap-2 mt-3 flex-wrap"><button disabled={busy || !videoUrl.trim()} onClick={sendVideoLink} className="bg-[#ff0000] hover:bg-[#e00000] disabled:opacity-40 px-4 py-3 rounded-lg font-bold text-[14px] text-white flex-1 min-w-[180px]">{busy ? "Enviando…" : "Enviar video (solo link)"}</button><button onClick={() => { setShowImageInfo(false); setVideoError(""); }} className="bg-[#111] border border-[#222] px-4 py-3 rounded-lg font-bold text-[14px] text-white">Cancelar</button></div><p className="text-[11px] text-[#666] mt-2">Se compartirá en {tab === "privados" && selectedDM ? `privado con ${selectedDM}` : "Grupo Secreto"}. Los mensajes de texto siempre se guardan en el servidor Abasthan, porque pesan poco.</p></div>}
          {profileUser && profileData && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4" onClick={() => setProfileUser(null)}>
              <div className="w-full max-w-[400px] bg-[#0a0a0a] border border-[#222] rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold tracking-widest text-[#999]">PERFIL</span>
                  <button onClick={() => setProfileUser(null)} aria-label="Cerrar perfil" className="bg-[#111] border border-[#222] p-2 rounded-lg text-white"><X size={16} /></button>
                </div>
                <div className="flex flex-col items-center text-center mt-2">
                  <span className="relative"><span className="w-[88px] h-[88px] rounded-2xl bg-[#ff0000] grid place-items-center font-black text-white text-[36px]">{profileData.name[0]}</span><span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] border-4 border-black rounded-full" /></span>
                  <h3 className="font-display font-black uppercase tracking-tight text-[24px] mt-3 text-white break-words">{profileData.name}</h3>
                  {DEMO_USERS.some(u => u.name === profileData.name) ? (
                    <p className="text-[13px] text-[#22c55e] font-bold flex items-center gap-1.5 mt-1"><span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" /> En línea</p>
                  ) : (
                    <p className="text-[13px] text-[#999] font-bold mt-1">Última vez hoy</p>
                  )}
                  <p className="text-[13px] text-[#999] mt-2">{profileData.mood || "Miembro del Grupo Secreto"}</p>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-xl p-3 mt-4 text-left">
                  <div className="text-[11px] font-bold tracking-widest text-[#999]">NOMBRE</div>
                  <div className="font-bold text-[15px] text-white mt-0.5 break-words">{profileData.name}</div>
                  {isAdmin && profileData.country ? (
                    <div className="mt-3 pt-3 border-t border-[#222]"><div className="text-[11px] font-bold tracking-widest text-[#ff1a1a]">SOLO ADMIN</div><div className="text-[13px] text-[#999] mt-1">{profileData.country} · {profileData.city}</div><div className="font-mono text-[12px] text-[#999] mt-0.5">IP: {profileData.ip}</div></div>
                  ) : (
                    <div className="text-[12px] text-[#666] mt-2">Miembro del Grupo Secreto · Chat privado 1 a 1</div>
                  )}
                </div>
                <button onClick={() => openPrivate(profileData.name)} className="w-full mt-4 bg-[#ff0000] hover:bg-[#e00000] py-3.5 rounded-xl font-black uppercase tracking-wide text-[15px] text-white flex items-center justify-center gap-2"><MessageCircle size={18} /> Hablar en privado</button>
                <button onClick={() => setProfileUser(null)} className="w-full mt-2 bg-[#111] border border-[#222] hover:border-[#ff0000] py-3 rounded-xl font-bold text-[14px] text-white">Cancelar</button>
                <p className="text-center text-[11px] text-[#666] mt-2">Cancelar te deja donde estabas.</p>
              </div>
            </div>
          )}
          <p className="text-center text-[11px] text-[#666] mt-3 flex items-center justify-center gap-1 flex-wrap"><Wifi size={12} /> Guardado en el servidor · Sincroniza al volver · <MapPin size={12} /> {isAdmin ? "Admin puede ver país y espiar DMs" : "Chat grupal + privados"} · Sin llamadas, sin audio, sin video</p>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)", minHeight: "100vh", background: "#000" }} className="overflow-x-clip">
      <ChatApp />
    </div>
  );
}

function InputBar({ text, setText, onSend, busy, onImage }: any) {
  return (
    <div className="flex items-end gap-2">
      <button onClick={onImage} title="Fotos, audio y video — aún no disponible" className="bg-[#111] border border-[#222] hover:border-[#ff0000] w-11 h-11 rounded-lg grid place-items-center shrink-0 text-[#999] hover:text-white"><ImagePlus size={19} /></button>
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onSend(); }} placeholder="Escribe algo duro…" className="flex-1 min-w-0 bg-[#111] border border-[#222] rounded-lg px-4 py-3 outline-none focus:border-[#ff0000] text-[15px] text-white placeholder:text-[#666]" />
      <button onClick={onSend} disabled={busy || !text.trim()} className="bg-[#ff0000] hover:bg-[#e00000] disabled:opacity-40 w-11 h-11 rounded-lg grid place-items-center shrink-0 text-white"><Send size={18} /></button>
    </div>
  );
}

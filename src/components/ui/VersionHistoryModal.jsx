import { useState, useEffect } from "react";
import {
  getTemplateVersions,
  restoreTemplateVersion,
  getEmailTemplateVersions,
  restoreEmailTemplateVersion,
} from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ACTION_STYLE = {
  CREATED:  "bg-emerald-100 text-emerald-700",
  UPDATED:  "bg-blue-100   text-blue-700",
  DELETED:  "bg-rose-100   text-rose-700",
  RESTORED: "bg-violet-100 text-violet-700",
};

import { fmtDateTime as fmtDate } from '../../utils/date'

/**
 * Generic version history modal — PDF templates and email templates.
 *
 * Props:
 *  template   – { id, name, currentVersion }
 *  kind       – 'pdf' (default) | 'email'
 *  onClose    – called when the modal should close
 *  onRestored – called with the updated resource after a restore
 */
export default function VersionHistoryModal({ template, kind = "pdf", onClose, onRestored }) {
  const fetchVersions  = kind === "email" ? getEmailTemplateVersions  : getTemplateVersions;
  const restoreVersion = kind === "email" ? restoreEmailTemplateVersion : restoreTemplateVersion;
  const toast = useToast();

  const [versions,   setVersions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [restoring,  setRestoring]  = useState(null);
  const [expanded,   setExpanded]   = useState(null);

  /* Compare mode state */
  const [compareMode,     setCompareMode]     = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);  // up to 2 version numbers
  const [comparing,       setComparing]       = useState(false);

  useEffect(() => {
    fetchVersions(template.id)
      .then(setVersions)
      .catch(err => toast.error(err.message || "Could not load version history."))
      .finally(() => setLoading(false));
  }, [template.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = async (version) => {
    if (!confirm(`Restore template to v${version.version}? This will create a new version snapshot.`)) return;
    setRestoring(version.version);
    try {
      const updated = await restoreVersion(template.id, version.version);
      toast.success(`Restored to v${version.version} successfully.`);
      onRestored?.(updated);
      const fresh = await fetchVersions(template.id);
      setVersions(fresh);
    } catch (err) {
      toast.error(err?.message || "Restore failed. Please try again.");
    } finally {
      setRestoring(null);
    }
  };

  /* Toggle a version in the compare selection (max 2) */
  const toggleCompare = (vNum) => {
    setCompareSelected(prev => {
      if (prev.includes(vNum)) return prev.filter(v => v !== vNum);
      if (prev.length >= 2) return [prev[1], vNum];   // slide window
      return [...prev, vNum];
    });
  };

  const canCompare = compareSelected.length === 2;
  const vA = versions.find(v => v.version === compareSelected[0]);
  const vB = versions.find(v => v.version === compareSelected[1]);

  /* ── Diff helpers ── */
  function charDiff(a, b) {
    const diff = (b?.length || 0) - (a?.length || 0);
    if (diff === 0) return null;
    return diff > 0 ? `+${diff} chars` : `${diff} chars`;
  }
  function placeholderDiff(a, b) {
    const setA = new Set(a?.placeholders || []);
    const setB = new Set(b?.placeholders || []);
    const added   = [...setB].filter(p => !setA.has(p));
    const removed = [...setA].filter(p => !setB.has(p));
    return { added, removed };
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col
                    ${comparing ? "w-full max-w-5xl max-h-[90vh]" : "w-full max-w-2xl max-h-[80vh]"}`}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              {comparing ? "Version Comparison" : "Version History"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
              {template.name} · {versions.length} version{versions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Compare mode toggle */}
            {!comparing && versions.length >= 2 && (
              <button
                onClick={() => { setCompareMode(m => !m); setCompareSelected([]) }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  compareMode
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                }`}
              >
                {compareMode ? "✓ Comparing" : "Compare versions"}
              </button>
            )}
            {compareMode && canCompare && !comparing && (
              <button
                onClick={() => setComparing(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Show diff →
              </button>
            )}
            {comparing && (
              <button
                onClick={() => { setComparing(false); setCompareMode(false); setCompareSelected([]) }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                           text-gray-500 dark:text-gray-400 hover:border-gray-400 transition-colors"
              >
                ← Back to history
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl
                         text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Compare hint banner ── */}
        {compareMode && !comparing && (
          <div className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 shrink-0">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
              {compareSelected.length === 0 && "Select two versions to compare them side-by-side."}
              {compareSelected.length === 1 && `v${compareSelected[0]} selected — select one more version.`}
              {compareSelected.length === 2 && `Ready to compare v${compareSelected[0]} ↔ v${compareSelected[1]}.`}
            </p>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* ── Side-by-side comparison view ── */}
          {comparing && vA && vB && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Comparison summary bar */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700
                              shrink-0 flex items-center gap-6 flex-wrap">
                <CompDiff
                  label="Character diff"
                  value={charDiff(vA.htmlContent, vB.htmlContent)}
                />
                {(() => {
                  const { added, removed } = placeholderDiff(vA, vB);
                  return (
                    <>
                      {added.length > 0 && (
                        <CompDiff label="Fields added" value={`+${added.join(', ')}`} positive />
                      )}
                      {removed.length > 0 && (
                        <CompDiff label="Fields removed" value={`−${removed.join(', ')}`} negative />
                      )}
                      {added.length === 0 && removed.length === 0 && (
                        <CompDiff label="Placeholder fields" value="no change" />
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Side-by-side HTML */}
              <div className="flex-1 flex overflow-hidden">
                <VersionPanel version={vA} side="left" isCurrent={vA.version === template.currentVersion} />
                <div className="w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
                <VersionPanel version={vB} side="right" isCurrent={vB.version === template.currentVersion} />
              </div>
            </div>
          )}

          {/* ── Normal timeline list ── */}
          {!comparing && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                  <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading versions…
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">No version history yet.</p>
              ) : (
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-0">
                  {versions.map(v => {
                    const isCurrent  = v.version === template.currentVersion;
                    const isExpanded = expanded === v.id;
                    const isChecked  = compareSelected.includes(v.version);

                    return (
                      <li key={v.id} className="mb-0 ml-6">
                        {/* Timeline dot */}
                        <span className={`absolute -left-3 flex items-center justify-center
                                          w-6 h-6 rounded-full ring-4 ring-white dark:ring-gray-800
                                          ${isCurrent
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
                          {isCurrent ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"/>
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500" />
                          )}
                        </span>

                        {/* Card */}
                        <div className={`mb-3 p-3 rounded-xl border transition-colors
                                         ${isCurrent
                                           ? "border-primary/30 bg-indigo-50/50 dark:bg-indigo-900/10"
                                           : isChecked
                                           ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                           : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"}`}>

                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              {/* Compare checkbox */}
                              {compareMode && (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCompare(v.version)}
                                  className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600
                                             focus:ring-indigo-500 cursor-pointer shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    v{v.version}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">
                                      CURRENT
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">{fmtDate(v.savedAt)}</span>
                                </div>
                                {v.changeNote && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.changeNote}</p>
                                )}
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  By {v.savedBy || "system"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!compareMode && (
                                <button
                                  onClick={() => setExpanded(isExpanded ? null : v.id)}
                                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                                             text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary
                                             transition-colors"
                                >
                                  {isExpanded ? "Hide" : "Preview"}
                                </button>
                              )}
                              {!isCurrent && !compareMode && (
                                <button
                                  onClick={() => handleRestore(v)}
                                  disabled={restoring === v.version}
                                  className="text-xs px-2 py-1 rounded-lg text-white
                                             bg-gradient-to-r from-indigo-500 to-violet-500
                                             hover:from-indigo-600 hover:to-violet-600
                                             disabled:opacity-50 transition-all"
                                >
                                  {restoring === v.version ? "Restoring…" : "Restore"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable preview */}
                          {isExpanded && !compareMode && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                                <span className="text-gray-400">Characters</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {v.htmlContent?.length?.toLocaleString() || 0}
                                </span>
                                <span className="text-gray-400">Placeholders</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {v.placeholders?.length || 0} field{v.placeholders?.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                                <pre className="text-[10px] text-gray-500 whitespace-pre-wrap break-all leading-relaxed">
                                  {v.htmlContent?.slice(0, 800) || "(empty)"}
                                  {(v.htmlContent?.length || 0) > 800 ? "\n…" : ""}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Comparison helper components ────────────────────────────────────────── */

function CompDiff({ label, value, positive, negative }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}:</span>
      <span className={`text-xs font-semibold ${
        positive ? "text-emerald-600 dark:text-emerald-400" :
        negative ? "text-red-500 dark:text-red-400" :
        "text-gray-700 dark:text-gray-300"
      }`}>{value}</span>
    </div>
  );
}

function VersionPanel({ version, side, isCurrent }) {
  const [tab, setTab] = useState("html"); // 'html' | 'rendered'

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Panel header */}
      <div className={`px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 shrink-0
                       flex items-center justify-between
                       ${side === "left"
                          ? "bg-blue-50 dark:bg-blue-900/10"
                          : "bg-violet-50 dark:bg-violet-900/10"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${
            side === "left" ? "text-blue-700 dark:text-blue-300" : "text-violet-700 dark:text-violet-300"
          }`}>v{version.version}</span>
          {isCurrent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">
              CURRENT
            </span>
          )}
          <span className="text-xs text-gray-400">{fmtDate(version.savedAt)}</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {["html", "rendered"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t === "html" ? "HTML" : "Rendered"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {tab === "html" ? (
          <pre className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-400
                          p-4 whitespace-pre-wrap break-all font-mono h-full min-h-0">
            {version.htmlContent || "(empty)"}
          </pre>
        ) : (
          <iframe
            title={`v${version.version} rendered`}
            srcDoc={`<!DOCTYPE html><html><head>
              <meta charset="UTF-8"/>
              <style>
                body{margin:0;padding:16px;background:#f5f5f5;font-family:Arial,sans-serif;}
                *{max-width:100%!important;}
              </style>
            </head><body>${version.htmlContent || ""}</body></html>`}
            className="w-full h-full border-none"
            sandbox="allow-same-origin"
          />
        )}
      </div>

      {/* Footer metadata */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50
                      flex items-center gap-4 text-xs text-gray-400 shrink-0">
        <span>{(version.htmlContent?.length || 0).toLocaleString()} chars</span>
        <span>{version.placeholders?.length || 0} placeholders</span>
        <span>Saved by {version.savedBy || "system"}</span>
      </div>
    </div>
  );
}

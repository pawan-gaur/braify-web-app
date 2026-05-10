import { useState, useEffect } from "react";
import {
  getTemplateVersions,
  restoreTemplateVersion,
  getEmailTemplateVersions,
  restoreEmailTemplateVersion,
} from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ACTION_STYLE = {
  CREATED: "bg-emerald-100 text-emerald-700",
  UPDATED: "bg-blue-100   text-blue-700",
  DELETED: "bg-rose-100   text-rose-700",
  RESTORED: "bg-violet-100 text-violet-700",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generic version history modal.
 * Works for both PDF templates and email templates.
 *
 * Props:
 *  template   – { id, name, currentVersion }
 *  kind       – 'pdf' (default) | 'email'
 *  onClose    – called when the modal should close
 *  onRestored – called with the updated resource after a restore
 */
export default function VersionHistoryModal({
  template,
  kind = "pdf",
  onClose,
  onRestored,
}) {
  const fetchVersions =
    kind === "email" ? getEmailTemplateVersions : getTemplateVersions;
  const restoreVersion =
    kind === "email" ? restoreEmailTemplateVersion : restoreTemplateVersion;
  const toast = useToast();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchVersions(template.id)
      .then(setVersions)
      .catch((err) =>
        toast.error(err.message || "Could not load version history.")
      )
      .finally(() => setLoading(false));
  }, [template.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = async (version) => {
    if (
      !confirm(
        `Restore template to v${version.version}? This will create a new version snapshot.`
      )
    )
      return;
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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Version History
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
              {template.name} · {versions.length} version
              {versions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <svg
                className="animate-spin h-5 w-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading versions…
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              No version history yet.
            </p>
          ) : (
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-0">
              {versions.map((v, i) => {
                const isCurrent = v.version === template.currentVersion;
                const isExpanded = expanded === v.id;

                return (
                  <li key={v.id} className="mb-0 ml-6">
                    {/* Timeline dot */}
                    <span
                      className={`absolute -left-3 flex items-center justify-center
                                      w-6 h-6 rounded-full ring-4 ring-white dark:ring-gray-800
                                      ${
                                        isCurrent
                                          ? "bg-primary text-white"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                      }`}
                    >
                      {isCurrent ? (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500" />
                      )}
                    </span>

                    {/* Card */}
                    <div
                      className={`mb-3 p-3 rounded-xl border transition-colors
                                     ${
                                       isCurrent
                                         ? "border-primary/30 bg-indigo-50/50 dark:bg-indigo-900/10"
                                         : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                                     }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              v{v.version}
                            </span>
                            {isCurrent && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                               bg-primary text-white"
                              >
                                CURRENT
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {fmtDate(v.savedAt)}
                            </span>
                          </div>
                          {v.changeNote && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {v.changeNote}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            By {v.savedBy || "system"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Preview / expand toggle */}
                          <button
                            onClick={() =>
                              setExpanded(isExpanded ? null : v.id)
                            }
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200
                                       dark:border-gray-600 text-gray-500 dark:text-gray-400
                                       hover:border-primary hover:text-primary transition-colors"
                          >
                            {isExpanded ? "Hide" : "Preview"}
                          </button>

                          {/* Restore — hidden for current version */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleRestore(v)}
                              disabled={restoring === v.version}
                              className="text-xs px-2 py-1 rounded-lg text-white
                                         bg-gradient-to-r from-indigo-500 to-violet-500
                                         hover:from-indigo-600 hover:to-violet-600
                                         disabled:opacity-50 transition-all"
                            >
                              {restoring === v.version
                                ? "Restoring…"
                                : "Restore"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable preview */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <span className="text-gray-400">Page size</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {v.pageSize} · {v.orientation}
                            </span>
                            <span className="text-gray-400">Placeholders</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {v.placeholders?.length || 0} field
                              {v.placeholders?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <pre className="text-[10px] text-gray-500 whitespace-pre-wrap break-all leading-relaxed">
                              {v.htmlContent?.slice(0, 600) || "(empty)"}
                              {v.htmlContent?.length > 600 ? "\n…" : ""}
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
      </div>
    </div>
  );
}

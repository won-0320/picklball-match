"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePairAction, deletePairAction } from "@/actions/roster-actions";
import type { RosterPair } from "@/lib/roster";
import { GROUP_TIER_LABEL } from "@/lib/validation";

const TEAM_LABEL: Record<"A" | "B", string> = { A: "백팀", B: "청팀" };

interface Draft {
  player1Name: string;
  player2Name: string;
}

function draftsFromPairs(pairs: RosterPair[]): Record<string, Draft> {
  return Object.fromEntries(
    pairs.map((p) => [p.id, { player1Name: p.player1Name, player2Name: p.player2Name }])
  );
}

export default function RosterEditor({ pairs }: { pairs: RosterPair[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFromPairs(pairs));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({});

  // Re-sync local drafts whenever the saved roster changes underneath us
  // (after router.refresh() following a save/delete, or a new pair added by
  // the manual-entry form). Keyed on a signature of the server data so a
  // plain re-render from typing doesn't clobber in-progress edits.
  const signature = pairs
    .map((p) => `${p.id}:${p.player1Name}:${p.player2Name}`)
    .join("|");
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setDrafts(draftsFromPairs(pairs));
    setRowMessage({});
  }

  const groups = useMemo(() => {
    const map = new Map<string, RosterPair[]>();
    for (const pair of pairs) {
      const key = `${pair.team}-${pair.groupTier}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(pair);
    }
    return [...map.entries()];
  }, [pairs]);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function isDirty(pair: RosterPair) {
    const draft = drafts[pair.id];
    return (
      draft.player1Name !== pair.player1Name || draft.player2Name !== pair.player2Name
    );
  }

  async function handleSave(pair: RosterPair) {
    setBusyId(pair.id);
    setRowMessage((prev) => ({ ...prev, [pair.id]: "" }));
    const draft = drafts[pair.id];
    const result = await updatePairAction(pair.id, draft.player1Name, draft.player2Name);
    setBusyId(null);

    if (!result.success) {
      setRowMessage((prev) => ({ ...prev, [pair.id]: result.message ?? "오류가 발생했습니다." }));
      return;
    }
    setRowMessage((prev) => ({ ...prev, [pair.id]: "저장됨" }));
    router.refresh();
  }

  async function handleDelete(pair: RosterPair) {
    if (
      !window.confirm(
        `${TEAM_LABEL[pair.team]} ${pair.pairNumber}조 (${pair.player1Name}, ${pair.player2Name})를 삭제합니다. ` +
          "이 조가 포함된 대진도 함께 삭제됩니다. 계속할까요?"
      )
    ) {
      return;
    }
    setBusyId(pair.id);
    setRowMessage((prev) => ({ ...prev, [pair.id]: "" }));
    const result = await deletePairAction(pair.id);
    setBusyId(null);

    if (!result.success) {
      setRowMessage((prev) => ({ ...prev, [pair.id]: result.message ?? "오류가 발생했습니다." }));
      return;
    }
    router.refresh();
  }

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">저장된 명단</h2>
      {pairs.length === 0 ? (
        <p className="text-xs text-gray-400">
          아직 저장된 명단이 없습니다. 위에서 엑셀 업로드 또는 직접 입력으로 저장해주세요.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            선수 이름을 고친 뒤 &quot;저장&quot;을 누르세요. 조를 삭제하면 그 조가 포함된 대진도
            함께 삭제되므로, 삭제 후에는 &quot;대진 생성&quot;을 다시 실행해주세요.
          </p>
          <div className="space-y-4">
            {groups.map(([key, groupPairs]) => {
              const [team, tier] = key.split("-") as ["A" | "B", "UPPER" | "LOWER"];
              return (
                <div key={key} className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">
                    {TEAM_LABEL[team]} · {GROUP_TIER_LABEL[tier]}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pr-2 pb-1 w-12">조</th>
                          <th className="pr-2 pb-1">선수1</th>
                          <th className="pr-2 pb-1">선수2</th>
                          <th className="pb-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupPairs.map((pair) => {
                          const draft = drafts[pair.id];
                          const busy = busyId === pair.id;
                          const message = rowMessage[pair.id];
                          return (
                            <tr key={pair.id}>
                              <td className="pr-2 py-1 text-gray-500">{pair.pairNumber}</td>
                              <td className="pr-2 py-1">
                                <input
                                  type="text"
                                  value={draft.player1Name}
                                  onChange={(e) =>
                                    setDraft(pair.id, { player1Name: e.target.value })
                                  }
                                  className="w-28 border rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="pr-2 py-1">
                                <input
                                  type="text"
                                  value={draft.player2Name}
                                  onChange={(e) =>
                                    setDraft(pair.id, { player2Name: e.target.value })
                                  }
                                  className="w-28 border rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleSave(pair)}
                                  disabled={busy || !isDirty(pair)}
                                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs disabled:opacity-40"
                                >
                                  {busy ? "..." : "저장"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(pair)}
                                  disabled={busy}
                                  className="ml-2 text-red-500 text-xs underline disabled:opacity-40"
                                >
                                  삭제
                                </button>
                                {message && (
                                  <span
                                    className={`ml-2 text-xs ${
                                      message === "저장됨" ? "text-green-700" : "text-red-600"
                                    }`}
                                  >
                                    {message}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

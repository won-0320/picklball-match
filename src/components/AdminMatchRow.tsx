"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateMatch } from "@/actions/match-actions";
import type { MatchDTO } from "@/lib/matches";

export default function AdminMatchRow({ match }: { match: MatchDTO }) {
  const router = useRouter();
  const [teamAScore, setTeamAScore] = useState(match.teamAScore?.toString() ?? "");
  const [teamBScore, setTeamBScore] = useState(match.teamBScore?.toString() ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const a = Number(teamAScore);
    const b = Number(teamBScore);
    if (
      teamAScore === "" ||
      teamBScore === "" ||
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < 0 ||
      b < 0 ||
      a === b
    ) {
      setError("점수를 확인해주세요 (0 이상 정수, 서로 달라야 함).");
      return;
    }
    setPending(true);
    const result = await adminUpdateMatch(match.id, a, b);
    setPending(false);
    if (!result.success) {
      setError(result.message ?? "오류가 발생했습니다.");
      return;
    }
    router.refresh();
  }

  async function handleReset() {
    setPending(true);
    await adminUpdateMatch(match.id, null, null);
    setPending(false);
    setTeamAScore("");
    setTeamBScore("");
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-sm bg-white">
      <div>
        <div>
          {match.teamAPair.pairNumber}조 ({match.teamAPair.player1Name}/{match.teamAPair.player2Name})
        </div>
        <div className="text-gray-400 text-xs">vs</div>
        <div>
          {match.teamBPair.pairNumber}조 ({match.teamBPair.player1Name}/{match.teamBPair.player2Name})
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={teamAScore}
            onChange={(e) => setTeamAScore(e.target.value)}
            className="w-14 border rounded px-1 py-0.5 text-center"
          />
          <span>:</span>
          <input
            type="number"
            value={teamBScore}
            onChange={(e) => setTeamBScore(e.target.value)}
            className="w-14 border rounded px-1 py-0.5 text-center"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            저장
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={pending}
            className="px-2 py-1 rounded border"
          >
            리셋
          </button>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    </div>
  );
}

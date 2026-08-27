"use client";

import { useState } from "react";
import { submitScore } from "@/actions/match-actions";
import type { MatchDTO } from "@/lib/matches";

export default function ScoreEntryModal({
  match,
  onClose,
  onSubmitted,
}: {
  match: MatchDTO;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    const a = Number(teamAScore);
    const b = Number(teamBScore);

    if (teamAScore === "" || teamBScore === "" || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("점수는 0 이상의 정수로 입력해주세요.");
      return;
    }
    if (a === b) {
      setError("두 팀의 점수는 같을 수 없습니다.");
      return;
    }

    setPending(true);
    const result = await submitScore(match.id, a, b);
    setPending(false);

    if (result.success) {
      onSubmitted();
      return;
    }

    if (result.recordedTeamAScore !== undefined) {
      setError(
        `${result.message} (기록된 점수: ${result.recordedTeamAScore} : ${result.recordedTeamBScore})`
      );
    } else {
      setError(result.message ?? "오류가 발생했습니다.");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-5 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm text-gray-600">
          <div>
            {match.teamAPair.pairNumber}조 ({match.teamAPair.player1Name}/
            {match.teamAPair.player2Name})
          </div>
          <div className="text-center text-gray-400 my-1">vs</div>
          <div>
            {match.teamBPair.pairNumber}조 ({match.teamBPair.player1Name}/
            {match.teamBPair.player2Name})
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={teamAScore}
            onChange={(e) => setTeamAScore(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-center"
            placeholder="백팀"
          />
          <span>:</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={teamBScore}
            onChange={(e) => setTeamBScore(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-center"
            placeholder="청팀"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border text-sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            {pending ? "저장 중..." : "결과 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

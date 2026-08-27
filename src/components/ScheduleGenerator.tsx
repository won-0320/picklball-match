"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateMatches, clearRosterAction } from "@/actions/roster-actions";
import type { RosterSummary } from "@/lib/roster";

export default function ScheduleGenerator({ summary }: { summary: RosterSummary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setMessage(null);
    const result = await generateMatches();
    setPending(false);

    if (!result.success) {
      setIsError(true);
      setMessage(result.message ?? "오류가 발생했습니다.");
      return;
    }

    setIsError(false);
    setMessage(`대진 생성 완료: 매치 ${result.matchCount}개`);
    router.refresh();
  }

  async function handleClear() {
    if (!window.confirm("저장된 명단과 대진표를 모두 삭제합니다. 계속할까요?")) {
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await clearRosterAction();
    setPending(false);

    if (!result.success) {
      setIsError(true);
      setMessage(result.message ?? "오류가 발생했습니다.");
      return;
    }

    setIsError(false);
    setMessage("명단과 대진표를 모두 삭제했습니다.");
    router.refresh();
  }

  const hasPairs =
    summary.teamAUpper + summary.teamALower + summary.teamBUpper + summary.teamBLower > 0;

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">대진 생성</h2>
      <p className="text-xs text-gray-500">
        저장된 명단을 기준으로 그룹별(3.5 이상 / 3.0 이하) 팀 간 전체 대진을 생성합니다. 다시
        누르면 기존 대진표를 지우고 새로 생성합니다. 엑셀 업로드/직접 입력으로 명단을 저장하는
        것은 기존에 저장된 조를 지우지 않고 더하거나 수정만 합니다 — 전체를 지우려면 아래
        &quot;전체 초기화&quot;를 사용하세요.
      </p>
      <div className="text-sm text-gray-700">
        <div>
          3.5 이상: 백팀 {summary.teamAUpper}조 · 청팀 {summary.teamBUpper}조
        </div>
        <div>
          3.0 이하: 백팀 {summary.teamALower}조 · 청팀 {summary.teamBLower}조
        </div>
        <div className="text-gray-400">현재 생성된 매치: {summary.matchCount}개</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending || !hasPairs}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {pending ? "처리 중..." : "대진 생성"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending || !hasPairs}
          className="px-3 py-1.5 rounded border border-red-300 text-red-600 text-sm disabled:opacity-50"
        >
          전체 초기화
        </button>
      </div>
      {!hasPairs && (
        <p className="text-xs text-gray-400">
          먼저 엑셀 업로드 또는 직접 입력으로 명단을 저장해주세요.
        </p>
      )}
      {message && (
        <p className={`text-sm ${isError ? "text-red-600" : "text-green-700"}`}>{message}</p>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateMatches } from "@/actions/roster-actions";
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

  const hasPairs =
    summary.teamAUpper + summary.teamALower + summary.teamBUpper + summary.teamBLower > 0;

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">대진 생성</h2>
      <p className="text-xs text-gray-500">
        저장된 명단을 기준으로 그룹별(3.5 이상 / 3.0 이하) 팀 간 전체 대진을 생성합니다. 다시
        누르면 기존 대진표를 지우고 새로 생성합니다.
      </p>
      <div className="text-sm text-gray-700">
        <div>
          3.5 이상: A팀 {summary.teamAUpper}조 · B팀 {summary.teamBUpper}조
        </div>
        <div>
          3.0 이하: A팀 {summary.teamALower}조 · B팀 {summary.teamBLower}조
        </div>
        <div className="text-gray-400">현재 생성된 매치: {summary.matchCount}개</div>
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending || !hasPairs}
        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
      >
        {pending ? "생성 중..." : "대진 생성"}
      </button>
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

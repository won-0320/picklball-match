"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePointsPerWin } from "@/actions/settings-actions";

export default function SettingsForm({ pointsPerWin }: { pointsPerWin: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(pointsPerWin));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSave() {
    setPending(true);
    setMessage(null);
    const parsed = Number(value);
    const result = await updatePointsPerWin(parsed);
    setPending(false);

    if (!result.success) {
      setIsError(true);
      setMessage(result.message ?? "오류가 발생했습니다.");
      return;
    }

    setIsError(false);
    setMessage("저장되었습니다.");
    router.refresh();
  }

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">승점 설정</h2>
      <p className="text-xs text-gray-500">
        경기 1승당 부여할 승점을 정합니다. 변경하면 기존에 완료된 경기 결과에도 즉시 반영되어
        팀 승점이 다시 계산됩니다.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 border rounded px-2 py-1 text-center"
        />
        <span className="text-sm text-gray-600">점 / 승</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${isError ? "text-red-600" : "text-green-700"}`}>{message}</p>
      )}
    </section>
  );
}

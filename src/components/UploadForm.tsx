"use client";

import { useActionState } from "react";
import { uploadRoster, type UploadRosterState } from "@/actions/roster-actions";

const initialState: UploadRosterState = {};

export default function UploadForm() {
  const [state, action, pending] = useActionState(uploadRoster, initialState);

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">엑셀 업로드</h2>
      <p className="text-xs text-gray-500">
        컬럼: 팀(A/B), 그룹(3.5 이상/3.0 이하), 조번호, 선수1, 선수2. 업로드 시 기존 조 편성과 대진표는
        모두 삭제되고 새로 생성됩니다.
      </p>
      <form action={action} className="flex items-center gap-3 flex-wrap">
        <input type="file" name="file" accept=".xlsx,.xls" required className="text-sm" />
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {pending ? "업로드 중..." : "업로드 및 대진 생성"}
        </button>
      </form>
      {state?.errors && state.errors.length > 0 && (
        <ul className="text-sm text-red-600 list-disc pl-5 space-y-0.5">
          {state.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      {state?.success && (
        <p className="text-sm text-green-700">
          업로드 완료: A팀 {state.success.teamACount}조, B팀 {state.success.teamBCount}조, 매치{" "}
          {state.success.matchCount}개 생성됨
        </p>
      )}
    </section>
  );
}

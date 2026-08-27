"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitManualRoster } from "@/actions/roster-actions";
import { GROUP_TIER_LABEL } from "@/lib/validation";

type GroupLabel = (typeof GROUP_TIER_LABEL)["UPPER" | "LOWER"];

interface ManualRow {
  key: number;
  team: "A" | "B";
  groupLabel: GroupLabel;
  pairNumber: string;
  player1Name: string;
  player2Name: string;
}

let nextKey = 1;

function emptyRow(): ManualRow {
  return {
    key: nextKey++,
    team: "A",
    groupLabel: GROUP_TIER_LABEL.UPPER,
    pairNumber: "",
    player1Name: "",
    player2Name: "",
  };
}

export default function ManualRosterForm() {
  const router = useRouter();
  const [rows, setRows] = useState<ManualRow[]>([emptyRow(), emptyRow()]);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateRow(key: number, patch: Partial<ManualRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  async function handleSubmit() {
    setErrors(null);
    setSuccessMessage(null);
    setPending(true);

    const rawRows = rows.map((row) => ({
      팀: row.team,
      그룹: row.groupLabel,
      조번호: row.pairNumber,
      선수1: row.player1Name,
      선수2: row.player2Name,
    }));

    const result = await submitManualRoster(rawRows);
    setPending(false);

    if (!result.success) {
      setErrors(result.errors ?? ["오류가 발생했습니다."]);
      return;
    }

    setSuccessMessage(
      `명단 저장 완료: A팀 ${result.data!.teamACount}조, B팀 ${result.data!.teamBCount}조. 대진표는 아래 "대진 생성"에서 별도로 만들어주세요.`
    );
    router.refresh();
  }

  return (
    <section className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="font-semibold">직접 입력</h2>
      <p className="text-xs text-gray-500">
        엑셀 파일이 없을 때 팀 명단을 직접 입력할 수 있습니다. 저장 시 기존 조 편성과 대진표는
        모두 삭제됩니다. 대진표는 저장 후 아래 &quot;대진 생성&quot;에서 별도로 만들어주세요.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pr-2 pb-1">팀</th>
              <th className="pr-2 pb-1">그룹</th>
              <th className="pr-2 pb-1">조번호</th>
              <th className="pr-2 pb-1">선수1</th>
              <th className="pr-2 pb-1">선수2</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="pr-2 py-1">
                  <select
                    value={row.team}
                    onChange={(e) => updateRow(row.key, { team: e.target.value as "A" | "B" })}
                    className="border rounded px-1 py-0.5"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </td>
                <td className="pr-2 py-1">
                  <select
                    value={row.groupLabel}
                    onChange={(e) =>
                      updateRow(row.key, { groupLabel: e.target.value as GroupLabel })
                    }
                    className="border rounded px-1 py-0.5"
                  >
                    <option value={GROUP_TIER_LABEL.UPPER}>{GROUP_TIER_LABEL.UPPER}</option>
                    <option value={GROUP_TIER_LABEL.LOWER}>{GROUP_TIER_LABEL.LOWER}</option>
                  </select>
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="number"
                    min={1}
                    value={row.pairNumber}
                    onChange={(e) => updateRow(row.key, { pairNumber: e.target.value })}
                    className="w-16 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="text"
                    value={row.player1Name}
                    onChange={(e) => updateRow(row.key, { player1Name: e.target.value })}
                    className="w-24 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="text"
                    value={row.player2Name}
                    onChange={(e) => updateRow(row.key, { player2Name: e.target.value })}
                    className="w-24 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="text-red-500 text-xs underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={addRow} className="px-2 py-1 rounded border text-sm">
          행 추가
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {pending ? "저장 중..." : "명단 저장"}
        </button>
      </div>
      {errors && errors.length > 0 && (
        <ul className="text-sm text-red-600 list-disc pl-5 space-y-0.5">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
    </section>
  );
}

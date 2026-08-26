import type { MatchDTO } from "@/lib/matches";
import AdminMatchRow from "@/components/AdminMatchRow";

export default function AdminMatchList({
  upper,
  lower,
}: {
  upper: MatchDTO[];
  lower: MatchDTO[];
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-semibold mb-2">상위 그룹 ({upper.length}경기)</h2>
        <div className="space-y-2">
          {upper.length === 0 && <p className="text-sm text-gray-500">경기가 없습니다.</p>}
          {upper.map((match) => (
            <AdminMatchRow key={match.id} match={match} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-semibold mb-2">하위 그룹 ({lower.length}경기)</h2>
        <div className="space-y-2">
          {lower.length === 0 && <p className="text-sm text-gray-500">경기가 없습니다.</p>}
          {lower.map((match) => (
            <AdminMatchRow key={match.id} match={match} />
          ))}
        </div>
      </div>
    </section>
  );
}

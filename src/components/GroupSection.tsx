import type { MatchDTO } from "@/lib/matches";
import MatchCard from "@/components/MatchCard";

export default function GroupSection({
  title,
  matches,
  onSelectMatch,
}: {
  title: string;
  matches: MatchDTO[];
  onSelectMatch: (match: MatchDTO) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="space-y-2">
        {matches.length === 0 && (
          <p className="text-sm text-gray-500">경기가 없습니다.</p>
        )}
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onSelect={() => onSelectMatch(match)} />
        ))}
      </div>
    </section>
  );
}

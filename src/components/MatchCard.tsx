import type { MatchDTO, MatchPairDTO } from "@/lib/matches";

function pairLabel(pair: MatchPairDTO): string {
  return `${pair.pairNumber}조 (${pair.player1Name}/${pair.player2Name})`;
}

export default function MatchCard({
  match,
  onSelect,
}: {
  match: MatchDTO;
  onSelect: () => void;
}) {
  const isPending = match.status === "PENDING";

  return (
    <button
      type="button"
      disabled={!isPending}
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 flex items-center justify-between gap-3 ${
        isPending
          ? "border-blue-300 bg-white hover:bg-blue-50 cursor-pointer"
          : "border-gray-200 bg-gray-100"
      }`}
    >
      <div className="text-sm">
        <div>{pairLabel(match.teamAPair)}</div>
        <div className="text-gray-400 text-xs my-0.5">vs</div>
        <div>{pairLabel(match.teamBPair)}</div>
      </div>
      <div className="text-right shrink-0">
        {isPending ? (
          <span className="inline-block rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-1">
            대기
          </span>
        ) : (
          <div>
            <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs px-2 py-1 mb-1">
              완료
            </span>
            <div className="font-mono text-sm font-semibold">
              {match.teamAScore} : {match.teamBScore}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

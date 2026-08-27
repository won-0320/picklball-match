import type { Standings } from "@/lib/standings";

export default function StandingsBanner({ standings }: { standings: Standings }) {
  const showWinCount = standings.pointsPerWin !== 1;

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-600 to-rose-600 text-white p-5 flex items-center justify-around text-center shadow">
      <div>
        <div className="text-sm opacity-80">백팀</div>
        <div className="text-4xl font-bold">{standings.teamAPoints}점</div>
        {showWinCount && (
          <div className="text-xs opacity-70">{standings.teamAWinCount}승</div>
        )}
      </div>
      <div className="text-lg font-semibold opacity-70">VS</div>
      <div>
        <div className="text-sm opacity-80">청팀</div>
        <div className="text-4xl font-bold">{standings.teamBPoints}점</div>
        {showWinCount && (
          <div className="text-xs opacity-70">{standings.teamBWinCount}승</div>
        )}
      </div>
    </div>
  );
}

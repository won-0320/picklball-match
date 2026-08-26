export default function StandingsBanner({
  standings,
}: {
  standings: { teamAWins: number; teamBWins: number };
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-600 to-rose-600 text-white p-5 flex items-center justify-around text-center shadow">
      <div>
        <div className="text-sm opacity-80">A팀</div>
        <div className="text-4xl font-bold">{standings.teamAWins}승</div>
      </div>
      <div className="text-lg font-semibold opacity-70">VS</div>
      <div>
        <div className="text-sm opacity-80">B팀</div>
        <div className="text-4xl font-bold">{standings.teamBWins}승</div>
      </div>
    </div>
  );
}

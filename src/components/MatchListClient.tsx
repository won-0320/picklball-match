"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import StandingsBanner from "@/components/StandingsBanner";
import GroupSection from "@/components/GroupSection";
import ScoreEntryModal from "@/components/ScoreEntryModal";
import type { MatchDTO, MatchListData } from "@/lib/matches";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MatchListClient({
  initialData,
}: {
  initialData: MatchListData;
}) {
  const { data, mutate } = useSWR<MatchListData>("/api/matches", fetcher, {
    refreshInterval: 5000,
    fallbackData: initialData,
  });
  const [activeMatch, setActiveMatch] = useState<MatchDTO | null>(null);

  const current = data ?? initialData;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-8 w-full">
      <StandingsBanner standings={current.standings} />
      <GroupSection title="상위 그룹" matches={current.upper} onSelectMatch={setActiveMatch} />
      <GroupSection title="하위 그룹" matches={current.lower} onSelectMatch={setActiveMatch} />
      {activeMatch && (
        <ScoreEntryModal
          match={activeMatch}
          onClose={() => setActiveMatch(null)}
          onSubmitted={() => {
            setActiveMatch(null);
            mutate();
          }}
        />
      )}
      <div className="text-center pt-4">
        <Link href="/admin/login" className="text-xs text-gray-400 underline">
          관리자 로그인
        </Link>
      </div>
    </main>
  );
}

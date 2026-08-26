import { getMatchListData } from "@/lib/matches";
import MatchListClient from "@/components/MatchListClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getMatchListData();
  return <MatchListClient initialData={initialData} />;
}

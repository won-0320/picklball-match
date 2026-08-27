import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { logoutAdmin } from "@/actions/auth-actions";
import { getMatchListData } from "@/lib/matches";
import { getRosterSummary } from "@/lib/roster";
import UploadForm from "@/components/UploadForm";
import ManualRosterForm from "@/components/ManualRosterForm";
import ScheduleGenerator from "@/components/ScheduleGenerator";
import SettingsForm from "@/components/SettingsForm";
import AdminMatchList from "@/components/AdminMatchList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [data, rosterSummary] = await Promise.all([getMatchListData(), getRosterSummary()]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">관리자</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm text-gray-500 underline">
            로그아웃
          </button>
        </form>
      </div>
      <UploadForm />
      <ManualRosterForm />
      <ScheduleGenerator summary={rosterSummary} />
      <SettingsForm pointsPerWin={data.standings.pointsPerWin} />
      <AdminMatchList upper={data.upper} lower={data.lower} />
    </main>
  );
}

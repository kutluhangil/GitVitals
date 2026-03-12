import { RepoDashboard } from "./RepoDashboard";
import { ProfileDashboard } from "./ProfileDashboard";

interface DashboardProps {
  data: any;
}

export function Dashboard({ data }: DashboardProps) {
  if (!data) return null;
  if (data.type === 'profile') {
    return <ProfileDashboard data={data} />;
  }
  return <RepoDashboard data={data} />;
}

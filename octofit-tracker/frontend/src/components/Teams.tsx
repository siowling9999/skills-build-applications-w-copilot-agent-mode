import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  members: string[];
};

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      dataKey="teams"
      emptyText="No teams found."
      renderItem={(team) => `${team.name} (${team.members.join(', ')})`}
    />
  );
}

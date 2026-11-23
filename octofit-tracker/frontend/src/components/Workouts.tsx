import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason: string;
};

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint="/api/workouts/suggestions/mona%40example.com"
      dataKey="suggestions"
      emptyText="No workout suggestions found."
      renderItem={(suggestion) => `${suggestion.title} - ${suggestion.reason}`}
    />
  );
}

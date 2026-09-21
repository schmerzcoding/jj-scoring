function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-feature-card" tabIndex={0}>
      <div className="glass-feature-card__flares" aria-hidden>
        <span className="glass-feature-card__flare glass-feature-card__flare--top" />
        <span className="glass-feature-card__flare glass-feature-card__flare--right" />
        <span className="glass-feature-card__flare glass-feature-card__flare--bottom" />
      </div>
      <div className="glass-feature-card__surface">
        <h3 className="glass-feature-card__title">{title}</h3>
        <p className="glass-feature-card__description">{description}</p>
      </div>
    </div>
  );
}

export function HomeRoleCards() {
  return (
    <div className="stagger-children home-role-cards grid gap-4 sm:grid-cols-3 sm:gap-5">
      <FeatureCard
        title="For Organizers"
        description="Create events, manage registrations, assign judges, and run competitions."
      />
      <FeatureCard
        title="For Judges"
        description="Score participants individually, round by round, from any device."
      />
      <FeatureCard
        title="For Dancers"
        description="Register as leader or follower and track your competition status."
      />
    </div>
  );
}

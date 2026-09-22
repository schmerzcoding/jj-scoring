export function HomeSectionFrame({
  children,
  className = "",
  glass = false,
}: {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}) {
  const rootClass = `home-section-frame ${className}`.trim();

  if (glass) {
    return (
      <div className={rootClass}>
        <div className="glass-feature-card home-upcoming__shell">
          <div className="glass-feature-card__flares" aria-hidden>
            <span className="glass-feature-card__flare glass-feature-card__flare--top" />
            <span className="glass-feature-card__flare glass-feature-card__flare--right" />
            <span className="glass-feature-card__flare glass-feature-card__flare--bottom" />
          </div>
          <div className="glass-feature-card__surface home-upcoming__surface">
            <div className="home-upcoming__top-fade" aria-hidden />
            <div className="home-upcoming__inner">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="home-section-frame__content">{children}</div>
    </div>
  );
}

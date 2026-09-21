export function HomeSectionFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`home-section-frame ${className}`.trim()}>
      <div className="home-section-frame__content">{children}</div>
    </div>
  );
}

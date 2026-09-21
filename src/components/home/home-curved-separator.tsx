type HomeCurvedSeparatorProps = {
  className?: string;
};

/** Reference-style section divider — flat center, curves down at the sides */
export function HomeCurvedSeparator({ className = "" }: HomeCurvedSeparatorProps) {
  return (
    <div className={`home-curved-separator ${className}`.trim()} aria-hidden>
      <svg
        viewBox="0 0 1440 52"
        preserveAspectRatio="none"
        className="home-curved-separator__svg"
      >
        <path
          d="M0 18 C 220 18 300 42 720 42 C 1140 42 1220 18 1440 18"
          className="home-curved-separator__line home-curved-separator__line--outer"
        />
        <path
          d="M0 24 C 220 24 300 48 720 48 C 1140 48 1220 24 1440 24"
          className="home-curved-separator__line home-curved-separator__line--inner"
        />
      </svg>
    </div>
  );
}

type PawIconProps = {
  className?: string;
};

export function PawIcon({ className }: PawIconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="10" cy="13.5" rx="5.5" ry="4" fill="currentColor" />
      <ellipse cx="4.5" cy="8" rx="2.2" ry="3" fill="currentColor" transform="rotate(-15 4.5 8)" />
      <ellipse cx="15.5" cy="8" rx="2.2" ry="3" fill="currentColor" transform="rotate(15 15.5 8)" />
      <ellipse cx="2" cy="12.5" rx="1.8" ry="2.5" fill="currentColor" transform="rotate(-25 2 12.5)" />
      <ellipse cx="18" cy="12.5" rx="1.8" ry="2.5" fill="currentColor" transform="rotate(25 18 12.5)" />
    </svg>
  );
}
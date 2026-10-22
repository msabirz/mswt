export function SkipLink({ label, target = "main" }: { label: string; target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="sr-only rounded-md bg-action-primary-bg px-4 py-2 text-action-primary-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50"
    >
      {label}
    </a>
  );
}

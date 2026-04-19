type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="max-w-sm text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-sm text-base leading-8 text-ink-700">{description}</p>
    </div>
  );
}

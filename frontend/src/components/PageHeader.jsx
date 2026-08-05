export default function PageHeader({ title, subtitle, action, testId }) {
  return (
    <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 md:mb-8" data-testid={testId || "page-header"}>
      <div className="min-w-0">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[color:var(--text-primary)] font-semibold leading-tight break-words">{title}</h1>
        {subtitle && <p className="mt-2 text-sm sm:text-base text-[color:var(--text-secondary)] max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 w-full md:w-auto">{action}</div>}
    </header>
  );
}

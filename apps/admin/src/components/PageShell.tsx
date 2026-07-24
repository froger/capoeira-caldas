type Props = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageShell({ title, children, actions }: Props) {
  return (
    <section className="page">
      <header className="page-header">
        <h2>{title}</h2>
        <div className="page-actions">{actions}</div>
      </header>
      {children}
    </section>
  );
}

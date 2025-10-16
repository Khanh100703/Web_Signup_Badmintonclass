export default function HeroBanner({ title, subtitle, actions }) {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div>
          <p className="hero-kicker">HUẤN LUYỆN VIÊN DOANH NGHIỆP</p>
          <h1>{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <h4>Badminton Academy</h4>
          <p>
            Trung tâm đào tạo cầu lông dành cho nhân viên văn phòng với giáo
            án hiện đại và đội ngũ huấn luyện viên chuyên nghiệp.
          </p>
        </div>
        <div className="footer-meta">
          <p>Hotline: 0909 123 456</p>
          <p>Email: hello@badminton.academy</p>
          <p>© {new Date().getFullYear()} Badminton Academy</p>
        </div>
      </div>
    </footer>
  );
}

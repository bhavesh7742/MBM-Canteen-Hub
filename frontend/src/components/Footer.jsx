import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()}{" "}
        <Link to="/">MBM Canteen Hub</Link>. Built with ❤️ for MBM University.
      </p>
    </footer>
  );
};

export default Footer;
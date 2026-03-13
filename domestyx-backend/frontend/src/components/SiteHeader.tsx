import { Link } from "react-router-dom";
import fasterCapitalLogo from "@/assets/fasterCapitalLogo.svg";

const SiteHeader = () => (
  <header className="site-header">
    <div className="section-shell flex flex-wrap items-center justify-between gap-3 py-3">
      <Link to="/" className="flex items-center gap-3">
        <img src={fasterCapitalLogo} alt="FasterCapital logo" className="site-logo" />
        <div className="leading-none">
          <p className="text-lg font-semibold text-white tracking-tight">FasterCapital</p>
          <p className="text-xs text-white/70 uppercase">Powered by DomestyX</p>
        </div>
      </Link>
      <p className="text-xs text-right text-white/85 md:text-sm">
        Connecting trusted domestic workers with families across India.
      </p>
    </div>
  </header>
);

export default SiteHeader;

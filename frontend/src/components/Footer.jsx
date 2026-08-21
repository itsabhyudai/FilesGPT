import { Github, Linkedin } from "lucide-react";
import Logo from "../assets/logo.png"; // replace with your logo

export default function Footer() {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-50 text-center md:text-left ">
        
        {/* Brand */}
        <div>
          <img src={Logo} alt="FilesGPT" className="w-32 mx-auto md:mx-0 mb-4" />
          <p className="text-gray-400 text-sm">
            Chat with your files, images, and websites.
          </p>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-white font-semibold mb-4">Follow Us</h3>
          <div className="flex justify-center md:justify-start gap-4">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-sky-500 transition"
            >
              <Github className="w-5 h-5" />
            </a>

            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-sky-500 transition"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

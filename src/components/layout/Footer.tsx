import { useTranslation } from 'react-i18next';
import { Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-[hsl(158_50%_7%)] text-[hsl(45_40%_94%)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight mb-3 inline-flex items-center gap-1.5">
              PRISM<span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
            </h3>
            <p className="text-[hsl(45_30%_75%)] text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Column 2: Links */}
          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#about"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('footer.about')}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('footer.pricing')}
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} PRISM. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const { t, i18n } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('prism-language', lang);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-gradient">
              PRISM
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <a
              href="#features"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {t('nav.features')}
            </a>
            <div className="relative inline-flex items-center gap-2">
              <a
                href="#pricing"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {t('nav.pricing')}
              </a>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </div>
            <a
              href="#about"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {t('nav.about')}
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Language Selector */}
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-[140px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="da">🇩🇰 Dansk</SelectItem>
              </SelectContent>
            </Select>

            <Link to="/auth">
              <Button variant="ghost">{t('nav.signIn')}</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary text-white">
                {t('nav.startFree')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            <a
              href="#features"
              className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.features')}
            </a>
            <div className="flex items-center gap-2 py-2">
              <a
                href="#pricing"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.pricing')}
              </a>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </div>
            <a
              href="#about"
              className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </a>

            {/* Language Selector */}
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-full">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="da">🇩🇰 Dansk</SelectItem>
              </SelectContent>
            </Select>

            <Link to="/auth" className="block">
              <Button variant="ghost" className="w-full justify-start">
                {t('nav.signIn')}
              </Button>
            </Link>
            <Link to="/auth" className="block">
              <Button className="w-full gradient-primary text-white">
                {t('nav.startFree')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

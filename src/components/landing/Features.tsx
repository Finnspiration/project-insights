import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Network, Sparkles, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  { icon: Network, key: 'feature1' },
  { icon: Sparkles, key: 'feature2' },
  { icon: BarChart3, key: 'feature3' },
];

export default function Features() {
  const { t } = useTranslation('common');

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">
            Capabilities
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
            {t('features.sectionTitle')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <Card className="group p-10 h-full bg-card border-border/60 hover:border-secondary/60 hover:shadow-[var(--shadow-elegant)] transition-all duration-300 relative overflow-hidden">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`features.${feature.key}.description`)}
                </p>
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-secondary group-hover:w-full transition-all duration-500" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

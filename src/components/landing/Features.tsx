import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Network, Sparkles, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Network,
    key: 'feature1',
  },
  {
    icon: Sparkles,
    key: 'feature2',
  },
  {
    icon: BarChart3,
    key: 'feature3',
  },
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
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('features.sectionTitle')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Card className="p-8 h-full bg-card hover:shadow-2xl transition-all duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`features.${feature.key}.description`)}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

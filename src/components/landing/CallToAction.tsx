import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function CallToAction() {
  const { t } = useTranslation('common');

  return (
    <section className="py-24 gradient-primary relative overflow-hidden">
      {/* Background Animation */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-primary-foreground mb-8 tracking-tight">
            {t('cta.ready')}
          </h2>

          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            {t('cta.startFree')}
          </Button>

          <p className="mt-4 text-primary-foreground/80 text-sm">
            {t('cta.noCard')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

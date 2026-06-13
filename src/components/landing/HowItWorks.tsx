import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ClipboardCheck, Upload, Eye, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: ClipboardCheck,
    key: 'step1',
  },
  {
    icon: Upload,
    key: 'step2',
  },
  {
    icon: Eye,
    key: 'step3',
  },
];

export default function HowItWorks() {
  const { t } = useTranslation('common');

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">
            Process
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
            {t('howItWorks.title')}
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.key}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Step Content */}
                <div className="text-center relative z-10">
                  {/* Number Circle */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full border-2 border-primary bg-background flex items-center justify-center text-secondary font-display font-bold text-2xl">
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-accent" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">
                    {t(`howItWorks.${step.key}.title`)}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`howItWorks.${step.key}.description`)}
                  </p>
                </div>

                {/* Arrow Connector (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-8 z-0">
                    <ArrowRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  name: { en: string; da: string };
  description?: { en: string; da: string };
  timeline_start?: string;
  timeline_end?: string;
  team_size?: number;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function EditProjectDialog({ open, onOpenChange, project, onSuccess }: EditProjectDialogProps) {
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation schema - only requires at least one language
  const projectSchema = z.object({
    nameEn: z.string()
      .trim()
      .max(100, { message: t('projects.validation.nameMax') })
      .optional(),
    nameDa: z.string()
      .trim()
      .max(100, { message: t('projects.validation.nameMax') })
      .optional(),
    descriptionEn: z.string()
      .trim()
      .max(500, { message: t('projects.validation.descriptionMax') })
      .optional(),
    descriptionDa: z.string()
      .trim()
      .max(500, { message: t('projects.validation.descriptionMax') })
      .optional(),
    timeline_start: z.string().optional(),
    timeline_end: z.string().optional(),
    team_size: z.number()
      .int()
      .min(1, { message: t('projects.validation.teamSizeMin') })
      .max(10000, { message: t('projects.validation.teamSizeMax') })
      .optional(),
  }).refine(
    (data) => {
      // At least one language name is required
      return (data.nameEn && data.nameEn.trim()) || (data.nameDa && data.nameDa.trim());
    },
    {
      message: t('projects.validation.atLeastOneName'),
      path: ['nameEn'],
    }
  ).refine(
    (data) => {
      if (data.timeline_start && data.timeline_end) {
        return new Date(data.timeline_end) > new Date(data.timeline_start);
      }
      return true;
    },
    {
      message: t('projects.validation.endDateAfterStart'),
      path: ['timeline_end'],
    }
  );

  type ProjectFormData = z.infer<typeof projectSchema>;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nameEn: '',
      nameDa: '',
      descriptionEn: '',
      descriptionDa: '',
      timeline_start: '',
      timeline_end: '',
      team_size: undefined,
    },
  });

  // Update form when project changes
  useEffect(() => {
    if (project) {
      form.reset({
        nameEn: project.name.en || '',
        nameDa: project.name.da || '',
        descriptionEn: project.description?.en || '',
        descriptionDa: project.description?.da || '',
        timeline_start: project.timeline_start || '',
        timeline_end: project.timeline_end || '',
        team_size: project.team_size || undefined,
      });
    }
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) return;

    setIsSubmitting(true);

    try {
      // Auto-copy name to other language if empty
      const finalNameEn = data.nameEn?.trim() || data.nameDa?.trim() || '';
      const finalNameDa = data.nameDa?.trim() || data.nameEn?.trim() || '';

      const name = {
        en: finalNameEn,
        da: finalNameDa,
      };

      const description = {
        en: data.descriptionEn?.trim() || data.descriptionDa?.trim() || '',
        da: data.descriptionDa?.trim() || data.descriptionEn?.trim() || '',
      };

      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description,
          timeline_start: data.timeline_start || null,
          timeline_end: data.timeline_end || null,
          team_size: data.team_size || null,
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(t('projects.edit.success'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(t('projects.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('projects.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Multilingual Name & Description */}
            <div className="space-y-4">
              <FormDescription className="text-sm text-muted-foreground">
                {t('projects.create.multilingualNote')}
              </FormDescription>

              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                  <TabsTrigger value="da">🇩🇰 Dansk</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.nameEn')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('projects.create.namePlaceholder')}
                            {...field}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('projects.nameHelper')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.descriptionEn')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('projects.create.descriptionPlaceholder')}
                            {...field}
                            maxLength={500}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="da" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="nameDa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.nameDa')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('projects.create.namePlaceholder')}
                            {...field}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('projects.nameHelper')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descriptionDa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.descriptionDa')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('projects.create.descriptionPlaceholder')}
                            {...field}
                            maxLength={500}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <FormLabel>{t('projects.create.timelineLabel')}</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeline_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projects.create.startDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projects.create.endDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Team Size */}
            <FormField
              control={form.control}
              name="team_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.create.teamSizeLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('projects.create.teamSizePlaceholder')}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseInt(value, 10) : undefined);
                      }}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('projects.create.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('projects.create.creating') : t('projects.create.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

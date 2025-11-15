import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trash2, Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean | null;
  content: string | null;
  metadata: any;
}

interface DocumentUploadProps {
  projectId: string;
  documents: Document[];
  onUploadSuccess: () => void;
}

export function DocumentUpload({ projectId, documents, onUploadSuccess }: DocumentUploadProps) {
  const { t } = useTranslation('common');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [uploadingText, setUploadingText] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const maxSize = 50 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-excel',
      'text/plain',
      'text/markdown',
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large (max 50MB)`);
        continue;
      }
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
        toast.error(`${file.name}: Unsupported file type`);
        continue;
      }
      await uploadFile(file);
    }
  };

  const pollDocumentStatus = async (docId: string, fileName: string) => {
    const maxAttempts = 15; // 30 seconds (15 * 2 seconds)
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const { data: doc, error } = await supabase
          .from('documents')
          .select('processed, content, metadata')
          .eq('id', docId)
          .single();

        if (error) throw error;

        // Check if processing is complete
        if (doc?.processed) {
          clearInterval(pollInterval);
          setProcessingDocs(prev => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
          toast.success(`✅ ${fileName} processed successfully! (${doc.content?.length || 0} characters extracted)`);
          onUploadSuccess();
        } else if (doc?.metadata?.failed) {
          clearInterval(pollInterval);
          setProcessingDocs(prev => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
          toast.error(`❌ ${fileName} processing failed: ${doc.metadata.error || 'Unknown error'}`);
          onUploadSuccess();
        } else if (attempts >= maxAttempts) {
          // Timeout after 30 seconds
          clearInterval(pollInterval);
          setProcessingDocs(prev => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
          toast.warning(`⏱️ ${fileName} processing timeout - check back later`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('project-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: newDoc, error: dbError } = await supabase.from('documents').insert({
        project_id: projectId,
        filename: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
      }).select().single();

      if (dbError) throw dbError;

      toast.success(`${file.name} uploaded - processing started...`);
      
      // Mark document as processing
      setProcessingDocs(prev => new Set(prev).add(newDoc.id));
      
      // Auto-trigger processing
      try {
        const { error: processError } = await supabase.functions.invoke('process-document', {
          body: { documentId: newDoc.id }
        });

        if (processError) {
          console.error('Processing invocation error:', processError);
          toast.error(`Failed to start processing: ${processError.message}`);
          setProcessingDocs(prev => {
            const next = new Set(prev);
            next.delete(newDoc.id);
            return next;
          });
        } else {
          // Start polling for status updates
          pollDocumentStatus(newDoc.id, file.name);
        }
      } catch (error: any) {
        console.error('Processing error:', error);
        toast.error(`Failed to process ${file.name}`);
        setProcessingDocs(prev => {
          const next = new Set(prev);
          next.delete(newDoc.id);
          return next;
        });
      }
      
      onUploadSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('project-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  const uploadPastedText = async () => {
    if (!pastedText.trim()) {
      toast.error(t('documents.errors.emptyText') || 'Please enter some text');
      return;
    }
    if (!textTitle.trim()) {
      toast.error(t('documents.errors.noTitle') || 'Please provide a title');
      return;
    }

    setUploadingText(true);
    try {
      const blob = new Blob([pastedText], { type: 'text/plain' });
      const file = new File([blob], `${textTitle}.txt`, { type: 'text/plain' });
      
      const fileExt = 'txt';
      const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: newDoc, error: dbError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          filename: `${textTitle}.txt`,
          file_path: filePath,
          file_type: 'text/plain',
          file_size: pastedText.length,
          processed: true,
          content: pastedText,
          language: null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success(t('documents.textUploaded') || 'Text uploaded successfully');
      
      setPastedText('');
      setTextTitle('');
      onUploadSuccess();
      
    } catch (error: any) {
      console.error('Error uploading text:', error);
      toast.error(error.message);
    } finally {
      setUploadingText(false);
    }
  };

  const confirmDelete = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const deleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await supabase.storage.from('project-documents').remove([documentToDelete.file_path]);
      await supabase.from('documents').delete().eq('id', documentToDelete.id);
      toast.success(t('documents.deleteSuccess'));
      onUploadSuccess();
    } catch (error) {
      toast.error(t('documents.deleteError'));
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('documents.title')}
        </CardTitle>
        <CardDescription>{t('documents.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Upload className="w-4 h-4 mr-2" />
              {t('documents.tabs.fileUpload') || 'File Upload'}
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              {t('documents.tabs.pasteText') || 'Paste Text'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleChange} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" disabled={uploading} />
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">{t('documents.dragDrop')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('documents.supportedFormats')}</p>
                  <label htmlFor="file-upload">
                    <Button variant="outline" disabled={uploading} className="cursor-pointer" asChild>
                      <span>{uploading ? t('documents.uploading') : t('documents.browse')}</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-title">
                {t('documents.textTitle') || 'Document Title'}
              </Label>
              <Input
                id="text-title"
                placeholder={t('documents.textTitlePlaceholder') || "E.g. 'Project Notes' or 'Stakeholder Analysis'"}
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                disabled={uploadingText}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pasted-text">
                {t('documents.pasteArea') || 'Text Content'}
              </Label>
              <Textarea
                id="pasted-text"
                placeholder={t('documents.pasteAreaPlaceholder') || 'Copy and paste your text here...'}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={uploadingText}
                className="min-h-[300px] font-mono text-sm"
                rows={12}
              />
              <p className="text-xs text-muted-foreground">
                {pastedText.length} {t('documents.characters') || 'characters'}
                {pastedText.length > 50000 && (
                  <span className="text-warning ml-2">
                    ⚠️ {t('documents.longText') || 'Very long text - consider splitting'}
                  </span>
                )}
              </p>
            </div>

            <Button
              onClick={uploadPastedText}
              disabled={uploadingText || !pastedText.trim() || !textTitle.trim()}
              className="w-full"
            >
              {uploadingText ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('documents.uploadingText') || 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('documents.uploadText') || 'Upload Text'}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {documents.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t('documents.uploaded')}</h3>
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium truncate">{doc.filename}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {/* Processing Status Badge */}
                      {processingDocs.has(doc.id) || doc.metadata?.processing ? (
                        <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          {t('documents.status.processing')}
                        </Badge>
                      ) : doc.processed ? (
                        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          ✓ {t('documents.status.processed')}
                        </Badge>
                      ) : doc.metadata?.failed ? (
                        <Badge variant="destructive">
                          ✗ {t('documents.status.failed')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          ⏳ {t('documents.status.pending')}
                        </Badge>
                      )}
                      
                      {/* Metadata Badges */}
                      {doc.content && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.content.length.toLocaleString()} {t('documents.metadata.chars')}
                        </Badge>
                      )}
                      {doc.metadata?.word_count && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.metadata.word_count.toLocaleString()} {t('documents.metadata.words')}
                        </Badge>
                      )}
                      {doc.metadata?.page_count && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.metadata.page_count} {t('documents.metadata.pages')}
                        </Badge>
                      )}
                      {doc.metadata?.processing_duration_ms && (
                        <Badge variant="outline" className="text-xs">
                          ⚡ {(doc.metadata.processing_duration_ms / 1000).toFixed(1)}s
                        </Badge>
                      )}
                      {doc.metadata?.truncated && (
                        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                          {t('documents.metadata.truncated')}
                        </Badge>
                      )}
                      
                      {/* File info */}
                      <span className="text-muted-foreground text-xs">{formatFileSize(doc.file_size)}</span>
                      <span className="text-muted-foreground text-xs">{format(new Date(doc.uploaded_at), 'PPp')}</span>
                    </div>
                    
                    {/* Metadata Details */}
                    {doc.metadata?.extraction_method && (
                      <p className="text-xs text-muted-foreground">
                        {t('documents.metadata.extractedWith')}: {doc.metadata.extraction_method}
                      </p>
                    )}
                    
                    {/* Error Display */}
                    {doc.metadata?.error && (
                      <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {t('documents.error')}: {doc.metadata.error}
                      </p>
                    )}
                    
                    {/* Content Preview */}
                    {doc.processed && doc.content && (
                      <Collapsible>
                        <CollapsibleTrigger className="text-sm text-primary hover:underline">
                          {t('documents.previewContent')} →
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="mt-2 p-3 bg-muted rounded text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {doc.content.slice(0, 500)}...
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => downloadDocument(doc)}><Download className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => confirmDelete(doc)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('documents.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('morphology.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDocument}>{t('documents.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

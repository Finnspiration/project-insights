import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import i18n from '@/lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDa = i18n.language === 'da';

      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isDa ? 'Der opstod en fejl' : 'An error occurred'}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{isDa ? 'Noget gik galt ved visning af denne komponent.' : 'Something went wrong while displaying this component.'}</p>
            {this.state.error && (
              <p className="text-xs opacity-75">
                {isDa ? 'Fejl' : 'Error'}: {this.state.error.message}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleReset}
              className="mt-2"
            >
              {isDa ? 'Prøv igen' : 'Try again'}
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

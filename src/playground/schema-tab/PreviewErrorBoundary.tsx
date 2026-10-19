import { Button as ToolButton } from '@fluentui/react-components';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from '../../components/icons';
interface PreviewBoundaryProps { resetKey?: string; children: ReactNode; onRetry: () => void; onError: (error: Error) => void }
export class PreviewErrorBoundary extends Component<PreviewBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, _info: ErrorInfo) { this.props.onError(error); }
  componentDidUpdate(previous: PreviewBoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) return <div className="schema-render-error" role="alert"><Icon name="warning" size={25}/><h3>Could not render this view</h3><p>The schema passed structural validation, but a component or runtime operation failed. Correct the draft or load another sample.</p><pre>{this.state.error.message}</pre><ToolButton type="button" className="button secondary" onClick={this.props.onRetry}><Icon name="reset" size={14}/>Retry preview</ToolButton></div>;
    return this.props.children;
  }
}

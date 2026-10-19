import { Component, type ReactNode } from "react";
interface Props {
  children: ReactNode;
  fallback: ReactNode;
  resetToken: unknown;
  onError: (error: Error) => void;
}
/** A malformed adapter prop cannot take down the already-running shell. */
export class FragmentRenderBoundary extends Component<
  Props,
  { failed: boolean; resetToken: unknown }
> {
  state = { failed: false, resetToken: null as unknown };
  static getDerivedStateFromProps(
    props: Props,
    state: { resetToken: unknown },
  ) {
    return props.resetToken !== state.resetToken
      ? { failed: false, resetToken: props.resetToken }
      : null;
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

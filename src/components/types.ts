export interface ValueChange<T> { value: T }
export type ValueChangeCallback<T> = (event: ValueChange<T>) => void;

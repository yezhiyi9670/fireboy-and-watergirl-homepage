export interface ConstructorOf<T> {
  new (...args: any[]): T;
}
export interface ParamlessConstructorOf<T> {
  new (): T;
}

export interface IResultError<TERROR_NAMES extends string> {
  detail: string;
  errorId: string;
  status: number;
  title: string;
  type: TERROR_NAMES;
}

export interface IError<TERROR_NAMES extends string, TEvent> {
  title: string,
  status: number,
  handler?: (e: TEvent) => Promise<TERROR_NAMES>
}

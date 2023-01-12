export type IHandler<TResult> = (
  eventBody: Record<string, unknown>,
  objectName: string,
  actionName: string,
  actionNameType?: string
) => Promise<TResult>;

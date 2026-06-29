interface ApiResponseOptions<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: any;

  constructor({ success = true, message = '', data = {} as T, meta }: ApiResponseOptions<T>) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  static success<T = any>(data: T, message = 'Success', meta?: any): ApiResponse<T> {
    return new ApiResponse<T>({ success: true, message, data, meta });
  }

  static error(
    message = 'Error',
    errors: any[] = [],
  ): { success: false; message: string; errors: any[] } {
    return {
      success: false,
      message,
      errors,
    };
  }
}

export default ApiResponse;

export interface ResponseDetails {
  field: string;
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: ResponseDetails[];
  pagination?: Pagination;
}

/**
 * StatusBuilder utility for creating standardized API responses.
 * Provides a fluent API and static helper methods to maintain consistency
 * across UseCases and Controllers.
 */
export class StatusBuilder<T = unknown> {
  private _success: boolean = true;
  private _data?: T;
  private _error?: string;
  private _details?: ResponseDetails[];
  private _pagination?: Pagination;

  /**
   * Sets the response as successful and attaches the data.
   */
  public success(data: T): this {
    this._success = true;
    this._data = data;
    return this;
  }

  /**
   * Sets the response as failed and attaches an error message.
   */
  public error(message: string): this {
    this._success = false;
    this._error = message;
    return this;
  }

  public details(details: ResponseDetails[]): this {
    this._details = details;
    return this;
  }

  public pagination(pagination: Pagination): this {
    this._pagination = pagination;
    return this;
  }

  public build(): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: this._success,
    };

    if (this._data !== undefined) response.data = this._data;
    if (this._error !== undefined) response.error = this._error;
    if (this._details !== undefined) response.details = this._details;
    if (this._pagination !== undefined) response.pagination = this._pagination;

    return response;
  }

  // --- Static Helper Methods ---

  /**
   * Quick helper for a successful response.
   */
  static ok<T>(data: T): ApiResponse<T> {
    return new StatusBuilder<T>().success(data).build();
  }

  /**
   * Quick helper for an error response.
   */
  static fail(message: string, details?: ResponseDetails[]): ApiResponse<never> {
    const builder = new StatusBuilder<never>().error(message);
    if (details) builder.details(details);
    return builder.build();
  }

  /**
   * Quick helper for a paginated response.
   */
  static paginated<T>(data: T[], pagination: Pagination): ApiResponse<T[]> {
    return new StatusBuilder<T[]>()
      .success(data)
      .pagination(pagination)
      .build();
  }
}
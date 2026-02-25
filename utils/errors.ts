export class AppError extends Error {
  public readonly statusCode: number
  public readonly details?: string[]

  constructor(message: string, statusCode = 400, details?: string[]) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }
}
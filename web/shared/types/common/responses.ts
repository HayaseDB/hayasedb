export interface MessageResponse {
  message: string
}

export interface ApiError {
  data?: {
    message?: string
    data?: { message?: string }
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "No autenticado") {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "No autorizado para este recurso") {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflicto con el estado actual del recurso") {
    super(message, 409);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Datos inválidos") {
    super(message, 422);
  }
}

import { IWsUseCase } from "@/domain/usecases/IWsUseCase";

export class WsController {
  constructor(private wsUsecase: IWsUseCase) {}

  private handleConnection(ws: WebSocket) {
  }
}
import { GuiBindingMap, IGuiController } from '../../interfaces';

export class GuiController<M extends GuiBindingMap = {}> extends IGuiController<M> {
  onViewCreated(): void {
    throw new Error('Method not implemented.');
  }
  onViewWillAppear(params?: any): void {
    throw new Error('Method not implemented.');
  }
  onViewDidAppear(): void {
    throw new Error('Method not implemented.');
  }
  onViewWillDisappear(): void {
    throw new Error('Method not implemented.');
  }
  onViewDidDisappear(): void {
    throw new Error('Method not implemented.');
  }
  onViewDisposed(): void {
    throw new Error('Method not implemented.');
  }
  onViewFocus(): void {
    throw new Error('Method not implemented.');
  }
  protected back(): void {
    throw new Error('Method not implemented.');
  }
  protected onInit(): void {
    throw new Error('Method not implemented.');
  }
  protected onLaunch(): void {
    throw new Error('Method not implemented.');
  }
  protected onRegEvent(): void {
    throw new Error('Method not implemented.');
  }
  protected onActivate(): void {
    throw new Error('Method not implemented.');
  }
  protected onUpdate(dt: number): void {
    throw new Error('Method not implemented.');
  }
  protected onPostUpdate(dt: number): void {
    throw new Error('Method not implemented.');
  }
  protected onUnRegEvent(): void {
    throw new Error('Method not implemented.');
  }
  protected onDeactivate(): void {
    throw new Error('Method not implemented.');
  }
  protected onPreTerminate(): void {
    throw new Error('Method not implemented.');
  }
  protected onTerminate(): void {
    throw new Error('Method not implemented.');
  }
}

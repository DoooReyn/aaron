import { aaron } from '../core';
import { ICounter } from '../interfaces';
import { ObjectEntry } from './ObjectEntry';
import { Triggers } from './Trigger';

/**
 * 计数器
 */
export class Counter extends ObjectEntry implements ICounter {
  /** 计数器ID */
  private _cid: number = 0;
  /** 设定#计次间隔 */
  protected $interval: number = 0;
  /** 设定#计次总数 */
  protected $total: number = 1;
  /** 计时#累计时间 */
  protected $accumulated: number = 0;
  /** 计时#剩余时间 */
  protected $rest: number = 0;
  /** 计时#累计次数 */
  protected $count: number = 0;
  /** 计时#是否完成 */
  protected $done: boolean = false;
  /** 触发器#计次 */
  public onCount: Triggers = new Triggers();
  /** 触发器#按帧计次 */
  public onTick: Triggers = new Triggers();
  /** 触发器#按固定频率计次 */
  public onFixedTick: Triggers = new Triggers();
  /** 触发器#完成 */
  public onDone: Triggers = new Triggers();

  /** 计时#累计次数 */
  public get count() {
    return this.$count;
  }

  /** 计时#是否完成 */
  public get done() {
    return this.$done;
  }

  /** 设定#计次总数 */
  public get total() {
    return this.$total;
  }

  /** 设定#计次间隔 */
  public get interval() {
    return this.$interval;
  }

  /** 计时#累计时间 */
  public get accumulated() {
    return this.$accumulated;
  }

  /** 计时器ID */
  public get cid() {
    return this._cid;
  }

  onInitialize(interval: number = 0, total: number = 1): void {
    this._cid = aaron.ascendingId.next('timer');
    this.$interval = interval;
    this.$total = total;
    this.$accumulated = 0;
    this.$rest = 0;
    this.$count = 0;
    this.$done = false;
  }

  onRecycled(): void {
    this.onCount.clear();
    this.onTick.clear();
    this.onFixedTick.clear();
    this.onDone.clear();
  }

  /**
   * 累加时间片
   * @param dt 时间片
   */
  public update(dt: number) {
    if (!this.$done) {
      this.$accumulated += dt;
      this.$rest += dt;
      this.onTick.runWith(dt);
      if (this.$rest >= this.$interval) {
        this.$rest -= this.$interval;
        this.$count++;
        this.onFixedTick.runWith(this.$interval);
        this.onCount.runWith(this.$count, this.$total);
        if (this.$total > 0 && this.$count >= this.$total) {
          this.onDone.run();
          this.recycle();
          this.$done = true;
        }
      }
    }
  }
}

import { createElement } from "../../shared/utils/create-element";

type DoubleSliderSelected = {
  from: number;
  to: number;
};

type PercentMode = "fromStart" | "fromEnd";

interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
  public element: HTMLElement;
  public min: number;
  public max: number;

  private formatValue: (value: number) => string;
  private selected: DoubleSliderSelected;
  private onPointerMove: ((e: PointerEvent) => void) | null = null;
  private onPointerUp: (() => void) | null = null;
  private onPointerDownLeft: ((event: PointerEvent) => void) | null = null;
  private onPointerDownRight: ((event: PointerEvent) => void) | null = null;
  private currentSide: 'left' | 'right' | null = null;

  constructor({ min = 0, max = 100, formatValue = data => String(data), selected = {from: min, to: max} }: Options = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected;
    this.element = createElement(this.template());
    this.initEventListeners();
  }

  private initEventListeners(): void {
    const leftThumb = this.element?.querySelector('.range-slider__thumb-left') as HTMLElement;
    const rightThumb = this.element?.querySelector('.range-slider__thumb-right') as HTMLElement; 

    this.onPointerDownLeft = (event: PointerEvent) => this.onDragStart(event, 'left');
    this.onPointerDownRight = (event: PointerEvent) => this.onDragStart(event, 'right');

    leftThumb.addEventListener('pointerdown', this.onPointerDownLeft);
    rightThumb.addEventListener('pointerdown', this.onPointerDownRight);
  }

  private onDragStart(event: PointerEvent, side: 'left' | 'right'): void {
    event.preventDefault();

    this.currentSide = side;

    this.onPointerMove = (e: PointerEvent) => this.onDragging(e);

    this.onPointerUp = () => {
      document.removeEventListener('pointermove', this.onPointerMove!);
      document.removeEventListener('pointerup', this.onPointerUp!);

      this.dispatchRangeSelect();

      this.currentSide = null;
      this.onPointerMove = null;
      this.onPointerUp = null;
    };

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  private dispatchRangeSelect(): void {
    const event = new CustomEvent('range-select', {
      detail: {
        from: Math.round(this.selected.from),
        to: Math.round(this.selected.to)
      },
      bubbles: true 
    });

    this.element?.dispatchEvent(event);
  }

  private onDragging(event: PointerEvent): void {
    const slider = this.element?.querySelector('.range-slider__inner') as HTMLElement;
    if (!slider || !this.currentSide) return;

    const rect = slider.getBoundingClientRect();

    let percent = (event.clientX - rect.left) / rect.width;
    percent = Math.min(Math.max(percent, 0), 1);

    const value = this.min + percent * (this.max - this.min);

    if (this.currentSide === 'left') {
      this.selected.from = Math.min(value, this.selected.to);
    } else {
      this.selected.to = Math.max(value, this.selected.from);
    }

    this.updateUI();
  }

  private updateUI(): void {
    const left = this.getPercent(this.selected.from, this.min, this.max, "fromStart");
    const right = this.getPercent(this.selected.to, this.min, this.max, "fromEnd");

    const progress = this.element?.querySelector('.range-slider__progress') as HTMLElement;
    const leftThumb = this.element?.querySelector('.range-slider__thumb-left') as HTMLElement;
    const rightThumb = this.element?.querySelector('.range-slider__thumb-right') as HTMLElement;

    const from = this.element.querySelector('[data-element="from"]') as HTMLElement;
    const to = this.element.querySelector('[data-element="to"]') as HTMLElement;

    progress.style.left = `${left}%`;
    progress.style.right = `${right}%`;

    leftThumb.style.left = `${left}%`;
    rightThumb.style.right = `${right}%`;

    from.textContent = this.formatValue(Math.round(this.selected.from));
    to.textContent = this.formatValue(Math.round(this.selected.to));
  }

  private template(): string {
    return `
      <div class="range-slider">
        <span data-element="from"> ${this.formatValue(this.selected.from)}</span>
        <div class="range-slider__inner">
          <span class="range-slider__progress"
            style="left: ${this.getPercent(this.selected.from, this.min, this.max, "fromStart")}%;
                  right: ${this.getPercent(this.selected.to, this.min, this.max, "fromEnd")}%">
          </span>
          <span class="range-slider__thumb-left"
            style="left: ${this.getPercent(this.selected.from, this.min, this.max, "fromStart")}%">
          </span>
          <span class="range-slider__thumb-right"
            style="right: ${this.getPercent(this.selected.to, this.min, this.max, "fromEnd")}%">
          </span>
        </div>
        <span data-element="to"> ${this.formatValue(this.selected.to)} </span>
      </div>
    `;
  }

  private getPercent(
    value: number,
    min: number,
    max: number,
    mode: PercentMode = 'fromStart',
  ): number {
    if (max === min) {
        return 0;
    }

    let v = value;

    v = Math.min(Math.max(value, min), max);

    const ratio = mode === 'fromStart'
        ? (v - min) / (max - min)
        : (max - v) / (max - min);

    return ratio * 100;
  }

  public destroy(): void {
    if (this.onPointerMove) {
      document.removeEventListener('pointermove', this.onPointerMove);
    }

    if (this.onPointerUp) {
      document.removeEventListener('pointerup', this.onPointerUp);
    }

    if (this.element) {
      const leftThumb = this.element.querySelector('.range-slider__thumb-left') as HTMLElement;
      const rightThumb = this.element.querySelector('.range-slider__thumb-right') as HTMLElement;

      if (leftThumb && this.onPointerDownLeft) {
        leftThumb.removeEventListener('pointerdown', this.onPointerDownLeft);
      }

      if (rightThumb && this.onPointerDownRight) {
        rightThumb.removeEventListener('pointerdown', this.onPointerDownRight);
      }
    }

    this.onPointerDownLeft = null;
    this.onPointerDownRight = null;
    this.onPointerMove = null;
    this.onPointerUp = null;
    this.element?.remove();
  }
}

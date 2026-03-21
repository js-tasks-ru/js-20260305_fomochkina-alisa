import { createElement } from "../../shared/utils/create-element";

interface Options {
  data?: number[];
  label?: string;
  value?: number;
  link?: string;
  formatHeading?: (data: number) => string;
}

export default class ColumnChart {
  public element: HTMLElement | null;
  public chartHeight = 50;

  private data: number[];
  private label: string;
  private value: number;
  private link: string;
  private formatHeading: (data: number) => string;

  constructor({ data = [], label = '', link = '', value = 0, formatHeading = dataHeading => String(dataHeading)}: Options = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;
    this.element = createElement(this.template());
  }

  private template(): string {
    const maxValue = Math.max(...this.data, 0);
    const scale = maxValue ? this.chartHeight / maxValue : 0;

    return `
      <div class="column-chart ${this.data.length === 0 ? 'column-chart_loading' : ''}" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : ''}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.formatHeading(this.value)}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.data
              .map(item => {
                const value = Math.floor(item * scale);
                const percent = maxValue ? `${(item / maxValue * 100).toFixed(0)}%` : '0%';
                return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  public update(data: number[]): void {
    if (!this.element) return;
    this.data = data;

    const chart = document.querySelector('.column-chart');
    if (this.data.length === 0){
      chart?.classList.add('column-chart_loading');
      return;
    }

    const body = this.element.querySelector('[data-element="body"]');
    if (!body) return;

    const maxValue = Math.max(...this.data, 0);
    const scale = maxValue ? this.chartHeight / maxValue : 0;

    const columns = this.data
      .map(item => {
        const value = Math.floor(item * scale);
        const percent = maxValue ? `${(item / maxValue * 100).toFixed(0)}%` : '0%';

        return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
      })
      .join('');

    body.innerHTML = columns;
    chart?.classList.remove('column-chart_loading');
  }

  public remove(): void{
    if (this.element){
      this.element.remove();
    }
  }

  public destroy(): void{
    if (this.element){
      this.element.remove();
      this.element = null;
    }
    
  }
}

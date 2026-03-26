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

  private body: HTMLElement | null;
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
    this.body = this.element.querySelector('[data-element="body"]');
  }

  private getColumnBody(): string {
    const maxValue = Math.max(...this.data, 0);
    const scale = maxValue ? this.chartHeight / maxValue : 0;

    const columns = this.data
      .map(item => {
        const value = Math.floor(item * scale);
        const percent = maxValue ? `${(item / maxValue * 100).toFixed(0)}%` : '0%';

        return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
      })
      .join('');
    return columns;
  }

  private template(): string {
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
            ${this.getColumnBody()}
          </div>
        </div>
      </div>
    `;
  }

  public update(data: number[]): void {
    if (!this.element) return;
    this.data = data;

    if (!this.body) return;    

    if (this.data.length === 0){
      this.body.innerHTML = '';
      this.element?.classList.add('column-chart_loading');
      return;
    }

    this.body.innerHTML = this.getColumnBody();
    this.element?.classList.remove('column-chart_loading');
  }

  public remove(): void{
    if (this.element){
      this.element.remove();
    }
  }

  public destroy(): void{
    this.body = null;
    this.remove();    
  }
}

import { createElement } from "../../shared/utils/create-element";
import { fetchJson } from "../../shared/utils/fetch-json";

const BACKEND_URL = 'https://course-js.javascript.ru';

type Range = {
  from: Date;
  to: Date;
}

type Data = {
  value: number;
  data: number[];
}

interface Options {
  url?: string;
  range?: Range;
  label?: string;
  link?: string;
  formatHeading?: (data: number) => string;
}

export default class ColumnChart {
  public element: HTMLElement | null;
  public chartHeight = 50;

  private url: string;
  private range: Range;

  private label: string;
  private link: string;
  private formatHeading: (data: number) => string;

  private value: number = 0;
  private data: number[] = [];
  private header: HTMLElement | null;
  private body: HTMLElement | null;

  constructor({ url = '', range = {from: new Date(), to: new Date()}, label = '', link = '', formatHeading = dataHeading => String(dataHeading)}: Options = {}) {
    this.url = url;
    this.label = label;
    this.range = range;
    this.link = link;
    this.formatHeading = formatHeading;

    this.element =  createElement(this.template());
    this.header = this.element.querySelector('[data-element="header"]');
    this.body = this.element.querySelector('[data-element="body"]');
    
    this.update(this.range.from, this.range.to); 
  }

  private async getData(from: Date, to: Date): Promise<Record<string, number>> {
    const url = `${BACKEND_URL}/${this.url}?from=${from.toISOString()}&to=${to.toISOString()}`;
    const responseData = await fetchJson<Record<string, number>>(url);
    return responseData;
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

  public async update(from: Date, to: Date): Promise<Record<string, number>|undefined> {
    if (!this.element) return;

    if (!this.body) return;    

    const rawData = await this.getData(from, to);

    const values = Object.values(rawData);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const formatData: Data = {
      value: sum,
      data: values
    };

    this.value = formatData.value;
    this.data = formatData.data;

    if (this.header) {
      this.header.innerHTML = this.formatHeading(this.value);
    }

    if (this.data.length === 0){
      this.body.innerHTML = '';
      this.element?.classList.add('column-chart_loading');
      return;
    }

    this.body.innerHTML = this.getColumnBody();
    this.element?.classList.remove('column-chart_loading');

    return rawData;
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

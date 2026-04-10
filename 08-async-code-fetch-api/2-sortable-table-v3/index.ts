import { fetchJson } from "../../shared/utils/fetch-json";
import { createElement } from "../../shared/utils/create-element";

const BACKEND_URL = 'https://course-js.javascript.ru';

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, unknown>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: unknown) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  url?: string;
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
  step?: number;
  start?: number;
  end?: number;
}

export default class SortableTable {
    public element: HTMLElement;

    private body: HTMLElement | null;
    private header: HTMLElement | null;
    private headerConfig : SortableTableHeader[];
    private data: SortableTableData[] = [];
    private isLoading = false;

    private url: string;
    private sorted: SortableTableSort | undefined;
    private isSortLocally: boolean;
    private step: number;
    private start: number;
    private end: number;

  constructor(headersConfig: SortableTableHeader[] = [], {
    url = '',
    sorted,
    isSortLocally = false,
    step = 30,
    start = 0,
    end = 30
  }: Options = {}) {
    this.headerConfig = headersConfig;
    this.url = url;
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;
    this.step = step;
    this.start = start;
    this.end = end;

    this.element = createElement(`
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
          <div data-element="header" class="sortable-table__header sortable-table__row">
            ${this.getTableHeader()}
          </div>
          <div data-element="body" class="sortable-table__body">
          </div>
        </div>
      </div>
    `);
    this.body = this.element.querySelector('[data-element="body"]');
    this.header = this.element.querySelector('[data-element="header"]');

    this.initEventListeners();
    this.render();
  }

  public async render(): Promise<void> {
    await this.getData(this.sorted?.id, this.sorted?.order);
    if (this.body) {
      this.body.innerHTML = this.getTableBody();
    }
  }

  private async getData(field: string|undefined, order: SortOrder|undefined): Promise<void> {
    let url = '';
    if (field&&order){
      url = `${BACKEND_URL}/${this.url}?_embed=subcategory.category&_sort=${field}&_order=${order}&_start=${this.start}&_end=${this.end}`;
    }
    else{
      url = `${BACKEND_URL}/${this.url}?_embed=subcategory.category&_start=${this.start}&_end=${this.end}`;
    }
    
    const newData = await fetchJson<SortableTableData[]>(url);
    if (this.start === 0) {
      this.data = newData;
    } else {
      this.data = [...this.data, ...newData];
    }
  }

  private getTableBody(): string {
    return `
      ${this.data
        .map(item => {
          return `<a href="/products/${item.id}" class="sortable-table__row">
                  ${this.getTableRaw(item)}
                 </a>`;
        })
        .join('')}
    `; 
  }

  private initEventListeners() {
    this.headerConfig.forEach(item => {
      const headerCell = this.header?.querySelector(
        `[data-id="${item.id}"]`
      ) as HTMLElement | null;

      if (headerCell && item.sortable) {
        headerCell.addEventListener('pointerdown', () => {
          this.onSelectSortedField(item.id);
        });
      }
    });
    document.addEventListener('scroll', this.onScroll);
  }

  private onScroll = async () => {
    const scrollBottom = document.documentElement.getBoundingClientRect().bottom;

    if (scrollBottom < document.documentElement.clientHeight + 100) {
      if (this.isLoading) return;
      await this.loadMoreData();
    }
  };

  private async loadMoreData(): Promise<void> {
    this.isLoading = true;
    this.start = this.end;
    this.end = this.start + this.step;

    const url = `${BACKEND_URL}/${this.url}?_start=${this.start}&_end=${this.end}`;
    const newData = await fetchJson<SortableTableData[]>(url);

    if (newData.length === 0) {
      document.removeEventListener('scroll', this.onScroll);
      this.isLoading = false;
      return;
    }

    await this.getData(this.sorted?.id, this.sorted?.order);

    if (this.body) {
      this.body.innerHTML = this.getTableBody(); 
    }
    this.isLoading = false;
  }

  private onSelectSortedField(idHeaderCell: string) {
    if (!idHeaderCell) {
      return;
    }

    let selectedOrder: SortOrder = 'desc';

    if (this.sorted?.id === idHeaderCell) {
      selectedOrder = this.sorted.order === 'asc' ? 'desc' : 'asc';
    }

    this.sorted = {
      id: idHeaderCell,
      order: selectedOrder
    };

    this.sort();
  }

  private sort() {
    if (!this.sorted){
      return;
    }
    if (this.isSortLocally) {
      this.sortOnClient(this.sorted?.id, this.sorted?.order);
    } else {
      this.sortOnServer(this.sorted?.id, this.sorted?.order);
    }
  }

  public async sortOnServer(field: string, order: SortOrder): Promise<void>{
    if (!this.body) return; 
    this.changeOrderAndArrowSort(field, order);
    this.data = [];     
    this.start = 0;      
    this.end = this.step;
    await this.getData(field, order);
    this.body.innerHTML = this.getTableBody()
  }

  public sortOnClient(field: string, order: SortOrder): void{
    if (!this.element) return;
    if (!this.body) return;   

    const headerItem = this.headerConfig.find(item => item.id === field);
    if (!headerItem) return; 
    if (!headerItem.sortable) return; 

    this.changeOrderAndArrowSort(field, order);

    const newArr = this.data.slice();

    const collator = new Intl.Collator(['ru', 'en'], {
      sensitivity: 'case',
      caseFirst: 'upper'
    });

    const direction = order === 'asc' ? 1 : -1;

    if (headerItem.sortType === 'string'){
      newArr.sort((a, b) => collator.compare(a[field] as string, b[field] as string) * direction);
    }
    else if (headerItem.sortType === 'number'){
      newArr.sort((a, b) => ((a[field] as number) - (b[field] as number)) * direction);
    }
    else if (headerItem.sortType === 'custom'){
      newArr.sort((a, b) => {
        if (headerItem.customSorting) {
          return headerItem.customSorting(a, b) * direction;
        }
        return ((a[field] as number) - (b[field] as number)) * direction;
      });
    }

    this.data = newArr;
    this.body.innerHTML = this.getTableBody()
  }

  private changeOrderAndArrowSort(field: string, order: SortOrder): void{
    const allHeaderCells = this.header?.querySelectorAll('.sortable-table__cell');
    allHeaderCells?.forEach(cell => {
      cell.removeAttribute('data-order');
    });

    const headerCell = this.header?.querySelector(`[data-id="${field}"]`) as HTMLElement | null;
    if (headerCell) {
      headerCell.setAttribute('data-order', order);  
    }
  }

  private getTableHeader(): string {
    return `
      ${this.headerConfig
        .map(item => {
          return `<div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}">
                    <span>${item.title}</span>
                    ${item.sortable ? 
                      `<span class="sortable-table__sort-arrow">
                        <span class="sort-arrow"></span>
                      </span>` : ''}
                  </div>`;
        })
        .join('')}
    `;
  }

  private getTableRaw(product: SortableTableData): string {
    return this.headerConfig
      .map(item => {
        const value = product[item.id];
        return item.template
          ? item.template(value)
          : `<div class="sortable-table__cell">${value}</div>`;
      })
      .join('');
  }

  public remove(){
    if (this.element){
      this.element.remove();
    }
  }

  public destroy(){
    document.removeEventListener('scroll', this.onScroll);
    this.body = null;
    this.remove();    
  }
}

import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
    public element: HTMLElement;

    private body: HTMLElement | null;
    private header: HTMLElement | null;
    private headerConfig : SortableTableHeader[];
    private data : SortableTableData[];
    private sorted: SortableTableSort | undefined;
    private isSortLocally: boolean;

  constructor(headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
    this.headerConfig = headersConfig;
    this.data = data;
    this.sorted = sorted;

    this.isSortLocally = isSortLocally;
    this.element = createElement(`
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
          <div data-element="header" class="sortable-table__header sortable-table__row">
            ${this.getTableHeader()}
          </div>
          <div data-element="body" class="sortable-table__body">
            ${this.getTableBody()}
          </div>
        </div>
      </div>
    `);
    this.body = this.element.querySelector('[data-element="body"]');
    this.header = this.element.querySelector('[data-element="header"]');
    this.initEventListeners();
    this.sort();
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

  private sortOnServer(field: string, order: SortOrder): void{}

  private sortOnClient(field: string, order: SortOrder): void{
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
    this.body = null;
    this.remove();    
  }
}

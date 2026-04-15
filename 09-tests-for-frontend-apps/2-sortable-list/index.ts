import { createElement } from '../../shared/utils/create-element';

export default class SortableList {
  public element: HTMLElement;
  public items: HTMLElement[];

  private draggingElem: HTMLElement | null = null;
  private placeholder: HTMLElement | null = null;

  private shiftX = 0;
  private shiftY = 0;

  constructor({ items = [] }: { items?: HTMLElement[] } = {}) {
    this.element = createElement(`<ul class='sortable-list'></ul>`);
    this.items = items;

    this.render();
    this.initEventListeners();
  }

  public addItem(item: HTMLElement) {
    item.classList.add(
      "products-edit__imagelist-item",
      "sortable-list__item"
    );
    this.element.append(item);
    this.items.push(item);
  }

  private render() {
    this.items.forEach(item => {
      item.classList.add(
        'products-edit__imagelist-item',
        'sortable-list__item'
      );
      this.element.append(item);
    });
  }

  private initEventListeners() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  private onPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-delete-handle]')) {
      const item = target.closest('.sortable-list__item');
      item?.remove();
      return;
    }

    const grabHandle = target.closest('[data-grab-handle]');
    if (!grabHandle) return;

    const item = target.closest('.sortable-list__item') as HTMLElement;
    if (!item) return;

    event.preventDefault();

    this.draggingElem = item;

    const rect = item.getBoundingClientRect();
    this.shiftX = event.clientX - rect.left;
    this.shiftY = event.clientY - rect.top;

    item.style.width = `${rect.width}px`;
    item.style.height = `${rect.height}px`;

    this.placeholder = document.createElement('li');
    this.placeholder.className = 'sortable-list__placeholder';
    this.placeholder.style.height = `${rect.height}px`;

    item.after(this.placeholder);

    item.classList.add('sortable-list__item_dragging');

    this.moveAt(event.clientX, event.clientY);

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  };

  private moveAt(clientX: number, clientY: number) {
    if (!this.draggingElem) return;

    this.draggingElem.style.left = `${clientX - this.shiftX}px`;
    this.draggingElem.style.top = `${clientY - this.shiftY}px`;
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.draggingElem || !this.placeholder) return;

    this.moveAt(event.clientX, event.clientY);

    this.draggingElem.style.pointerEvents = 'none';

    const elemBelow = document.elementFromPoint(
      event.clientX,
      event.clientY
    ) as HTMLElement;

    this.draggingElem.style.pointerEvents = '';

    if (!elemBelow) return;

    const item = elemBelow.closest('.sortable-list__item');

    if (!item || item === this.draggingElem) return;

    const rect = item.getBoundingClientRect();
    const middleY = rect.top + rect.height / 2;

    if (event.clientY < middleY) {
      item.before(this.placeholder);
    } else {
      item.after(this.placeholder);
    }
  };

  private onPointerUp = () => {
    if (!this.draggingElem) return;

    this.draggingElem.classList.remove('sortable-list__item_dragging');
    this.draggingElem.style.left = '';
    this.draggingElem.style.top = '';

    this.draggingElem.style.width = '';
    this.draggingElem.style.height = '';

    if (this.placeholder) {
      this.placeholder.replaceWith(this.draggingElem);
      this.placeholder = null;
    }

    this.draggingElem = null;

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  };

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.element.removeEventListener('pointerdown', this.onPointerDown);
  }
}
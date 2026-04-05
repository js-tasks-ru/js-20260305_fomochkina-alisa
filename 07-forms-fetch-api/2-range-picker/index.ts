import { createElement } from "../../shared/utils/create-element";

interface Options {
  from?: Date;
  to?: Date;
}

export default class RangePicker {
  private selectedFrom: Date | null = null;
  private selectedTo: Date | null = null;
  private from: Date;
  private to: Date;
  public element: HTMLElement;
  private selectorElement: HTMLElement | null = null;

  constructor({ from = new Date(), to = new Date() }: Options = {}) {
    this.selectedFrom = from;
    this.selectedTo = to;
    this.from = from;
    this.to = to;
    this.element = createElement(`
      <div class="rangepicker rangepicker_close">
        <div class="rangepicker__input" data-element="input"></div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `);
    this.updateInputDisplay();
    this.initEventListeners();
  }

  private initEventListeners(): void {
    const rangepickerInput = this.element.querySelector(".rangepicker__input");
    rangepickerInput?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.togglePicker();
    });

    document.addEventListener("click", (event) => {
      if (!this.element.contains(event.target as Node)) {
        this.closePicker();
      }
    });
  }

  private togglePicker(): void {
    if (this.element.classList.contains("rangepicker_open")) {
      this.closePicker();
    } else {
      this.openPicker();
    }
  }

  private openPicker(): void {
    this.element.classList.remove("rangepicker_close");
    this.element.classList.add("rangepicker_open");
    
    if (!this.selectorElement) {
      this.createSelector();
    }
  }

  private closePicker(): void {
    this.element.classList.remove("rangepicker_open");
    this.element.classList.add("rangepicker_close");
  }

  private createSelector(): void {
    const leftDate = new Date(this.selectedFrom || this.from);
    leftDate.setDate(1);
    
    const rightDate = new Date(leftDate);
    rightDate.setMonth(rightDate.getMonth() + 1);
    
    let selector = this.element.querySelector('.rangepicker__selector');

    if (!selector) return;
    
    selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.renderCalendar(leftDate)}
      ${this.renderCalendar(rightDate)}
    `;
    this.selectorElement = selector as HTMLElement;
    
    this.initSelectorEventListeners();
  }

  private renderCalendar(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    const firstDay = new Date(year, month, 1);
    let startOffset = firstDay.getDay();
    startOffset = startOffset === 0 ? 6 : startOffset - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let daysHtml = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateValue = currentDate.toISOString();
      let cellClass = 'rangepicker__cell';
      
      if (this.selectedFrom && this.isSameDate(currentDate, this.selectedFrom)) {
        cellClass += ' rangepicker__selected-from';
      } else if (this.selectedTo && this.isSameDate(currentDate, this.selectedTo)) {
        cellClass += ' rangepicker__selected-to';
      } else if (this.selectedFrom && this.selectedTo && 
                this.isBetweenDates(currentDate, this.selectedFrom, this.selectedTo)) {
        cellClass += ' rangepicker__selected-between';
      }
      
      const styleAttr = day == 1 ? ` style="--start-from: ${startOffset}"` : '';
      
      daysHtml += `
        <button type="button" class="${cellClass}" data-value="${dateValue}" data-year="${year}" data-month="${month}"${styleAttr}>
          ${day}
        </button>
      `;
    }
    
    return `
      <div class="rangepicker__calendar" data-year="${year}" data-month="${month}">
        <div class="rangepicker__month-indicator">
          <time id="month">${monthNames[month]}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
          ${daysHtml}
        </div>
      </div>
    `;
  }

  private initSelectorEventListeners(): void {
    if (!this.selectorElement) return;
    
    const leftControl = this.selectorElement.querySelector('.rangepicker__selector-control-left');
    const rightControl = this.selectorElement.querySelector('.rangepicker__selector-control-right');
    
    if (leftControl) {
      leftControl.removeEventListener('click', this.handleLeftNavigation);
      leftControl.addEventListener('click', this.handleLeftNavigation);
    }
    
    if (rightControl) {
      rightControl.removeEventListener('click', this.handleRightNavigation);
      rightControl.addEventListener('click', this.handleRightNavigation);
    }
    
    const cells = this.selectorElement.querySelectorAll('.rangepicker__cell:not([disabled])');
    cells.forEach(cell => {
      cell.removeEventListener('click', this.handleDateCellClick);
      cell.addEventListener('click', this.handleDateCellClick);
    });
  }

  private handleLeftNavigation = (e: Event) => {
    e.stopPropagation();
    this.navigateMonths(-1);
  }

  private handleRightNavigation = (e: Event) => {
    e.stopPropagation();
    this.navigateMonths(1);
  }

  private handleDateCellClick = (event: Event) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const dateValue = target.getAttribute('data-value');
    if (dateValue) {
      this.handleDateSelect(new Date(dateValue));
    }
  }

  private handleDateSelect(selectedDate: Date): void {
    
    if (this.selectedFrom && this.selectedTo) {
      this.selectedFrom = selectedDate;
      this.selectedTo = null;
    } 
    else if (this.selectedFrom && !this.selectedTo) {
      if (selectedDate < this.selectedFrom) {
        this.selectedTo = this.selectedFrom;
        this.selectedFrom = selectedDate;
      } else {
        this.selectedTo = selectedDate;
      }
      this.updateInputDisplay();
    }
    else if (!this.selectedFrom) {
      this.selectedFrom = selectedDate;
      this.selectedTo = null;
    }
    
    if (this.selectedFrom) this.from = this.selectedFrom;
    if (this.selectedTo) this.to = this.selectedTo;
    
    this.updateSelectorHighlight();
    
    if (this.selectedFrom && this.selectedTo) {
      this.dispatchRangeSelectEvent();
    }
  }

  private navigateMonths(direction: number): void {
    if (!this.selectorElement) return;
    
    const calendars = this.selectorElement.querySelectorAll('.rangepicker__calendar');
    if (calendars.length !== 2) return;
    
    const leftCalendar = calendars[0] as HTMLElement;
    const year = parseInt(leftCalendar.dataset.year || '0');
    const month = parseInt(leftCalendar.dataset.month || '0');
    
    if (isNaN(year) || isNaN(month)) return;
    
    const currentDate = new Date(year, month, 1);
    currentDate.setMonth(currentDate.getMonth() + direction);
    
    const newYear = currentDate.getFullYear();
    const newMonth = currentDate.getMonth();
    
    const leftDate = new Date(newYear, newMonth, 1);
    const rightDate = new Date(newYear, newMonth + 1, 1);
    
    const leftCalendarHtml = this.renderCalendar(leftDate);
    const rightCalendarHtml = this.renderCalendar(rightDate);
    
    if (calendars[0]) calendars[0].outerHTML = leftCalendarHtml;
    if (calendars[1]) calendars[1].outerHTML = rightCalendarHtml;
    
    this.initSelectorEventListeners();
  }

  private updateSelectorHighlight(): void {
    if (!this.selectorElement) return;
    
    let from = this.selectedFrom;
    let to = this.selectedTo;
    
    if (from && to && from > to) {
      from = this.selectedTo;
      to = this.selectedFrom;
    }
    
    const cells = this.selectorElement.querySelectorAll('.rangepicker__cell:not([disabled])');
    cells.forEach(cell => {
      const dateValue = cell.getAttribute('data-value');
      if (dateValue) {
        const cellDate = new Date(dateValue);
        
        cell.classList.remove('rangepicker__selected-from', 'rangepicker__selected-to', 'rangepicker__selected-between');
        
        if (from && this.isSameDate(cellDate, from)) {
          cell.classList.add('rangepicker__selected-from');
        } else if (to && this.isSameDate(cellDate, to)) {
          cell.classList.add('rangepicker__selected-to');
        } else if (from && to && cellDate > from && cellDate < to) {
          cell.classList.add('rangepicker__selected-between');
        }
      }
    });
  }

  private updateInputDisplay(): void {
    if (!this.selectedFrom || !this.selectedTo) {
      return;
    }
    
    let fromSpan = this.element.querySelector('[data-element="from"]');
    let toSpan = this.element.querySelector('[data-element="to"]');
    let input = this.element.querySelector('[data-element="input"]');
    
    if (fromSpan && toSpan) {
      fromSpan.textContent = this.formatDate(this.selectedFrom);
      toSpan.textContent = this.formatDate(this.selectedTo);
    } else if (input) {
      input.innerHTML = `
        <span data-element="from">${this.formatDate(this.selectedFrom)}</span> -
        <span data-element="to">${this.formatDate(this.selectedTo)}</span>
      `;
    }
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isBetweenDates(date: Date, from: Date, to: Date): boolean {
    return date > from && date < to;
  }

  private dispatchRangeSelectEvent(): void {
    const event = new CustomEvent('range-select', {
      detail: {
        from: this.selectedFrom,
        to: this.selectedTo
      },
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  public remove(): void {
    this.element.remove();
  }

  public destroy(): void {
    this.remove();
  }
}

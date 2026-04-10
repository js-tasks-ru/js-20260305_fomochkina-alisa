import { escapeHtml } from '../../shared/utils/escape-html';
import { fetchJson } from '../../shared/utils/fetch-json';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

interface ProductImage {
  url: string;
  source: string;
}

interface Subcategories {
  id: string;
  title: string;
  count: number;
  category: string;
  weight: number;
};

interface ImgurUploadResponse {
  data: {
    link: string;
  };
}

export default class ProductForm {
  productId?: string;
  public element: HTMLElement;

  constructor(productId?: string) {
    this.productId = productId;
    this.element = document.createElement('div');
    this.element.className = 'product-form';
  }

  private getTemplate() {
    return `
    <form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input required="" type="text" name="title" id="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea required="" class="form-control" name="description" id="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer"><ul class="sortable-list"></ul></div>
        <button type="button" name="uploadImage" id="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
        <input type="file" name="fileInput" id="fileInput" accept="image/*" style="display:none">
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select class="form-control" name="subcategory" id="subcategory"></select>
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input required="" type="number" name="price" id="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input required="" type="number" name="discount" id="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input required="" type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select class="form-control" name="status" id="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" id="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>
    </form>
    `;
  }

  async render(): Promise<HTMLElement> {
    this.element.innerHTML = this.getTemplate();

    await this.loadCategories();

    if (this.productId) {
      await this.loadProduct();
    }

    this.initEventListeners();

    return this.element;
  }

  private async loadCategories() {
    const url = `${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`;
    const categories = await fetchJson<{
      id: string;
      title: string;
      subcategories: Subcategories[];
    }[]>(url);
    
    if (categories) {
      const select = this.element.querySelector('#subcategory');
      if (select) {
        select.innerHTML = categories.flatMap(
          category =>
            category.subcategories.map(sub =>
              `<option value="${sub.id}">${category.title} &gt; ${sub.title}</option>`
            )
        ).join('\n');
      }
    }
  }

  private async loadProduct() {
    if (!this.productId) return;
    
    const url = `${BACKEND_URL}/api/rest/products?id=${this.productId}`;
    const product = await fetchJson<{
      title: string;
      description: string;
      price: number;
      discount: number;
      quantity: number;
      subcategory: string;
      status: number;
      images: ProductImage[];
    }[]>(url);
    
    if (product && product[0]) {
      const form = this.element.querySelector('[data-element="productForm"]') as HTMLFormElement;
      
      (form.elements.namedItem("title") as HTMLInputElement).value = product[0].title;
      (form.elements.namedItem("description") as HTMLTextAreaElement).value = product[0].description;
      (form.elements.namedItem("price") as HTMLInputElement).value = String(product[0].price);
      (form.elements.namedItem("discount") as HTMLInputElement).value = String(product[0].discount);
      (form.elements.namedItem("quantity") as HTMLInputElement).value = String(product[0].quantity);
      (form.elements.namedItem("subcategory") as HTMLSelectElement).value = product[0].subcategory;
      (form.elements.namedItem("status") as HTMLSelectElement).value = String(product[0].status);

      const list = this.element.querySelector(".sortable-list") as HTMLElement;
      
      if (product[0].images) {
        list.innerHTML = this.createImageList(product[0].images);
      }
    }
  }

  private initEventListeners(): void {
    const listImages = this.element.querySelector(".sortable-list");

    listImages?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-delete-handle]")) {
        target.closest("li")?.remove();
      }
    });

    const uploadButton = this.element.querySelector('[name="uploadImage"]') as HTMLButtonElement;
    const fileInput = this.element.querySelector<HTMLInputElement>('input[name="fileInput"]')!;

    uploadButton.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetchJson<ImgurUploadResponse>("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: formData
      });

      this.addImage(response.data.link ?? "", response.data.link.split("/").pop() ?? "");
      
      fileInput.value = '';
    });

    const form = this.element.querySelector('[data-element="productForm"]') as HTMLFormElement;
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); 
      await this.save();
    });
  }

  private addImage(url: string, source: string) {
    const list = this.element.querySelector(".sortable-list");

    const li = document.createElement("li");
    li.className = "products-edit__imagelist-item sortable-list__item";

    li.innerHTML = `
      <input type="hidden" name="url" value="${escapeHtml(url)}">
      <input type="hidden" name="source" value="${escapeHtml(source)}">
      <span>
        <img src="icon-grab.svg" data-grab-handle alt="grab">
        <img class="sortable-table__cell-img" src="${escapeHtml(url)}">
        <span>${escapeHtml(source)}</span>
      </span>
      <button type="button">
        <img src="icon-trash.svg" data-delete-handle alt="delete">
      </button>
    `;

    list?.appendChild(li);
  }

  private createImageList(images: { url: string; source: string }[]): string {
    return images.map(image => `
      <li class="products-edit__imagelist-item sortable-list__item">
        <input type="hidden" name="url" value="${escapeHtml(image.url)}">
        <input type="hidden" name="source" value="${escapeHtml(image.source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(image.url)}">
          <span>${escapeHtml(image.source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>
    `).join("");
  }

  public async save(): Promise<void> {
    const form = this.element.querySelector('[data-element="productForm"]') as HTMLFormElement;

    const productData: any = {
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      price: Number((form.elements.namedItem("price") as HTMLInputElement).value),
      discount: Number((form.elements.namedItem("discount") as HTMLInputElement).value),
      quantity: Number((form.elements.namedItem("quantity") as HTMLInputElement).value),
      subcategory: (form.elements.namedItem("subcategory") as HTMLSelectElement).value,
      status: Number((form.elements.namedItem("status") as HTMLSelectElement).value),
      images: this.getImagesFromForm()
    };

    if (!productData.title || !productData.description || !productData.price) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    let url = `${BACKEND_URL}/api/rest/products`;
    let method = 'POST';
    let isUpdating = false;
    
    if (this.productId) {
      url += `?id=${this.productId}`;
      method = 'PATCH';
      isUpdating = true;
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (isUpdating) {
      const updateEvent = new CustomEvent('product-updated', {
        detail: { 
          product: result, 
          id: this.productId,
          oldData: null, 
          newData: productData
        },
        bubbles: true
      });
      this.element.dispatchEvent(updateEvent);
      
      console.log('Product updated successfully');
    } else {
      const saveEvent = new CustomEvent('product-saved', {
        detail: { 
          product: result,
          formData: productData
        },
        bubbles: true 
      });
      this.element.dispatchEvent(saveEvent);
      
      console.log('Product saved successfully');
    }
  }

  private getImagesFromForm(): { url: string; source: string }[] {
    const images: { url: string; source: string }[] = [];
    const listItems = this.element.querySelectorAll('.sortable-list li');
  
    listItems.forEach(item => {
      const urlInput = item.querySelector('input[name="url"]') as HTMLInputElement;
      const sourceInput = item.querySelector('input[name="source"]') as HTMLInputElement;
    
      if (urlInput && sourceInput && urlInput.value && sourceInput.value) {
        images.push({
          url: urlInput.value,
          source: sourceInput.value
        });
      }
    });
  
    return images;
  }

  public remove(): void {
    this.element.remove();
  }

  public destroy(): void {
    this.remove();
  }
}
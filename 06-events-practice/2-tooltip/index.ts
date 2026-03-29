export default class Tooltip {
    private static instance: Tooltip | null = null;

    public element: HTMLElement | null = null;

    private lastEvent: MouseEvent | null = null;

    private elementsWithTooltips: Map<HTMLElement, {
        pointerover: (e: MouseEvent) => void;
        pointermove: (e: MouseEvent) => void;
        pointerout: () => void;
    }> = new Map();

    constructor() {
        if (Tooltip.instance) {
            return Tooltip.instance;
        }

        Tooltip.instance = this;
        this.initialize();
    }

    public initialize() {
        const tooltipDiv = document.querySelector(`[data-tooltip]`) as HTMLElement | null;

        if (tooltipDiv) {
            const mousePointerOverHandler = (event: MouseEvent) => {
                this.lastEvent = event;
                this.showTooltip(event);
            };

            const mousePointerMoveHandler = (event: MouseEvent) => {
                this.lastEvent = event;
                this.showTooltip(event);
            };

            const mousePointerOutHandler = () => {
                this.hideTooltip();
            };

            this.elementsWithTooltips.set(tooltipDiv, {
                pointerover: mousePointerOverHandler,
                pointermove: mousePointerMoveHandler,
                pointerout: mousePointerOutHandler
            });

            tooltipDiv.addEventListener('pointerover', mousePointerOverHandler);
            tooltipDiv.addEventListener('pointermove', mousePointerMoveHandler);
            tooltipDiv.addEventListener('pointerout', mousePointerOutHandler);
        }
    }

    public render(target: HTMLElement) {
        if (!this.element) {
            const text = target?.dataset?.tooltip ?? '';
            this.element = document.createElement('div');
            this.element.className = 'tooltip';
            this.element.textContent = text;
            document.body.appendChild(this.element);
        }

        if (this.lastEvent) {
            this.element.style.left = `${this.lastEvent.clientX + 15}px`;
            this.element.style.top = `${this.lastEvent.clientY + 15}px`;
            this.element.style.position = 'fixed';
        }
    }

    private showTooltip(event: MouseEvent) {
        this.hideTooltip();
        const target = event.target as HTMLElement;

        if (target) {
            this.render(target);
        }
    }

    private hideTooltip() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    public destroy(): void {
        this.elementsWithTooltips.forEach((handlers, element) => {
            element.removeEventListener('pointerover', handlers.pointerover);
            element.removeEventListener('pointermove', handlers.pointermove);
            element.removeEventListener('pointerout', handlers.pointerout);
        });

        this.elementsWithTooltips.clear();

        this.element?.remove();
        this.element = null;
    }
}
interface ContextTemplate {
	title?: string;
	shortcut?: string;
	icon?: string;
	fontawesome_icon?:string;
	fontawesome_color?:string;
	onclick?: () => void;
	separator?: boolean;
	children?: ContextTemplate[];
}

interface ContextElement {
    id?: string;
    className?: string;
    textContent?: string;
    attributes?: [string, string][];
    styles?: [string, string][];
}

/**
 * Creates a context menu. This context menu can be opened when listening on the event "contextmenu".
 * @class
 */
class ContextMenu {
	private arrow_down: string = "▼";
	private arrow_up: string = "▲";
	private menu: HTMLElement | null = null;
	private menuid: string | null = null;

	/**
	 * @constructs ContextMenu
	 * @param {MouseEvent} event The mouse event.
	 * @param {Array<{title?:string,shortcut?:string,icon?:string,fontawesome_icon?:string,fontawesome_color?:string,onclick?:Function,separator?:boolean,children?:Array}>} items The items to be displayed.
	 */
	public constructor(event: MouseEvent, items: ContextTemplate[]) {
		event.stopPropagation();
		this._closeAllMenus();
		this._build(event, items);

		document.onclick = (e: MouseEvent) => {
			const target: HTMLElement = e.target as HTMLElement;
			const menu = this._getMenu();
			if (menu && !menu.contains(target)) {
				document.body.removeChild(menu as Node);
			}
		};
	}

	/**
	 * Gets the current menu if it's built.
	 * @returns {HTMLElement|null} The menu.
	 * @private
	 */
	private _getMenu(): HTMLElement | null {
		if (this.menuid) {
			return document.querySelector("#" + this.menuid);
		} else {
			return null;
		}
	}

	/**
	 * Closes the current menu if it's opened.
	 * @public
	 */
	public closeCurrentMenu(): void {
		const menu = this._getMenu();
		if (menu) {
			document.body.removeChild(menu as Node);
		}
	}

	/**
	 * Closes all the menus that could be opened.
	 * @private
	 */
	private _closeAllMenus(): void {
		const allmenus = document.querySelectorAll(".contextmenu");
		if (allmenus) {
			for (let i = 0; i < allmenus.length; i++) {
				document.body.removeChild(allmenus[i]);
			}
		}
	}

	/**
	 * Returns a random number between min and max.
	 * @param {number} min The minimum number (included)
	 * @param {number} max The maximum number (not included)
	 * @returns {number} The random number [min;max[
	 * @private
	 */
	private _rand(min: number, max: number): number {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

    /**
     * Creates a customizable div element.
     * @param {string} tagName The name of the tag.
     * @param {{id?:string,className?:string,textContent?:string,attributes?:Array<string>,styles?:Array<string>}} options The options to customize the element.
     * @returns {HTMLElement} The created element.
     * @private
     */
    private _createEl(tagName: string, options?: ContextElement): HTMLElement {
        const el = document.createElement(tagName);
        if (!options) return el;

        if (options.id) el.setAttribute("id", options.id);
        if (options.textContent) el.textContent = options.textContent;
        if (options.className) {
            const classes = options.className.split(" ");
            for (let clas of classes) {
                el.classList.add(clas);
            }
        }

        if (options.styles) {
            for (let style of options.styles) {
                const property = style[0];
                const value = style[1];
                el.style[property as any] = value;
            }
        }

        if (options.attributes) {
            for (let attr of options.attributes) {
                const name = attr[0];
                const value = attr[1];
                el.setAttribute(name, value);
            }
        }

        return el;
    }

	/**
	 * Builds the menu.
	 * @param {MouseEvent} event The mouse event.
	 * @param {{title?:string,shortcut?:string,icon?:string,fontawesome_icon?:string,fontawesome_color?:string,onclick?:Function,separator?:boolean,children?:Array}} items The items to be displayed.
	 * @private
	 */
	private _build(event: MouseEvent, items: ContextTemplate[]): void {
		this.menuid = "contextmenu-" + this._rand(0, 1000000);
		let contextmenu = this._createEl("div", { className: "contextmenu", id: this.menuid });
		let list = this._createEl("ul");

		for (let item of items) {
			if (item.separator) {
				const sep = this._createEl("div", { className: "contextmenu-separator" });
				list.appendChild(sep);
			} else {
				const li = this._buildItem(item);
				list.appendChild(li);
			}
		}

		contextmenu.appendChild(list);
		document.body.appendChild(contextmenu);

		this.menu = document.querySelector("#" + this.menuid);
		if (this.menu) {
			this.menu.style.left =
				event.clientX + this.menu.offsetWidth >= window.innerWidth
					? event.clientX - this.menu.offsetWidth + "px"
					: event.clientX + "px";

			this.menu.style.top =
				event.clientY + this.menu.offsetHeight >= window.innerHeight
					? event.clientY - this.menu.offsetHeight + "px"
					: event.clientY + "px";
				
			const all_items = this.menu.querySelectorAll("button.contextmenu-item");
			if (all_items && all_items[0]) (all_items[0] as HTMLElement).focus();
		}		
	}

	/**
	 * Opens the children list of an item.
	 * @param {Event} e The click event.
	 * @private
	 */
	private _openChildren(e: Event): void {
		const target = e.target as HTMLElement;
		const li = target.parentElement;
		if (li) {
			const children_container = li.querySelector(".contextmenu-container-children");
			const arrow = li.querySelector(".contextmenu-arrow");
			if (children_container && arrow) {
				children_container.classList.toggle("contextmenu-hidden");
				arrow.textContent == this.arrow_up ? arrow.textContent = this.arrow_down : arrow.textContent = this.arrow_up;
			}
		}
	}

	/**
	 * Builds an item.
	 * @param {{title?:string,shortcut?:string,icon?:string,fontawesome_icon?:string,fontawesome_color?:string,onclick?:Function,separator?:boolean,children?:Array}} item An item to be displayed in the menu.
	 * @returns {HTMLLIElement} The template of an item.
	 * @private
	 */
	private _buildItem(item: ContextTemplate): HTMLLIElement {
		const li = this._createEl("li") as HTMLLIElement;
		const el_contextmenuitem = this._createEl("button", { className: "contextmenu-item" });
		const el_containertitle = this._createEl("div", { className: "contextmenu-container-title" });
		const el_icon = item.icon ? this._createEl("img", { attributes: [["src", item.icon]] }) : null;
		const el_fontawesome_icon = item.fontawesome_icon ? this._createEl("i", { className: item.fontawesome_icon }) : null;
		const el_title = this._createEl("span", { className: "contextmenu-title", textContent: item.title });

		if ((el_icon && !el_fontawesome_icon) || (el_icon && el_fontawesome_icon)) el_containertitle.appendChild(el_icon);
		if (el_fontawesome_icon && item.fontawesome_color) el_fontawesome_icon.style.color = item.fontawesome_color;
		if (!el_icon && el_fontawesome_icon) el_containertitle.appendChild(el_fontawesome_icon);

		if (item.title) el_contextmenuitem.setAttribute("aria-label", item.title);

		if (!item.children && item.onclick) {
			el_contextmenuitem.addEventListener("click", () => {
				if (item.onclick) item.onclick();
				this.closeCurrentMenu();
			});
		} else if (item.children) {
			el_contextmenuitem.addEventListener("click", (e: MouseEvent) => {
				this._openChildren(e);
			});
		}

		if (item.children) {
			const el_arrow = this._createEl("span", { className: "contextmenu-arrow", textContent: this.arrow_down });
			const el_containerchildren = this._createEl("div", { className: "contextmenu-container-children contextmenu-hidden" });
			const el_ul = this._createEl("ul");

			for (var child of item.children) {
				child.children = undefined;

 				if (child.separator) {
					const sep = this._createEl("div", { className: "contextmenu-separator" });
					el_ul.appendChild(sep);
				} else {
					const li = this._buildItem(child);
					el_ul.appendChild(li);
				}
			}

			el_containertitle.appendChild(el_title);
			el_contextmenuitem.appendChild(el_containertitle);
			el_contextmenuitem.appendChild(el_arrow);
			li.appendChild(el_contextmenuitem);
			el_containerchildren.appendChild(el_ul);
			li.appendChild(el_containerchildren);

			/*
			li
				>div.contextmenu-item
					>>div.contextmenu-container-title
						${icon ? ">>>img[src=" + icon + "]" : ""}
						>>>span.contextmenu-title(${title})
					>>span.contextmenu-arrow(${this.arrow_down})
				>div.contextmenu-container-children.contextmenu-hidden
					>>ul
			*/
		} else {
			const el_shortcut = item.shortcut ? this._createEl("span", { className: "contextmenu-shortcut", textContent: item.shortcut }) : null;
			
			el_containertitle.appendChild(el_title);
			el_contextmenuitem.appendChild(el_containertitle);
			if (el_shortcut) el_contextmenuitem.appendChild(el_shortcut);
			li.appendChild(el_contextmenuitem);

			/*
			li${"@" + event_name}
				>div.contextmenu-item
					>>div.contextmenu-container-title
						${icon ? ">>>img[src=" + icon + "]" : ""}
						>>>span.contextmenu-title(${title})
					${shortcut ? ">>span.contextmenu-shortcut(" + shortcut + ")" : ""}\n
			*/
		}

		return li;
	}
}
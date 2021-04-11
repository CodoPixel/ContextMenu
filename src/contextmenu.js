"use strict";
/**
 * Creates a context menu. This context menu can be opened when listening on the event "contextmenu".
 * @class
 */
class ContextMenu {
    /**
     * @constructs ContextMenu
     * @param event The mouse event.
     * @param items The items to be displayed.
     */
    constructor(event, items) {
        this.arrow_down = "▼";
        this.arrow_up = "▲";
        this.menu = null;
        this.menuid = null;
        event.stopPropagation();
        this._closeAllMenus();
        this.builder = new HTMLBuilder();
        this._build(event, items);
        document.onclick = (e) => {
            const target = e.target;
            const menu = this._getMenu();
            if (menu && !menu.contains(target)) {
                document.body.removeChild(menu);
            }
        };
    }
    /**
     * Gets the current menu if it's built.
     * @returns {HTMLElement|null} The menu.
     */
    _getMenu() {
        if (this.menuid) {
            return document.querySelector("#" + this.menuid);
        }
        else {
            return null;
        }
    }
    /**
     * Closes the current menu if it's opened.
     */
    closeCurrentMenu() {
        const menu = this._getMenu();
        if (menu) {
            document.body.removeChild(menu);
        }
    }
    /**
     * Closes all the menus that could be opened.
     */
    _closeAllMenus() {
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
     */
    _rand(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    /**
     * Builds the menu.
     * @param {MouseEvent} event The mouse event.
     * @param {{title:string|undefined,shortcut:string|undefined,icon:string|undefined,onclick:Function|undefined,separator:boolean|undefined,children:array|undefined}} items The items to be displayed.
     */
    _build(event, items) {
        const id = "contextmenu-" + this._rand(0, 1000000);
        let template = `
            div.contextmenu#${id}
                >ul
        `;
        for (let item of items) {
            if (item.separator) {
                template += this.builder.indentTemplate("div.contextmenu-separator", 2) + "\n";
            }
            else {
                template += this.builder.indentTemplate(this._buildItem(item), 2) + "\n";
            }
        }
        this.builder.generate(template);
        this.builder.clearEvents();
        this.menuid = id;
        this.menu = document.querySelector("#" + id);
        if (this.menu) {
            this.menu.style.left =
                event.clientX + this.menu.offsetWidth >= window.innerWidth
                    ? event.clientX - this.menu.offsetWidth + "px"
                    : event.clientX + "px";
            this.menu.style.top =
                event.clientY + this.menu.offsetHeight >= window.innerHeight
                    ? event.clientY - this.menu.offsetHeight + "px"
                    : event.clientY + "px";
        }
    }
    _openChildren(e) {
        const target = e.target;
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
     * @param {{title:string|undefined,shortcut:string|undefined,icon:string|undefined,onclick:Function|undefined,separator:boolean|undefined,children:array|undefined}} item An item to be displayed in the menu.
     * @returns The template of an item.
     */
    _buildItem(item) {
        const icon = item.icon ? item.icon : null;
        const title = item.title ? item.title : "";
        const shortcut = item.shortcut ? item.shortcut : null;
        const onclick = item.onclick ? item.onclick : null;
        const children = item.children ? item.children : null;
        let event_name = "";
        if (!children && onclick) {
            event_name = "eventitem-" + this._rand(0, 1000000);
            this.builder.bindEvent({
                name: event_name,
                type: "click",
                callback: () => {
                    onclick();
                    this.closeCurrentMenu();
                },
            });
        }
        else if (children) {
            event_name = "openchildren-" + this._rand(0, 1000000);
            this.builder.bindEvent({
                name: event_name,
                type: "click",
                callback: (e) => { this._openChildren(e); }
            });
        }
        if (children) {
            let complex_template = `
                li${"@" + event_name}
                    >div.contextmenu-item
						>>div.contextmenu-container-title
							${icon ? ">>>img[src=" + icon + "]" : ""}
							>>>span.contextmenu-title(${title})
						>>span.contextmenu-arrow(${this.arrow_down})
					>div.contextmenu-container-children.contextmenu-hidden
						>>ul
            `;
            for (var child of children) {
                child.children = undefined; // the user cannot have children again
                if (child.separator) {
                    complex_template += this.builder.indentTemplate("div.contextmenu-separator", 3) + "\n";
                }
                else {
                    complex_template += this.builder.indentTemplate(this._buildItem(child), 3) + "\n";
                }
            }
            return complex_template;
        }
        else {
            return `
                li${"@" + event_name}
                    >div.contextmenu-item
						>>div.contextmenu-container-title
							${icon ? ">>>img[src=" + icon + "]" : ""}
							>>>span.contextmenu-title(${title})
						${shortcut ? ">>span.contextmenu-shortcut(" + shortcut + ")" : ""}\n
            `;
        }
    }
}
/**
 * A tool that allows you to generate HTML content from a template in an optimised way.
 * @class
 */
class HTMLBuilder {
    /**
     * @constructs HTMLBuilder
     * @param {HTMLElement} parent The parent in which to put the generated elements.
     */
    constructor(parent) {
        /**
         * The regular expression used to parse a template.
         * @type {RegExp}
         * @constant
         * @private
         */
        this.REGEX = /(\w+)((?:\.[\w-]*)*)*(#[\w-]*)?(?:\((.*)\))?(?:\[(.*)\])?(?:\@([\w;-]*))*/;
        /**
         * The symbol uses to separate different attributes.
         * @type {string}
         * @private
         */
        this.SYMBOL_BETWEEN_ATTRIBUTES = ";";
        /**
         * The list of all the events.
         * @private
         */
        this.EVENTS = [];
        this.parent = parent || document.body;
    }
    /**
     * Changes the parent element.
     *
     * @param parent The new parent element in which to put the generated elements.
     * @public
     */
    setParent(parent) {
        this.parent = parent;
    }
    /**
     * Registers an event to use in a template. Those events are available for all the templates.
     *
     * @param {{name: string, type: string, callback: Function, options: any}} event The event to register.
     * @public
     */
    bindEvent(event) {
        if (!event.name)
            throw new Error("bindEvent(): cannot bind an event without a name.");
        if (!event.type)
            throw new Error("bindEvent(): cannot bind an event without a precise type.");
        if (!event.callback)
            throw new Error("bindEvent(): cannot bind an event without a callback function.");
        if (event.name.startsWith("on")) {
            event.name = event.name.replace("on", "");
        }
        this.EVENTS.push(event);
    }
    /**
     * Clears all the events.
     * @public
     * @since 1.0.6
     */
    clearEvents() {
        this.EVENTS = [];
    }
    /**
     * Changes the symbol that separates the attributes inside brackets.
     *
     * @param {string} symbol The new symbol.
     * @public
     * @example `
     *      changeSymbolBetweenAttributes('/')
     *      => [attr1=et / attr2=voilà]
     * `
     */
    changeSymbolBetweenAttributes(symbol) {
        this.SYMBOL_BETWEEN_ATTRIBUTES = symbol;
    }
    /**
     * Indents a template in order to concatenate it with another one.
     * @param {string} template The template to indent.
     * @param {number} indentation The level of indentation (by default 1).
     * @returns {string} The new template.
     * @since 1.0.3
     */
    indentTemplate(template, indentation = 1) {
        var newTemplate = "";
        var lines = this._extractLinesFrom(template);
        for (var line of lines) {
            newTemplate += ">".repeat(indentation) + line.trim() + "\n"; // \n to add more lines
        }
        return newTemplate.trim();
    }
    /**
     * Gets the indentation level of a line.
     *
     * @param {string} line The line to parse.
     * @return {number} The level of indentation.
     * @private
     */
    _level(line) {
        var level = 0;
        for (var i = 0; i < line.length; i++) {
            if (line[i] !== ">") {
                break;
            }
            else {
                level++;
            }
        }
        return level;
    }
    /**
     * Extracts the different lines of a template in order to analyse them individually.
     *
     * @param {string} template The template of the HTML elements.
     * @return {Array<string>} The lines from a template.
     * @private
     */
    _extractLinesFrom(template) {
        var lines = template.trim().split("\n");
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim();
            if (lines[i].length == 0) {
                lines.splice(i, 1);
            }
        }
        return lines;
    }
    /**
     * Decodes HTML entities like `&amp;` etc.
     *
     * @param {string} content The content to decode.
     * @return {string} The decoded content.
     * @private
     * {@link https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it/7394787#7394787}
     */
    _decodeHTMLEntities(content) {
        var txt = document.createElement("textarea");
        txt.innerHTML = content;
        return txt.value;
    }
    /**
     * Gets an event according to its name.
     *
     * @param name The name of the event we are looking for.
     * @return {{name: string, type: string, callback: Function, options: any}} The event we are looking for.
     * @private
     */
    _searchForEvent(name) {
        for (var event of this.EVENTS) {
            if (name === event.name) {
                return event;
            }
        }
        return null;
    }
    /**
     * Generates a new HTML element from a line (you must use a specific syntax & order).
     *
     * @param {string} line The line to parse.
     * @return {HTMLElement} The generated HTML element.
     * @private
     * @throws If there is no tagname.
     */
    _createElementFromLine(line) {
        // Be careful when you use exec() with the global flag
        // If you use a global flag, then set the lastIndex property of the regex to 0 (its initial value).
        // this.REGEX.lastIndex = 0;
        //
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#finding_successive_matches
        var matches = this.REGEX.exec(line) || [];
        var tagname = matches[1] || null;
        var classes = matches[2] ? matches[2].split(".").filter((v) => v !== "") : null;
        var id = matches[3] ? matches[3].replace("#", "") : null;
        var content = matches[4] || null;
        var attributes = matches[5] ? matches[5].split(this.SYMBOL_BETWEEN_ATTRIBUTES) : null;
        var events = matches[6] ? matches[6].split(";").filter((v) => v !== "") : null;
        if (!tagname) {
            throw new Error('HTMLBuilder: unable to parse a line: "' + line + '"');
        }
        var element = document.createElement(tagname);
        if (classes) {
            for (var c of classes) {
                if (/\d/.test(c[0])) {
                    console.error("HTMLBuilder: invalid syntax for class name '" + c + "'");
                    continue;
                }
                element.classList.add(c);
            }
        }
        if (attributes) {
            for (var attr of attributes) {
                if (/\d/.test(attr[0])) {
                    console.error("HTMLBuilder: invalid syntax for attribute name '" + attr + "'");
                    continue;
                }
                attr = attr.trim();
                if (attr.indexOf("=") !== -1) {
                    var name = attr.split("=")[0];
                    var value = attr.split("=")[1];
                    element.setAttribute(name, value);
                }
                else {
                    element.setAttribute(attr, "");
                }
            }
        }
        if (id)
            element.id = id;
        if (content)
            element.appendChild(document.createTextNode(this._decodeHTMLEntities(content)));
        if (events) {
            for (var name of events) {
                if (/\d/.test(name[0])) {
                    console.error("HTMLBuilder: invalid syntax for event name '" + name + "'");
                    continue;
                }
                var event = this._searchForEvent(name);
                if (event) {
                    // @ts-ignore
                    element.addEventListener(event.type, event.callback, event.options);
                }
            }
        }
        return element;
    }
    /**
     * Gets the maximum level of indentation.
     *
     * @param {Array} children The list of children of a main element from a template.
     * @return {number} The maximum level of indentation of a list of children.
     * @private
     */
    _maxLevel(children) {
        var max = children[0][1];
        for (var child of children) {
            var level = child[1];
            if (level > max) {
                max = level;
            }
        }
        return max;
    }
    /**
     * Gets the index of the deepest element. The deepest element is the last child to have the highest level of indentation.
     *
     * @param {Array} children The list of children of a main element from a template.
     * @return {number} The index of the deepest child.
     * @private
     */
    _getIndexOfDeepestElement(children) {
        var max = this._maxLevel(children);
        if (max === 1) {
            // If all the elements are on the closest possible level (1),
            // then we want to append the last child of the list.
            // Remember that we do a prepend() not an append(),
            // therefore the last one must go first in order to keep the right order
            return children.length - 1;
        }
        var lastIndex = 1;
        for (var i = 0; i < children.length; i++) {
            var level = children[i][1];
            if (level === max) {
                lastIndex = i;
            }
        }
        return lastIndex;
    }
    /**
     * Gets the index of the nearest element of the deepest one. This child is the parent element of the deepest one.
     *
     * @param indexOfDeepest The index of the deepest element.
     * @param children The list of children of a main element from a template.
     * @return {number} The index of the nearest child.
     * @private
     */
    _getIndexOfNearestParentElementOf(indexOfDeepest, children) {
        var deepest = children[indexOfDeepest][1];
        var lastIndex = null;
        for (var i = 0; i < indexOfDeepest; i++) {
            var level = children[i][1];
            if (level === deepest - 1) {
                lastIndex = i;
            }
        }
        return lastIndex;
    }
    /**
     * Reproduces a template in full HTML structure and adds it to the parent as a child (there can be several children).
     *
     * @param {string} template The template of your HTML structure.
     * @public
     */
    generate(template) {
        if (template.trim().length === 0)
            return;
        // We read all the lines in order to identify the main HTML elements,
        // i.e. those without indentation
        var lines = this._extractLinesFrom(template);
        var mainLines = [];
        var i = 0;
        var k = 0;
        for (i = 0; i < lines.length; i++) {
            var line = lines[i];
            var level = this._level(line);
            if (level === 0) {
                mainLines.push([line, i]); // the line & its index among all the lines
            }
        }
        // We read the next lines and we create an array [HTMLElement, its level] that we save
        // in a list of children, for each main element.
        for (i = 0; i < mainLines.length; i++) {
            var childrenElements = [];
            var mainLine = mainLines[i][0];
            var mainLevel = mainLines[i][1];
            var nextMainLevel = mainLines[i + 1] ? mainLines[i + 1][1] : lines.length;
            var mainElement = this._createElementFromLine(mainLine);
            // starts at the position of the main line
            // ends at the position of the next main line
            // in order to get only its children
            for (k = mainLevel + 1; k < nextMainLevel; k++) {
                var line = lines[k];
                var child = this._createElementFromLine(line);
                childrenElements.push([child, this._level(line)]);
            }
            // We search for the deepest element (i.e. the one with the highest level of indentation)
            // This deepest has as parent the nearest element which has a level of indentation equal to "child's level - 1"
            // We call it the "nearest parent element".
            // Then, because we read the list of children from bottom to top, we prepend() in order to keep the right order.
            // Indeed, append() would reverse the right order.
            while (childrenElements.length > 0) {
                var indexOfDeepest = this._getIndexOfDeepestElement(childrenElements);
                var indexOfNearestParent = this._getIndexOfNearestParentElementOf(indexOfDeepest, childrenElements);
                // Don't forget to specify "!== null" because indexOfNearestParent can be 0 (= false)
                indexOfNearestParent !== null
                    ? childrenElements[indexOfNearestParent][0].prepend(childrenElements[indexOfDeepest][0])
                    : mainElement.prepend(childrenElements[indexOfDeepest][0]);
                childrenElements.splice(indexOfDeepest, 1);
            }
            this.parent.appendChild(mainElement);
        }
    }
}

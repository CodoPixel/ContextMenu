# ContextMenu

Creates a custom context menu on right click.

## Get started

You need to import two files that you can find in the `src` folder of this repository: `contextmenu.js` & `contextmenu.css`. Then, don't forget to include both files into your project:

```html
<link rel="stylesheet" href="contextmenu.css">
```

```html
<script src="contextmenu.js">
```

Perfect, now let's create our first context menu.

## Create your own context menu

A context menu must be generated when there is a right click, in other words you must listen to a particular event: `contextmenu`:

```javascript
const mybutton = document.querySelector("#btn");
mybutton.addEventListener("contextmenu", function(ev) {
    ev.preventDefault(); // this avoids the default behavior of the browser
    let contextMenu = new ContextMenu(ev, [
        { title: "Item1" }
    ]);
});
```

See it by yourself, right click on this button and the context menu will appear.

## Customize your own context menu

The context menu works on an item system. An item can have a title, an icon, a shortcut and a callback function. This function is called when the user clicks on the item.

There are two kinds of item, a single item and a complex item. Here is the single one:

```javascript
var item = {
    title: "Item 1",
    shortcut: "Ctrl+C",
    icon: "assets/myicon.svg",
    // or: fontawesome_icon: "fas fa-check", (the className of an icon)
    onclick: () => console.log("clicked on item 1"),
};
```

Now the complex item:

```javascript
var item = {
    title: "Item 1",
    icon: "assets/myicon.svg",
    children: [
        { title: "subitem 1", onclick: () => {} }
    ],
};
```

Basically, a complex item is just a dropdown menu which displays more items when clicked. In addition, a complex item can neither have a shortcut nor a callback function.

**Note:** a subitem cannot have children.

## Separators

Instead of an item, you can define a separator to separate groups of items:

```javascript
var item = {
    separator: true,
};
```

Of course, a separator cannot have any other options.

## Customize the style of the context menu

You can change the font family, the background color etc. of the context menu by modifying the CSS file. There are the main variables defined at the beginning of the file, which are:

```css
:root {
	--menu-background-color: #fff;
	--menu-box-shadow: 0 0 6px rgba(204, 204, 204, 0.25);
	--menu-width: 180px;
	--menu-font-family: Roboto, "Segoe UI", "Open Sans", "Helvetica Neue", sans-serif;
	--menu-font-color: #404040;
	--menu-font-size: 0.9em;
	--menu-hover-item-color: #b4e6ff;
	--menu-hover-child-color: #8ed7fc;
	--menu-shortcut-color: rgba(64, 64, 64, 0.5);
	--menu-separator-color: #eee;
	--menu-icon-width: 10px;
	--menu-separator-height: 1px;
}
```

In addition, the file is, I think, well commented.

## License

MIT License
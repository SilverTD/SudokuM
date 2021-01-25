function HTMLBuilder()
{
	this.html = "";
	this.hooks = [];
}

HTMLBuilder.prototype.add = function(content)
{
	if (typeof content === "string") {
		this.html += content;
	} else if (typeof content === "object" && "html" in content && "hooks" in content) {
		this.html += content.html;
		this.addHooks(content.hooks);
	} else {
		throw "Input must be an HTML string or an HTMLBuilder-like object";
	}
	return this;
};

// Polls the function getValue at a specified for updated values and updates the HTML in the DOM
// - getValue may return either a string or an HTMLBuilder, but either must be complete valid HTML (no unmatched tags)
// - period specifies the time between updates in milliseconds (default 100 ms)
HTMLBuilder.prototype.addReactive = function(getValue, period = 100) {
	const ID = uniqueID("reactive");
	this.html += `<span id=${ID}></span>`;
	this.addHook(() => {
		(function update() {
			const el = document.getElementById(ID);
			if (el) {
				const value = getValue();

				if (value instanceof HTMLBuilder)
					value.insertInto(el);
				else
					el.innerHTML = value;

				setTimeout(update, period);
			}
		})();
	});
	return this;
};

HTMLBuilder.prototype.addDOM = function(domElement)
{
	const ID = uniqueID("DOM");
	this.html += `<span id='${ID}'></span>`;
	this.addHook(() => $(`#${ID}`).html(domElement));
	return this;
}

HTMLBuilder.prototype.addHook = function(hook)
{
	this.hooks.push(hook);
	return this;
};

HTMLBuilder.prototype.addHooks = function(hooks)
{
	this.hooks = this.hooks.concat(hooks);
	return this;
};

HTMLBuilder.prototype.insertInto = function(selector)
{
	$(selector).html(this.html);
	this.hooks.forEach((hook) => hook());
};

HTMLBuilder.prototype.appendInto = function(selector)
{
	$(selector).append(this.html);
	this.hooks.forEach((hook) => hook());
};

HTMLBuilder.prototype.appendAfter = function(selector)
{
	$(selector).after(this.html);
	this.hooks.forEach((hook) => hook());
};

HTMLBuilder.prototype.appendBefore = function(selector)
{
	$(selector).before(this.html);
	this.hooks.forEach((hook) => hook());
};

HTMLBuilder.prototype.print = function()
{
	console.log(this.html);
	console.log(this.hooks);
	return this;
};

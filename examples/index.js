const SectionSnapScroller = require("section-snap-scroller");

const scroller = new SectionSnapScroller(document.getElementById("main"), {
	behavior: "mandatory",
	onSectionUpdate: function (id) { console.log("onUpdate: " + id); },
	beforeScroll: function (id) { console.log("beforeScroll: " + id); },
	onScroll: function (id) { console.log("onScroll: " + id); },
	afterScroll: function (id) { console.log("afterScroll: " + id); },
});

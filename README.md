# SectionSnapScroller.js
JavaScript based scroll handler to perform vertical snap scroll on page sections.

## Installation

`npm i section-snap-scroller`

## Usage

```javascript
var $el = document.getElementById("main");
var scrollHandler = new SectionSnapScroller($el, {
	behavior: "mandatory", // "proximity"
	onSectionUpdate: function (sectionId) {
		// This is fired when the current section is updated
		console.log("Update scroll to " + sectionId);
	},
	beforeScroll: function (sectionId) {
		// This is fired once before scroll starts
		console.log("Before scroll from " + sectionId);
	},
	onScroll: function (sectionId) {
		// This is fired while scrolling
		console.log("While scrolling from " + sectionId);
	},
	afterScroll: function (sectionId) {
		// This is fired once when scroll ends
		console.log("After scroll to " + sectionId);
	},
});
```

## Scroll Snap

This package reproduce the behavior of the CSS module [Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap) but handler by javascript and for non-touchable browsers where this CSS module works regular.

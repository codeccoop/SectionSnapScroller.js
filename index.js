var isMobile = require("is-mobile");
var { throttle } = require("easeer-js");

var SectionSnapScroller = (function() {
    /* PRIVATE INTERFACE */
    function _smoothScrolling($el, order) {
        var delta = 0;
        var offset = Math.abs(order.top);
        var direction = order.top > 0 ? 1 : -1;

        return throttle(function(progress) {
            var move = offset * progress * direction - delta;
            $el.scrollBy(0, move);
            delta += move;
        }, {
	    interval: 10,
            duration: (offset / 20) * 10,
            easing: "out"
	});
    }

    function _setupScrollViewport(getContentHeight) {
        var viewport = document.createElement("div");
        viewport.classList.add("scroll-viewport");
        var span = document.createElement("div");
        span.classList.add("scroll-span");

        var height = getContentHeight();
        window.addEventListener("resize", function() {
            if (isMobile()) {
                return;
            }
            height = getContentHeight();
            span.style.height = height + "px";
        });
        screen.orientation.addEventListener("change", function() {
            height = getContentHeight();
            span.style.height = height + "px";
        });

        span.style.height = height + "px";
        viewport.appendChild(span);
        return viewport;
    }

    function _createStylesheet(behavior) {
        var styles;
        if (isMobile()) {
            styles = ".scroll-root { overflow-y: scroll; height: 100vh; scroll-snap-type: y " + behavior + "; }";
            styles +=
                ".scroll-root .scroll-section { min-height: 100vh; min-height: calc(var(--vh, 1vh) * 100); width: 100vw; width: calc(var(--vw, 1vw) * 100); scroll-snap-align: start; scroll-snap-stop: always; }";
            styles += ".scroll-root .scroll-section:last-child { height: 0px; min-height: 0px; }";
        } else {
            styles = "html, body { overscroll-behavior-y: contain; }";
            styles +=
                ".scroll-root { overflow: hidden; height: 100vh; height: calc(var(--vh, 1vh) * 100); width: 100%; overscroll-behavior-y: contain; }";
            styles +=
                ".scroll-root .scroll-section { min-height: 100vh; min-height: calc(var(--vh, 1vh) * 100); width: 100vw; width: calc(var(--vw, 1vw) * 100); }";
            styles +=
                ".scroll-viewport { position: absolute; z-index: 90; pointer-events: none; top: 0px; left: 0px; width: 100vw; width: calc(var(--vw, 1vw) * 100); height: 100vh; height: calc(var(--vh, 1vh) * 100); overflow-x: hidden; overflow-y: auto; }";
            styles +=
                ".scroll-viewport .scroll-span { width: 100%; background: transparent; }";
            styles +=
                ".scroll-viewport .scroll-logger { position: fixed; bottom: 15px; right: 30px; z-index: 10; background: white; border-radius: 5px; padding: .5em 1em; box-shadow: 2px 2px 6px #0003; }";

        }

        var css = document.createElement("style");
        css.type = "text/css";

        if (css.styleSheet) {
            css.styleSheet.cssText = styles;
        } else {
            css.appendChild(document.createTextNode(styles));
        }

        document.getElementsByTagName("head")[0].appendChild(css);
    }

    function _setupLogger() {
        logger = document.createElement("div");
        logger.classList.add("scroll-logger");

        logger.log = function(message) {
            logger.innerText = message;
        };

        return logger;
    }

    var onScroll = (function() {
        var self, direction, overflow, delayed;
		var scrolling = false;

        function _onScrollEnds() {
            overflow = self.getCurrentSectionOverflow(direction);
            if (overflow * direction < 0) {
				if (self.behavior === "mandatory") {
					self.currentSection =
						self.sections.indexOf(self.currentSection) + direction;
				} else {
					self.currentSection = self.getVisibleSection().id;
				}
            }
			self.afterScroll(self.currentSection);
			scrolling = false;
        }

        return function(ev) {
            self = this;
            if (this._delayed === true) return;
			if (scrolling === false) {
				this.beforeScroll(this.currentSection);
				scrolling = true;
			}

            var offset = ev.deltaY;
            direction = ev.deltaY < 0 ? -1 : 1;

			var nextSection = this.sections[Math.max(0, Math.min(
				this.sections.length - 1,
				this.sections.indexOf(this.currentSection) + direction
			))];
			var nextSectionOverflow = getSectionOverflow(nextSection, direction);

			if (this.behavior === "mandatory") {
				offset = Math.abs(offset) > Math.abs(nextSectionOverflow) ?
					nextSectionOverflow : offset;
			}

            this.$el.scrollBy(0, offset);
            this.$viewport.scrollBy(0, offset);
			this.onScroll(this.currentSection);

            clearTimeout(delayed);
            delayed = setTimeout(_onScrollEnds, 50);
        };
    })();

	function getSectionOverflow (id, direction) {
		if (direction === void 0) {
			console.warn("getSectionOverflow needs a direction to compute the sections overflow. Direction mus't be a positive integer like 1 to get descending overflow, and negative integer, like -1, to get ascending overflow. When no direction is informed, then it uses 1 as a fallback value.");
			direction = 1;
		}
        var overflow;
        var $el = document.getElementById(id);
        var box = $el.getBoundingClientRect();
        if (direction > 0) {
            overflow = Math.floor(box.height + box.top - window.innerHeight);
        } else {
            overflow = Math.floor(box.top);
        }

        return Math.abs(overflow) <= 5 ? 0 : overflow;
	}


    /* PUBLIC INTERFACE */
    function SectionSnapScroller(scrollEl, settings) {
        var self = this;
        settings = settings || {};
		this.behavior = ["mandatory", "proximity"].includes(settings.behavior) ? settings.behavior : "mandatory";
        _createStylesheet(this.behavior);

        if (typeof scrollEl === "string") {
            this.$el = document.querySelector(scrollEl);
            if (this.$el === void 0) {
                throw new Error("SectionSnapScroller can't find their root HTMLElement");
            }
        } else if (HTMLElement.prototype.isPrototypeOf(scrollEl)) {
            this.$el = scrollEl;
        } else {
            throw new Error("SecttionSnapScroller initialization needs a root HTMLElement to be attached on");
        }

        this.$el.classList.add("scroll-root");
        this._sectionClass = "scroll-section";
        this._delayed = false;

        var sections;
        if (settings.sectionClass) {
            sections = Array.apply(
                null,
                this.$el.getElementsByClassName(settings.sectionClass)
            );
        } else {
            sections = Array.apply(null, this.$el.children);
        }

        Object.defineProperty(this, "sections", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: Array.apply(null, sections).map(function(el, i) {
                el.classList.add("scroll-section");
                if (el.getAttribute("id") === null) {
                    el.setAttribute("id", "scroll-section-" + i);
                }
                return el.id;
            }),
        });

        var _while;
        var _currentSection;
        Object.defineProperty(this, "currentSection", {
            get: function() {
                return _currentSection;
            },
            set: function(section) {
                if (Number.isInteger(section)) {
                    section = self.sections[section] || _currentSection;
                }

                if (section !== _currentSection) {
                    var direction =
                        self.sections.indexOf(section) -
                        self.sections.indexOf(_currentSection);
                    _currentSection = section;

                    function afterScroll() {
                        self.$el.removeEventListener("scroll", whileScroll);
                        self._delayed = false;
                        // self.$logger.log("Delayed = false");
                    }

                    function whileScroll() {
                        clearTimeout(_while);
                        _while = setTimeout(afterScroll, 50);
                    }
                    self.$el.addEventListener("scroll", whileScroll);
                    _while = setTimeout(afterScroll, 150);
                    self._delayed = true;
                    // self.$logger.log("Delayed = true");

                    self.scrollTo(_currentSection, direction);

                    setTimeout(function() {
                        self.onSectionUpdate(_currentSection);
                    }, 0);
                }
            },
        });

        Object.defineProperty(this, "currentSectionEl", {
            get: function() {
                return Array.apply(null, self.$el.getElementsByClassName(self._sectionClass))
                    .filter(function(el) {
                        return el.id === self.currentSection;
                    });
            }
        })

        if (isMobile()) {
            var lastChild = document.createElement("div");
            lastChild.classList.add(this._sectionClass);
            this.$el.appendChild(lastChild);
            return
        }

        onScroll = onScroll.bind(this);
        document.addEventListener("wheel", onScroll, true);

        function onPopState() {
            _currentSection = location.hash.replace(/#/, "");
            var section = document.getElementById(_currentSection);
            var box = section.getBoundingClientRect();
            self.$viewport.scrollBy(0, box.top);
            self.onSectionUpdate(_currentSection);
        }

        window.addEventListener("popstate", onPopState);

        setTimeout(function() {
            self.$viewport = _setupScrollViewport(self.getContentHeight.bind(self));
            self.$el.appendChild(self.$viewport);

            var hashId = location.hash.replace(/#/, "");
            var visibleSection =
                document.getElementById(hashId) || self.getVisibleSection();
            _currentSection = visibleSection.id;
            location.hash = _currentSection;

            self.scrollTo(_currentSection, 1, "auto");
            self._delayed = false;
            // self.$logger.log("Delayed = false");

            if (settings.debug) {
                self.$viewport.appendChild(self.$logger);
                // self.$logger.log("Initialized");
            }
        }, 0);

        // this.$logger = _setupLogger();

		/* SCROLL HOOKS */
		if (settings.onSectionUpdate) this.onSectionUpdate = settings.onSectionUpdate;
		if (settings.beforeScroll) this.beforeScroll = settings.beforeScroll;
		if (settings.onScroll) this.onScroll = settings.onScroll;
		if (settings.afterScroll) this.afterScroll = settings.afterScroll;
    }

    SectionSnapScroller.prototype.getContentHeight = function() {
        var height = 0;
        for (var i = 0; i < this.$el.childElementCount; i++) {
            if (this.$el.children[i].classList.contains("scroll-viewport")) {
                continue;
            }

            height += this.$el.children[i].clientHeight;
        }

        return height;
    };

    SectionSnapScroller.prototype.getVisibleSection = function() {
        return Array.apply(
            null,
            document.getElementsByClassName(this._sectionClass)
        ).reduce(function(focused, sectionEl) {
            var acum_top = focused ?
                focused.getBoundingClientRect().top :
                window.innerHeight;
            var n_top = sectionEl.getBoundingClientRect().top;

            if (Math.abs(n_top) < Math.abs(acum_top)) {
                return sectionEl;
            } else {
                return focused;
            }
        }, null);
    };

    SectionSnapScroller.prototype.getCurrentSectionOverflow = function(direction) {
		return getSectionOverflow(this.currentSection, direction);
    };

    SectionSnapScroller.prototype.scrollTo = function(id, direction, behavior) {
        direction = direction || 1;
        behavior = behavior || "smooth";
        var el = document.getElementById(id);
        var order = {
            left: 0,
            top: null,
            behavior: behavior,
        };

        if (direction > 0) {
            order.top = el.getBoundingClientRect().top;
        } else {
            order.top = el.getBoundingClientRect().bottom - window.innerHeight;
        }

        this.$el.scrollBy(order);

        if (behavior === "auto") {
            this.$viewport.scrollBy(order);
        } else {
            _smoothScrolling(this.$viewport, order);
        }

        this.currentSection = id;
        history.replaceState({
            from: location.hash
        }, null, "/#" + id);
    };

    SectionSnapScroller.prototype.onResize = (function() {
        var self;
        var delayed;

        return function() {
            self = this;
            clearTimeout(delayed);
            delayer = setTimeout(function() {
                var section = self.getVisibleSection();
                var box = section.getBoundingClientRect();
                self.$el.scrollBy(0, box.top);
                self.$viewport.scrollBy(0, box.top);
            }, 50);
        };
    })();

    SectionSnapScroller.prototype.onSectionUpdate = function() {};
    SectionSnapScroller.prototype.beforeScroll = function() {};
	SectionSnapScroller.prototype.onScroll = function() {};
	SectionSnapScroller.prototype.afterScroll = function() {};

    return SectionSnapScroller;
})();

module.exports = SectionSnapScroller;

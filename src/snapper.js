var snapper = function snapper() {
    return {
        /**
         * Handle the scroll event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onScroll: function onScroll(event) {
            viewport.updateTop();
            section.updateActive();

            if (isAllowedToSnap()) {
                var args = getSnapCallbackArguments();

                config.onBeforeSnap.apply(undefined, args.before);

                snapToActiveSection(function onSnapped() {
                    config.onSnapped.apply(undefined, args.after);
                });
            }

            section.updateLastActive();
            viewport.updateLastTop();
        },

        /**
         * Handle the wheel event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onWheel: function onWheel(event) {
            // Don't allow the wheel event while auto scrolling
            if (scroller.isAutoScrolling()) {
                event.preventDefault();
            }
        },

        /**
         * Handle the click event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onClick: function onClick(event) {
            var anchor = event.target;
            while (anchor && anchor.tagName !== "A") {
                anchor = anchor.parentNode;
            }

            // Only handle links that were clicked with the primary button, without modifier keys:
            if (!anchor || event.which !== 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            // Get the href tag
            var href = anchor.getAttribute('href') || '';

            // Return early if it's not a tag
            if (href.indexOf('#') !== 0) {
                return;
            }

            // If it's just a tag and nothing else, then go to top
            if (href === '#') {
                event.preventDefault();
                replaceUrl('');

                // Get the callback arguments, with a little modification
                var args = getSnapCallbackArguments();
                args.before[1] = args.after[0] = section[0];

                // Scroll with callbacks
                config.onBeforeSnap.apply(undefined, args.before);
                scroller.scrollTo(0, function onScrollToTop() {
                    config.onSnapped.apply(undefined, args.after);
                });

                // Return early
                return;
            }

            // Get the target
            var targetId = anchor.hash.substring(1);
            var targetElem = document.getElementById(targetId);

            // If there is a target element, then go to it!
            if (targetElem) {
                event.preventDefault();
                replaceUrl('#' + targetId);

                // Get the callback arguments, with a little modification
                var args = getSnapCallbackArguments();
                args.before[1] = args.after[0] = targetElem;

                // Scroll with callbacks
                config.onBeforeSnap.apply(undefined, args.before);
                scroller.scrollTo(targetElem, function onScrollToHash() {
                    config.onSnapped.apply(undefined, args.after);
                });
            }
        }
    };

    ///////////////////////
    // PRIVATE FUNCTIONS //
    ///////////////////////

    /**
     * Determine if the scroller is allowed to snap
     *
     * @return {boolean}
     */
    function isAllowedToSnap() {
        return !scroller.isAutoScrolling() && section.activeChanged();
    }

    /**
     * Get the snap callback arguments
     *
     * @return {object}
     */
    function getSnapCallbackArguments() {
        var scrollDirection = {
            isUp: !viewport.isScrollingUp(),
            isDown: !viewport.isScrollingDown()
        };

        return {
            before: [section.lastActive(), section.active(), scrollDirection],
            after: [section.active(), section.lastActive(), scrollDirection]
        };
    }

    /**
     * Scroll to the currently-active section
     *
     * @param  {function} callback
     *
     * @return {void}
     */
    function snapToActiveSection(callback) {
        if (config.snapTo !== 'bottom' && viewport.isScrollingDown() || config.snapTo === 'top') {
            scroller.scrollTo(viewport.top() + section.active().getBoundingClientRect().top, callback);
        }
        else if (config.snapTo !== 'top' && viewport.isScrollingUp() || config.snapTo === 'bottom') {
            scroller.scrollTo(viewport.top() - viewport.height() + section.active().getBoundingClientRect().bottom, callback);
        }
    }

    /**
     * Replace the url hash
     *
     * @param  {string} hash
     *
     * @return {void}
     */
    function replaceUrl(hash) {
        try {
            history.replaceState({}, '', window.location.href.split('#')[0] + hash);
        }
        catch (e) {
            // To avoid the Security exception in Chrome when the page was opened via the file protocol, e.g., file://index.html
        }
    } 
};
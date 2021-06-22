
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (213:3) {:else}
    function create_else_block(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Good ");
    			t1 = text(/*greeting*/ ctx[8]);
    			t2 = text(".");
    			attr_dev(h1, "id", "header-1");
    			attr_dev(h1, "class", "svelte-1n6n38k");
    			add_location(h1, file, 213, 4, 4553);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*greeting*/ 256) set_data_dev(t1, /*greeting*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(213:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (211:3) {#if name}
    function create_if_block_1(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Good ");
    			t1 = text(/*greeting*/ ctx[8]);
    			t2 = text(", ");
    			t3 = text(/*name*/ ctx[0]);
    			t4 = text(".");
    			attr_dev(h1, "id", "header-1");
    			attr_dev(h1, "class", "svelte-1n6n38k");
    			add_location(h1, file, 211, 4, 4490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(h1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*greeting*/ 256) set_data_dev(t1, /*greeting*/ ctx[8]);
    			if (dirty & /*name*/ 1) set_data_dev(t3, /*name*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(211:3) {#if name}",
    		ctx
    	});

    	return block;
    }

    // (272:3) {#if weather}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*temperature*/ ctx[4]);
    			t1 = text("°");
    			t2 = space();
    			div1 = element("div");
    			attr_dev(div0, "id", "temperature");
    			attr_dev(div0, "class", "svelte-1n6n38k");
    			add_location(div0, file, 273, 5, 6485);
    			attr_dev(div1, "class", div1_class_value = "weather-icon " + /*weatherClass*/ ctx[3] + " svelte-1n6n38k");
    			add_location(div1, file, 274, 5, 6533);
    			attr_dev(div2, "id", "weather-container");
    			attr_dev(div2, "class", "svelte-1n6n38k");
    			add_location(div2, file, 272, 4, 6451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*temperature*/ 16) set_data_dev(t0, /*temperature*/ ctx[4]);

    			if (dirty & /*weatherClass*/ 8 && div1_class_value !== (div1_class_value = "weather-icon " + /*weatherClass*/ ctx[3] + " svelte-1n6n38k")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(272:3) {#if weather}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div7;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div6;
    	let t5;
    	let br0;
    	let t6;
    	let h2;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let br1;
    	let br2;
    	let t11;
    	let div5;
    	let div2;
    	let a0;
    	let span0;
    	let t13;
    	let span1;
    	let t15;
    	let br3;
    	let br4;
    	let t16;
    	let a1;
    	let span2;
    	let t18;
    	let span3;
    	let t20;
    	let br5;
    	let br6;
    	let t21;
    	let a2;
    	let span4;
    	let t23;
    	let span5;
    	let t25;
    	let br7;
    	let br8;
    	let t26;
    	let a3;
    	let span6;
    	let t28;
    	let span7;
    	let t30;
    	let div3;
    	let a4;
    	let span8;
    	let t32;
    	let span9;
    	let t34;
    	let br9;
    	let br10;
    	let t35;
    	let a5;
    	let span10;
    	let t37;
    	let span11;
    	let t39;
    	let br11;
    	let br12;
    	let t40;
    	let a6;
    	let span12;
    	let t42;
    	let span13;
    	let t44;
    	let br13;
    	let br14;
    	let t45;
    	let a7;
    	let span14;
    	let t47;
    	let span15;
    	let t49;
    	let div4;
    	let a8;
    	let span16;
    	let t51;
    	let span17;
    	let t53;
    	let br15;
    	let br16;
    	let t54;
    	let a9;
    	let span18;
    	let t56;
    	let span19;
    	let t58;
    	let br17;
    	let br18;
    	let t59;
    	let a10;
    	let span20;
    	let t61;
    	let span21;
    	let t63;
    	let br19;
    	let br20;
    	let t64;
    	let a11;
    	let span22;
    	let t66;
    	let span23;
    	let t68;
    	let t69;
    	let div8;
    	let t70;
    	let t71;

    	function select_block_type(ctx, dirty) {
    		if (/*name*/ ctx[0]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*weather*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div7 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*hours*/ ctx[5]);
    			t2 = text("-");
    			t3 = text(/*minutes*/ ctx[6]);
    			t4 = space();
    			div6 = element("div");
    			if_block0.c();
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			h2 = element("h2");
    			t7 = text("Today is ");
    			t8 = text(/*date*/ ctx[7]);
    			t9 = text(".");
    			t10 = space();
    			br1 = element("br");
    			br2 = element("br");
    			t11 = space();
    			div5 = element("div");
    			div2 = element("div");
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = ">";
    			t13 = space();
    			span1 = element("span");
    			span1.textContent = "gmail";
    			t15 = space();
    			br3 = element("br");
    			br4 = element("br");
    			t16 = space();
    			a1 = element("a");
    			span2 = element("span");
    			span2.textContent = ">";
    			t18 = space();
    			span3 = element("span");
    			span3.textContent = "calendar";
    			t20 = space();
    			br5 = element("br");
    			br6 = element("br");
    			t21 = space();
    			a2 = element("a");
    			span4 = element("span");
    			span4.textContent = ">";
    			t23 = space();
    			span5 = element("span");
    			span5.textContent = "drive";
    			t25 = space();
    			br7 = element("br");
    			br8 = element("br");
    			t26 = space();
    			a3 = element("a");
    			span6 = element("span");
    			span6.textContent = ">";
    			t28 = space();
    			span7 = element("span");
    			span7.textContent = "docs";
    			t30 = space();
    			div3 = element("div");
    			a4 = element("a");
    			span8 = element("span");
    			span8.textContent = ">";
    			t32 = space();
    			span9 = element("span");
    			span9.textContent = "github";
    			t34 = space();
    			br9 = element("br");
    			br10 = element("br");
    			t35 = space();
    			a5 = element("a");
    			span10 = element("span");
    			span10.textContent = ">";
    			t37 = space();
    			span11 = element("span");
    			span11.textContent = "stack";
    			t39 = space();
    			br11 = element("br");
    			br12 = element("br");
    			t40 = space();
    			a6 = element("a");
    			span12 = element("span");
    			span12.textContent = ">";
    			t42 = space();
    			span13 = element("span");
    			span13.textContent = "heroku";
    			t44 = space();
    			br13 = element("br");
    			br14 = element("br");
    			t45 = space();
    			a7 = element("a");
    			span14 = element("span");
    			span14.textContent = ">";
    			t47 = space();
    			span15 = element("span");
    			span15.textContent = "synergy";
    			t49 = space();
    			div4 = element("div");
    			a8 = element("a");
    			span16 = element("span");
    			span16.textContent = ">";
    			t51 = space();
    			span17 = element("span");
    			span17.textContent = "youtube";
    			t53 = space();
    			br15 = element("br");
    			br16 = element("br");
    			t54 = space();
    			a9 = element("a");
    			span18 = element("span");
    			span18.textContent = ">";
    			t56 = space();
    			span19 = element("span");
    			span19.textContent = "twitch";
    			t58 = space();
    			br17 = element("br");
    			br18 = element("br");
    			t59 = space();
    			a10 = element("a");
    			span20 = element("span");
    			span20.textContent = ">";
    			t61 = space();
    			span21 = element("span");
    			span21.textContent = "reddit";
    			t63 = space();
    			br19 = element("br");
    			br20 = element("br");
    			t64 = space();
    			a11 = element("a");
    			span22 = element("span");
    			span22.textContent = ">";
    			t66 = space();
    			span23 = element("span");
    			span23.textContent = "type";
    			t68 = space();
    			if (if_block1) if_block1.c();
    			t69 = space();
    			div8 = element("div");
    			t70 = text("v");
    			t71 = text(/*version*/ ctx[1]);
    			attr_dev(img, "id", "image");
    			if (img.src !== (img_src_value = "gifs/bg-1.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1n6n38k");
    			add_location(img, file, 206, 3, 4354);
    			attr_dev(div0, "id", "time");
    			attr_dev(div0, "class", "svelte-1n6n38k");
    			add_location(div0, file, 207, 3, 4401);
    			attr_dev(div1, "id", "image-container");
    			attr_dev(div1, "class", "svelte-1n6n38k");
    			add_location(div1, file, 205, 2, 4324);
    			attr_dev(br0, "class", "svelte-1n6n38k");
    			add_location(br0, file, 215, 3, 4605);
    			attr_dev(h2, "id", "header-2");
    			attr_dev(h2, "class", "svelte-1n6n38k");
    			add_location(h2, file, 216, 3, 4613);
    			attr_dev(br1, "class", "svelte-1n6n38k");
    			add_location(br1, file, 217, 3, 4656);
    			attr_dev(br2, "class", "svelte-1n6n38k");
    			add_location(br2, file, 217, 7, 4660);
    			attr_dev(span0, "class", "arrow svelte-1n6n38k");
    			add_location(span0, file, 221, 6, 4780);
    			attr_dev(span1, "class", "text svelte-1n6n38k");
    			add_location(span1, file, 221, 35, 4809);
    			attr_dev(a0, "href", "https://mail.google.com");
    			attr_dev(a0, "class", "svelte-1n6n38k");
    			add_location(a0, file, 220, 5, 4739);
    			attr_dev(br3, "class", "svelte-1n6n38k");
    			add_location(br3, file, 223, 5, 4856);
    			attr_dev(br4, "class", "svelte-1n6n38k");
    			add_location(br4, file, 223, 9, 4860);
    			attr_dev(span2, "class", "arrow svelte-1n6n38k");
    			add_location(span2, file, 225, 6, 4915);
    			attr_dev(span3, "class", "text svelte-1n6n38k");
    			add_location(span3, file, 225, 35, 4944);
    			attr_dev(a1, "href", "https://calendar.google.com");
    			attr_dev(a1, "class", "svelte-1n6n38k");
    			add_location(a1, file, 224, 5, 4870);
    			attr_dev(br5, "class", "svelte-1n6n38k");
    			add_location(br5, file, 227, 5, 4994);
    			attr_dev(br6, "class", "svelte-1n6n38k");
    			add_location(br6, file, 227, 9, 4998);
    			attr_dev(span4, "class", "arrow svelte-1n6n38k");
    			add_location(span4, file, 229, 6, 5050);
    			attr_dev(span5, "class", "text svelte-1n6n38k");
    			add_location(span5, file, 229, 35, 5079);
    			attr_dev(a2, "href", "https://drive.google.com");
    			attr_dev(a2, "class", "svelte-1n6n38k");
    			add_location(a2, file, 228, 5, 5008);
    			attr_dev(br7, "class", "svelte-1n6n38k");
    			add_location(br7, file, 231, 5, 5126);
    			attr_dev(br8, "class", "svelte-1n6n38k");
    			add_location(br8, file, 231, 9, 5130);
    			attr_dev(span6, "class", "arrow svelte-1n6n38k");
    			add_location(span6, file, 233, 6, 5181);
    			attr_dev(span7, "class", "text svelte-1n6n38k");
    			add_location(span7, file, 233, 35, 5210);
    			attr_dev(a3, "href", "https://docs.google.com");
    			attr_dev(a3, "class", "svelte-1n6n38k");
    			add_location(a3, file, 232, 5, 5140);
    			attr_dev(div2, "class", "link-column svelte-1n6n38k");
    			attr_dev(div2, "id", "link-column-1");
    			add_location(div2, file, 219, 4, 4689);
    			attr_dev(span8, "class", "arrow svelte-1n6n38k");
    			add_location(span8, file, 238, 6, 5352);
    			attr_dev(span9, "class", "text svelte-1n6n38k");
    			add_location(span9, file, 238, 35, 5381);
    			attr_dev(a4, "href", "https://github.com");
    			attr_dev(a4, "class", "svelte-1n6n38k");
    			add_location(a4, file, 237, 5, 5316);
    			attr_dev(br9, "class", "svelte-1n6n38k");
    			add_location(br9, file, 240, 5, 5429);
    			attr_dev(br10, "class", "svelte-1n6n38k");
    			add_location(br10, file, 240, 9, 5433);
    			attr_dev(span10, "class", "arrow svelte-1n6n38k");
    			add_location(span10, file, 242, 6, 5486);
    			attr_dev(span11, "class", "text svelte-1n6n38k");
    			add_location(span11, file, 242, 35, 5515);
    			attr_dev(a5, "href", "https://stackoverflow.com");
    			attr_dev(a5, "class", "svelte-1n6n38k");
    			add_location(a5, file, 241, 5, 5443);
    			attr_dev(br11, "class", "svelte-1n6n38k");
    			add_location(br11, file, 244, 5, 5562);
    			attr_dev(br12, "class", "svelte-1n6n38k");
    			add_location(br12, file, 244, 9, 5566);
    			attr_dev(span12, "class", "arrow svelte-1n6n38k");
    			add_location(span12, file, 246, 6, 5622);
    			attr_dev(span13, "class", "text svelte-1n6n38k");
    			add_location(span13, file, 246, 35, 5651);
    			attr_dev(a6, "href", "https://dashboard.heroku.com");
    			attr_dev(a6, "class", "svelte-1n6n38k");
    			add_location(a6, file, 245, 5, 5576);
    			attr_dev(br13, "class", "svelte-1n6n38k");
    			add_location(br13, file, 248, 5, 5699);
    			attr_dev(br14, "class", "svelte-1n6n38k");
    			add_location(br14, file, 248, 9, 5703);
    			attr_dev(span14, "class", "arrow svelte-1n6n38k");
    			add_location(span14, file, 250, 6, 5780);
    			attr_dev(span15, "class", "text svelte-1n6n38k");
    			add_location(span15, file, 250, 35, 5809);
    			attr_dev(a7, "href", "https://wa-bsd405-psv.edupoint.com/Home_PXP2.aspx");
    			attr_dev(a7, "class", "svelte-1n6n38k");
    			add_location(a7, file, 249, 5, 5713);
    			attr_dev(div3, "class", "link-column svelte-1n6n38k");
    			attr_dev(div3, "id", "link-column-2");
    			add_location(div3, file, 236, 4, 5266);
    			attr_dev(span16, "class", "arrow svelte-1n6n38k");
    			add_location(span16, file, 255, 6, 5955);
    			attr_dev(span17, "class", "text svelte-1n6n38k");
    			add_location(span17, file, 255, 35, 5984);
    			attr_dev(a8, "href", "https://youtube.com");
    			attr_dev(a8, "class", "svelte-1n6n38k");
    			add_location(a8, file, 254, 5, 5918);
    			attr_dev(br15, "class", "svelte-1n6n38k");
    			add_location(br15, file, 257, 5, 6033);
    			attr_dev(br16, "class", "svelte-1n6n38k");
    			add_location(br16, file, 257, 9, 6037);
    			attr_dev(span18, "class", "arrow svelte-1n6n38k");
    			add_location(span18, file, 259, 6, 6082);
    			attr_dev(span19, "class", "text svelte-1n6n38k");
    			add_location(span19, file, 259, 35, 6111);
    			attr_dev(a9, "href", "https://twitch.tv");
    			attr_dev(a9, "class", "svelte-1n6n38k");
    			add_location(a9, file, 258, 5, 6047);
    			attr_dev(br17, "class", "svelte-1n6n38k");
    			add_location(br17, file, 261, 5, 6159);
    			attr_dev(br18, "class", "svelte-1n6n38k");
    			add_location(br18, file, 261, 9, 6163);
    			attr_dev(span20, "class", "arrow svelte-1n6n38k");
    			add_location(span20, file, 263, 6, 6209);
    			attr_dev(span21, "class", "text svelte-1n6n38k");
    			add_location(span21, file, 263, 35, 6238);
    			attr_dev(a10, "href", "https://reddit.com");
    			attr_dev(a10, "class", "svelte-1n6n38k");
    			add_location(a10, file, 262, 5, 6173);
    			attr_dev(br19, "class", "svelte-1n6n38k");
    			add_location(br19, file, 265, 5, 6286);
    			attr_dev(br20, "class", "svelte-1n6n38k");
    			add_location(br20, file, 265, 9, 6290);
    			attr_dev(span22, "class", "arrow svelte-1n6n38k");
    			add_location(span22, file, 267, 6, 6339);
    			attr_dev(span23, "class", "text svelte-1n6n38k");
    			add_location(span23, file, 267, 35, 6368);
    			attr_dev(a11, "href", "http://monkeytype.com");
    			attr_dev(a11, "class", "svelte-1n6n38k");
    			add_location(a11, file, 266, 5, 6300);
    			attr_dev(div4, "class", "link-column svelte-1n6n38k");
    			attr_dev(div4, "id", "link-column-3");
    			add_location(div4, file, 253, 4, 5868);
    			attr_dev(div5, "id", "links");
    			attr_dev(div5, "class", "svelte-1n6n38k");
    			add_location(div5, file, 218, 3, 4668);
    			attr_dev(div6, "id", "inner-box");
    			attr_dev(div6, "class", "svelte-1n6n38k");
    			add_location(div6, file, 209, 2, 4451);
    			attr_dev(div7, "id", "box");
    			attr_dev(div7, "class", "svelte-1n6n38k");
    			add_location(div7, file, 204, 1, 4307);
    			attr_dev(div8, "id", "version");
    			attr_dev(div8, "class", "svelte-1n6n38k");
    			add_location(div8, file, 279, 1, 6619);
    			attr_dev(main, "class", "svelte-1n6n38k");
    			add_location(main, file, 203, 0, 4299);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div7);
    			append_dev(div7, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div7, t4);
    			append_dev(div7, div6);
    			if_block0.m(div6, null);
    			append_dev(div6, t5);
    			append_dev(div6, br0);
    			append_dev(div6, t6);
    			append_dev(div6, h2);
    			append_dev(h2, t7);
    			append_dev(h2, t8);
    			append_dev(h2, t9);
    			append_dev(div6, t10);
    			append_dev(div6, br1);
    			append_dev(div6, br2);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t13);
    			append_dev(a0, span1);
    			append_dev(div2, t15);
    			append_dev(div2, br3);
    			append_dev(div2, br4);
    			append_dev(div2, t16);
    			append_dev(div2, a1);
    			append_dev(a1, span2);
    			append_dev(a1, t18);
    			append_dev(a1, span3);
    			append_dev(div2, t20);
    			append_dev(div2, br5);
    			append_dev(div2, br6);
    			append_dev(div2, t21);
    			append_dev(div2, a2);
    			append_dev(a2, span4);
    			append_dev(a2, t23);
    			append_dev(a2, span5);
    			append_dev(div2, t25);
    			append_dev(div2, br7);
    			append_dev(div2, br8);
    			append_dev(div2, t26);
    			append_dev(div2, a3);
    			append_dev(a3, span6);
    			append_dev(a3, t28);
    			append_dev(a3, span7);
    			append_dev(div5, t30);
    			append_dev(div5, div3);
    			append_dev(div3, a4);
    			append_dev(a4, span8);
    			append_dev(a4, t32);
    			append_dev(a4, span9);
    			append_dev(div3, t34);
    			append_dev(div3, br9);
    			append_dev(div3, br10);
    			append_dev(div3, t35);
    			append_dev(div3, a5);
    			append_dev(a5, span10);
    			append_dev(a5, t37);
    			append_dev(a5, span11);
    			append_dev(div3, t39);
    			append_dev(div3, br11);
    			append_dev(div3, br12);
    			append_dev(div3, t40);
    			append_dev(div3, a6);
    			append_dev(a6, span12);
    			append_dev(a6, t42);
    			append_dev(a6, span13);
    			append_dev(div3, t44);
    			append_dev(div3, br13);
    			append_dev(div3, br14);
    			append_dev(div3, t45);
    			append_dev(div3, a7);
    			append_dev(a7, span14);
    			append_dev(a7, t47);
    			append_dev(a7, span15);
    			append_dev(div5, t49);
    			append_dev(div5, div4);
    			append_dev(div4, a8);
    			append_dev(a8, span16);
    			append_dev(a8, t51);
    			append_dev(a8, span17);
    			append_dev(div4, t53);
    			append_dev(div4, br15);
    			append_dev(div4, br16);
    			append_dev(div4, t54);
    			append_dev(div4, a9);
    			append_dev(a9, span18);
    			append_dev(a9, t56);
    			append_dev(a9, span19);
    			append_dev(div4, t58);
    			append_dev(div4, br17);
    			append_dev(div4, br18);
    			append_dev(div4, t59);
    			append_dev(div4, a10);
    			append_dev(a10, span20);
    			append_dev(a10, t61);
    			append_dev(a10, span21);
    			append_dev(div4, t63);
    			append_dev(div4, br19);
    			append_dev(div4, br20);
    			append_dev(div4, t64);
    			append_dev(div4, a11);
    			append_dev(a11, span22);
    			append_dev(a11, t66);
    			append_dev(a11, span23);
    			append_dev(div6, t68);
    			if (if_block1) if_block1.m(div6, null);
    			append_dev(main, t69);
    			append_dev(main, div8);
    			append_dev(div8, t70);
    			append_dev(div8, t71);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hours*/ 32) set_data_dev(t1, /*hours*/ ctx[5]);
    			if (dirty & /*minutes*/ 64) set_data_dev(t3, /*minutes*/ ctx[6]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div6, t5);
    				}
    			}

    			if (dirty & /*date*/ 128) set_data_dev(t8, /*date*/ ctx[7]);

    			if (/*weather*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*version*/ 2) set_data_dev(t71, /*version*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function format_two_digits(n) {
    	return n < 10 ? "0" + n : n;
    }

    function instance($$self, $$props, $$invalidate) {
    	let hours;
    	let minutes;
    	let date;
    	let greeting;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	let { apiKey } = $$props;
    	let { location } = $$props;
    	console.log(apiKey);
    	let d = new Date();
    	let version;

    	fetch(`manifest.json`).then(res => res.json()).then(out => {
    		$$invalidate(1, version = out.version);
    		console.log(out);
    	});

    	let weather;
    	let weatherClass = "none";
    	let temperature = 0;
    	updateWeather();

    	function updateWeather() {
    		if (apiKey && location) {
    			fetch(`http://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${apiKey}`).then(res => res.json()).then(out => {
    				$$invalidate(2, weather = out);
    				console.log(weather);
    				$$invalidate(4, temperature = Math.round(weather.main.temp));

    				if (weather.weather[0].main === "Clear") {
    					if (d < weather.sys.sunrise || d > weather.sys.sunset) {
    						$$invalidate(3, weatherClass = "moon");
    					} else {
    						$$invalidate(3, weatherClass = "sun");
    					}
    				} else if (weather.weather[0].main === "Rain" || weather.weather[0].main === "Drizzle" || weather.weather[0].main === "Thunderstorm") {
    					$$invalidate(3, weatherClass = "rain");
    				} else if (weather.weather[0].main === "Snow") {
    					$$invalidate(3, weatherClass = "snow");
    				} else {
    					$$invalidate(3, weatherClass = "cloud");
    				}
    			}).catch(error => {
    				console.log(error);
    				$$invalidate(2, weather = null);
    			});
    		}
    	}

    	const timeInterval = setInterval(
    		() => {
    			$$invalidate(11, d = new Date());
    		},
    		1000
    	);

    	const weatherInterval = setInterval(
    		() => {
    			updateWeather();
    		},
    		600000
    	);

    	const writable_props = ["name", "apiKey", "location"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("apiKey" in $$props) $$invalidate(9, apiKey = $$props.apiKey);
    		if ("location" in $$props) $$invalidate(10, location = $$props.location);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		apiKey,
    		location,
    		d,
    		version,
    		weather,
    		weatherClass,
    		temperature,
    		updateWeather,
    		timeInterval,
    		weatherInterval,
    		format_two_digits,
    		hours,
    		minutes,
    		date,
    		greeting
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("apiKey" in $$props) $$invalidate(9, apiKey = $$props.apiKey);
    		if ("location" in $$props) $$invalidate(10, location = $$props.location);
    		if ("d" in $$props) $$invalidate(11, d = $$props.d);
    		if ("version" in $$props) $$invalidate(1, version = $$props.version);
    		if ("weather" in $$props) $$invalidate(2, weather = $$props.weather);
    		if ("weatherClass" in $$props) $$invalidate(3, weatherClass = $$props.weatherClass);
    		if ("temperature" in $$props) $$invalidate(4, temperature = $$props.temperature);
    		if ("hours" in $$props) $$invalidate(5, hours = $$props.hours);
    		if ("minutes" in $$props) $$invalidate(6, minutes = $$props.minutes);
    		if ("date" in $$props) $$invalidate(7, date = $$props.date);
    		if ("greeting" in $$props) $$invalidate(8, greeting = $$props.greeting);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*d*/ 2048) {
    			$$invalidate(5, hours = format_two_digits(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12));
    		}

    		if ($$self.$$.dirty & /*d*/ 2048) {
    			$$invalidate(6, minutes = format_two_digits(d.getMinutes()));
    		}

    		if ($$self.$$.dirty & /*d*/ 2048) {
    			$$invalidate(7, date = d.toLocaleDateString("en", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric"
    			}));
    		}

    		if ($$self.$$.dirty & /*d*/ 2048) {
    			$$invalidate(8, greeting = d.getHours() < 12
    			? "morning"
    			: d.getHours() < 18 ? "afternoon" : "evening");
    		}
    	};

    	return [
    		name,
    		version,
    		weather,
    		weatherClass,
    		temperature,
    		hours,
    		minutes,
    		date,
    		greeting,
    		apiKey,
    		location,
    		d
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0, apiKey: 9, location: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*apiKey*/ ctx[9] === undefined && !("apiKey" in props)) {
    			console_1.warn("<App> was created without expected prop 'apiKey'");
    		}

    		if (/*location*/ ctx[10] === undefined && !("location" in props)) {
    			console_1.warn("<App> was created without expected prop 'location'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apiKey() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiKey(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: '',
    		location: '',
    		apiKey: ''
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

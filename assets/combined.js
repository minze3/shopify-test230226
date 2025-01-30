// Combined js

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/ftdomdelegate/main.js
function Delegate(root) {
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }
  this.handle = Delegate.prototype.handle.bind(this);
  this._removedListeners = [];
}
Delegate.prototype.root = function(root) {
  const listenerMap = this.listenerMap;
  let eventType;
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }
  this.rootElement = root;
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }
  return this;
};
Delegate.prototype.captureForType = function(eventType) {
  return ["blur", "error", "focus", "load", "resize", "scroll"].indexOf(eventType) !== -1;
};
Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
  let root;
  let listenerMap;
  let matcher;
  let matcherParam;
  if (!eventType) {
    throw new TypeError("Invalid event type: " + eventType);
  }
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }
  if (useCapture === void 0) {
    useCapture = this.captureForType(eventType);
  }
  if (typeof handler !== "function") {
    throw new TypeError("Handler must be a type of Function");
  }
  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }
  if (!selector) {
    matcherParam = null;
    matcher = matchesRoot.bind(this);
  } else if (/^[a-z]+$/i.test(selector)) {
    matcherParam = selector;
    matcher = matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = matchesId;
  } else {
    matcherParam = selector;
    matcher = Element.prototype.matches;
  }
  listenerMap[eventType].push({
    selector,
    handler,
    matcher,
    matcherParam
  });
  return this;
};
Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
  let i;
  let listener;
  let listenerMap;
  let listenerList;
  let singleEventType;
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }
  if (useCapture === void 0) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }
  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }
    return this;
  }
  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];
    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      this._removedListeners.push(listener);
      listenerList.splice(i, 1);
    }
  }
  if (!listenerList.length) {
    delete listenerMap[eventType];
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }
  return this;
};
Delegate.prototype.handle = function(event) {
  let i;
  let l;
  const type = event.type;
  let root;
  let phase;
  let listener;
  let returned;
  let listenerList = [];
  let target;
  const eventIgnore = "ftLabsDelegateIgnore";
  if (event[eventIgnore] === true) {
    return;
  }
  target = event.target;
  if (target.nodeType === 3) {
    target = target.parentNode;
  }
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }
  root = this.rootElement;
  phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);
  switch (phase) {
    case 1:
      listenerList = this.listenerMap[1][type];
      break;
    case 2:
      if (this.listenerMap[0] && this.listenerMap[0][type]) {
        listenerList = listenerList.concat(this.listenerMap[0][type]);
      }
      if (this.listenerMap[1] && this.listenerMap[1][type]) {
        listenerList = listenerList.concat(this.listenerMap[1][type]);
      }
      break;
    case 3:
      listenerList = this.listenerMap[0][type];
      break;
  }
  let toFire = [];
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];
      if (!listener) {
        break;
      }
      if (target.tagName && ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 && target.hasAttribute("disabled")) {
        toFire = [];
      } else if (listener.matcher.call(target, listener.matcherParam, target)) {
        toFire.push([event, target, listener]);
      }
    }
    if (target === root) {
      break;
    }
    l = listenerList.length;
    target = target.parentElement || target.parentNode;
    if (target instanceof HTMLDocument) {
      break;
    }
  }
  let ret;
  for (i = 0; i < toFire.length; i++) {
    if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
      continue;
    }
    returned = this.fire.apply(this, toFire[i]);
    if (returned === false) {
      toFire[i][0][eventIgnore] = true;
      toFire[i][0].preventDefault();
      ret = false;
      break;
    }
  }
  return ret;
};
Delegate.prototype.fire = function(event, target, listener) {
  return listener.handler.call(target, event, target);
};
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}
function matchesRoot(selector, element) {
  if (this.rootElement === window) {
    return (
      // Match the outer document (dispatched from document)
      element === document || // The <html> element (dispatched from document.body or document.documentElement)
      element === document.documentElement || // Or the window itself (dispatched from window)
      element === window
    );
  }
  return this.rootElement === element;
}
function matchesId(id, element) {
  return id === element.id;
}
Delegate.prototype.destroy = function() {
  this.off();
  this.root();
};
var main_default = Delegate;

// js/components/input-binding-manager.js
var InputBindingManager = class {
  constructor() {
    this.delegateElement = new main_default(document.body);
    this.delegateElement.on("change", "[data-bind-value]", this._onValueChanged.bind(this));
  }
  _onValueChanged(event, target) {
    const boundElement = document.getElementById(target.getAttribute("data-bind-value"));
    if (boundElement) {
      if (target.tagName === "SELECT") {
        target = target.options[target.selectedIndex];
      }
      boundElement.innerHTML = target.hasAttribute("title") ? target.getAttribute("title") : target.value;
    }
  }
};

// js/helper/event.js
function triggerEvent(element, name, data = {}) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    detail: data
  }));
}
function triggerNonBubblingEvent(element, name, data = {}) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: false,
    detail: data
  }));
}

// js/custom-element/custom-html-element.js
var CustomHTMLElement = class extends HTMLElement {
  constructor() {
    super();
    this._hasSectionReloaded = false;
    if (Shopify.designMode) {
      this.rootDelegate.on("shopify:section:select", (event) => {
        const parentSection = this.closest(".shopify-section");
        if (event.target === parentSection && event.detail.load) {
          this._hasSectionReloaded = true;
        }
      });
    }
  }
  get rootDelegate() {
    return this._rootDelegate = this._rootDelegate || new main_default(document.documentElement);
  }
  get delegate() {
    return this._delegate = this._delegate || new main_default(this);
  }
  showLoadingBar() {
    triggerEvent(document.documentElement, "theme:loading:start");
  }
  hideLoadingBar() {
    triggerEvent(document.documentElement, "theme:loading:end");
  }
  untilVisible(intersectionObserverOptions = { rootMargin: "30px 0px", threshold: 0 }) {
    const onBecameVisible = () => {
      this.classList.add("became-visible");
      this.style.opacity = "1";
    };
    return new Promise((resolve) => {
      if (window.IntersectionObserver) {
        this.intersectionObserver = new IntersectionObserver((event) => {
          if (event[0].isIntersecting) {
            this.intersectionObserver.disconnect();
            requestAnimationFrame(() => {
              resolve();
              onBecameVisible();
            });
          }
        }, intersectionObserverOptions);
        this.intersectionObserver.observe(this);
      } else {
        resolve();
        onBecameVisible();
      }
    });
  }
  disconnectedCallback() {
    this.delegate.destroy();
    this.rootDelegate.destroy();
    this.intersectionObserver?.disconnect();
    delete this._delegate;
    delete this._rootDelegate;
  }
};

// node_modules/tabbable/dist/index.esm.js
var candidateSelectors = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"];
var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
var NoElement = typeof Element === "undefined";
var matches = NoElement ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
var getRootNode = !NoElement && Element.prototype.getRootNode ? function(element) {
  var _element$getRootNode;
  return element === null || element === void 0 ? void 0 : (_element$getRootNode = element.getRootNode) === null || _element$getRootNode === void 0 ? void 0 : _element$getRootNode.call(element);
} : function(element) {
  return element === null || element === void 0 ? void 0 : element.ownerDocument;
};
var isInert = function isInert2(node, lookUp) {
  var _node$getAttribute;
  if (lookUp === void 0) {
    lookUp = true;
  }
  var inertAtt = node === null || node === void 0 ? void 0 : (_node$getAttribute = node.getAttribute) === null || _node$getAttribute === void 0 ? void 0 : _node$getAttribute.call(node, "inert");
  var inert = inertAtt === "" || inertAtt === "true";
  var result = inert || lookUp && node && isInert2(node.parentNode);
  return result;
};
var isContentEditable = function isContentEditable2(node) {
  var _node$getAttribute2;
  var attValue = node === null || node === void 0 ? void 0 : (_node$getAttribute2 = node.getAttribute) === null || _node$getAttribute2 === void 0 ? void 0 : _node$getAttribute2.call(node, "contenteditable");
  return attValue === "" || attValue === "true";
};
var getCandidates = function getCandidates2(el, includeContainer, filter) {
  if (isInert(el)) {
    return [];
  }
  var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
  if (includeContainer && matches.call(el, candidateSelector)) {
    candidates.unshift(el);
  }
  candidates = candidates.filter(filter);
  return candidates;
};
var getCandidatesIteratively = function getCandidatesIteratively2(elements, includeContainer, options) {
  var candidates = [];
  var elementsToCheck = Array.from(elements);
  while (elementsToCheck.length) {
    var element = elementsToCheck.shift();
    if (isInert(element, false)) {
      continue;
    }
    if (element.tagName === "SLOT") {
      var assigned = element.assignedElements();
      var content = assigned.length ? assigned : element.children;
      var nestedCandidates = getCandidatesIteratively2(content, true, options);
      if (options.flatten) {
        candidates.push.apply(candidates, nestedCandidates);
      } else {
        candidates.push({
          scopeParent: element,
          candidates: nestedCandidates
        });
      }
    } else {
      var validCandidate = matches.call(element, candidateSelector);
      if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
        candidates.push(element);
      }
      var shadowRoot = element.shadowRoot || // check for an undisclosed shadow
      typeof options.getShadowRoot === "function" && options.getShadowRoot(element);
      var validShadowRoot = !isInert(shadowRoot, false) && (!options.shadowRootFilter || options.shadowRootFilter(element));
      if (shadowRoot && validShadowRoot) {
        var _nestedCandidates = getCandidatesIteratively2(shadowRoot === true ? element.children : shadowRoot.children, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, _nestedCandidates);
        } else {
          candidates.push({
            scopeParent: element,
            candidates: _nestedCandidates
          });
        }
      } else {
        elementsToCheck.unshift.apply(elementsToCheck, element.children);
      }
    }
  }
  return candidates;
};
var hasTabIndex = function hasTabIndex2(node) {
  return !isNaN(parseInt(node.getAttribute("tabindex"), 10));
};
var getTabIndex = function getTabIndex2(node) {
  if (!node) {
    throw new Error("No node provided");
  }
  if (node.tabIndex < 0) {
    if ((/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) && !hasTabIndex(node)) {
      return 0;
    }
  }
  return node.tabIndex;
};
var getSortOrderTabIndex = function getSortOrderTabIndex2(node, isScope) {
  var tabIndex = getTabIndex(node);
  if (tabIndex < 0 && isScope && !hasTabIndex(node)) {
    return 0;
  }
  return tabIndex;
};
var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
};
var isInput = function isInput2(node) {
  return node.tagName === "INPUT";
};
var isHiddenInput = function isHiddenInput2(node) {
  return isInput(node) && node.type === "hidden";
};
var isDetailsWithSummary = function isDetailsWithSummary2(node) {
  var r = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
    return child.tagName === "SUMMARY";
  });
  return r;
};
var getCheckedRadio = function getCheckedRadio2(nodes, form) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].checked && nodes[i].form === form) {
      return nodes[i];
    }
  }
};
var isTabbableRadio = function isTabbableRadio2(node) {
  if (!node.name) {
    return true;
  }
  var radioScope = node.form || getRootNode(node);
  var queryRadios = function queryRadios2(name) {
    return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
  };
  var radioSet;
  if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
    radioSet = queryRadios(window.CSS.escape(node.name));
  } else {
    try {
      radioSet = queryRadios(node.name);
    } catch (err) {
      console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
      return false;
    }
  }
  var checked = getCheckedRadio(radioSet, node.form);
  return !checked || checked === node;
};
var isRadio = function isRadio2(node) {
  return isInput(node) && node.type === "radio";
};
var isNonTabbableRadio = function isNonTabbableRadio2(node) {
  return isRadio(node) && !isTabbableRadio(node);
};
var isNodeAttached = function isNodeAttached2(node) {
  var _nodeRoot;
  var nodeRoot = node && getRootNode(node);
  var nodeRootHost = (_nodeRoot = nodeRoot) === null || _nodeRoot === void 0 ? void 0 : _nodeRoot.host;
  var attached = false;
  if (nodeRoot && nodeRoot !== node) {
    var _nodeRootHost, _nodeRootHost$ownerDo, _node$ownerDocument;
    attached = !!((_nodeRootHost = nodeRootHost) !== null && _nodeRootHost !== void 0 && (_nodeRootHost$ownerDo = _nodeRootHost.ownerDocument) !== null && _nodeRootHost$ownerDo !== void 0 && _nodeRootHost$ownerDo.contains(nodeRootHost) || node !== null && node !== void 0 && (_node$ownerDocument = node.ownerDocument) !== null && _node$ownerDocument !== void 0 && _node$ownerDocument.contains(node));
    while (!attached && nodeRootHost) {
      var _nodeRoot2, _nodeRootHost2, _nodeRootHost2$ownerD;
      nodeRoot = getRootNode(nodeRootHost);
      nodeRootHost = (_nodeRoot2 = nodeRoot) === null || _nodeRoot2 === void 0 ? void 0 : _nodeRoot2.host;
      attached = !!((_nodeRootHost2 = nodeRootHost) !== null && _nodeRootHost2 !== void 0 && (_nodeRootHost2$ownerD = _nodeRootHost2.ownerDocument) !== null && _nodeRootHost2$ownerD !== void 0 && _nodeRootHost2$ownerD.contains(nodeRootHost));
    }
  }
  return attached;
};
var isZeroArea = function isZeroArea2(node) {
  var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
  return width === 0 && height === 0;
};
var isHidden = function isHidden2(node, _ref) {
  var displayCheck = _ref.displayCheck, getShadowRoot = _ref.getShadowRoot;
  if (getComputedStyle(node).visibility === "hidden") {
    return true;
  }
  var isDirectSummary = matches.call(node, "details>summary:first-of-type");
  var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
  if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
    return true;
  }
  if (!displayCheck || displayCheck === "full" || displayCheck === "legacy-full") {
    if (typeof getShadowRoot === "function") {
      var originalNode = node;
      while (node) {
        var parentElement = node.parentElement;
        var rootNode = getRootNode(node);
        if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true) {
          return isZeroArea(node);
        } else if (node.assignedSlot) {
          node = node.assignedSlot;
        } else if (!parentElement && rootNode !== node.ownerDocument) {
          node = rootNode.host;
        } else {
          node = parentElement;
        }
      }
      node = originalNode;
    }
    if (isNodeAttached(node)) {
      return !node.getClientRects().length;
    }
    if (displayCheck !== "legacy-full") {
      return true;
    }
  } else if (displayCheck === "non-zero-area") {
    return isZeroArea(node);
  }
  return false;
};
var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
    var parentNode = node.parentElement;
    while (parentNode) {
      if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
        for (var i = 0; i < parentNode.children.length; i++) {
          var child = parentNode.children.item(i);
          if (child.tagName === "LEGEND") {
            return matches.call(parentNode, "fieldset[disabled] *") ? true : !child.contains(node);
          }
        }
        return true;
      }
      parentNode = parentNode.parentElement;
    }
  }
  return false;
};
var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
  if (node.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  isInert(node) || isHiddenInput(node) || isHidden(node, options) || // For a details element with a summary, the summary element gets the focus
  isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
    return false;
  }
  return true;
};
var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
  if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
    return false;
  }
  return true;
};
var isValidShadowRootTabbable = function isValidShadowRootTabbable2(shadowHostNode) {
  var tabIndex = parseInt(shadowHostNode.getAttribute("tabindex"), 10);
  if (isNaN(tabIndex) || tabIndex >= 0) {
    return true;
  }
  return false;
};
var sortByOrder = function sortByOrder2(candidates) {
  var regularTabbables = [];
  var orderedTabbables = [];
  candidates.forEach(function(item, i) {
    var isScope = !!item.scopeParent;
    var element = isScope ? item.scopeParent : item;
    var candidateTabindex = getSortOrderTabIndex(element, isScope);
    var elements = isScope ? sortByOrder2(item.candidates) : element;
    if (candidateTabindex === 0) {
      isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        item,
        isScope,
        content: elements
      });
    }
  });
  return orderedTabbables.sort(sortOrderedTabbables).reduce(function(acc, sortable) {
    sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
    return acc;
  }, []).concat(regularTabbables);
};
var tabbable = function tabbable2(container, options) {
  options = options || {};
  var candidates;
  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorTabbable.bind(null, options),
      flatten: false,
      getShadowRoot: options.getShadowRoot,
      shadowRootFilter: isValidShadowRootTabbable
    });
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
  }
  return sortByOrder(candidates);
};
var focusable = function focusable2(container, options) {
  options = options || {};
  var candidates;
  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorFocusable.bind(null, options),
      flatten: true,
      getShadowRoot: options.getShadowRoot
    });
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
  }
  return candidates;
};
var isTabbable = function isTabbable2(node, options) {
  options = options || {};
  if (!node) {
    throw new Error("No node provided");
  }
  if (matches.call(node, candidateSelector) === false) {
    return false;
  }
  return isNodeMatchingSelectorTabbable(options, node);
};
var focusableCandidateSelector = /* @__PURE__ */ candidateSelectors.concat("iframe").join(",");
var isFocusable = function isFocusable2(node, options) {
  options = options || {};
  if (!node) {
    throw new Error("No node provided");
  }
  if (matches.call(node, focusableCandidateSelector) === false) {
    return false;
  }
  return isNodeMatchingSelectorFocusable(options, node);
};

// node_modules/focus-trap/dist/focus-trap.esm.js
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null)
    return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object")
      return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
var activeFocusTraps = {
  activateTrap: function activateTrap(trapStack, trap) {
    if (trapStack.length > 0) {
      var activeTrap = trapStack[trapStack.length - 1];
      if (activeTrap !== trap) {
        activeTrap.pause();
      }
    }
    var trapIndex = trapStack.indexOf(trap);
    if (trapIndex === -1) {
      trapStack.push(trap);
    } else {
      trapStack.splice(trapIndex, 1);
      trapStack.push(trap);
    }
  },
  deactivateTrap: function deactivateTrap(trapStack, trap) {
    var trapIndex = trapStack.indexOf(trap);
    if (trapIndex !== -1) {
      trapStack.splice(trapIndex, 1);
    }
    if (trapStack.length > 0) {
      trapStack[trapStack.length - 1].unpause();
    }
  }
};
var isSelectableInput = function isSelectableInput2(node) {
  return node.tagName && node.tagName.toLowerCase() === "input" && typeof node.select === "function";
};
var isEscapeEvent = function isEscapeEvent2(e) {
  return (e === null || e === void 0 ? void 0 : e.key) === "Escape" || (e === null || e === void 0 ? void 0 : e.key) === "Esc" || (e === null || e === void 0 ? void 0 : e.keyCode) === 27;
};
var isTabEvent = function isTabEvent2(e) {
  return (e === null || e === void 0 ? void 0 : e.key) === "Tab" || (e === null || e === void 0 ? void 0 : e.keyCode) === 9;
};
var isKeyForward = function isKeyForward2(e) {
  return isTabEvent(e) && !e.shiftKey;
};
var isKeyBackward = function isKeyBackward2(e) {
  return isTabEvent(e) && e.shiftKey;
};
var delay = function delay2(fn) {
  return setTimeout(fn, 0);
};
var findIndex = function findIndex2(arr, fn) {
  var idx = -1;
  arr.every(function(value, i) {
    if (fn(value)) {
      idx = i;
      return false;
    }
    return true;
  });
  return idx;
};
var valueOrHandler = function valueOrHandler2(value) {
  for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    params[_key - 1] = arguments[_key];
  }
  return typeof value === "function" ? value.apply(void 0, params) : value;
};
var getActualTarget = function getActualTarget2(event) {
  return event.target.shadowRoot && typeof event.composedPath === "function" ? event.composedPath()[0] : event.target;
};
var internalTrapStack = [];
var createFocusTrap = function createFocusTrap2(elements, userOptions) {
  var doc = (userOptions === null || userOptions === void 0 ? void 0 : userOptions.document) || document;
  var trapStack = (userOptions === null || userOptions === void 0 ? void 0 : userOptions.trapStack) || internalTrapStack;
  var config = _objectSpread2({
    returnFocusOnDeactivate: true,
    escapeDeactivates: true,
    delayInitialFocus: true,
    isKeyForward,
    isKeyBackward
  }, userOptions);
  var state = {
    // containers given to createFocusTrap()
    // @type {Array<HTMLElement>}
    containers: [],
    // list of objects identifying tabbable nodes in `containers` in the trap
    // NOTE: it's possible that a group has no tabbable nodes if nodes get removed while the trap
    //  is active, but the trap should never get to a state where there isn't at least one group
    //  with at least one tabbable node in it (that would lead to an error condition that would
    //  result in an error being thrown)
    // @type {Array<{
    //   container: HTMLElement,
    //   tabbableNodes: Array<HTMLElement>, // empty if none
    //   focusableNodes: Array<HTMLElement>, // empty if none
    //   posTabIndexesFound: boolean,
    //   firstTabbableNode: HTMLElement|undefined,
    //   lastTabbableNode: HTMLElement|undefined,
    //   firstDomTabbableNode: HTMLElement|undefined,
    //   lastDomTabbableNode: HTMLElement|undefined,
    //   nextTabbableNode: (node: HTMLElement, forward: boolean) => HTMLElement|undefined
    // }>}
    containerGroups: [],
    // same order/length as `containers` list
    // references to objects in `containerGroups`, but only those that actually have
    //  tabbable nodes in them
    // NOTE: same order as `containers` and `containerGroups`, but __not necessarily__
    //  the same length
    tabbableGroups: [],
    nodeFocusedBeforeActivation: null,
    mostRecentlyFocusedNode: null,
    active: false,
    paused: false,
    // timer ID for when delayInitialFocus is true and initial focus in this trap
    //  has been delayed during activation
    delayInitialFocusTimer: void 0,
    // the most recent KeyboardEvent for the configured nav key (typically [SHIFT+]TAB), if any
    recentNavEvent: void 0
  };
  var trap;
  var getOption = function getOption2(configOverrideOptions, optionName, configOptionName) {
    return configOverrideOptions && configOverrideOptions[optionName] !== void 0 ? configOverrideOptions[optionName] : config[configOptionName || optionName];
  };
  var findContainerIndex = function findContainerIndex2(element, event) {
    var composedPath = typeof (event === null || event === void 0 ? void 0 : event.composedPath) === "function" ? event.composedPath() : void 0;
    return state.containerGroups.findIndex(function(_ref) {
      var container = _ref.container, tabbableNodes = _ref.tabbableNodes;
      return container.contains(element) || // fall back to explicit tabbable search which will take into consideration any
      //  web components if the `tabbableOptions.getShadowRoot` option was used for
      //  the trap, enabling shadow DOM support in tabbable (`Node.contains()` doesn't
      //  look inside web components even if open)
      (composedPath === null || composedPath === void 0 ? void 0 : composedPath.includes(container)) || tabbableNodes.find(function(node) {
        return node === element;
      });
    });
  };
  var getNodeForOption = function getNodeForOption2(optionName) {
    var optionValue = config[optionName];
    if (typeof optionValue === "function") {
      for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        params[_key2 - 1] = arguments[_key2];
      }
      optionValue = optionValue.apply(void 0, params);
    }
    if (optionValue === true) {
      optionValue = void 0;
    }
    if (!optionValue) {
      if (optionValue === void 0 || optionValue === false) {
        return optionValue;
      }
      throw new Error("`".concat(optionName, "` was specified but was not a node, or did not return a node"));
    }
    var node = optionValue;
    if (typeof optionValue === "string") {
      node = doc.querySelector(optionValue);
      if (!node) {
        throw new Error("`".concat(optionName, "` as selector refers to no known node"));
      }
    }
    return node;
  };
  var getInitialFocusNode = function getInitialFocusNode2() {
    var node = getNodeForOption("initialFocus");
    if (node === false) {
      return false;
    }
    if (node === void 0 || !isFocusable(node, config.tabbableOptions)) {
      if (findContainerIndex(doc.activeElement) >= 0) {
        node = doc.activeElement;
      } else {
        var firstTabbableGroup = state.tabbableGroups[0];
        var firstTabbableNode = firstTabbableGroup && firstTabbableGroup.firstTabbableNode;
        node = firstTabbableNode || getNodeForOption("fallbackFocus");
      }
    }
    if (!node) {
      throw new Error("Your focus-trap needs to have at least one focusable element");
    }
    return node;
  };
  var updateTabbableNodes = function updateTabbableNodes2() {
    state.containerGroups = state.containers.map(function(container) {
      var tabbableNodes = tabbable(container, config.tabbableOptions);
      var focusableNodes = focusable(container, config.tabbableOptions);
      var firstTabbableNode = tabbableNodes.length > 0 ? tabbableNodes[0] : void 0;
      var lastTabbableNode = tabbableNodes.length > 0 ? tabbableNodes[tabbableNodes.length - 1] : void 0;
      var firstDomTabbableNode = focusableNodes.find(function(node) {
        return isTabbable(node);
      });
      var lastDomTabbableNode = focusableNodes.slice().reverse().find(function(node) {
        return isTabbable(node);
      });
      var posTabIndexesFound = !!tabbableNodes.find(function(node) {
        return getTabIndex(node) > 0;
      });
      return {
        container,
        tabbableNodes,
        focusableNodes,
        /** True if at least one node with positive `tabindex` was found in this container. */
        posTabIndexesFound,
        /** First tabbable node in container, __tabindex__ order; `undefined` if none. */
        firstTabbableNode,
        /** Last tabbable node in container, __tabindex__ order; `undefined` if none. */
        lastTabbableNode,
        // NOTE: DOM order is NOT NECESSARILY "document position" order, but figuring that out
        //  would require more than just https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
        //  because that API doesn't work with Shadow DOM as well as it should (@see
        //  https://github.com/whatwg/dom/issues/320) and since this first/last is only needed, so far,
        //  to address an edge case related to positive tabindex support, this seems like a much easier,
        //  "close enough most of the time" alternative for positive tabindexes which should generally
        //  be avoided anyway...
        /** First tabbable node in container, __DOM__ order; `undefined` if none. */
        firstDomTabbableNode,
        /** Last tabbable node in container, __DOM__ order; `undefined` if none. */
        lastDomTabbableNode,
        /**
         * Finds the __tabbable__ node that follows the given node in the specified direction,
         *  in this container, if any.
         * @param {HTMLElement} node
         * @param {boolean} [forward] True if going in forward tab order; false if going
         *  in reverse.
         * @returns {HTMLElement|undefined} The next tabbable node, if any.
         */
        nextTabbableNode: function nextTabbableNode(node) {
          var forward = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
          var nodeIdx = tabbableNodes.indexOf(node);
          if (nodeIdx < 0) {
            if (forward) {
              return focusableNodes.slice(focusableNodes.indexOf(node) + 1).find(function(el) {
                return isTabbable(el);
              });
            }
            return focusableNodes.slice(0, focusableNodes.indexOf(node)).reverse().find(function(el) {
              return isTabbable(el);
            });
          }
          return tabbableNodes[nodeIdx + (forward ? 1 : -1)];
        }
      };
    });
    state.tabbableGroups = state.containerGroups.filter(function(group) {
      return group.tabbableNodes.length > 0;
    });
    if (state.tabbableGroups.length <= 0 && !getNodeForOption("fallbackFocus")) {
      throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times");
    }
    if (state.containerGroups.find(function(g) {
      return g.posTabIndexesFound;
    }) && state.containerGroups.length > 1) {
      throw new Error("At least one node with a positive tabindex was found in one of your focus-trap's multiple containers. Positive tabindexes are only supported in single-container focus-traps.");
    }
  };
  var getActiveElement = function getActiveElement2(el) {
    var activeElement = el.activeElement;
    if (!activeElement) {
      return;
    }
    if (activeElement.shadowRoot && activeElement.shadowRoot.activeElement !== null) {
      return getActiveElement2(activeElement.shadowRoot);
    }
    return activeElement;
  };
  var tryFocus = function tryFocus2(node) {
    if (node === false) {
      return;
    }
    if (node === getActiveElement(document)) {
      return;
    }
    if (!node || !node.focus) {
      tryFocus2(getInitialFocusNode());
      return;
    }
    node.focus({
      preventScroll: !!config.preventScroll
    });
    state.mostRecentlyFocusedNode = node;
    if (isSelectableInput(node)) {
      node.select();
    }
  };
  var getReturnFocusNode = function getReturnFocusNode2(previousActiveElement) {
    var node = getNodeForOption("setReturnFocus", previousActiveElement);
    return node ? node : node === false ? false : previousActiveElement;
  };
  var findNextNavNode = function findNextNavNode2(_ref2) {
    var target = _ref2.target, event = _ref2.event, _ref2$isBackward = _ref2.isBackward, isBackward = _ref2$isBackward === void 0 ? false : _ref2$isBackward;
    target = target || getActualTarget(event);
    updateTabbableNodes();
    var destinationNode = null;
    if (state.tabbableGroups.length > 0) {
      var containerIndex = findContainerIndex(target, event);
      var containerGroup = containerIndex >= 0 ? state.containerGroups[containerIndex] : void 0;
      if (containerIndex < 0) {
        if (isBackward) {
          destinationNode = state.tabbableGroups[state.tabbableGroups.length - 1].lastTabbableNode;
        } else {
          destinationNode = state.tabbableGroups[0].firstTabbableNode;
        }
      } else if (isBackward) {
        var startOfGroupIndex = findIndex(state.tabbableGroups, function(_ref3) {
          var firstTabbableNode = _ref3.firstTabbableNode;
          return target === firstTabbableNode;
        });
        if (startOfGroupIndex < 0 && (containerGroup.container === target || isFocusable(target, config.tabbableOptions) && !isTabbable(target, config.tabbableOptions) && !containerGroup.nextTabbableNode(target, false))) {
          startOfGroupIndex = containerIndex;
        }
        if (startOfGroupIndex >= 0) {
          var destinationGroupIndex = startOfGroupIndex === 0 ? state.tabbableGroups.length - 1 : startOfGroupIndex - 1;
          var destinationGroup = state.tabbableGroups[destinationGroupIndex];
          destinationNode = getTabIndex(target) >= 0 ? destinationGroup.lastTabbableNode : destinationGroup.lastDomTabbableNode;
        } else if (!isTabEvent(event)) {
          destinationNode = containerGroup.nextTabbableNode(target, false);
        }
      } else {
        var lastOfGroupIndex = findIndex(state.tabbableGroups, function(_ref4) {
          var lastTabbableNode = _ref4.lastTabbableNode;
          return target === lastTabbableNode;
        });
        if (lastOfGroupIndex < 0 && (containerGroup.container === target || isFocusable(target, config.tabbableOptions) && !isTabbable(target, config.tabbableOptions) && !containerGroup.nextTabbableNode(target))) {
          lastOfGroupIndex = containerIndex;
        }
        if (lastOfGroupIndex >= 0) {
          var _destinationGroupIndex = lastOfGroupIndex === state.tabbableGroups.length - 1 ? 0 : lastOfGroupIndex + 1;
          var _destinationGroup = state.tabbableGroups[_destinationGroupIndex];
          destinationNode = getTabIndex(target) >= 0 ? _destinationGroup.firstTabbableNode : _destinationGroup.firstDomTabbableNode;
        } else if (!isTabEvent(event)) {
          destinationNode = containerGroup.nextTabbableNode(target);
        }
      }
    } else {
      destinationNode = getNodeForOption("fallbackFocus");
    }
    return destinationNode;
  };
  var checkPointerDown = function checkPointerDown2(e) {
    var target = getActualTarget(e);
    if (findContainerIndex(target, e) >= 0) {
      return;
    }
    if (valueOrHandler(config.clickOutsideDeactivates, e)) {
      trap.deactivate({
        // NOTE: by setting `returnFocus: false`, deactivate() will do nothing,
        //  which will result in the outside click setting focus to the node
        //  that was clicked (and if not focusable, to "nothing"); by setting
        //  `returnFocus: true`, we'll attempt to re-focus the node originally-focused
        //  on activation (or the configured `setReturnFocus` node), whether the
        //  outside click was on a focusable node or not
        returnFocus: config.returnFocusOnDeactivate
      });
      return;
    }
    if (valueOrHandler(config.allowOutsideClick, e)) {
      return;
    }
    e.preventDefault();
  };
  var checkFocusIn = function checkFocusIn2(event) {
    var target = getActualTarget(event);
    var targetContained = findContainerIndex(target, event) >= 0;
    if (targetContained || target instanceof Document) {
      if (targetContained) {
        state.mostRecentlyFocusedNode = target;
      }
    } else {
      event.stopImmediatePropagation();
      var nextNode;
      var navAcrossContainers = true;
      if (state.mostRecentlyFocusedNode) {
        if (getTabIndex(state.mostRecentlyFocusedNode) > 0) {
          var mruContainerIdx = findContainerIndex(state.mostRecentlyFocusedNode);
          var tabbableNodes = state.containerGroups[mruContainerIdx].tabbableNodes;
          if (tabbableNodes.length > 0) {
            var mruTabIdx = tabbableNodes.findIndex(function(node) {
              return node === state.mostRecentlyFocusedNode;
            });
            if (mruTabIdx >= 0) {
              if (config.isKeyForward(state.recentNavEvent)) {
                if (mruTabIdx + 1 < tabbableNodes.length) {
                  nextNode = tabbableNodes[mruTabIdx + 1];
                  navAcrossContainers = false;
                }
              } else {
                if (mruTabIdx - 1 >= 0) {
                  nextNode = tabbableNodes[mruTabIdx - 1];
                  navAcrossContainers = false;
                }
              }
            }
          }
        } else {
          if (!state.containerGroups.some(function(g) {
            return g.tabbableNodes.some(function(n) {
              return getTabIndex(n) > 0;
            });
          })) {
            navAcrossContainers = false;
          }
        }
      } else {
        navAcrossContainers = false;
      }
      if (navAcrossContainers) {
        nextNode = findNextNavNode({
          // move FROM the MRU node, not event-related node (which will be the node that is
          //  outside the trap causing the focus escape we're trying to fix)
          target: state.mostRecentlyFocusedNode,
          isBackward: config.isKeyBackward(state.recentNavEvent)
        });
      }
      if (nextNode) {
        tryFocus(nextNode);
      } else {
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }
    }
    state.recentNavEvent = void 0;
  };
  var checkKeyNav = function checkKeyNav2(event) {
    var isBackward = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    state.recentNavEvent = event;
    var destinationNode = findNextNavNode({
      event,
      isBackward
    });
    if (destinationNode) {
      if (isTabEvent(event)) {
        event.preventDefault();
      }
      tryFocus(destinationNode);
    }
  };
  var checkKey = function checkKey2(event) {
    if (isEscapeEvent(event) && valueOrHandler(config.escapeDeactivates, event) !== false) {
      event.preventDefault();
      trap.deactivate();
      return;
    }
    if (config.isKeyForward(event) || config.isKeyBackward(event)) {
      checkKeyNav(event, config.isKeyBackward(event));
    }
  };
  var checkClick = function checkClick2(e) {
    var target = getActualTarget(e);
    if (findContainerIndex(target, e) >= 0) {
      return;
    }
    if (valueOrHandler(config.clickOutsideDeactivates, e)) {
      return;
    }
    if (valueOrHandler(config.allowOutsideClick, e)) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  var addListeners = function addListeners2() {
    if (!state.active) {
      return;
    }
    activeFocusTraps.activateTrap(trapStack, trap);
    state.delayInitialFocusTimer = config.delayInitialFocus ? delay(function() {
      tryFocus(getInitialFocusNode());
    }) : tryFocus(getInitialFocusNode());
    doc.addEventListener("focusin", checkFocusIn, true);
    doc.addEventListener("mousedown", checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener("touchstart", checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener("click", checkClick, {
      capture: true,
      passive: false
    });
    doc.addEventListener("keydown", checkKey, {
      capture: true,
      passive: false
    });
    return trap;
  };
  var removeListeners = function removeListeners2() {
    if (!state.active) {
      return;
    }
    doc.removeEventListener("focusin", checkFocusIn, true);
    doc.removeEventListener("mousedown", checkPointerDown, true);
    doc.removeEventListener("touchstart", checkPointerDown, true);
    doc.removeEventListener("click", checkClick, true);
    doc.removeEventListener("keydown", checkKey, true);
    return trap;
  };
  var checkDomRemoval = function checkDomRemoval2(mutations) {
    var isFocusedNodeRemoved = mutations.some(function(mutation) {
      var removedNodes = Array.from(mutation.removedNodes);
      return removedNodes.some(function(node) {
        return node === state.mostRecentlyFocusedNode;
      });
    });
    if (isFocusedNodeRemoved) {
      tryFocus(getInitialFocusNode());
    }
  };
  var mutationObserver = typeof window !== "undefined" && "MutationObserver" in window ? new MutationObserver(checkDomRemoval) : void 0;
  var updateObservedNodes = function updateObservedNodes2() {
    if (!mutationObserver) {
      return;
    }
    mutationObserver.disconnect();
    if (state.active && !state.paused) {
      state.containers.map(function(container) {
        mutationObserver.observe(container, {
          subtree: true,
          childList: true
        });
      });
    }
  };
  trap = {
    get active() {
      return state.active;
    },
    get paused() {
      return state.paused;
    },
    activate: function activate(activateOptions) {
      if (state.active) {
        return this;
      }
      var onActivate = getOption(activateOptions, "onActivate");
      var onPostActivate = getOption(activateOptions, "onPostActivate");
      var checkCanFocusTrap = getOption(activateOptions, "checkCanFocusTrap");
      if (!checkCanFocusTrap) {
        updateTabbableNodes();
      }
      state.active = true;
      state.paused = false;
      state.nodeFocusedBeforeActivation = doc.activeElement;
      onActivate === null || onActivate === void 0 || onActivate();
      var finishActivation = function finishActivation2() {
        if (checkCanFocusTrap) {
          updateTabbableNodes();
        }
        addListeners();
        updateObservedNodes();
        onPostActivate === null || onPostActivate === void 0 || onPostActivate();
      };
      if (checkCanFocusTrap) {
        checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
        return this;
      }
      finishActivation();
      return this;
    },
    deactivate: function deactivate(deactivateOptions) {
      if (!state.active) {
        return this;
      }
      var options = _objectSpread2({
        onDeactivate: config.onDeactivate,
        onPostDeactivate: config.onPostDeactivate,
        checkCanReturnFocus: config.checkCanReturnFocus
      }, deactivateOptions);
      clearTimeout(state.delayInitialFocusTimer);
      state.delayInitialFocusTimer = void 0;
      removeListeners();
      state.active = false;
      state.paused = false;
      updateObservedNodes();
      activeFocusTraps.deactivateTrap(trapStack, trap);
      var onDeactivate = getOption(options, "onDeactivate");
      var onPostDeactivate = getOption(options, "onPostDeactivate");
      var checkCanReturnFocus = getOption(options, "checkCanReturnFocus");
      var returnFocus = getOption(options, "returnFocus", "returnFocusOnDeactivate");
      onDeactivate === null || onDeactivate === void 0 || onDeactivate();
      var finishDeactivation = function finishDeactivation2() {
        delay(function() {
          if (returnFocus) {
            tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
          }
          onPostDeactivate === null || onPostDeactivate === void 0 || onPostDeactivate();
        });
      };
      if (returnFocus && checkCanReturnFocus) {
        checkCanReturnFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation)).then(finishDeactivation, finishDeactivation);
        return this;
      }
      finishDeactivation();
      return this;
    },
    pause: function pause(pauseOptions) {
      if (state.paused || !state.active) {
        return this;
      }
      var onPause = getOption(pauseOptions, "onPause");
      var onPostPause = getOption(pauseOptions, "onPostPause");
      state.paused = true;
      onPause === null || onPause === void 0 || onPause();
      removeListeners();
      updateObservedNodes();
      onPostPause === null || onPostPause === void 0 || onPostPause();
      return this;
    },
    unpause: function unpause(unpauseOptions) {
      if (!state.paused || !state.active) {
        return this;
      }
      var onUnpause = getOption(unpauseOptions, "onUnpause");
      var onPostUnpause = getOption(unpauseOptions, "onPostUnpause");
      state.paused = false;
      onUnpause === null || onUnpause === void 0 || onUnpause();
      updateTabbableNodes();
      addListeners();
      updateObservedNodes();
      onPostUnpause === null || onPostUnpause === void 0 || onPostUnpause();
      return this;
    },
    updateContainerElements: function updateContainerElements(containerElements) {
      var elementsAsArray = [].concat(containerElements).filter(Boolean);
      state.containers = elementsAsArray.map(function(element) {
        return typeof element === "string" ? doc.querySelector(element) : element;
      });
      if (state.active) {
        updateTabbableNodes();
      }
      updateObservedNodes();
      return this;
    }
  };
  trap.updateContainerElements(elements);
  return trap;
};

// js/helper/section.js
function filterShopifyEvent(event, domElement, callback) {
  let executeCallback = false;
  if (event.type.includes("shopify:section")) {
    if (domElement.hasAttribute("section") && domElement.getAttribute("section") === event.detail.sectionId) {
      executeCallback = true;
    }
  } else if (event.type.includes("shopify:block") && event.target === domElement) {
    executeCallback = true;
  }
  if (executeCallback) {
    callback(event);
  }
}

// js/custom-element/behavior/openable-element.js
var OpenableElement = class extends CustomHTMLElement {
  static get observedAttributes() {
    return ["open"];
  }
  constructor() {
    super();
    if (Shopify.designMode) {
      this.rootDelegate.on("shopify:section:select", (event) => filterShopifyEvent(event, this, () => this.open = true));
      this.rootDelegate.on("shopify:section:deselect", (event) => filterShopifyEvent(event, this, () => this.open = false));
    }
    if (this.hasAttribute("append-body")) {
      const existingNode = document.getElementById(this.id);
      this.removeAttribute("append-body");
      if (existingNode && existingNode !== this) {
        existingNode.replaceWith(this.cloneNode(true));
        this.remove();
      } else {
        document.body.appendChild(this);
      }
    }
  }
  connectedCallback() {
    this.delegate.on("click", ".openable__overlay", () => this.open = false);
    this.delegate.on("click", '[data-action="close"]', (event) => {
      event.stopPropagation();
      this.open = false;
    });
  }
  get requiresLoading() {
    return this.hasAttribute("href");
  }
  get open() {
    return this.hasAttribute("open");
  }
  set open(value) {
    if (value) {
      (async () => {
        await this._load();
        this.clientWidth;
        this.setAttribute("open", "");
      })();
    } else {
      this.removeAttribute("open");
    }
  }
  get shouldTrapFocus() {
    return true;
  }
  get returnFocusOnDeactivate() {
    return !this.hasAttribute("return-focus") || this.getAttribute("return-focus") === "true";
  }
  get focusTrap() {
    return this._focusTrap = this._focusTrap || createFocusTrap(this, {
      fallbackFocus: this,
      initialFocus: this.hasAttribute("initial-focus-selector") ? this.getAttribute("initial-focus-selector") : void 0,
      clickOutsideDeactivates: (event) => !(event.target.hasAttribute("aria-controls") && event.target.getAttribute("aria-controls") === this.id),
      allowOutsideClick: (event) => event.target.hasAttribute("aria-controls") && event.target.getAttribute("aria-controls") === this.id,
      returnFocusOnDeactivate: this.returnFocusOnDeactivate,
      onDeactivate: () => this.open = false,
      preventScroll: true
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "open":
        if (oldValue === null && newValue === "") {
          if (this.shouldTrapFocus) {
            setTimeout(() => this.focusTrap.activate(), 150);
          }
          triggerEvent(this, "openable-element:open");
        } else if (newValue === null) {
          if (this.shouldTrapFocus) {
            this.focusTrap.deactivate();
          }
          triggerEvent(this, "openable-element:close");
        }
    }
  }
  async _load() {
    if (!this.requiresLoading) {
      return;
    }
    triggerNonBubblingEvent(this, "openable-element:load:start");
    const response = await fetch(this.getAttribute("href"));
    const element = document.createElement("div");
    element.innerHTML = await response.text();
    this.innerHTML = element.querySelector(this.tagName.toLowerCase()).innerHTML;
    this.removeAttribute("href");
    triggerNonBubblingEvent(this, "openable-element:load:end");
  }
};
window.customElements.define("openable-element", OpenableElement);

// js/custom-element/behavior/collapsible-content.js
var CollapsibleContent = class extends OpenableElement {
  constructor() {
    super();
    this.ignoreNextTransition = this.open;
    this.addEventListener("shopify:block:select", () => this.open = true);
    this.addEventListener("shopify:block:deselect", () => this.open = false);
  }
  get animateItems() {
    return this.hasAttribute("animate-items");
  }
  attributeChangedCallback(name) {
    if (this.ignoreNextTransition) {
      return this.ignoreNextTransition = false;
    }
    switch (name) {
      case "open":
        this.style.overflow = "hidden";
        const keyframes = {
          height: ["0px", `${this.scrollHeight}px`],
          visibility: ["hidden", "visible"]
        };
        if (this.animateItems) {
          keyframes["opacity"] = this.open ? [0, 0] : [0, 1];
        }
        this.animate(keyframes, {
          duration: 500,
          direction: this.open ? "normal" : "reverse",
          easing: "cubic-bezier(0.75, 0, 0.175, 1)"
        }).onfinish = () => {
          this.style.overflow = this.open ? "visible" : "hidden";
        };
        if (this.animateItems && this.open) {
          this.animate({
            opacity: [0, 1],
            transform: ["translateY(10px)", "translateY(0)"]
          }, {
            duration: 250,
            delay: 250,
            easing: "cubic-bezier(0.75, 0, 0.175, 1)"
          });
        }
        triggerEvent(this, this.open ? "openable-element:open" : "openable-element:close");
    }
  }
};
window.customElements.define("collapsible-content", CollapsibleContent);

// js/custom-element/behavior/confirm-button.js
var ConfirmButton = class extends HTMLButtonElement {
  connectedCallback() {
    this.addEventListener("click", (event) => {
      if (!window.confirm(this.getAttribute("data-message") || "Are you sure you wish to do this?")) {
        event.preventDefault();
      }
    });
  }
};
window.customElements.define("confirm-button", ConfirmButton, { extends: "button" });

// js/mixin/loader-button.js
var LoaderButtonMixin = {
  _prepareButton() {
    this.originalContent = this.innerHTML;
    this._startTransitionPromise = null;
    this.innerHTML = `
      <span class="loader-button__text">${this.innerHTML}</span>
      <span class="loader-button__loader" hidden>
        <div class="spinner">
          <svg focusable="false" width="24" height="24" class="icon icon--spinner" viewBox="25 25 50 50">
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="5"></circle>
          </svg>
        </div>
      </span>
    `;
    this.textElement = this.firstElementChild;
    this.spinnerElement = this.lastElementChild;
    window.addEventListener("pagehide", () => this.removeAttribute("aria-busy"));
  },
  _startTransition() {
    const textAnimation = this.textElement.animate({
      opacity: [1, 0],
      transform: ["translateY(0)", "translateY(-10px)"]
    }, {
      duration: 75,
      easing: "ease",
      fill: "forwards"
    });
    this.spinnerElement.hidden = false;
    const spinnerAnimation = this.spinnerElement.animate({
      opacity: [0, 1],
      transform: ["translate(-50%, 0%)", "translate(-50%, -50%)"]
    }, {
      duration: 75,
      delay: 75,
      easing: "ease",
      fill: "forwards"
    });
    this._startTransitionPromise = Promise.all([
      new Promise((resolve) => textAnimation.onfinish = () => resolve()),
      new Promise((resolve) => spinnerAnimation.onfinish = () => resolve())
    ]);
  },
  async _endTransition() {
    if (!this._startTransitionPromise) {
      return;
    }
    await this._startTransitionPromise;
    this.spinnerElement.animate({
      opacity: [1, 0],
      transform: ["translate(-50%, -50%)", "translate(-50%, -100%)"]
    }, {
      duration: 75,
      delay: 100,
      easing: "ease",
      fill: "forwards"
    }).onfinish = () => this.spinnerElement.hidden = true;
    this.textElement.animate({
      opacity: [0, 1],
      transform: ["translateY(10px)", "translateY(0)"]
    }, {
      duration: 75,
      delay: 175,
      easing: "ease",
      fill: "forwards"
    });
    this._startTransitionPromise = null;
  }
};

// js/custom-element/behavior/loader-button.js
var LoaderButton = class extends HTMLButtonElement {
  static get observedAttributes() {
    return ["aria-busy"];
  }
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      if (this.type === "submit" && this.form && this.form.checkValidity() && !this.form.hasAttribute("is")) {
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          event.preventDefault();
          this.setAttribute("aria-busy", "true");
          setTimeout(() => this.form.submit(), 250);
        } else {
          this.setAttribute("aria-busy", "true");
        }
      }
    });
  }
  connectedCallback() {
    this._prepareButton();
  }
  disconnectedCallback() {
    this.innerHTML = this.originalContent;
  }
  attributeChangedCallback(property, oldValue, newValue) {
    if (property === "aria-busy") {
      if (newValue === "true") {
        this._startTransition();
      } else {
        this._endTransition();
      }
    }
  }
};
Object.assign(LoaderButton.prototype, LoaderButtonMixin);
window.customElements.define("loader-button", LoaderButton, { extends: "button" });

// js/custom-element/behavior/page-pagination.js
var PagePagination = class extends CustomHTMLElement {
  connectedCallback() {
    if (this.hasAttribute("ajax")) {
      this.delegate.on("click", "a", this._onLinkClicked.bind(this));
    }
  }
  _onLinkClicked(event, target) {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("page", target.getAttribute("data-page"));
    triggerEvent(this, "pagination:page-changed", { url: url.toString() });
  }
};
window.customElements.define("page-pagination", PagePagination);

// js/custom-element/behavior/toggle-button.js
var ToggleButton = class extends HTMLButtonElement {
  static get observedAttributes() {
    return ["aria-expanded", "aria-busy"];
  }
  constructor() {
    super();
    if (this.hasAttribute("loader")) {
      this._prepareButton();
    }
    this.addEventListener("click", this._onButtonClick.bind(this));
    this.rootDelegate = new main_default(document.documentElement);
  }
  _onButtonClick() {
    this.isExpanded = !this.isExpanded;
  }
  connectedCallback() {
    document.addEventListener("openable-element:close", (event) => {
      if (this.controlledElement === event.target) {
        this.isExpanded = false;
        event.stopPropagation();
      }
    });
    document.addEventListener("openable-element:open", (event) => {
      if (this.controlledElement === event.target) {
        this.isExpanded = true;
        event.stopPropagation();
      }
    });
    this.rootDelegate.on("openable-element:load:start", `#${this.getAttribute("aria-controls")}`, () => {
      if (this.classList.contains("button")) {
        this.setAttribute("aria-busy", "true");
      } else if (this.offsetParent !== null) {
        triggerEvent(document.documentElement, "theme:loading:start");
      }
    }, true);
    this.rootDelegate.on("openable-element:load:end", `#${this.getAttribute("aria-controls")}`, () => {
      if (this.classList.contains("button")) {
        this.removeAttribute("aria-busy");
      } else if (this.offsetParent !== null) {
        triggerEvent(document.documentElement, "theme:loading:end");
      }
    }, true);
  }
  disconnectedCallback() {
    this.rootDelegate.destroy();
  }
  get isExpanded() {
    return this.getAttribute("aria-expanded") === "true";
  }
  set isExpanded(value) {
    this.setAttribute("aria-expanded", value ? "true" : "false");
  }
  get controlledElement() {
    return document.getElementById(this.getAttribute("aria-controls"));
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "aria-expanded":
        if (oldValue === "false" && newValue === "true") {
          this.controlledElement.open = true;
        } else if (oldValue === "true" && newValue === "false") {
          this.controlledElement.open = false;
        }
        break;
      case "aria-busy":
        if (this.hasAttribute("loader")) {
          if (newValue === "true") {
            this._startTransition();
          } else {
            this._endTransition();
          }
        }
        break;
    }
  }
};
Object.assign(ToggleButton.prototype, LoaderButtonMixin);
window.customElements.define("toggle-button", ToggleButton, { extends: "button" });

// js/custom-element/behavior/toggle-link.js
var ToggleLink = class extends HTMLAnchorElement {
  static get observedAttributes() {
    return ["aria-expanded"];
  }
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      this.isExpanded = !this.isExpanded;
    });
    this.rootDelegate = new main_default(document.documentElement);
  }
  connectedCallback() {
    this.rootDelegate.on("openable-element:close", `#${this.getAttribute("aria-controls")}`, (event) => {
      if (this.controlledElement === event.target) {
        this.isExpanded = false;
      }
    }, true);
    this.rootDelegate.on("openable-element:open", `#${this.getAttribute("aria-controls")}`, (event) => {
      if (this.controlledElement === event.target) {
        this.isExpanded = true;
      }
    }, true);
  }
  disconnectedCallback() {
    this.rootDelegate.destroy();
  }
  get isExpanded() {
    return this.getAttribute("aria-expanded") === "true";
  }
  set isExpanded(value) {
    this.setAttribute("aria-expanded", value ? "true" : "false");
  }
  get controlledElement() {
    return document.querySelector(`#${this.getAttribute("aria-controls")}`);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "aria-expanded":
        if (oldValue === "false" && newValue === "true") {
          this.controlledElement.open = true;
        } else if (oldValue === "true" && newValue === "false") {
          this.controlledElement.open = false;
        }
    }
  }
};
window.customElements.define("toggle-link", ToggleLink, { extends: "a" });

// js/custom-element/behavior/page-dots.js
var PageDots = class extends CustomHTMLElement {
  connectedCallback() {
    this.buttons = Array.from(this.querySelectorAll("button"));
    this.delegate.on("click", "button", (event, target) => {
      this._dispatchEvent(this.buttons.indexOf(target));
    });
    if (this.hasAttribute("animation-timer")) {
      this.delegate.on("animationend", (event) => {
        if (event.elapsedTime > 0) {
          this._dispatchEvent((this.selectedIndex + 1 + this.buttons.length) % this.buttons.length);
        }
      });
    }
  }
  get selectedIndex() {
    return this.buttons.findIndex((button) => button.getAttribute("aria-current") === "true");
  }
  set selectedIndex(selectedIndex) {
    this.buttons.forEach((button, index) => button.setAttribute("aria-current", selectedIndex === index ? "true" : "false"));
    if (this.hasAttribute("align-selected")) {
      const selectedItem = this.buttons[selectedIndex], windowHalfWidth = window.innerWidth / 2, boundingRect = selectedItem.getBoundingClientRect(), scrollableElement = this._findFirstScrollableElement(this.parentElement);
      if (scrollableElement) {
        scrollableElement.scrollTo({
          behavior: "smooth",
          left: scrollableElement.scrollLeft + (boundingRect.left - windowHalfWidth) + boundingRect.width / 2
        });
      }
    }
  }
  _dispatchEvent(index) {
    if (index !== this.selectedIndex) {
      this.dispatchEvent(new CustomEvent("page-dots:changed", {
        bubbles: true,
        detail: {
          index
        }
      }));
    }
  }
  _findFirstScrollableElement(item, currentDepth = 0) {
    if (item === null || currentDepth > 3) {
      return null;
    }
    return item.scrollWidth > item.clientWidth ? item : this._findFirstScrollableElement(item.parentElement, currentDepth + 1);
  }
};
window.customElements.define("page-dots", PageDots);

// js/custom-element/behavior/prev-next-buttons.js
var PrevNextButtons = class extends HTMLElement {
  connectedCallback() {
    this.prevButton = this.querySelector("button:first-of-type");
    this.nextButton = this.querySelector("button:last-of-type");
    this.prevButton.addEventListener("click", () => this.prevButton.dispatchEvent(new CustomEvent("prev-next:prev", { bubbles: true })));
    this.nextButton.addEventListener("click", () => this.nextButton.dispatchEvent(new CustomEvent("prev-next:next", { bubbles: true })));
  }
  set isPrevDisabled(value) {
    this.prevButton.disabled = value;
  }
  set isNextDisabled(value) {
    this.nextButton.disabled = value;
  }
};
var PrevButton = class extends HTMLButtonElement {
  connectedCallback() {
    this.addEventListener("click", () => this.dispatchEvent(new CustomEvent("prev-next:prev", { bubbles: true })));
  }
};
var NextButton = class extends HTMLButtonElement {
  connectedCallback() {
    this.addEventListener("click", () => this.dispatchEvent(new CustomEvent("prev-next:next", { bubbles: true })));
  }
};
window.customElements.define("prev-next-buttons", PrevNextButtons);
window.customElements.define("prev-button", PrevButton, { extends: "button" });
window.customElements.define("next-button", NextButton, { extends: "button" });

// js/helper/dimensions.js
function getStickyHeaderOffset() {
  const documentStyles = getComputedStyle(document.documentElement);
  return parseInt(documentStyles.getPropertyValue("--header-height") || 0) * parseInt(documentStyles.getPropertyValue("--enable-sticky-header") || 0) + parseInt(documentStyles.getPropertyValue("--announcement-bar-height") || 0) * parseInt(documentStyles.getPropertyValue("--enable-sticky-announcement-bar") || 0);
}

// js/custom-element/behavior/safe-sticky.js
var SafeSticky = class extends HTMLElement {
  connectedCallback() {
    this.lastKnownY = window.scrollY;
    this.currentTop = 0;
    this.hasPendingRaf = false;
    window.addEventListener("scroll", this._checkPosition.bind(this));
  }
  get initialTopOffset() {
    return getStickyHeaderOffset() + (parseInt(this.getAttribute("offset")) || 0);
  }
  _checkPosition() {
    if (this.hasPendingRaf) {
      return;
    }
    this.hasPendingRaf = true;
    requestAnimationFrame(() => {
      let bounds = this.getBoundingClientRect(), maxTop = bounds.top + window.scrollY - this.offsetTop + this.initialTopOffset, minTop = this.clientHeight - window.innerHeight;
      if (window.scrollY < this.lastKnownY) {
        this.currentTop -= window.scrollY - this.lastKnownY;
      } else {
        this.currentTop += this.lastKnownY - window.scrollY;
      }
      this.currentTop = Math.min(Math.max(this.currentTop, -minTop), maxTop, this.initialTopOffset);
      this.lastKnownY = window.scrollY;
      this.style.top = `${this.currentTop}px`;
      this.hasPendingRaf = false;
    });
  }
};
window.customElements.define("safe-sticky", SafeSticky);

// js/helper/throttle.js
function throttle(callback, delay3 = 15) {
  let throttleTimeout = null, storedEvent = null;
  const throttledEventHandler = (event) => {
    storedEvent = event;
    const shouldHandleEvent = !throttleTimeout;
    if (shouldHandleEvent) {
      callback(storedEvent);
      storedEvent = null;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        if (storedEvent) {
          throttledEventHandler(storedEvent);
        }
      }, delay3);
    }
  };
  return throttledEventHandler;
}

// js/custom-element/behavior/scroll-spy.js
var ScrollSpy = class extends HTMLElement {
  connectedCallback() {
    this._createSvg();
    this.elementsToObserve = Array.from(this.querySelectorAll("a")).map((linkElement) => document.querySelector(linkElement.getAttribute("href")));
    this.navListItems = Array.from(this.querySelectorAll("li"));
    this.navItems = this.navListItems.map((listItem) => {
      const anchor = listItem.firstElementChild, targetID = anchor && anchor.getAttribute("href").slice(1), target = document.getElementById(targetID);
      return { listItem, anchor, target };
    }).filter((item) => item.target);
    this.drawPath();
    window.addEventListener("scroll", throttle(this.markVisibleSection.bind(this), 25));
    window.addEventListener("orientationchange", () => {
      window.addEventListener("resize", () => {
        this.drawPath();
        this.markVisibleSection();
      }, { once: true });
    });
    this.markVisibleSection();
  }
  /**
   * Dynamically create the SVG element that will be used to "spy" the scroll
   */
  _createSvg() {
    this.navPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.insertAdjacentElement("beforeend", this.navPath);
    this.insertAdjacentElement("beforeend", svgElement);
    this.lastPathStart = this.lastPathEnd = null;
  }
  drawPath() {
    let path = [], pathIndent;
    this.navItems.forEach((item, i) => {
      const x = item.anchor.offsetLeft - 5, y = item.anchor.offsetTop, height = item.anchor.offsetHeight;
      if (i === 0) {
        path.push("M", x, y, "L", x, y + height);
        item.pathStart = 0;
      } else {
        if (pathIndent !== x) {
          path.push("L", pathIndent, y);
        }
        path.push("L", x, y);
        this.navPath.setAttribute("d", path.join(" "));
        item.pathStart = this.navPath.getTotalLength() || 0;
        path.push("L", x, y + height);
      }
      pathIndent = x;
      this.navPath.setAttribute("d", path.join(" "));
      item.pathEnd = this.navPath.getTotalLength();
    });
  }
  syncPath() {
    const someElsAreVisible = () => this.querySelectorAll(".is-visible").length > 0, thisElIsVisible = (el) => el.classList.contains("is-visible"), pathLength = this.navPath.getTotalLength();
    let pathStart = pathLength, pathEnd = 0;
    this.navItems.forEach((item) => {
      if (thisElIsVisible(item.listItem)) {
        pathStart = Math.min(item.pathStart, pathStart);
        pathEnd = Math.max(item.pathEnd, pathEnd);
      }
    });
    if (someElsAreVisible() && pathStart < pathEnd) {
      if (pathStart !== this.lastPathStart || pathEnd !== this.lastPathEnd) {
        const dashArray = `1 ${pathStart} ${pathEnd - pathStart} ${pathLength}`;
        this.navPath.style.setProperty("stroke-dashoffset", "1");
        this.navPath.style.setProperty("stroke-dasharray", dashArray);
        this.navPath.style.setProperty("opacity", "1");
      }
    } else {
      this.navPath.style.setProperty("opacity", "0");
    }
    this.lastPathStart = pathStart;
    this.lastPathEnd = pathEnd;
  }
  markVisibleSection() {
    this.navListItems.forEach((item) => item.classList.remove("is-visible"));
    for (const [index, elementToObserve] of this.elementsToObserve.entries()) {
      const boundingClientRect = elementToObserve.getBoundingClientRect();
      if (boundingClientRect.top > getStickyHeaderOffset() || index === this.elementsToObserve.length - 1) {
        this.querySelector(`a[href="#${elementToObserve.id}"]`).parentElement.classList.add("is-visible");
        break;
      }
    }
    this.syncPath();
  }
};
window.customElements.define("scroll-spy", ScrollSpy);

// js/custom-element/behavior/scroll-shadow.js
var template = `
  <style>
    :host {
      display: inline-block;
      contain: layout;
      position: relative;
    }
    
    :host([hidden]) {
      display: none;
    }
    
    s {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      pointer-events: none;
      background-image:
        var(--scroll-shadow-top, radial-gradient(farthest-side at 50% 0%, rgba(0,0,0,.2), rgba(0,0,0,0))),
        var(--scroll-shadow-bottom, radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.2), rgba(0,0,0,0))),
        var(--scroll-shadow-left, radial-gradient(farthest-side at 0%, rgba(0,0,0,.2), rgba(0,0,0,0))),
        var(--scroll-shadow-right, radial-gradient(farthest-side at 100%, rgba(0,0,0,.2), rgba(0,0,0,0)));
      background-position: top, bottom, left, right;
      background-repeat: no-repeat;
      background-size: 100% var(--top, 0), 100% var(--bottom, 0), var(--left, 0) 100%, var(--right, 0) 100%;
    }
  </style>
  <slot></slot>
  <s></s>
`;
var Updater = class {
  constructor(targetElement) {
    this.scheduleUpdate = throttle(() => this.update(targetElement, getComputedStyle(targetElement)));
    this.resizeObserver = new ResizeObserver(this.scheduleUpdate.bind(this));
  }
  start(element) {
    if (this.element) {
      this.stop();
    }
    if (element) {
      element.addEventListener("scroll", this.scheduleUpdate);
      this.resizeObserver.observe(element);
      this.element = element;
    }
  }
  stop() {
    if (!this.element) {
      return;
    }
    this.element.removeEventListener("scroll", this.scheduleUpdate);
    this.resizeObserver.unobserve(this.element);
    this.element = null;
  }
  update(targetElement, style) {
    if (!this.element) {
      return;
    }
    const maxSize = style.getPropertyValue("--scroll-shadow-size") ? parseInt(style.getPropertyValue("--scroll-shadow-size")) : 0;
    const scroll = {
      top: Math.max(this.element.scrollTop, 0),
      bottom: Math.max(this.element.scrollHeight - this.element.offsetHeight - this.element.scrollTop, 0),
      left: Math.max(this.element.scrollLeft, 0),
      right: Math.max(this.element.scrollWidth - this.element.offsetWidth - this.element.scrollLeft, 0)
    };
    requestAnimationFrame(() => {
      for (const position of ["top", "bottom", "left", "right"]) {
        targetElement.style.setProperty(
          `--${position}`,
          `${scroll[position] > maxSize ? maxSize : scroll[position]}px`
        );
      }
    });
  }
};
var ScrollShadow = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    this.updater = new Updater(this.shadowRoot.lastElementChild);
  }
  connectedCallback() {
    this.shadowRoot.querySelector("slot").addEventListener("slotchange", () => this.start());
    this.start();
  }
  disconnectedCallback() {
    this.updater.stop();
  }
  start() {
    this.updater.start(this.firstElementChild);
  }
};
if ("ResizeObserver" in window) {
  window.customElements.define("scroll-shadow", ScrollShadow);
}

// js/custom-element/behavior/share-toggle-button.js
var ShareToggleButton = class extends ToggleButton {
  _onButtonClick() {
    if (window.matchMedia(window.themeVariables.breakpoints.phone).matches && navigator.share) {
      navigator.share({
        title: this.hasAttribute("share-title") ? this.getAttribute("share-title") : document.title,
        url: this.hasAttribute("share-url") ? this.getAttribute("share-url") : window.location.href
      });
    } else {
      super._onButtonClick();
    }
  }
};
window.customElements.define("share-toggle-button", ShareToggleButton, { extends: "button" });

// js/custom-element/ui/carousel.js
var NativeCarousel = class extends CustomHTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll("native-carousel-item"));
    this.pageDotsElements = Array.from(this.querySelectorAll("page-dots"));
    this.prevNextButtonsElements = Array.from(this.querySelectorAll("prev-next-buttons"));
    if (this.items.length > 1) {
      this.addEventListener("prev-next:prev", this.prev.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index, true));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => this.select(event.target.index, !event.detail.load));
      }
    }
    const scrollerElement = this.items[0].parentElement;
    this.intersectionObserver = new IntersectionObserver(this._onVisibilityChanged.bind(this), { root: scrollerElement, rootMargin: `${scrollerElement.clientHeight}px 0px`, threshold: 0.8 });
    this.items.forEach((item) => this.intersectionObserver.observe(item));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.intersectionObserver.disconnect();
  }
  get selectedIndex() {
    return this.items.findIndex((item) => item.selected);
  }
  prev(shouldAnimate = true) {
    this.select(Math.max(this.selectedIndex - 1, 0), shouldAnimate);
  }
  next(shouldAnimate = true) {
    this.select(Math.min(this.selectedIndex + 1, this.items.length - 1), shouldAnimate);
  }
  select(index, shouldAnimate = true) {
    const clampIndex = Math.max(0, Math.min(index, this.items.length));
    const selectedElement = this.items[clampIndex];
    this._adjustNavigationForElement(selectedElement);
    if (shouldAnimate) {
      this.items.forEach((item) => this.intersectionObserver.unobserve(item));
      setInterval(() => {
        this.items.forEach((item) => this.intersectionObserver.observe(item));
      }, 800);
    }
    this.items.forEach((item, loopIndex) => item.selected = loopIndex === clampIndex);
    const direction = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
    selectedElement.parentElement.scrollTo({ left: direction * (selectedElement.clientWidth * clampIndex), behavior: shouldAnimate ? "smooth" : "auto" });
  }
  _adjustNavigationForElement(selectedElement) {
    this.items.forEach((item) => item.selected = selectedElement === item);
    this.pageDotsElements.forEach((pageDot) => pageDot.selectedIndex = selectedElement.index);
    this.prevNextButtonsElements.forEach((prevNextButton) => {
      prevNextButton.isPrevDisabled = selectedElement.index === 0;
      prevNextButton.isNextDisabled = selectedElement.index === this.items.length - 1;
    });
  }
  _onVisibilityChanged(entries) {
    for (let entry of entries) {
      if (entry.isIntersecting) {
        this._adjustNavigationForElement(entry.target);
        break;
      }
    }
  }
};
var NativeCarouselItem = class extends CustomHTMLElement {
  static get observedAttributes() {
    return ["hidden"];
  }
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  set selected(value) {
    this.hidden = !value;
  }
};
window.customElements.define("native-carousel-item", NativeCarouselItem);
window.customElements.define("native-carousel", NativeCarousel);

// js/custom-element/ui/drag-cursor.js
var DragCursor = class extends HTMLElement {
  connectedCallback() {
    this.scrollableElement = this.parentElement;
    this.scrollableElement.addEventListener("mouseenter", this._onMouseEnter.bind(this));
    this.scrollableElement.addEventListener("mousemove", this._onMouseMove.bind(this));
    this.scrollableElement.addEventListener("mouseleave", this._onMouseLeave.bind(this));
    this.innerHTML = `
      <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <path d="M0 60C0 26.863 26.863 0 60 0s60 26.863 60 60-26.863 60-60 60S0 93.137 0 60z" fill="rgb(var(--text-color))"/>
        <path d="M46 50L36 60l10 10M74 50l10 10-10 10" stroke="rgb(var(--section-background))" stroke-width="4"/>
      </svg>
    `;
  }
  _onMouseEnter(event) {
    this.removeAttribute("hidden");
    this._positionCursor(event);
  }
  _onMouseLeave() {
    this.setAttribute("hidden", "");
  }
  _onMouseMove(event) {
    this.toggleAttribute("hidden", event.target.tagName === "BUTTON" || event.target.tagName === "A");
    this._positionCursor(event);
  }
  _positionCursor(event) {
    const elementBoundingRect = this.scrollableElement.getBoundingClientRect();
    const x = event.clientX - elementBoundingRect.x;
    const y = event.clientY - elementBoundingRect.y;
    this.style.transform = `translate(${x - this.clientWidth / 2}px, ${y - this.clientHeight / 2}px)`;
  }
};
window.customElements.define("drag-cursor", DragCursor);

// js/custom-element/ui/scrollable-content.js
var ScrollableContent = class extends CustomHTMLElement {
  connectedCallback() {
    if (this.draggable) {
      this._setupDraggability();
    }
    this._checkScrollability();
    window.addEventListener("resize", this._checkScrollability.bind(this));
    this.addEventListener("scroll", throttle(this._calculateProgress.bind(this), 15));
  }
  get draggable() {
    return this.hasAttribute("draggable");
  }
  _setupDraggability() {
    this.insertAdjacentHTML("afterend", '<drag-cursor hidden class="custom-drag-cursor"></drag-cursor>');
    const mediaQuery = matchMedia("(hover: none)");
    mediaQuery.addListener(this._onMediaChanges.bind(this));
    if (!mediaQuery.matches) {
      this._attachDraggableListeners();
    }
  }
  _attachDraggableListeners() {
    this.delegate.on("mousedown", this._onMouseDown.bind(this));
    this.delegate.on("mousemove", this._onMouseMove.bind(this));
    this.delegate.on("mouseup", this._onMouseUp.bind(this));
  }
  _removeDraggableListeners() {
    this.delegate.off("mousedown");
    this.delegate.off("mousemove");
    this.delegate.off("mouseup");
  }
  _checkScrollability() {
    this.classList.toggle("is-scrollable", this.scrollWidth > this.offsetWidth);
  }
  _calculateProgress() {
    const scrollLeft = this.scrollLeft * (window.themeVariables.settings.direction === "ltr" ? 1 : -1);
    const progress = Math.max(0, Math.min(1, scrollLeft / (this.scrollWidth - this.clientWidth))) * 100;
    triggerEvent(this, "scrollable-content:progress", { progress });
  }
  _onMediaChanges(event) {
    if (!event.matches) {
      this._attachDraggableListeners();
    } else {
      this._removeDraggableListeners();
    }
  }
  _onMouseDown(event) {
    if (event.target && event.target.nodeName === "IMG") {
      event.preventDefault();
    }
    this.startX = event.clientX + this.scrollLeft;
    this.diffX = 0;
    this.drag = true;
  }
  _onMouseMove(event) {
    if (this.drag) {
      this.diffX = this.startX - (event.clientX + this.scrollLeft);
      this.scrollLeft += this.diffX;
    }
  }
  _onMouseUp() {
    this.drag = false;
    let start = 1;
    let animate = () => {
      let step = Math.sinh(start);
      if (step <= 0) {
        window.cancelAnimationFrame(animate);
      } else {
        this.scrollLeft += this.diffX * step;
        start -= 0.03;
        window.requestAnimationFrame(animate);
      }
    };
    animate();
  }
};
window.customElements.define("scrollable-content", ScrollableContent);

// js/custom-element/ui/loading-bar.js
var LoadingBar = class extends CustomHTMLElement {
  constructor() {
    super();
    this.rootDelegate.on("theme:loading:start", this.show.bind(this));
    this.rootDelegate.on("theme:loading:end", this.hide.bind(this));
    this.delegate.on("transitionend", this._onTransitionEnd.bind(this));
  }
  show() {
    this.classList.add("is-visible");
    this.style.transform = "scaleX(0.4)";
  }
  hide() {
    this.style.transform = "scaleX(1)";
    this.classList.add("is-finished");
  }
  _onTransitionEnd(event) {
    if (event.propertyName === "transform" && this.classList.contains("is-finished")) {
      this.classList.remove("is-visible");
      this.classList.remove("is-finished");
      this.style.transform = "scaleX(0)";
    }
  }
};
window.customElements.define("loading-bar", LoadingBar);

// js/custom-element/ui/split-lines.js
var SplitLines = class extends HTMLElement {
  connectedCallback() {
    this.originalContent = this.textContent;
    this.lastWidth = window.innerWidth;
    this.hasBeenSplitted = false;
    window.addEventListener("resize", this._onResize.bind(this));
  }
  [Symbol.asyncIterator]() {
    return {
      splitPromise: this.split.bind(this),
      index: 0,
      async next() {
        const lines = await this.splitPromise();
        if (this.index !== lines.length) {
          return { done: false, value: lines[this.index++] };
        } else {
          return { done: true };
        }
      }
    };
  }
  split(force = false) {
    if (this.childElementCount > 0 && !force) {
      return Promise.resolve(Array.from(this.children));
    }
    this.hasBeenSplitted = true;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        this.innerHTML = this.originalContent.replace(/./g, "<span>$&</span>").replace(/\s/g, " ");
        const bounds = {};
        Array.from(this.children).forEach((child) => {
          const rect = parseInt(child.getBoundingClientRect().top);
          bounds[rect] = (bounds[rect] || "") + child.textContent;
        });
        this.innerHTML = Object.values(bounds).map(
          (item) => `<span ${this.hasAttribute("reveal") && !force ? "reveal" : ""} ${this.hasAttribute("reveal-visibility") && !force ? "reveal-visibility" : ""} style="display: block">${item.trim()}</span>`
        ).join("");
        this.style.opacity = this.hasAttribute("reveal") ? 1 : null;
        this.style.visibility = this.hasAttribute("reveal-visibility") ? "visible" : null;
        resolve(Array.from(this.children));
      });
    });
  }
  async _onResize() {
    if (this.lastWidth === window.innerWidth || !this.hasBeenSplitted) {
      return;
    }
    await this.split(true);
    this.dispatchEvent(new CustomEvent("split-lines:re-split", { bubbles: true }));
    this.lastWidth = window.innerWidth;
  }
};
window.customElements.define("split-lines", SplitLines);

// js/custom-element/ui/popover.js
var PopoverContent = class extends OpenableElement {
  connectedCallback() {
    super.connectedCallback();
    this.delegate.on("click", ".popover__overlay", () => this.open = false);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        document.documentElement.classList.toggle("lock-mobile", this.open);
    }
  }
};
window.customElements.define("popover-content", PopoverContent);

// js/custom-element/ui/tabs-nav.js
var TabsNav = class extends HTMLElement {
  connectedCallback() {
    this.buttons = Array.from(this.querySelectorAll("button[aria-controls]"));
    this.scrollerElement = this.querySelector(".tabs-nav__scroller");
    this.buttons.forEach((button) => button.addEventListener("click", () => this.selectButton(button)));
    this.addEventListener("shopify:block:select", (event) => this.selectButton(event.target, !event.detail.load));
    this.positionElement = document.createElement("span");
    this.positionElement.classList.add("tabs-nav__position");
    this.buttons[0].parentElement.insertAdjacentElement("afterend", this.positionElement);
    window.addEventListener("resize", this._onWindowResized.bind(this));
    this._adjustNavigationPosition();
    if (this.hasArrows) {
      this._handleArrows();
    }
  }
  get hasArrows() {
    return this.hasAttribute("arrows");
  }
  get selectedTabIndex() {
    return this.buttons.findIndex((button) => button.getAttribute("aria-expanded") === "true");
  }
  get selectedButton() {
    return this.buttons.find((button) => button.getAttribute("aria-expanded") === "true");
  }
  selectButton(button, animate = true) {
    if (!this.buttons.includes(button) || this.selectedButton === button) {
      return;
    }
    const from = document.getElementById(this.selectedButton.getAttribute("aria-controls")), to = document.getElementById(button.getAttribute("aria-controls"));
    if (animate) {
      this._transitionContent(from, to);
    } else {
      from.hidden = true;
      to.hidden = false;
    }
    this.selectedButton.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-expanded", "true");
    triggerEvent(this, "tabs-nav:changed", { button });
    this._adjustNavigationPosition();
  }
  addButton(button) {
    button.addEventListener("click", () => this.selectButton(button));
    button.setAttribute("aria-expanded", "false");
    this.buttons[this.buttons.length - 1].insertAdjacentElement("afterend", button);
    this.buttons.push(button);
    this._adjustNavigationPosition(false);
  }
  _transitionContent(from, to) {
    from.animate({
      opacity: [1, 0]
    }, {
      duration: 250,
      easing: "ease"
    }).onfinish = () => {
      from.hidden = true;
      to.hidden = false;
      to.animate({
        opacity: [0, 1]
      }, {
        duration: 250,
        easing: "ease"
      });
    };
  }
  _onWindowResized() {
    this._adjustNavigationPosition();
  }
  _adjustNavigationPosition(shouldAnimate = true) {
    const scale = this.selectedButton.clientWidth / this.positionElement.parentElement.clientWidth, translate = this.selectedButton.offsetLeft / this.positionElement.parentElement.clientWidth / scale, windowHalfWidth = this.scrollerElement.clientWidth / 2;
    this.scrollerElement.scrollTo({
      behavior: shouldAnimate ? "smooth" : "auto",
      left: this.selectedButton.offsetLeft - windowHalfWidth + this.selectedButton.clientWidth / 2
    });
    if (!shouldAnimate) {
      this.positionElement.style.transition = "none";
    }
    this.positionElement.style.setProperty("--scale", scale);
    this.positionElement.style.setProperty("--translate", `${translate * 100}%`);
    this.positionElement.clientWidth;
    requestAnimationFrame(() => {
      this.positionElement.classList.add("is-initialized");
      this.positionElement.style.transition = null;
    });
  }
  /**
   * When the tabs nav can have lot of tab items (for instance on product page), the custom element can add
   * extra arrows to make navigation easier
   */
  _handleArrows() {
    const arrowsContainer = this.querySelector(".tabs-nav__arrows");
    arrowsContainer.firstElementChild.addEventListener("click", () => {
      this.selectButton(this.buttons[Math.max(this.selectedTabIndex - 1, 0)]);
    });
    arrowsContainer.lastElementChild.addEventListener("click", () => {
      this.selectButton(this.buttons[Math.min(this.selectedTabIndex + 1, this.buttons.length - 1)]);
    });
  }
};
window.customElements.define("tabs-nav", TabsNav);

// js/helper/library-loader.js
var LibraryLoader = class {
  static load(libraryName) {
    const STATUS_REQUESTED = "requested", STATUS_LOADED = "loaded";
    const library = this.libraries[libraryName];
    if (!library) {
      return;
    }
    if (library.status === STATUS_REQUESTED) {
      return library.promise;
    }
    if (library.status === STATUS_LOADED) {
      return Promise.resolve();
    }
    let promise;
    if (library.type === "script") {
      promise = new Promise((resolve, reject) => {
        let tag = document.createElement("script");
        tag.id = library.tagId;
        tag.src = library.src;
        tag.onerror = reject;
        tag.onload = () => {
          library.status = STATUS_LOADED;
          resolve();
        };
        document.body.appendChild(tag);
      });
    } else {
      promise = new Promise((resolve, reject) => {
        let tag = document.createElement("link");
        tag.id = library.tagId;
        tag.href = library.src;
        tag.rel = "stylesheet";
        tag.type = "text/css";
        tag.onerror = reject;
        tag.onload = () => {
          library.status = STATUS_LOADED;
          resolve();
        };
        document.body.appendChild(tag);
      });
    }
    library.promise = promise;
    library.status = STATUS_REQUESTED;
    return promise;
  }
};
__publicField(LibraryLoader, "libraries", {
  flickity: {
    tagId: "flickity",
    src: window.themeVariables.libs.flickity,
    type: "script"
  },
  photoswipe: {
    tagId: "photoswipe",
    src: window.themeVariables.libs.photoswipe,
    type: "script"
  },
  qrCode: {
    tagId: "qrCode",
    src: window.themeVariables.libs.qrCode,
    type: "script"
  },
  modelViewerUiStyles: {
    tagId: "shopify-model-viewer-ui-styles",
    src: "https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css",
    type: "link"
  }
});

// js/custom-element/ui/qr-code.js
var QrCode = class extends HTMLElement {
  async connectedCallback() {
    await LibraryLoader.load("qrCode");
    new window.QRCode(this, {
      text: this.getAttribute("identifier"),
      width: 200,
      height: 200
    });
  }
};
window.customElements.define("qr-code", QrCode);

// js/custom-element/ui/country-selector.js
var CountrySelector = class extends HTMLSelectElement {
  connectedCallback() {
    this.provinceElement = document.getElementById(this.getAttribute("aria-owns"));
    this.addEventListener("change", this._updateProvinceVisibility.bind(this));
    if (this.hasAttribute("data-default")) {
      for (let i = 0; i !== this.options.length; ++i) {
        if (this.options[i].text === this.getAttribute("data-default")) {
          this.selectedIndex = i;
          break;
        }
      }
    }
    this._updateProvinceVisibility();
    const provinceSelectElement = this.provinceElement.tagName === "SELECT" ? this.provinceElement : this.provinceElement.querySelector("select");
    if (provinceSelectElement.hasAttribute("data-default")) {
      for (let i = 0; i !== provinceSelectElement.options.length; ++i) {
        if (provinceSelectElement.options[i].text === provinceSelectElement.getAttribute("data-default")) {
          provinceSelectElement.selectedIndex = i;
          break;
        }
      }
    }
  }
  _updateProvinceVisibility() {
    const selectedOption = this.options[this.selectedIndex];
    if (!selectedOption) {
      return;
    }
    let provinces = JSON.parse(selectedOption.getAttribute("data-provinces") || "[]"), provinceSelectElement = this.provinceElement.tagName === "SELECT" ? this.provinceElement : this.provinceElement.querySelector("select");
    provinceSelectElement.innerHTML = "";
    if (provinces.length === 0) {
      this.provinceElement.hidden = true;
      return;
    }
    provinces.forEach((data) => {
      provinceSelectElement.options.add(new Option(data[1], data[0]));
    });
    this.provinceElement.hidden = false;
  }
};
window.customElements.define("country-selector", CountrySelector, { extends: "select" });

// js/custom-element/ui/modal.js
var ModalContent = class extends OpenableElement {
  connectedCallback() {
    super.connectedCallback();
    if (this.appearAfterDelay && !(this.onlyOnce && this.hasAppearedOnce)) {
      setTimeout(() => this.open = true, this.apparitionDelay);
    }
    this.delegate.on("click", ".modal__overlay", () => this.open = false);
  }
  get appearAfterDelay() {
    return this.hasAttribute("apparition-delay");
  }
  get apparitionDelay() {
    return parseInt(this.getAttribute("apparition-delay") || 0) * 1e3;
  }
  get onlyOnce() {
    return this.hasAttribute("only-once");
  }
  get hasAppearedOnce() {
    return localStorage.getItem("theme:popup-appeared") !== null;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        document.documentElement.classList.toggle("lock-all", this.open);
        if (this.open) {
          localStorage.setItem("theme:popup-appeared", true);
        }
    }
  }
};
window.customElements.define("modal-content", ModalContent);

// js/custom-element/ui/price-range.js
var PriceRange = class extends HTMLElement {
  connectedCallback() {
    this.rangeLowerBound = this.querySelector(".price-range__range-group input:first-child");
    this.rangeHigherBound = this.querySelector(".price-range__range-group input:last-child");
    this.textInputLowerBound = this.querySelector(".price-range__input:first-child input");
    this.textInputHigherBound = this.querySelector(".price-range__input:last-child input");
    this.textInputLowerBound.addEventListener("focus", () => this.textInputLowerBound.select());
    this.textInputHigherBound.addEventListener("focus", () => this.textInputHigherBound.select());
    this.textInputLowerBound.addEventListener("change", (event) => {
      event.target.value = Math.max(Math.min(parseInt(event.target.value), parseInt(this.textInputHigherBound.value || event.target.max) - 1), event.target.min);
      this.rangeLowerBound.value = event.target.value;
      this.rangeLowerBound.parentElement.style.setProperty("--range-min", `${parseInt(this.rangeLowerBound.value) / parseInt(this.rangeLowerBound.max) * 100}%`);
    });
    this.textInputHigherBound.addEventListener("change", (event) => {
      event.target.value = Math.min(Math.max(parseInt(event.target.value), parseInt(this.textInputLowerBound.value || event.target.min) + 1), event.target.max);
      this.rangeHigherBound.value = event.target.value;
      this.rangeHigherBound.parentElement.style.setProperty("--range-max", `${parseInt(this.rangeHigherBound.value) / parseInt(this.rangeHigherBound.max) * 100}%`);
    });
    this.rangeLowerBound.addEventListener("change", (event) => {
      this.textInputLowerBound.value = event.target.value;
      this.textInputLowerBound.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.rangeHigherBound.addEventListener("change", (event) => {
      this.textInputHigherBound.value = event.target.value;
      this.textInputHigherBound.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.rangeLowerBound.addEventListener("input", (event) => {
      triggerEvent(this, "facet:abort-loading");
      event.target.value = Math.min(parseInt(event.target.value), parseInt(this.textInputHigherBound.value || event.target.max) - 1);
      event.target.parentElement.style.setProperty("--range-min", `${parseInt(event.target.value) / parseInt(event.target.max) * 100}%`);
      this.textInputLowerBound.value = event.target.value;
    });
    this.rangeHigherBound.addEventListener("input", (event) => {
      triggerEvent(this, "facet:abort-loading");
      event.target.value = Math.max(parseInt(event.target.value), parseInt(this.textInputLowerBound.value || event.target.min) + 1);
      event.target.parentElement.style.setProperty("--range-max", `${parseInt(event.target.value) / parseInt(event.target.max) * 100}%`);
      this.textInputHigherBound.value = event.target.value;
    });
  }
};
window.customElements.define("price-range", PriceRange);

// js/custom-element/ui/link-bar.js
var LinkBar = class extends HTMLElement {
  connectedCallback() {
    const selectedItem = this.querySelector(".link-bar__link-item--selected");
    if (selectedItem) {
      requestAnimationFrame(() => {
        selectedItem.style.scrollSnapAlign = "none";
      });
    }
  }
};
window.customElements.define("link-bar", LinkBar);

// js/helper/media-features.js
var MediaFeatures = class {
  static prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  static supportsHover() {
    return window.matchMedia("(pointer: fine)").matches;
  }
};

// js/custom-element/ui/flickity-carousel.js
var FlickityCarousel = class extends CustomHTMLElement {
  constructor() {
    super();
    if (this.childElementCount === 1) {
      return;
    }
    this.addEventListener("flickity:ready", this._preloadNextImage.bind(this));
    this.addEventListener("flickity:slide-changed", this._preloadNextImage.bind(this));
    this._createFlickity();
  }
  async disconnectedCallback() {
    if (this.flickity) {
      const flickityInstance = await this.flickity;
      flickityInstance.destroy();
    }
  }
  get flickityConfig() {
    return JSON.parse(this.getAttribute("flickity-config"));
  }
  get flickityInstance() {
    return this.flickity;
  }
  async next() {
    (await this.flickityInstance).next();
  }
  async previous() {
    (await this.flickityInstance).previous();
  }
  async select(indexOrSelector) {
    (await this.flickityInstance).selectCell(indexOrSelector);
  }
  async setDraggable(draggable) {
    const flickityInstance = await this.flickity;
    flickityInstance.options.draggable = draggable;
    flickityInstance.updateDraggable();
  }
  async reload() {
    const flickityInstance = await this.flickity;
    flickityInstance.destroy();
    if (this.flickityConfig["cellSelector"]) {
      Array.from(this.children).sort((a, b) => parseInt(a.getAttribute("data-original-position")) > parseInt(b.getAttribute("data-original-position")) ? 1 : -1).forEach((node) => this.appendChild(node));
    }
    this._createFlickity();
  }
  async _createFlickity() {
    this.flickity = new Promise(async (resolve) => {
      await LibraryLoader.load("flickity");
      await this.untilVisible({ rootMargin: "400px", threshold: 0 });
      const flickityInstance = new window.ThemeFlickity(this, { ...this.flickityConfig, ...{
        rightToLeft: window.themeVariables.settings.direction === "rtl",
        accessibility: MediaFeatures.supportsHover(),
        // Flickity cause the carousel to scroll when focused, which is annoying on mobile
        on: {
          ready: (event) => triggerEvent(this, "flickity:ready", event),
          change: (event) => triggerEvent(this, "flickity:slide-changed", event),
          settle: (event) => triggerEvent(this, "flickity:slide-settled", event)
        }
      } });
      resolve(flickityInstance);
    });
    if (this.hasAttribute("click-nav")) {
      const flickityInstance = await this.flickityInstance;
      flickityInstance.on("staticClick", this._onStaticClick.bind(this));
      this.addEventListener("mousemove", this._onMouseMove.bind(this));
    }
  }
  /**
   * If the "click-nav" option is passed, desktop device can switch from one slide to the other
   */
  async _onStaticClick(event, pointer, cellElement) {
    const flickityInstance = await this.flickityInstance, isVideoOrModelType = flickityInstance.selectedElement.hasAttribute("data-media-type") && ["video", "external_video", "model"].includes(flickityInstance.selectedElement.getAttribute("data-media-type"));
    if (!cellElement || isVideoOrModelType || window.matchMedia(window.themeVariables.breakpoints.phone).matches) {
      return;
    }
    const flickityViewport = flickityInstance.viewport, boundingRect = flickityViewport.getBoundingClientRect(), halfEdge = Math.floor(boundingRect.right - boundingRect.width / 2);
    if (pointer.clientX > halfEdge) {
      flickityInstance.next();
    } else {
      flickityInstance.previous();
    }
  }
  /**
   * Add the class "is-hovering-right" or "is-hovering-left" depending on the part we're hovering
   */
  async _onMouseMove(event) {
    const flickityInstance = await this.flickityInstance, isVideoOrModelType = flickityInstance.selectedElement.hasAttribute("data-media-type") && ["video", "external_video", "model"].includes(flickityInstance.selectedElement.getAttribute("data-media-type"));
    this.classList.toggle("is-hovering-right", event.offsetX > this.clientWidth / 2 && !isVideoOrModelType);
    this.classList.toggle("is-hovering-left", event.offsetX <= this.clientWidth / 2 && !isVideoOrModelType);
  }
  /**
   * To give a feeling of faster browsing, we always preload the next image once we settle on a slide
   */
  async _preloadNextImage() {
    const flickityInstance = await this.flickity;
    if (flickityInstance.selectedElement.nextElementSibling) {
      flickityInstance.selectedElement.nextElementSibling.querySelector("img")?.setAttribute("loading", "eager");
    }
  }
};
window.customElements.define("flickity-carousel", FlickityCarousel);

// js/helper/dom.js
function getSiblings(element, filter, includeSelf = false) {
  let siblings = [];
  let currentElement = element;
  while (currentElement = currentElement.previousElementSibling) {
    if (!filter || currentElement.matches(filter)) {
      siblings.push(currentElement);
    }
  }
  if (includeSelf) {
    siblings.push(element);
  }
  currentElement = element;
  while (currentElement = currentElement.nextElementSibling) {
    if (!filter || currentElement.matches(filter)) {
      siblings.push(currentElement);
    }
  }
  return siblings;
}
async function resolveAsyncIterator(target) {
  const processedTarget = [];
  if (!(target != null && typeof target[Symbol.iterator] === "function")) {
    target = [target];
  }
  for (const targetItem of target) {
    if (typeof targetItem[Symbol.asyncIterator] === "function") {
      for await (const awaitTarget of targetItem) {
        processedTarget.push(awaitTarget);
      }
    } else {
      processedTarget.push(targetItem);
    }
  }
  return processedTarget;
}

// js/custom-element/ui/flickity-controls.js
var FlickityControls = class extends CustomHTMLElement {
  async connectedCallback() {
    this.flickityCarousel.addEventListener("flickity:ready", this._onSlideChanged.bind(this, false));
    this.flickityCarousel.addEventListener("flickity:slide-changed", this._onSlideChanged.bind(this, true));
    this.delegate.on("click", '[data-action="prev"]', () => this.flickityCarousel.previous());
    this.delegate.on("click", '[data-action="next"]', () => this.flickityCarousel.next());
    this.delegate.on("click", '[data-action="select"]', (event, target) => this.flickityCarousel.select(`#${target.getAttribute("aria-controls")}`));
  }
  get flickityCarousel() {
    return this._flickityCarousel = this._flickityCarousel || document.getElementById(this.getAttribute("controls"));
  }
  async _onSlideChanged(animate = true) {
    let flickityInstance = await this.flickityCarousel.flickityInstance, activeItems = Array.from(this.querySelectorAll(`[aria-controls="${flickityInstance.selectedElement.id}"]`));
    activeItems.forEach((activeItem) => {
      activeItem.setAttribute("aria-current", "true");
      getSiblings(activeItem).forEach((sibling) => sibling.removeAttribute("aria-current"));
      requestAnimationFrame(() => {
        if (activeItem.offsetParent && activeItem.offsetParent !== this) {
          const windowHalfHeight = activeItem.offsetParent.clientHeight / 2, windowHalfWidth = activeItem.offsetParent.clientWidth / 2;
          activeItem.offsetParent.scrollTo({
            behavior: animate ? "smooth" : "auto",
            top: activeItem.offsetTop - windowHalfHeight + activeItem.clientHeight / 2,
            left: activeItem.offsetLeft - windowHalfWidth + activeItem.clientWidth / 2
          });
        }
      });
    });
  }
};
window.customElements.define("flickity-controls", FlickityControls);

// js/custom-element/ui/external-video.js
var ExternalVideo = class extends CustomHTMLElement {
  /**
   * This must be done in the constructor and not connectedCallback because the element will be re-added
   * at run-time by Flickity
   */
  constructor() {
    super();
    this.hasLoaded = false;
    (async () => {
      if (this.autoPlay) {
        await this.untilVisible({ rootMargin: "300px", threshold: 0 });
        this.play();
      } else {
        this.addEventListener("click", this.play.bind(this), { once: true });
      }
    })();
  }
  get autoPlay() {
    return this.hasAttribute("autoplay");
  }
  get provider() {
    return this.getAttribute("provider");
  }
  async play() {
    if (!this.hasLoaded) {
      await this._setupPlayer();
    }
    if (this.provider === "youtube") {
      setTimeout(() => {
        this.querySelector("iframe").contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: "" }), "*");
      }, 150);
    } else if (this.provider === "vimeo") {
      this.querySelector("iframe").contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
    }
  }
  pause() {
    if (!this.hasLoaded) {
      return;
    }
    if (this.provider === "youtube") {
      this.querySelector("iframe").contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: "" }), "*");
    } else if (this.provider === "vimeo") {
      this.querySelector("iframe").contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
    }
  }
  _setupPlayer() {
    if (this._setupPromise) {
      return this._setupPromise;
    }
    return this._setupPromise = new Promise((resolve) => {
      const template2 = this.querySelector("template"), node = template2.content.firstElementChild.cloneNode(true);
      node.onload = () => {
        this.hasLoaded = true;
        resolve();
      };
      if (this.autoPlay) {
        template2.replaceWith(node);
      } else {
        this.innerHTML = "";
        this.appendChild(node);
      }
    });
  }
};
window.customElements.define("external-video", ExternalVideo);

// js/helper/product-loader.js
var ProductLoader = class {
  static load(productHandle) {
    if (!productHandle) {
      return;
    }
    if (this.loadedProducts[productHandle]) {
      return this.loadedProducts[productHandle];
    }
    this.loadedProducts[productHandle] = new Promise(async (resolve) => {
      const response = await fetch(`${window.themeVariables.routes.rootUrlWithoutSlash}/products/${productHandle}.js`);
      const responseAsJson = await response.json();
      resolve(responseAsJson);
    });
    return this.loadedProducts[productHandle];
  }
};
__publicField(ProductLoader, "loadedProducts", {});

// js/custom-element/ui/model-media.js
var ModelMedia = class extends HTMLElement {
  /**
   * This must be done in the constructor and not connectedCallback because the element will be re-added
   * at run-time by Flickity
   */
  constructor() {
    super();
    LibraryLoader.load("modelViewerUiStyles");
    window.Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: this._setupShopifyXr.bind(this)
      },
      {
        name: "model-viewer-ui",
        version: "1.0",
        onLoad: () => {
          this.modelUi = new window.Shopify.ModelViewerUI(this.firstElementChild, { focusOnPlay: false });
          const modelViewer = this.querySelector("model-viewer");
          modelViewer.addEventListener("shopify_model_viewer_ui_toggle_play", () => {
            modelViewer.dispatchEvent(new CustomEvent("model:played", { bubbles: true }));
          });
          modelViewer.addEventListener("shopify_model_viewer_ui_toggle_pause", () => {
            modelViewer.dispatchEvent(new CustomEvent("model:paused", { bubbles: true }));
          });
        }
      }
    ]);
  }
  disconnectedCallback() {
    this.modelUi?.destroy();
  }
  play() {
    if (this.modelUi) {
      this.modelUi.play();
    }
  }
  pause() {
    if (this.modelUi) {
      this.modelUi.pause();
    }
  }
  async _setupShopifyXr() {
    if (!window.ShopifyXR) {
      document.addEventListener("shopify_xr_initialized", this._setupShopifyXr.bind(this));
    } else {
      const product = await ProductLoader.load(this.getAttribute("product-handle"));
      const models = product["media"].filter((media) => media["media_type"] === "model");
      window.ShopifyXR.addModels(models);
      window.ShopifyXR.setupXRElements();
    }
  }
};
window.customElements.define("model-media", ModelMedia);

// js/custom-element/ui/native-video.js
var NativeVideo = class extends HTMLElement {
  /**
   * This must be done in the constructor and not connectedCallback because the element will be re-added
   * at run-time by Flickity
   */
  constructor() {
    super();
    this.hasLoaded = false;
    if (this.autoPlay) {
      this.play();
    } else {
      this.addEventListener("click", this.play.bind(this), { once: true });
    }
  }
  get autoPlay() {
    return this.hasAttribute("autoplay");
  }
  play() {
    if (!this.hasLoaded) {
      this._replaceContent();
    }
    this.querySelector("video").play();
  }
  pause() {
    if (this.hasLoaded) {
      this.querySelector("video").pause();
    }
  }
  _replaceContent() {
    let node = this.querySelector("template");
    if (!node) {
      return;
    }
    node = node.content.firstElementChild.cloneNode(true);
    if (!this.hasAttribute("autoplay")) {
      this.innerHTML = "";
    }
    this.appendChild(node);
    this.firstElementChild.addEventListener("play", () => {
      this.dispatchEvent(new CustomEvent("video:played", { bubbles: true }));
    });
    this.firstElementChild.addEventListener("pause", () => {
      this.dispatchEvent(new CustomEvent("video:paused", { bubbles: true }));
    });
    this.hasLoaded = true;
  }
};
window.customElements.define("native-video", NativeVideo);

// js/custom-element/ui/combo-box.js
var ComboBox = class extends OpenableElement {
  connectedCallback() {
    super.connectedCallback();
    this.options = Array.from(this.querySelectorAll('[role="option"]'));
    this.delegate.on("click", '[role="option"]', this._onValueClicked.bind(this));
    this.delegate.on("keydown", '[role="listbox"]', this._onKeyDown.bind(this));
    this.delegate.on("change", "select", this._onValueChanged.bind(this));
    this.delegate.on("click", ".combo-box__overlay", () => this.open = false);
    if (this.hasAttribute("fit-toggle")) {
      const maxWidth = Math.max(...this.options.map((item) => item.clientWidth)), control = document.querySelector(`[aria-controls="${this.id}"]`);
      if (control) {
        control.style.setProperty("--largest-option-width", `${maxWidth + 2}px`);
      }
    }
  }
  get nativeSelect() {
    return this.querySelector("select");
  }
  set selectedValue(value) {
    this.options.forEach((option) => {
      option.setAttribute("aria-selected", option.getAttribute("value") === value ? "true" : "false");
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        if (this.open) {
          const boundingRect = this.getBoundingClientRect();
          this.classList.toggle("combo-box--top", boundingRect.top >= window.innerHeight / 2 * 1.5);
          setTimeout(() => this.focusTrap.activate(), 150);
        } else {
          this.focusTrap.deactivate();
          setTimeout(() => this.classList.remove("combo-box--top"), 200);
        }
        document.documentElement.classList.toggle("lock-mobile", this.open);
    }
  }
  // Called when the option of the custom select is clicked
  _onValueClicked(event, target) {
    this.selectedValue = target.value;
    this.nativeSelect.value = target.value;
    this.nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    this.open = false;
  }
  // Called when the option of the underlying native select is changed (for instance by external code)
  _onValueChanged(event, target) {
    Array.from(this.nativeSelect.options).forEach((option) => option.toggleAttribute("selected", target.value === option.value));
    this.selectedValue = target.value;
  }
  // Improves accessibility with arrow up/down
  _onKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (event.key === "ArrowDown") {
        document.activeElement.nextElementSibling?.focus();
      } else {
        document.activeElement.previousElementSibling?.focus();
      }
    }
  }
};
window.customElements.define("combo-box", ComboBox);

// js/custom-element/ui/quantity-selector.js
var QuantitySelector = class extends CustomHTMLElement {
  connectedCallback() {
    this.inputElement = this.querySelector("input");
    this.delegate.on("click", "button:first-child", () => this.inputElement.quantity = this.inputElement.quantity - 1);
    this.delegate.on("click", "button:last-child", () => this.inputElement.quantity = this.inputElement.quantity + 1);
  }
};
window.customElements.define("quantity-selector", QuantitySelector);

// js/custom-element/ui/input-number.js
var InputNumber = class extends HTMLInputElement {
  connectedCallback() {
    this.addEventListener("input", this._onValueInput.bind(this));
    this.addEventListener("change", this._onValueChanged.bind(this));
    this.addEventListener("keydown", this._onKeyDown.bind(this));
  }
  get quantity() {
    return parseInt(this.value);
  }
  set quantity(quantity) {
    const isNumeric = (typeof quantity === "number" || typeof quantity === "string" && quantity.trim() !== "") && !isNaN(quantity);
    if (quantity === "") {
      return;
    }
    if (!isNumeric || quantity < 0) {
      quantity = parseInt(quantity) || 1;
    }
    this.value = Math.max(this.min || 1, Math.min(quantity, this.max || Number.MAX_VALUE)).toString();
    this.size = Math.max(this.value.length + 1, 2);
  }
  _onValueInput() {
    this.quantity = this.value;
  }
  _onValueChanged() {
    if (this.value === "") {
      this.quantity = 1;
    }
  }
  _onKeyDown(event) {
    event.stopPropagation();
    if (event.key === "ArrowUp") {
      this.quantity = this.quantity + 1;
    } else if (event.key === "ArrowDown") {
      this.quantity = this.quantity - 1;
    }
  }
};
window.customElements.define("input-number", InputNumber, { extends: "input" });

// js/custom-element/section/announcement-bar/announcement-bar.js
var AnnouncementBar = class extends CustomHTMLElement {
  async connectedCallback() {
    await customElements.whenDefined("announcement-bar-item");
    this.items = Array.from(this.querySelectorAll("announcement-bar-item"));
    this.hasPendingTransition = false;
    this.delegate.on("click", '[data-action="prev"]', this.previous.bind(this));
    this.delegate.on("click", '[data-action="next"]', this.next.bind(this));
    if (this.autoPlay) {
      this.delegate.on("announcement-bar:content:open", this._pausePlayer.bind(this));
      this.delegate.on("announcement-bar:content:close", this._startPlayer.bind(this));
    }
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this._updateCustomProperties.bind(this));
      this.resizeObserver.observe(this);
    }
    if (this.autoPlay) {
      this._startPlayer();
    }
    if (Shopify.designMode) {
      this.delegate.on("shopify:block:select", (event) => this.select(event.target.index, false));
    }
  }
  get autoPlay() {
    return this.hasAttribute("auto-play");
  }
  get selectedIndex() {
    return this.items.findIndex((item) => item.selected);
  }
  previous() {
    this.select((this.selectedIndex - 1 + this.items.length) % this.items.length);
  }
  next() {
    this.select((this.selectedIndex + 1 + this.items.length) % this.items.length);
  }
  async select(index, animate = true) {
    if (this.selectedIndex === index || this.hasPendingTransition) {
      return;
    }
    if (this.autoPlay) {
      this._pausePlayer();
    }
    this.hasPendingTransition = true;
    await this.items[this.selectedIndex].deselect(animate);
    await this.items[index].select(animate);
    this.hasPendingTransition = false;
    if (this.autoPlay) {
      this._startPlayer();
    }
  }
  _pausePlayer() {
    clearInterval(this._interval);
  }
  _startPlayer() {
    clearInterval(this._interval);
    this._interval = setInterval(this.next.bind(this), parseInt(this.getAttribute("cycle-speed")) * 1e3);
  }
  _updateCustomProperties(entries) {
    entries.forEach((entry) => {
      if (entry.target === this) {
        const height = entry.borderBoxSize ? entry.borderBoxSize.length > 0 ? entry.borderBoxSize[0].blockSize : entry.borderBoxSize.blockSize : entry.target.clientHeight;
        document.documentElement.style.setProperty("--announcement-bar-height", `${height}px`);
      }
    });
  }
};
window.customElements.define("announcement-bar", AnnouncementBar);

// js/custom-element/section/announcement-bar/item.js
var AnnouncementBarItem = class extends CustomHTMLElement {
  connectedCallback() {
    if (this.hasContent) {
      this.contentElement = this.querySelector(".announcement-bar__content");
      this.delegate.on("click", '[data-action="open-content"]', this.openContent.bind(this));
      this.delegate.on("click", '[data-action="close-content"]', this.closeContent.bind(this));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", this.openContent.bind(this));
        this.addEventListener("shopify:block:deselect", this.closeContent.bind(this));
      }
    }
  }
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get hasContent() {
    return this.hasAttribute("has-content");
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  get focusTrap() {
    return this._trapFocus = this._trapFocus || createFocusTrap(this.contentElement.querySelector(".announcement-bar__content-inner"), {
      fallbackFocus: this,
      clickOutsideDeactivates: (event) => !(event.target.tagName === "BUTTON"),
      allowOutsideClick: (event) => event.target.tagName === "BUTTON",
      onDeactivate: this.closeContent.bind(this),
      preventScroll: true
    });
  }
  async select(animate = true) {
    this.removeAttribute("hidden");
    await new Promise((resolve) => {
      this.animate({
        transform: ["translateY(8px)", "translateY(0)"],
        opacity: [0, 1]
      }, {
        duration: animate ? 150 : 0,
        easing: "ease-in-out"
      }).onfinish = resolve;
    });
  }
  async deselect(animate = true) {
    await this.closeContent();
    await new Promise((resolve) => {
      this.animate({
        transform: ["translateY(0)", "translateY(-8px)"],
        opacity: [1, 0]
      }, {
        duration: animate ? 150 : 0,
        easing: "ease-in-out"
      }).onfinish = resolve;
    });
    this.setAttribute("hidden", "");
  }
  async openContent() {
    if (this.hasContent) {
      this.contentElement.addEventListener("transitionend", () => this.focusTrap.activate(), { once: true });
      this.contentElement.removeAttribute("hidden");
      document.documentElement.classList.add("lock-all");
      this.dispatchEvent(new CustomEvent("announcement-bar:content:open", { bubbles: true }));
    }
  }
  async closeContent() {
    if (!this.hasContent || this.contentElement.hasAttribute("hidden")) {
      return Promise.resolve();
    }
    await new Promise((resolve) => {
      this.contentElement.addEventListener("transitionend", () => resolve(), { once: true });
      this.contentElement.setAttribute("hidden", "");
      this.focusTrap.deactivate();
      document.documentElement.classList.remove("lock-all");
      this.dispatchEvent(new CustomEvent("announcement-bar:content:close", { bubbles: true }));
    });
  }
};
window.customElements.define("announcement-bar-item", AnnouncementBarItem);

// js/custom-element/section/search/search-page.js
var SearchPage = class extends HTMLElement {
  connectedCallback() {
    this.facetToolbar = document.getElementById("mobile-facet-toolbar");
    this.tabsNav = document.getElementById("search-tabs-nav");
    this.tabsNav.addEventListener("tabs-nav:changed", this._onCategoryChanged.bind(this));
    this._completeSearch();
  }
  get terms() {
    return this.getAttribute("terms");
  }
  get completeFor() {
    return this.getAttribute("complete-for").split(",");
  }
  async _completeSearch() {
    const promisesList = [];
    this.completeFor.forEach((item) => {
      promisesList.push(fetch(`${window.themeVariables.routes.searchUrl}?section_id=${this.getAttribute("section-id")}&q=${this.terms}&type=${item}&options[prefix]=last&options[unavailable_products]=${window.themeVariables.settings.searchUnavailableProducts}`));
    });
    const responses = await Promise.all(promisesList);
    await Promise.all(responses.map(async (response) => {
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const categoryResultDiv = div.querySelector(".main-search__category-result"), tabNavItem = div.querySelector("#search-tabs-nav .tabs-nav__item");
      if (categoryResultDiv) {
        categoryResultDiv.setAttribute("hidden", "");
        this.insertAdjacentElement("beforeend", categoryResultDiv);
        this.tabsNav.addButton(tabNavItem);
      }
    }));
  }
  _onCategoryChanged(event) {
    const button = event.detail.button;
    this.facetToolbar.classList.toggle("is-collapsed", button.getAttribute("data-type") !== "product");
  }
};
window.customElements.define("search-page", SearchPage);

// js/custom-element/section/footer/cookie-bar.js
var CookieBar = class extends CustomHTMLElement {
  connectedCallback() {
    if (window.Shopify && window.Shopify.designMode) {
      this.rootDelegate.on("shopify:section:select", (event) => filterShopifyEvent(event, this, () => this.open = true));
      this.rootDelegate.on("shopify:section:deselect", (event) => filterShopifyEvent(event, this, () => this.open = false));
    }
    this.delegate.on("click", '[data-action~="accept-policy"]', this._acceptPolicy.bind(this));
    this.delegate.on("click", '[data-action~="decline-policy"]', this._declinePolicy.bind(this));
    window.Shopify.loadFeatures([{
      name: "consent-tracking-api",
      version: "0.1",
      onLoad: this._onCookieBarSetup.bind(this)
    }]);
  }
  set open(value) {
    this.toggleAttribute("hidden", !value);
  }
  _onCookieBarSetup() {
    if (window.Shopify.customerPrivacy.shouldShowGDPRBanner()) {
      this.open = true;
    }
  }
  _acceptPolicy() {
    window.Shopify.customerPrivacy.setTrackingConsent(true, () => this.open = false);
  }
  _declinePolicy() {
    window.Shopify.customerPrivacy.setTrackingConsent(false, () => this.open = false);
  }
};
window.customElements.define("cookie-bar", CookieBar);

// js/custom-element/section/product-recommendations/product-recommendations.js
var ProductRecommendations = class extends HTMLElement {
  async connectedCallback() {
    const response = await fetch(`${window.themeVariables.routes.productRecommendationsUrl}?product_id=${this.productId}&limit=${this.recommendationsCount}&section_id=${this.sectionId}&intent=${this.intent}`);
    const div = document.createElement("div");
    div.innerHTML = await response.text();
    const productRecommendationsElement = div.querySelector("product-recommendations");
    if (productRecommendationsElement.hasChildNodes()) {
      this.innerHTML = productRecommendationsElement.innerHTML;
    } else {
      if (this.intent === "complementary") {
        this.remove();
      }
    }
  }
  get productId() {
    return this.getAttribute("product-id");
  }
  get sectionId() {
    return this.getAttribute("section-id");
  }
  get recommendationsCount() {
    return parseInt(this.getAttribute("recommendations-count") || 4);
  }
  get intent() {
    return this.getAttribute("intent");
  }
};
window.customElements.define("product-recommendations", ProductRecommendations);

// js/custom-element/section/product-recommendations/recently-viewed-products.js
var RecentlyViewedProducts = class extends HTMLElement {
  async connectedCallback() {
    if (this.searchQueryString === "") {
      return;
    }
    const response = await fetch(`${window.themeVariables.routes.searchUrl}?type=product&q=${this.searchQueryString}&section_id=${this.sectionId}`);
    const div = document.createElement("div");
    div.innerHTML = await response.text();
    const recentlyViewedProductsElement = div.querySelector("recently-viewed-products");
    if (recentlyViewedProductsElement.hasChildNodes()) {
      this.innerHTML = recentlyViewedProductsElement.innerHTML;
    }
  }
  get searchQueryString() {
    const items = JSON.parse(localStorage.getItem("theme:recently-viewed-products") || "[]");
    if (this.hasAttribute("exclude-product-id") && items.includes(parseInt(this.getAttribute("exclude-product-id")))) {
      items.splice(items.indexOf(parseInt(this.getAttribute("exclude-product-id"))), 1);
    }
    return items.map((item) => "id:" + item).slice(0, this.productsCount).join(" OR ");
  }
  get sectionId() {
    return this.getAttribute("section-id");
  }
  get productsCount() {
    return this.getAttribute("products-count") || 4;
  }
};
window.customElements.define("recently-viewed-products", RecentlyViewedProducts);

// js/helper/image.js
function getSizedMediaUrl(media, size) {
  let src = typeof media === "string" ? media : media["preview_image"] ? media["preview_image"]["src"] : media["url"];
  if (size === null) {
    return src;
  }
  if (size === "master") {
    return src.replace(/http(s)?:/, "");
  }
  const match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif|webp)(\?v=\d+)?$/i);
  if (match) {
    const prefix = src.split(match[0]);
    const suffix = match[0];
    return (prefix[0] + "_" + size + suffix).replace(/http(s)?:/, "");
  } else {
    return null;
  }
}
function getMediaSrcset(media, sizeList) {
  let srcset = [], supportedSizes = typeof media === "string" ? sizeList : getSupportedSizes(media, sizeList);
  supportedSizes.forEach((supportedSize) => {
    srcset.push(`${getSizedMediaUrl(media, supportedSize + "x")} ${supportedSize}w`);
  });
  return srcset.join(",");
}
function getSupportedSizes(media, desiredSizes) {
  let supportedSizes = [], mediaWidth = media["preview_image"]["width"];
  desiredSizes.forEach((width) => {
    if (mediaWidth >= width) {
      supportedSizes.push(width);
    }
  });
  return supportedSizes;
}
function imageLoaded(image) {
  return new Promise((resolve) => {
    if (!image || image.tagName !== "IMG" || image.complete) {
      resolve();
    } else {
      image.onload = () => resolve();
    }
  });
}

// js/helper/animation.js
var CustomAnimation = class {
  constructor(effect) {
    this._effect = effect;
    this._playState = "idle";
    this._finished = Promise.resolve();
  }
  get finished() {
    return this._finished;
  }
  get animationEffects() {
    return this._effect instanceof CustomKeyframeEffect ? [this._effect] : this._effect.animationEffects;
  }
  cancel() {
    this.animationEffects.forEach((animationEffect) => animationEffect.cancel());
  }
  finish() {
    this.animationEffects.forEach((animationEffect) => animationEffect.finish());
  }
  play() {
    this._playState = "running";
    this._effect.play();
    this._finished = this._effect.finished;
    this._finished.then(() => {
      this._playState = "finished";
    }, (rejection) => {
      this._playState = "idle";
    });
  }
};
var CustomKeyframeEffect = class {
  constructor(target, keyframes, options = {}) {
    if (!target) {
      return;
    }
    if ("Animation" in window) {
      this._animation = new Animation(new KeyframeEffect(target, keyframes, options));
    } else {
      options["fill"] = "forwards";
      this._animation = target.animate(keyframes, options);
      this._animation.pause();
    }
    this._animation.addEventListener("finish", () => {
      target.style.opacity = keyframes.hasOwnProperty("opacity") ? keyframes["opacity"][keyframes["opacity"].length - 1] : null;
      target.style.visibility = keyframes.hasOwnProperty("visibility") ? keyframes["visibility"][keyframes["visibility"].length - 1] : null;
    });
  }
  get finished() {
    if (!this._animation) {
      return Promise.resolve();
    }
    return this._animation.finished ? this._animation.finished : new Promise((resolve) => this._animation.onfinish = resolve);
  }
  play() {
    if (this._animation) {
      this._animation.startTime = null;
      this._animation.play();
    }
  }
  cancel() {
    if (this._animation) {
      this._animation.cancel();
    }
  }
  finish() {
    if (this._animation) {
      this._animation.finish();
    }
  }
};
var GroupEffect = class {
  constructor(childrenEffects) {
    this._childrenEffects = childrenEffects;
    this._finished = Promise.resolve();
  }
  get finished() {
    return this._finished;
  }
  get animationEffects() {
    return this._childrenEffects.flatMap((effect) => {
      return effect instanceof CustomKeyframeEffect ? effect : effect.animationEffects;
    });
  }
};
var ParallelEffect = class extends GroupEffect {
  play() {
    const promises = [];
    for (const effect of this._childrenEffects) {
      effect.play();
      promises.push(effect.finished);
    }
    this._finished = Promise.all(promises);
  }
};
var SequenceEffect = class extends GroupEffect {
  play() {
    this._finished = new Promise(async (resolve, reject) => {
      try {
        for (const effect of this._childrenEffects) {
          effect.play();
          await effect.finished;
        }
        resolve();
      } catch (exception) {
        reject();
      }
    });
  }
};

// js/custom-element/section/slideshow/slideshow-item.js
var SlideshowItem = class extends HTMLElement {
  async connectedCallback() {
    this._pendingAnimations = [];
    this.addEventListener("split-lines:re-split", (event) => {
      Array.from(event.target.children).forEach((line) => line.style.visibility = this.selected ? "visible" : "hidden");
    });
    if (MediaFeatures.prefersReducedMotion()) {
      this.setAttribute("reveal-visibility", "");
      Array.from(this.querySelectorAll("[reveal], [reveal-visibility]")).forEach((item) => {
        item.removeAttribute("reveal");
        item.removeAttribute("reveal-visibility");
      });
    }
  }
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  async transitionToLeave(transitionType, shouldAnimate = true) {
    if (transitionType !== "reveal") {
      this.setAttribute("hidden", "");
    }
    this._pendingAnimations.forEach((animation2) => animation2.cancel());
    this._pendingAnimations = [];
    let animation = null, textElements = await resolveAsyncIterator(this.querySelectorAll("split-lines, .button-group, .button-wrapper")), imageElements = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
    switch (transitionType) {
      case "sweep":
        animation = new CustomAnimation(new SequenceEffect([
          new CustomKeyframeEffect(this, { visibility: ["visible", "hidden"] }, { duration: 500 }),
          new ParallelEffect(textElements.map((item) => {
            return new CustomKeyframeEffect(item, { opacity: [1, 0], visibility: ["visible", "hidden"] });
          }))
        ]));
        break;
      case "fade":
        animation = new CustomAnimation(new CustomKeyframeEffect(this, { opacity: [1, 0], visibility: ["visible", "hidden"] }, { duration: 250, easing: "ease-in-out" }));
        break;
      case "reveal":
        animation = new CustomAnimation(new SequenceEffect([
          new ParallelEffect(textElements.reverse().map((item) => {
            return new CustomKeyframeEffect(item, { opacity: [1, 0], visibility: ["visible", "hidden"] }, { duration: 250, easing: "ease-in-out" });
          })),
          new ParallelEffect(imageElements.map((item) => {
            if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
              return new CustomKeyframeEffect(item, { visibility: ["visible", "hidden"], clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"] }, { duration: 450, easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)" });
            } else {
              return new CustomKeyframeEffect(item, { visibility: ["visible", "hidden"], clipPath: ["inset(0 0 0 0)", "inset(100% 0 0 0)"] }, { duration: 450, easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)" });
            }
          }))
        ]));
        break;
    }
    await this._executeAnimation(animation, shouldAnimate);
    if (transitionType === "reveal") {
      this.setAttribute("hidden", "");
    }
  }
  async transitionToEnter(transitionType, shouldAnimate = true, reverseDirection = false) {
    this.removeAttribute("hidden");
    await this._untilReady();
    let animation = null, textElements = await resolveAsyncIterator(this.querySelectorAll("split-lines, .button-group, .button-wrapper")), imageElements = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
    switch (transitionType) {
      case "sweep":
        animation = new CustomAnimation(new SequenceEffect([
          new CustomKeyframeEffect(this, { visibility: ["hidden", "visible"], clipPath: reverseDirection ? ["inset(0 100% 0 0)", "inset(0 0 0 0)"] : ["inset(0 0 0 100%)", "inset(0 0 0 0)"] }, { duration: 500, easing: "cubic-bezier(1, 0, 0, 1)" }),
          new ParallelEffect(textElements.map((item, index) => {
            return new CustomKeyframeEffect(item, { opacity: [0, 1], visibility: ["hidden", "visible"], clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"], transform: ["translateY(100%)", "translateY(0)"] }, { duration: 450, delay: 100 * index, easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)" });
          }))
        ]));
        break;
      case "fade":
        animation = new CustomAnimation(new CustomKeyframeEffect(this, { opacity: [0, 1], visibility: ["hidden", "visible"] }, { duration: 250, easing: "ease-in-out" }));
        break;
      case "reveal":
        animation = new CustomAnimation(new SequenceEffect([
          new ParallelEffect(imageElements.map((item) => {
            if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
              return new CustomKeyframeEffect(item, { visibility: ["hidden", "visible"], clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"] }, { duration: 450, delay: 100, easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)" });
            } else {
              return new CustomKeyframeEffect(item, { visibility: ["hidden", "visible"], clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"] }, { duration: 450, delay: 100, easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)" });
            }
          })),
          new ParallelEffect(textElements.map((item, index) => {
            return new CustomKeyframeEffect(item, { opacity: [0, 1], visibility: ["hidden", "visible"], clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"], transform: ["translateY(100%)", "translateY(0)"] }, { duration: 450, delay: 100 * index, easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)" });
          }))
        ]));
        break;
    }


    // custome video block code start
    //console.log(this);
    if(this.querySelector('.slideshow__video-wrapper')){
      //console.log(this.querySelectorAll('.slideshow__video-wrapper').length);
      this.querySelectorAll('.slideshow__video-wrapper').forEach((videoWrapper) => {
        //console.log('offsetParent: ',videoWrapper.offsetParent);
        // console.log(videoWrapper);
        if(videoWrapper.offsetParent){
          // console.log('playing');
          var videoEl = videoWrapper.querySelector('video')
          var videoduration = videoEl.duration;
          this.closest('.shopify-section--slideshow').style.setProperty('--section-autoplay-duration', `${videoduration}s`);
          videoEl.currentTime = 0;
          videoEl.play();
        } else {
          // console.log('stop');
          var videoEl = videoWrapper.querySelector('video')
          videoEl.pause();
          videoEl.currentTime = 0;      
        }
      });
      // custome video block code end
    } else {
      var slideshowEl = this.closest('.shopify-section--slideshow');
      slideshowEl.style.setProperty('--section-autoplay-duration', ``);
    }



    return this._executeAnimation(animation, shouldAnimate);
  }
  async _executeAnimation(animation, shouldAnimate) {
    this._pendingAnimations.push(animation);
    shouldAnimate ? animation.play() : animation.finish();
    return animation.finished;
  }
  async _untilReady() {
    return Promise.all(this._getVisibleImages().map((image) => imageLoaded(image)));
  }
  _preloadImages() {
    this._getVisibleImages().forEach((image) => {
      image.setAttribute("loading", "eager");
    });
  }
  _getVisibleImages() {
    return Array.from(this.querySelectorAll("img")).filter((image) => {
      return getComputedStyle(image.parentElement).display !== "none";
    });
  }
};
window.customElements.define("slide-show-item", SlideshowItem);

// js/mixin/vertical-scroll-blocker.js
var VerticalScrollBlockerMixin = {
  _blockVerticalScroll(threshold = 18) {
    this.addEventListener("touchstart", (event) => {
      this.firstTouchClientX = event.touches[0].clientX;
    });
    this.addEventListener("touchmove", (event) => {
      const touchClientX = event.touches[0].clientX - this.firstTouchClientX;
      if (Math.abs(touchClientX) > threshold) {
        event.preventDefault();
      }
    }, { passive: false });
  }
};

// js/custom-element/section/slideshow/slideshow.js
var Slideshow = class extends CustomHTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll("slide-show-item"));
    this.pageDots = this.querySelector("page-dots");
    this.isTransitioning = false;
    if (this.items.length > 1) {
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:deselect", this.startPlayer.bind(this));
        this.addEventListener("shopify:block:select", (event) => {
          this.pausePlayer();
          this.intersectionObserver.disconnect();
          if (!(!event.detail.load && event.target.selected)) {
            this.select(event.target.index, !event.detail.load);
          }
        });
      }
      this.addEventListener("swiperight", this.previous.bind(this));
      this.addEventListener("swipeleft", this.next.bind(this));
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index));
      this._blockVerticalScroll();
    }
    this._setupVisibility();
  }
  get selectedIndex() {
    return this.items.findIndex((item) => item.selected);
  }
  get transitionType() {
    return MediaFeatures.prefersReducedMotion() ? "fade" : this.getAttribute("transition-type");
  }
  async _setupVisibility() {
    await this.untilVisible();
    await this.items[this.selectedIndex].transitionToEnter(this.transitionType).catch((error) => {
    });
    this.startPlayer();
  }
  previous() {
    this.select((this.selectedIndex - 1 + this.items.length) % this.items.length, true, true);
  }
  next() {
    this.select((this.selectedIndex + 1 + this.items.length) % this.items.length, true, false);
  }
  async select(index, shouldTransition = true, reverseDirection = false) {
    if (this.transitionType === "reveal" && this.isTransitioning) {
      return;
    }
    this.isTransitioning = true;
    const previousItem = this.items[this.selectedIndex], newItem = this.items[index];
    this.items[(newItem.index + 1) % this.items.length]._preloadImages();
    if (previousItem && previousItem !== newItem) {
      if (this.transitionType !== "reveal") {
        previousItem.transitionToLeave(this.transitionType, shouldTransition);
      } else {
        await previousItem.transitionToLeave(this.transitionType, shouldTransition);
      }
    }
    if (this.pageDots) {
      this.pageDots.selectedIndex = newItem.index;
    }
    await newItem.transitionToEnter(this.transitionType, shouldTransition, reverseDirection).catch((error) => {
    });
    this.isTransitioning = false;
  }
  pausePlayer() {
    this.style.setProperty("--section-animation-play-state", "paused");
  }
  startPlayer() {
    if (this.hasAttribute("auto-play")) {
      this.style.setProperty("--section-animation-play-state", "running");
    }
  }
};
Object.assign(Slideshow.prototype, VerticalScrollBlockerMixin);
window.customElements.define("slide-show", Slideshow);

// js/custom-element/section/image-with-text/image-with-text-item.js
var ImageWithTextItem = class extends HTMLElement {
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  get hasAttachedImage() {
    return this.hasAttribute("attached-image");
  }
  async transitionToEnter(shouldAnimate = true) {
    this.removeAttribute("hidden");
    const textWrapper = this.querySelector(".image-with-text__text-wrapper"), headings = await resolveAsyncIterator(this.querySelectorAll(".image-with-text__content split-lines"));
    const animation = new CustomAnimation(new SequenceEffect([
      new ParallelEffect(headings.map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 0.2, 1],
          transform: ["translateY(100%)", "translateY(0)"],
          clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"]
        }, {
          duration: 350,
          delay: 120 * index,
          easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)"
        });
      })),
      new CustomKeyframeEffect(textWrapper, { opacity: [0, 1] }, { duration: 300 })
    ]));
    shouldAnimate ? animation.play() : animation.finish();
    return animation.finished;
  }
  async transitionToLeave(shouldAnimate = true) {
    const elements = await resolveAsyncIterator(this.querySelectorAll(".image-with-text__text-wrapper, .image-with-text__content split-lines"));
    const animation = new CustomAnimation(new ParallelEffect(elements.map((item) => {
      return new CustomKeyframeEffect(item, { opacity: [1, 0] }, { duration: 200 });
    })));
    shouldAnimate ? animation.play() : animation.finish();
    await animation.finished;
    this.setAttribute("hidden", "");
  }
};
window.customElements.define("image-with-text-item", ImageWithTextItem);

// js/custom-element/section/image-with-text/image-with-text.js
var ImageWithText = class extends CustomHTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll("image-with-text-item"));
    this.imageItems = Array.from(this.querySelectorAll(".image-with-text__image"));
    this.pageDots = this.querySelector("page-dots");
    this.hasPendingTransition = false;
    if (this.items.length > 1) {
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:deselect", this.startPlayer.bind(this));
        this.addEventListener("shopify:block:select", (event) => {
          this.intersectionObserver.disconnect();
          this.pausePlayer();
          this.select(event.target.index, !event.detail.load);
        });
      }
    }
    this._setupVisibility();
  }
  async _setupVisibility() {
    await this.untilVisible();
    if (this.hasAttribute("reveal-on-scroll")) {
      await this.transitionImage(this.selectedIndex);
      this.select(this.selectedIndex);
    }
    this.startPlayer();
  }
  get selectedIndex() {
    return this.items.findIndex((item) => item.selected);
  }
  async select(index, shouldAnimate = true) {
    if (this.hasPendingTransition) {
      return;
    }
    this.hasPendingTransition = true;
    if (this.items[index].hasAttachedImage || !shouldAnimate) {
      await this.transitionImage(index, shouldAnimate);
    }
    if (this.selectedIndex !== index) {
      await this.items[this.selectedIndex].transitionToLeave(shouldAnimate);
    }
    if (this.pageDots) {
      this.pageDots.selectedIndex = index;
    }
    await this.items[index].transitionToEnter(shouldAnimate);
    this.hasPendingTransition = false;
  }
  async transitionImage(index, shouldAnimate = true) {
    const activeImage = this.imageItems.find((item) => !item.hasAttribute("hidden")), nextImage = this.imageItems.find((item) => item.id === this.items[index].getAttribute("attached-image")) || activeImage;
    activeImage.setAttribute("hidden", "");
    nextImage.removeAttribute("hidden");
    await imageLoaded(nextImage);
    const animation = new CustomAnimation(new CustomKeyframeEffect(nextImage, {
      visibility: ["hidden", "visible"],
      clipPath: ["inset(0 0 0 100%)", "inset(0 0 0 0)"]
    }, {
      duration: 600,
      easing: "cubic-bezier(1, 0, 0, 1)"
    }));
    shouldAnimate ? animation.play() : animation.finish();
  }
  pausePlayer() {
    this.style.setProperty("--section-animation-play-state", "paused");
  }
  startPlayer() {
    this.style.setProperty("--section-animation-play-state", "running");
  }
};
window.customElements.define("image-with-text", ImageWithText);

// js/custom-element/section/testimonials/testimonial-item.js
var TestimonialItem = class extends CustomHTMLElement {
  connectedCallback() {
    this.addEventListener("split-lines:re-split", (event) => {
      Array.from(event.target.children).forEach((line) => line.style.visibility = this.selected ? "visible" : "hidden");
    });
  }
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  async transitionToLeave(shouldAnimate = true) {
    const textLines = await resolveAsyncIterator(this.querySelectorAll("split-lines, .testimonial__author")), animation = new CustomAnimation(new ParallelEffect(textLines.reverse().map((item, index) => {
      return new CustomKeyframeEffect(item, {
        visibility: ["visible", "hidden"],
        clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
        transform: ["translateY(0)", "translateY(100%)"]
      }, {
        duration: 350,
        delay: 60 * index,
        easing: "cubic-bezier(0.68, 0.00, 0.77, 0.00)"
      });
    })));
    shouldAnimate ? animation.play() : animation.finish();
    await animation.finished;
    this.setAttribute("hidden", "");
  }
  async transitionToEnter(shouldAnimate = true) {
    const textLines = await resolveAsyncIterator(this.querySelectorAll("split-lines, .testimonial__author")), animation = new CustomAnimation(new ParallelEffect(textLines.map((item, index) => {
      return new CustomKeyframeEffect(item, {
        visibility: ["hidden", "visible"],
        clipPath: ["inset(0 0 100% 0)", "inset(0 0 0px 0)"],
        transform: ["translateY(100%)", "translateY(0)"]
      }, {
        duration: 550,
        delay: 120 * index,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)"
      });
    })));
    this.removeAttribute("hidden");
    shouldAnimate ? animation.play() : animation.finish();
    return animation.finished;
  }
};
window.customElements.define("testimonial-item", TestimonialItem);

// js/custom-element/section/testimonials/testimonial-list.js
var TestimonialList = class extends CustomHTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll("testimonial-item"));
    this.pageDots = this.querySelector("page-dots");
    this.hasPendingTransition = false;
    if (this.items.length > 1) {
      this.addEventListener("swiperight", this.previous.bind(this));
      this.addEventListener("swipeleft", this.next.bind(this));
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => {
          this.intersectionObserver?.disconnect();
          if (event.detail.load || !event.target.selected) {
            this.select(event.target.index, !event.detail.load);
          }
        });
      }
      this._blockVerticalScroll();
    }
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  get selectedIndex() {
    return this.items.findIndex((item) => item.selected);
  }
  async _setupVisibility() {
    await this.untilVisible();
    this.items[this.selectedIndex].transitionToEnter();
  }
  previous() {
    this.select((this.selectedIndex - 1 + this.items.length) % this.items.length);
  }
  next() {
    this.select((this.selectedIndex + 1 + this.items.length) % this.items.length);
  }
  async select(index, shouldAnimate = true) {
    if (this.hasPendingTransition) {
      return;
    }
    this.hasPendingTransition = true;
    await this.items[this.selectedIndex].transitionToLeave(shouldAnimate);
    if (this.pageDots) {
      this.pageDots.selectedIndex = index;
    }
    await this.items[index].transitionToEnter(shouldAnimate);
    this.hasPendingTransition = false;
  }
};
Object.assign(TestimonialList.prototype, VerticalScrollBlockerMixin);
window.customElements.define("testimonial-list", TestimonialList);

// js/custom-element/section/shop-the-look/shop-the-look-item.js
var ShopTheLookItem = class extends HTMLElement {
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  async transitionToLeave(shouldAnimate = true) {
    this.setAttribute("hidden", "");
    const animation = new CustomAnimation(new CustomKeyframeEffect(this, { visibility: ["visible", "hidden"] }, { duration: 500 }));
    shouldAnimate ? animation.play() : animation.finish();
    return animation.finished;
  }
  async transitionToEnter(shouldAnimate = true) {
    this.removeAttribute("hidden");
    const dots = Array.from(this.querySelectorAll(".shop-the-look__dot"));
    dots.forEach((dot) => dot.style.opacity = 0);
    const animation = new CustomAnimation(new SequenceEffect([
      new ParallelEffect(Array.from(this.querySelectorAll(".shop-the-look__image")).map((item) => {
        return new CustomKeyframeEffect(item, { opacity: [1, 1] }, { duration: 0 });
      })),
      new CustomKeyframeEffect(this, { visibility: ["hidden", "visible"], zIndex: [0, 1], clipPath: ["inset(0 0 0 100%)", "inset(0 0 0 0)"] }, { duration: 500, easing: "cubic-bezier(1, 0, 0, 1)" }),
      new ParallelEffect(dots.map((item, index) => {
        return new CustomKeyframeEffect(item, { opacity: [0, 1], transform: ["scale(0)", "scale(1)"] }, { duration: 120, delay: 75 * index, easing: "ease-in-out" });
      }))
    ]));
    shouldAnimate ? animation.play() : animation.finish();
    await animation.finished;
    if (window.matchMedia(window.themeVariables.breakpoints.tabletAndUp).matches) {
      const firstPopover = this.querySelector(".shop-the-look__product-wrapper .shop-the-look__dot");
      firstPopover?.setAttribute("aria-expanded", "true");
    }
  }
};
window.customElements.define("shop-the-look-item", ShopTheLookItem);

// js/custom-element/section/shop-the-look/shop-the-look-nav.js
var ShopTheLookNav = class extends CustomHTMLElement {
  connectedCallback() {
    this.shopTheLook = this.closest("shop-the-look");
    this.inTransition = false;
    this.pendingTransition = false;
    this.pendingTransitionTo = null;
    this.delegate.on("click", '[data-action="prev"]', () => this.shopTheLook.previous());
    this.delegate.on("click", '[data-action="next"]', () => this.shopTheLook.next());
  }
  transitionToIndex(selectedIndex, nextIndex, shouldAnimate = true) {
    const indexElements = Array.from(this.querySelectorAll(".shop-the-look__counter-page-transition")), currentElement = indexElements[selectedIndex], nextElement = indexElements[nextIndex];
    if (this.inTransition) {
      this.pendingTransition = true;
      this.pendingTransitionTo = nextIndex;
      return;
    }
    this.inTransition = true;
    currentElement.animate({ transform: ["translateY(0)", "translateY(-100%)"] }, { duration: shouldAnimate ? 1e3 : 0, easing: "cubic-bezier(1, 0, 0, 1)" }).onfinish = () => {
      currentElement.setAttribute("hidden", "");
      this.inTransition = false;
      if (this.pendingTransition && this.pendingTransitionTo !== nextIndex) {
        this.pendingTransition = false;
        this.transitionToIndex(nextIndex, this.pendingTransitionTo, shouldAnimate);
        this.pendingTransitionTo = null;
      }
    };
    nextElement.removeAttribute("hidden");
    nextElement.animate({ transform: ["translateY(100%)", "translateY(0)"] }, { duration: shouldAnimate ? 1e3 : 0, easing: "cubic-bezier(1, 0, 0, 1)" });
  }
};
window.customElements.define("shop-the-look-nav", ShopTheLookNav);

// js/custom-element/section/shop-the-look/shop-the-look.js
var ShopTheLook = class extends CustomHTMLElement {
  connectedCallback() {
    this.lookItems = Array.from(this.querySelectorAll("shop-the-look-item"));
    this.nav = this.querySelector("shop-the-look-nav");
    this.hasPendingTransition = false;
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
    if (this.lookItems.length > 1 && Shopify.designMode) {
      this.addEventListener("shopify:block:select", async (event) => {
        this.intersectionObserver.disconnect();
        await this.select(event.target.index, !event.detail.load);
        this.nav.animate({ opacity: [0, 1], transform: ["translateY(30px)", "translateY(0)"] }, { duration: 0, fill: "forwards", easing: "ease-in-out" });
      });
    }
  }
  get selectedIndex() {
    return this.lookItems.findIndex((item) => item.selected);
  }
  async _setupVisibility() {
    await this.untilVisible();
    const images = Array.from(this.lookItems[this.selectedIndex].querySelectorAll(".shop-the-look__image"));
    for (let image of images) {
      if (image.offsetParent !== null) {
        await imageLoaded(image);
      }
    }
    await this.lookItems[this.selectedIndex].transitionToEnter();
    if (this.nav) {
      this.nav.animate({ opacity: [0, 1], transform: ["translateY(30px)", "translateY(0)"] }, { duration: 150, fill: "forwards", easing: "ease-in-out" });
    }
  }
  previous() {
    this.select((this.selectedIndex - 1 + this.lookItems.length) % this.lookItems.length);
  }
  next() {
    this.select((this.selectedIndex + 1 + this.lookItems.length) % this.lookItems.length);
  }
  async select(index, animate = true) {
    const currentLook = this.lookItems[this.selectedIndex], nextLook = this.lookItems[index];
    if (this.hasPendingTransition) {
      return;
    }
    this.hasPendingTransition = true;
    if (currentLook !== nextLook) {
      this.nav.transitionToIndex(this.selectedIndex, index, animate);
      currentLook.transitionToLeave();
    }
    nextLook.transitionToEnter(animate);
    this.hasPendingTransition = false;
  }
};
window.customElements.define("shop-the-look", ShopTheLook);

// js/custom-element/section/collection-list/collection-list.js
var CollectionList = class extends CustomHTMLElement {
  async connectedCallback() {
    this.items = Array.from(this.querySelectorAll(".list-collections__item"));
    if (this.hasAttribute("scrollable")) {
      this.scroller = this.querySelector(".list-collections__scroller");
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      this.addEventListener("shopify:block:select", (event) => event.target.scrollIntoView({ block: "nearest", inline: "center", behavior: event.detail.load ? "auto" : "smooth" }));
    }
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  async _setupVisibility() {
    await this.untilVisible();
    const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
    const animation = new CustomAnimation(new ParallelEffect(this.items.map((item, index) => {
      return new SequenceEffect([
        new CustomKeyframeEffect(item.querySelector(".list-collections__item-image"), {
          opacity: [0, 1],
          transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"]
        }, {
          duration: 250,
          delay: prefersReducedMotion ? 0 : 150 * index,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)"
        }),
        new ParallelEffect(Array.from(item.querySelectorAll(".list-collections__item-info [reveal]")).map((textItem, subIndex) => {
          return new CustomKeyframeEffect(textItem, {
            opacity: [0, 1],
            clipPath: [`inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`, "inset(0 0 0 0)"],
            transform: [`translateY(${prefersReducedMotion ? 0 : "100%"})`, "translateY(0)"]
          }, {
            duration: 200,
            delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
            easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)"
          });
        }))
      ]);
    })));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
  previous() {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
    this.scroller.scrollBy({
      left: -this.items[0].clientWidth * directionFlip,
      behavior: "smooth"
    });
  }
  next() {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
    this.scroller.scrollBy({
      left: this.items[0].clientWidth * directionFlip,
      behavior: "smooth"
    });
  }
};
window.customElements.define("collection-list", CollectionList);

// js/custom-element/section/product-list/product-list.js
var ProductList = class extends CustomHTMLElement {
  constructor() {
    super();
    this.productListInner = this.querySelector(".product-list__inner");
    this.productItems = Array.from(this.querySelectorAll("product-item"));
  }
  connectedCallback() {
    this.addEventListener("prev-next:prev", this.previous.bind(this));
    this.addEventListener("prev-next:next", this.next.bind(this));
    if (!this.hidden && this.staggerApparition) {
      this._staggerProductsApparition();
    }
  }
  get staggerApparition() {
    return this.hasAttribute("stagger-apparition");
  }
  get apparitionAnimation() {
    return this._animation = this._animation || new CustomAnimation(new ParallelEffect(this.productItems.map((item, index) => {
      return new CustomKeyframeEffect(item, {
        opacity: [0, 1],
        transform: [`translateY(${MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60}px)`, "translateY(0)"]
      }, {
        duration: 600,
        delay: MediaFeatures.prefersReducedMotion() ? 0 : 100 * index - Math.min(3 * index * index, 100 * index),
        easing: "ease"
      });
    })));
  }
  // Move to previous products (if any)
  previous(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1, columnGap = parseInt(getComputedStyle(this).getPropertyValue("--product-list-column-gap"));
    event.target.nextElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.productListInner.scrollLeft * directionFlip - (this.productListInner.clientWidth + columnGap) <= 0);
    this.productListInner.scrollBy({ left: -(this.productListInner.clientWidth + columnGap) * directionFlip, behavior: "smooth" });
  }
  // Move to next products (if any)
  next(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1, columnGap = parseInt(getComputedStyle(this).getPropertyValue("--product-list-column-gap"));
    event.target.previousElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.productListInner.scrollLeft * directionFlip + (this.productListInner.clientWidth + columnGap) * 2 >= this.productListInner.scrollWidth);
    this.productListInner.scrollBy({ left: (this.productListInner.clientWidth + columnGap) * directionFlip, behavior: "smooth" });
  }
  attributeChangedCallback(name) {
    if (!this.staggerApparition) {
      return;
    }
    switch (name) {
      case "hidden":
        if (!this.hidden) {
          this.productListInner.scrollLeft = 0;
          this.productListInner.parentElement.scrollLeft = 0;
          this.querySelector(".prev-next-button--prev")?.setAttribute("disabled", "");
          this.querySelector(".prev-next-button--next")?.removeAttribute("disabled");
          this._staggerProductsApparition();
        } else {
          this.apparitionAnimation.finish();
        }
    }
  }
  async _staggerProductsApparition() {
    this.productItems.forEach((item) => item.style.opacity = 0);
    await this.untilVisible({ threshold: this.clientHeight > 0 ? Math.min(50 / this.clientHeight, 1) : 0 });
    this.apparitionAnimation.play();
  }
};
__publicField(ProductList, "observedAttributes", ["hidden"]);
window.customElements.define("product-list", ProductList);

// js/custom-element/section/logo-list/logo-list.js
var LogoList = class extends CustomHTMLElement {
  async connectedCallback() {
    this.items = Array.from(this.querySelectorAll(".logo-list__item"));
    this.logoListScrollable = this.querySelector(".logo-list__list");
    if (this.items.length > 1) {
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
    }
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  async _setupVisibility() {
    await this.untilVisible({ rootMargin: "50px 0px", threshold: 0 });
    const animation = new CustomAnimation(new ParallelEffect(this.items.map((item, index) => {
      return new CustomKeyframeEffect(item, {
        opacity: [0, 1],
        transform: [`translateY(${MediaFeatures.prefersReducedMotion() ? 0 : "30px"})`, "translateY(0)"]
      }, {
        duration: 300,
        delay: MediaFeatures.prefersReducedMotion() ? 0 : 100 * index,
        easing: "ease"
      });
    })));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
  previous(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
    event.target.nextElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.logoListScrollable.scrollLeft * directionFlip - (this.logoListScrollable.clientWidth + 24) <= 0);
    this.logoListScrollable.scrollBy({ left: -(this.logoListScrollable.clientWidth + 24) * directionFlip, behavior: "smooth" });
  }
  next(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
    event.target.previousElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.logoListScrollable.scrollLeft * directionFlip + (this.logoListScrollable.clientWidth + 24) * 2 >= this.logoListScrollable.scrollWidth);
    this.logoListScrollable.scrollBy({ left: (this.logoListScrollable.clientWidth + 24) * directionFlip, behavior: "smooth" });
  }
};
window.customElements.define("logo-list", LogoList);

// js/custom-element/section/blog/blog-post-navigation.js
var BlogPostNavigation = class extends HTMLElement {
  connectedCallback() {
    window.addEventListener("scroll", throttle(this._updateProgressBar.bind(this), 15));
  }
  get hasNextArticle() {
    return this.hasAttribute("has-next-article");
  }
  _updateProgressBar() {
    const stickyHeaderOffset = getStickyHeaderOffset(), marginCompensation = window.matchMedia(window.themeVariables.breakpoints.pocket).matches ? 40 : 80, articleNavBoundingBox = this.getBoundingClientRect(), articleMainPartBoundingBox = this.parentElement.getBoundingClientRect(), difference = articleMainPartBoundingBox.bottom - (articleNavBoundingBox.bottom - marginCompensation), progress = Math.max(-1 * (difference / (articleMainPartBoundingBox.height + marginCompensation) - 1), 0);
    this.classList.toggle("is-visible", articleMainPartBoundingBox.top < stickyHeaderOffset && articleMainPartBoundingBox.bottom > stickyHeaderOffset + this.clientHeight - marginCompensation);
    if (this.hasNextArticle) {
      if (progress > 0.8) {
        this.classList.add("article__nav--show-next");
      } else {
        this.classList.remove("article__nav--show-next");
      }
    }
    this.style.setProperty("--transform", `${progress}`);
  }
};
window.customElements.define("blog-post-navigation", BlogPostNavigation);

// js/custom-element/section/multi-column/multi-column.js
var MultiColumn = class extends CustomHTMLElement {
  connectedCallback() {
    if (!this.hasAttribute("stack")) {
      this.multiColumnInner = this.querySelector(".multi-column__inner");
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => {
          event.target.scrollIntoView({ inline: "center", block: "nearest", behavior: event.detail.load ? "auto" : "smooth" });
        });
      }
    }
    if (this.hasAttribute("stagger-apparition")) {
      this._setupVisibility();
    }
  }
  async _setupVisibility() {
    await this.untilVisible({ threshold: Math.min(50 / this.clientHeight, 1) });
    const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
    const animation = new CustomAnimation(new ParallelEffect(Array.from(this.querySelectorAll(".multi-column__item")).map((item, index) => {
      return new CustomKeyframeEffect(item, {
        opacity: [0, 1],
        transform: [`translateY(${MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60}px)`, "translateY(0)"]
      }, {
        duration: 600,
        delay: prefersReducedMotion ? 0 : 100 * index,
        easing: "ease"
      });
    })));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
  // Move to previous products (if any)
  previous(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1, columnGap = parseInt(getComputedStyle(this).getPropertyValue("--multi-column-column-gap"));
    event.target.nextElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.multiColumnInner.scrollLeft * directionFlip - (this.multiColumnInner.clientWidth + columnGap) <= 0);
    this.multiColumnInner.scrollBy({ left: -(this.multiColumnInner.clientWidth + columnGap) * directionFlip, behavior: "smooth" });
  }
  // Move to next products (if any)
  next(event) {
    const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1, columnGap = parseInt(getComputedStyle(this).getPropertyValue("--multi-column-column-gap"));
    event.target.previousElementSibling.removeAttribute("disabled");
    event.target.toggleAttribute("disabled", this.multiColumnInner.scrollLeft * directionFlip + (this.multiColumnInner.clientWidth + columnGap) * 2 >= this.multiColumnInner.scrollWidth);
    this.multiColumnInner.scrollBy({ left: (this.multiColumnInner.clientWidth + columnGap) * directionFlip, behavior: "smooth" });
  }
};
window.customElements.define("multi-column", MultiColumn);

// js/custom-element/section/gallery/gallery-list.js
var GalleryList = class extends HTMLElement {
  connectedCallback() {
    this.listItems = Array.from(this.querySelectorAll("gallery-item"));
    this.scrollBarElement = this.querySelector(".gallery__progress-bar");
    this.listWrapperElement = this.querySelector(".gallery__list-wrapper");
    if (this.listItems.length > 1) {
      this.addEventListener("scrollable-content:progress", this._updateProgressBar.bind(this));
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => this.select(event.target.index, !event.detail.load));
      }
    }
  }
  previous() {
    this.select([...this.listItems].reverse().find((item) => item.isOnLeftHalfPartOfScreen).index);
  }
  next() {
    this.select(this.listItems.findIndex((item) => item.isOnRightHalfPartOfScreen));
  }
  select(index, animate = true) {
    const boundingRect = this.listItems[index].getBoundingClientRect();
    this.listWrapperElement.scrollBy({
      behavior: animate ? "smooth" : "auto",
      left: Math.floor(boundingRect.left - window.innerWidth / 2 + boundingRect.width / 2)
    });
  }
  _updateProgressBar(event) {
    this.scrollBarElement?.style.setProperty("--transform", `${event.detail.progress}%`);
  }
};
window.customElements.define("gallery-list", GalleryList);

// js/custom-element/section/gallery/gallery-item.js
var GalleryItem = class extends HTMLElement {
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get isOnRightHalfPartOfScreen() {
    if (window.themeVariables.settings.direction === "ltr") {
      return this.getBoundingClientRect().left > window.innerWidth / 2;
    } else {
      return this.getBoundingClientRect().right < window.innerWidth / 2;
    }
  }
  get isOnLeftHalfPartOfScreen() {
    if (window.themeVariables.settings.direction === "ltr") {
      return this.getBoundingClientRect().right < window.innerWidth / 2;
    } else {
      return this.getBoundingClientRect().left > window.innerWidth / 2;
    }
  }
};
window.customElements.define("gallery-item", GalleryItem);

// js/custom-element/section/image-with-text-overlay/image-with-text-overlay.js
var ImageWithTextOverlay = class extends CustomHTMLElement {
  connectedCallback() {
    if (this.hasAttribute("parallax") && !MediaFeatures.prefersReducedMotion()) {
      this._hasPendingRaF = false;
      this._onScrollListener = this._onScroll.bind(this);
      window.addEventListener("scroll", this._onScrollListener);
    }
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._onScrollListener) {
      window.removeEventListener("scroll", this._onScrollListener);
    }
  }
  async _setupVisibility() {
    await this.untilVisible();
    const image = this.querySelector(".image-overlay__image"), headings = await resolveAsyncIterator(this.querySelectorAll("split-lines")), prefersReducedMotion = MediaFeatures.prefersReducedMotion();
    await imageLoaded(image);
    const innerEffect = [
      new CustomKeyframeEffect(image, { opacity: [0, 1], transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"] }, { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }),
      new ParallelEffect(headings.map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 0.2, 1],
          transform: [`translateY(${prefersReducedMotion ? 0 : "100%"})`, "translateY(0)"],
          clipPath: [`inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`, "inset(0 0 0 0)"]
        }, {
          duration: 300,
          delay: prefersReducedMotion ? 0 : 120 * index,
          easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)"
        });
      })),
      new CustomKeyframeEffect(this.querySelector(".image-overlay__text-container"), { opacity: [0, 1] }, { duration: 300 })
    ];
    const animation = prefersReducedMotion ? new CustomAnimation(new ParallelEffect(innerEffect)) : new CustomAnimation(new SequenceEffect(innerEffect));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
  _onScroll() {
    if (this._hasPendingRaF) {
      return;
    }
    this._hasPendingRaF = true;
    requestAnimationFrame(() => {
      const boundingRect = this.getBoundingClientRect(), speedFactor = 3, contentElement = this.querySelector(".image-overlay__content-wrapper"), imageElement = this.querySelector(".image-overlay__image"), boundingRectBottom = boundingRect.bottom, boundingRectHeight = boundingRect.height, stickyHeaderOffset = getStickyHeaderOffset();
      if (contentElement) {
        contentElement.style.opacity = Math.max(1 - speedFactor * (1 - Math.min(boundingRectBottom / boundingRectHeight, 1)), 0).toString();
      }
      if (imageElement) {
        imageElement.style.transform = `translateY(${100 - Math.max(1 - (1 - Math.min(boundingRectBottom / (boundingRectHeight + stickyHeaderOffset), 1)), 0) * 100}px)`;
      }
      this._hasPendingRaF = false;
    });
  }
};
window.customElements.define("image-with-text-overlay", ImageWithTextOverlay);

// js/custom-element/section/image-with-text-block/image-with-text-block.js
var ImageWithTextBlock = class extends CustomHTMLElement {
  async connectedCallback() {
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  async _setupVisibility() {
    await this.untilVisible();
    const images = Array.from(this.querySelectorAll(".image-with-text-block__image[reveal]")), headings = await resolveAsyncIterator(this.querySelectorAll("split-lines")), prefersReducedMotion = MediaFeatures.prefersReducedMotion();
    for (const image of images) {
      if (image.offsetParent !== null) {
        await imageLoaded(image);
      }
    }
    const innerEffect = [
      new ParallelEffect(images.map((item) => {
        return new CustomKeyframeEffect(item, { opacity: [0, 1], transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"] }, { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
      })),
      new CustomKeyframeEffect(this.querySelector(".image-with-text-block__content"), { opacity: [0, 1], transform: [`translateY(${prefersReducedMotion ? 0 : "60px"})`, "translateY(0)"] }, { duration: 150, easing: "ease-in-out" }),
      new ParallelEffect(headings.map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 0.2, 1],
          transform: [`translateY(${prefersReducedMotion ? 0 : "100%"})`, "translateY(0)"],
          clipPath: [`inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`, "inset(0 0 0 0)"]
        }, {
          duration: 300,
          delay: prefersReducedMotion ? 0 : 120 * index,
          easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)"
        });
      })),
      new CustomKeyframeEffect(this.querySelector(".image-with-text-block__text-container"), { opacity: [0, 1] }, { duration: 300 })
    ];
    const animation = prefersReducedMotion ? new CustomAnimation(new ParallelEffect(innerEffect)) : new CustomAnimation(new SequenceEffect(innerEffect));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
};
window.customElements.define("image-with-text-block", ImageWithTextBlock);

// js/custom-element/section/blog/article-list.js
var ArticleList = class extends CustomHTMLElement {
  async connectedCallback() {
    this.articleItems = Array.from(this.querySelectorAll(".article-item"));
    if (this.staggerApparition) {
      await this.untilVisible({ threshold: this.clientHeight > 0 ? Math.min(50 / this.clientHeight, 1) : 0 });
      const animation = new CustomAnimation(new ParallelEffect(this.articleItems.map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 1],
          transform: [`translateY(${MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60}px)`, "translateY(0)"]
        }, {
          duration: 600,
          delay: MediaFeatures.prefersReducedMotion() ? 0 : 100 * index - Math.min(3 * index * index, 100 * index),
          easing: "ease"
        });
      })));
      this._hasSectionReloaded ? animation.finish() : animation.play();
    }
  }
  get staggerApparition() {
    return this.hasAttribute("stagger-apparition");
  }
};
window.customElements.define("article-list", ArticleList);

// js/custom-element/section/blog/blog-post-header.js
var BlogPostHeader = class extends HTMLElement {
  async connectedCallback() {
    const image = this.querySelector(".article__image");
    if (MediaFeatures.prefersReducedMotion()) {
      image.removeAttribute("reveal");
    } else {
      await imageLoaded(image);
      image.animate({ opacity: [0, 1], transform: ["scale(1.1)", "scale(1)"] }, { duration: 500, fill: "forwards", easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
    }
  }
};
window.customElements.define("blog-post-header", BlogPostHeader);

// js/custom-element/section/search/predictive-search-input.js
var PredictiveSearchInput = class extends HTMLInputElement {
  connectedCallback() {
    this.addEventListener("click", () => document.getElementById(this.getAttribute("aria-controls")).open = true);
  }
};
window.customElements.define("predictive-search-input", PredictiveSearchInput, { extends: "input" });

// js/custom-element/ui/drawer.js
var DrawerContent = class extends OpenableElement {
  connectedCallback() {
    super.connectedCallback();
    if (this.hasAttribute("reverse-breakpoint")) {
      this.originalDirection = this.classList.contains("drawer--from-left") ? "left" : "right";
      const matchMedia2 = window.matchMedia(this.getAttribute("reverse-breakpoint"));
      matchMedia2.addListener(this._checkReverseOpeningDirection.bind(this));
      this._checkReverseOpeningDirection(matchMedia2);
    }
    this.delegate.on("click", ".drawer__overlay", () => this.open = false);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        document.documentElement.classList.toggle("lock-all", this.open);
    }
  }
  _checkReverseOpeningDirection(match) {
    this.classList.remove("drawer--from-left");
    if (this.originalDirection === "left" && !match.matches || this.originalDirection !== "left" && match.matches) {
      this.classList.add("drawer--from-left");
    }
  }
};
window.customElements.define("drawer-content", DrawerContent);

// js/custom-element/section/search/predictive-search-drawer.js
var PredictiveSearchDrawer = class extends DrawerContent {
  connectedCallback() {
    super.connectedCallback();
    this.inputElement = this.querySelector('[name="q"]');
    this.drawerContentElement = this.querySelector(".drawer__content");
    this.drawerFooterElement = this.querySelector(".drawer__footer");
    this.loadingStateElement = this.querySelector(".predictive-search__loading-state");
    this.resultsElement = this.querySelector(".predictive-search__results");
    this.menuListElement = this.querySelector(".predictive-search__menu-list");
    this.delegate.on("input", '[name="q"]', this._debounce(this._onSearch.bind(this), 200));
    this.delegate.on("click", '[data-action="reset-search"]', this._startNewSearch.bind(this));
  }
  async _onSearch(event, target) {
    if (event.key === "Enter") {
      return;
    }
    if (this.abortController) {
      this.abortController.abort();
    }
    this.drawerContentElement.classList.remove("drawer__content--center");
    this.drawerFooterElement.hidden = true;
    if (target.value === "") {
      this.loadingStateElement.hidden = true;
      this.resultsElement.hidden = true;
      this.menuListElement ? this.menuListElement.hidden = false : "";
    } else {
      this.drawerContentElement.classList.add("drawer__content--center");
      this.loadingStateElement.hidden = false;
      this.resultsElement.hidden = true;
      this.menuListElement ? this.menuListElement.hidden = true : "";
      let searchResults = {};
      try {
        this.abortController = new AbortController();
        if (this._supportPredictiveApi()) {
          searchResults = await this._doPredictiveSearch(target.value);
        } else {
          searchResults = await this._doLiquidSearch(target.value);
        }
      } catch (e) {
        if (e.name === "AbortError") {
          return;
        }
      }
      this.loadingStateElement.hidden = true;
      this.resultsElement.hidden = false;
      this.menuListElement ? this.menuListElement.hidden = true : "";
      if (searchResults.hasResults) {
        this.drawerFooterElement.hidden = false;
        this.drawerContentElement.classList.remove("drawer__content--center");
      }
      this.resultsElement.innerHTML = searchResults.html;
    }
  }
  async _doPredictiveSearch(term) {
    const response = await fetch(`${window.themeVariables.routes.predictiveSearchUrl}?q=${encodeURIComponent(term)}&resources[limit]=10&resources[limit_scope]=each&section_id=predictive-search`, {
      signal: this.abortController.signal
    });
    const div = document.createElement("div");
    div.innerHTML = await response.text();
    return { hasResults: div.querySelector(".predictive-search__results-categories") !== null, html: div.firstElementChild.innerHTML };
  }
  /* Some languages do not support predictive search API so we fallback to the Liquid search */
  async _doLiquidSearch(term) {
    const response = await fetch(`${window.themeVariables.routes.searchUrl}?q=${encodeURIComponent(term)}&resources[limit]=50&section_id=predictive-search-compatibility`, {
      signal: this.abortController.signal
    });
    const div = document.createElement("div");
    div.innerHTML = await response.text();
    return { hasResults: div.querySelector(".predictive-search__results-categories") !== null, html: div.firstElementChild.innerHTML };
  }
  _startNewSearch() {
    this.inputElement.value = "";
    this.inputElement.focus();
    const event = new Event("input", {
      bubbles: true,
      cancelable: true
    });
    this.inputElement.dispatchEvent(event);
  }
  _supportPredictiveApi() {
    const shopifyFeatureRequests = JSON.parse(document.getElementById("shopify-features").innerHTML);
    return shopifyFeatureRequests["predictiveSearch"];
  }
  /**
   * Simple function that allows to debounce
   */
  _debounce(fn, delay3) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay3);
    };
  }
};
window.customElements.define("predictive-search-drawer", PredictiveSearchDrawer);

// js/custom-element/section/timeline/timeline.js
var Timeline = class extends HTMLElement {
  connectedCallback() {
    this.prevNextButtons = this.querySelector("prev-next-buttons");
    this.pageDots = this.querySelector("page-dots");
    this.scrollBarElement = this.querySelector(".timeline__progress-bar");
    this.listWrapperElement = this.querySelector(".timeline__list-wrapper");
    this.listItemElements = Array.from(this.querySelectorAll(".timeline__item"));
    this.isScrolling = false;
    if (this.listItemElements.length > 1) {
      this.addEventListener("prev-next:prev", this.previous.bind(this));
      this.addEventListener("prev-next:next", this.next.bind(this));
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index));
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => {
          this.select([...event.target.parentNode.children].indexOf(event.target), !event.detail.load);
        });
      }
      this.itemIntersectionObserver = new IntersectionObserver(this._onItemObserved.bind(this), { threshold: 0.4 });
      const mediaQuery = window.matchMedia(window.themeVariables.breakpoints.pocket);
      mediaQuery.addListener(this._onMediaChanged.bind(this));
      this._onMediaChanged(mediaQuery);
    }
  }
  get selectedIndex() {
    return this.listItemElements.findIndex((item) => !item.hasAttribute("hidden"));
  }
  previous() {
    this.select(Math.max(0, this.selectedIndex - 1));
  }
  next() {
    this.select(Math.min(this.selectedIndex + 1, this.listItemElements.length - 1));
  }
  select(index, animate = true) {
    const listItemElement = this.listItemElements[index], boundingRect = listItemElement.getBoundingClientRect();
    if (animate) {
      this.isScrolling = true;
      setTimeout(() => this.isScrolling = false, 800);
    }
    if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
      this.listWrapperElement.scrollTo({
        behavior: animate ? "smooth" : "auto",
        left: this.listItemElements[0].clientWidth * index
        /* Note: the last element does not contain extra margin so we use the first element width */
      });
    } else {
      this.listWrapperElement.scrollBy({
        behavior: animate ? "smooth" : "auto",
        left: Math.floor(boundingRect.left - window.innerWidth / 2 + boundingRect.width / 2)
      });
    }
    this._onItemSelected(index);
  }
  _onItemSelected(index) {
    const listItemElement = this.listItemElements[index];
    listItemElement.removeAttribute("hidden", "false");
    getSiblings(listItemElement).forEach((item) => item.setAttribute("hidden", ""));
    this.prevNextButtons.isPrevDisabled = index === 0;
    this.prevNextButtons.isNextDisabled = index === this.listItemElements.length - 1;
    this.pageDots.selectedIndex = index;
    this.scrollBarElement?.style.setProperty("--transform", `${100 / (this.listItemElements.length - 1) * index}%`);
  }
  _onItemObserved(entries) {
    if (this.isScrolling) {
      return;
    }
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this._onItemSelected([...entry.target.parentNode.children].indexOf(entry.target));
      }
    });
  }
  _onMediaChanged(event) {
    if (event.matches) {
      this.listItemElements.forEach((item) => this.itemIntersectionObserver.observe(item));
    } else {
      this.listItemElements.forEach((item) => this.itemIntersectionObserver.unobserve(item));
    }
  }
};
window.customElements.define("time-line", Timeline);

// js/custom-element/section/press/press-list.js
var PressList = class extends CustomHTMLElement {
  connectedCallback() {
    this.pressItemsWrapper = this.querySelector(".press-list__wrapper");
    this.pressItems = Array.from(this.querySelectorAll("press-item"));
    this.pageDots = this.querySelector("page-dots");
    if (this.pressItems.length > 1) {
      if (Shopify.designMode) {
        this.addEventListener("shopify:block:select", (event) => {
          this.intersectionObserver?.disconnect();
          if (event.detail.load || !event.target.selected) {
            this.select(event.target.index, !event.detail.load);
          }
        });
      }
      this.pressItemsWrapper.addEventListener("swiperight", this.previous.bind(this));
      this.pressItemsWrapper.addEventListener("swipeleft", this.next.bind(this));
      this.addEventListener("page-dots:changed", (event) => this.select(event.detail.index));
      this._blockVerticalScroll();
    }
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
  }
  async _setupVisibility() {
    await this.untilVisible();
    this.pressItems[this.selectedIndex].transitionToEnter();
  }
  get selectedIndex() {
    return this.pressItems.findIndex((item) => item.selected);
  }
  previous() {
    this.select((this.selectedIndex - 1 + this.pressItems.length) % this.pressItems.length);
  }
  next() {
    this.select((this.selectedIndex + 1 + this.pressItems.length) % this.pressItems.length);
  }
  async select(index, shouldAnimate = true) {
    const previousItem = this.pressItems[this.selectedIndex], newItem = this.pressItems[index];
    await previousItem.transitionToLeave(shouldAnimate);
    this.pageDots.selectedIndex = index;
    await newItem.transitionToEnter(shouldAnimate);
  }
};
Object.assign(PressList.prototype, VerticalScrollBlockerMixin);
window.customElements.define("press-list", PressList);

// js/custom-element/section/press/press-item.js
var PressItem = class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("split-lines:re-split", (event) => {
      Array.from(event.target.children).forEach((line) => line.style.visibility = this.selected ? "visible" : "hidden");
    });
  }
  get index() {
    return [...this.parentNode.children].indexOf(this);
  }
  get selected() {
    return !this.hasAttribute("hidden");
  }
  async transitionToLeave(shouldAnimate = true) {
    const textLines = await resolveAsyncIterator(this.querySelectorAll("split-lines")), animation = new CustomAnimation(new ParallelEffect(textLines.reverse().map((item, index) => {
      return new CustomKeyframeEffect(item, {
        visibility: ["visible", "hidden"],
        clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
        transform: ["translateY(0)", "translateY(100%)"]
      }, {
        duration: 350,
        delay: 60 * index,
        easing: "cubic-bezier(0.68, 0.00, 0.77, 0.00)"
      });
    })));
    shouldAnimate ? animation.play() : animation.finish();
    await animation.finished;
    this.setAttribute("hidden", "");
  }
  async transitionToEnter(shouldAnimate = true) {
    this.removeAttribute("hidden");
    const textLines = await resolveAsyncIterator(this.querySelectorAll("split-lines, .testimonial__author")), animation = new CustomAnimation(new ParallelEffect(textLines.map((item, index) => {
      return new CustomKeyframeEffect(item, {
        visibility: ["hidden", "visible"],
        clipPath: ["inset(0 0 100% 0)", "inset(0 0 0px 0)"],
        transform: ["translateY(100%)", "translateY(0)"]
      }, {
        duration: 550,
        delay: 120 * index,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)"
      });
    })));
    shouldAnimate ? animation.play() : animation.finish();
    return animation.finished;
  }
};
window.customElements.define("press-item", PressItem);

// js/custom-element/section/header/desktop-navigation.js
var DesktopNavigation = class extends CustomHTMLElement {
  connectedCallback() {
    this.openingTimeout = null;
    this.currentMegaMenu = null;
    this.delegate.on("mouseenter", ".has-dropdown", (event, target) => {
      if (event.target === target && event.relatedTarget !== null) {
        this.openDropdown(target);
      }
    }, true);
    this.delegate.on("click", ".header__linklist-link[aria-expanded], .nav-dropdown__link[aria-expanded]", (event, target) => {
      if (window.matchMedia("(hover: hover)").matches || target.getAttribute("aria-expanded") === "true") {
        return;
      }
      event.preventDefault();
      this.openDropdown(target.parentElement);
    });
    this.delegate.on("shopify:block:select", (event) => this.openDropdown(event.target.parentElement));
    this.delegate.on("shopify:block:deselect", (event) => this.closeDropdown(event.target.parentElement));
  }
  openDropdown(parentElement) {
    const menuItem = parentElement.querySelector("[aria-controls]"), dropdown = parentElement.querySelector(`#${menuItem.getAttribute("aria-controls")}`);
    this.currentMegaMenu = dropdown.classList.contains("mega-menu") ? dropdown : null;
    let openingTimeout = setTimeout(() => {
      if (menuItem.getAttribute("aria-expanded") === "true") {
        return;
      }
      menuItem.setAttribute("aria-expanded", "true");
      dropdown.removeAttribute("hidden");
      if (dropdown.classList.contains("mega-menu") && !MediaFeatures.prefersReducedMotion()) {
        const items = Array.from(dropdown.querySelectorAll(".mega-menu__column, .mega-menu__image-push"));
        items.forEach((item) => {
          item.getAnimations().forEach((animation2) => animation2.cancel());
          item.style.opacity = 0;
        });
        const animation = new CustomAnimation(new ParallelEffect(items.map((item, index) => {
          return new CustomKeyframeEffect(item, {
            opacity: [0, 1],
            transform: ["translateY(20px)", "translateY(0)"]
          }, {
            duration: 250,
            delay: 100 + 60 * index,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)"
          });
        })));
        animation.play();
      }
      const leaveListener = (event) => {
        if (event.relatedTarget !== null) {
          this.closeDropdown(parentElement);
          parentElement.removeEventListener("mouseleave", leaveListener);
        }
      };
      const leaveDocumentListener = () => {
        this.closeDropdown(parentElement);
        document.documentElement.removeEventListener("mouseleave", leaveDocumentListener);
      };
      parentElement.addEventListener("mouseleave", leaveListener);
      document.documentElement.addEventListener("mouseleave", leaveDocumentListener);
      openingTimeout = null;
      this.dispatchEvent(new CustomEvent("desktop-nav:dropdown:open", { bubbles: true }));
    }, 100);
    parentElement.addEventListener("mouseleave", () => {
      if (openingTimeout) {
        clearTimeout(openingTimeout);
      }
    }, { once: true });
  }
  closeDropdown(parentElement) {
    const menuItem = parentElement.querySelector("[aria-controls]"), dropdown = parentElement.querySelector(`#${menuItem.getAttribute("aria-controls")}`);
    requestAnimationFrame(() => {
      dropdown.classList.add("is-closing");
      menuItem.setAttribute("aria-expanded", "false");
      setTimeout(() => {
        dropdown.setAttribute("hidden", "");
        clearTimeout(this.openingTimeout);
        dropdown.classList.remove("is-closing");
      }, dropdown.classList.contains("mega-menu") && this.currentMegaMenu !== dropdown ? 250 : 0);
      this.dispatchEvent(new CustomEvent("desktop-nav:dropdown:close", { bubbles: true }));
    });
  }
};
window.customElements.define("desktop-navigation", DesktopNavigation);

// js/custom-element/section/header/mobile-navigation.js
var MobileNavigation = class extends DrawerContent {
  get apparitionAnimation() {
    if (this._apparitionAnimation) {
      return this._apparitionAnimation;
    }
    if (!MediaFeatures.prefersReducedMotion()) {
      const navItems = Array.from(this.querySelectorAll('.mobile-nav__item[data-level="1"]')), effects = [];
      effects.push(new ParallelEffect(navItems.map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 1],
          transform: ["translateX(-40px)", "translateX(0)"]
        }, {
          duration: 300,
          delay: 300 + 120 * index - Math.min(2 * index * index, 120 * index),
          easing: "cubic-bezier(0.25, 1, 0.5, 1)"
        });
      })));
      const bottomBar = this.querySelector(".drawer__footer");
      if (bottomBar) {
        effects.push(new CustomKeyframeEffect(
          bottomBar,
          {
            opacity: [0, 1],
            transform: ["translateY(100%)", "translateY(0)"]
          },
          {
            duration: 300,
            delay: 500 + Math.max(125 * navItems.length - 25 * navItems.length, 25),
            easing: "cubic-bezier(0.25, 1, 0.5, 1)"
          }
        ));
      }
      return this._apparitionAnimation = new CustomAnimation(new ParallelEffect(effects));
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        if (this.open && this.apparitionAnimation) {
          Array.from(this.querySelectorAll('.mobile-nav__item[data-level="1"], .drawer__footer')).forEach((item) => item.style.opacity = 0);
          this.apparitionAnimation.play();
        }
        triggerEvent(this, this.open ? "mobile-nav:open" : "mobile-nav:close");
    }
  }
};
window.customElements.define("mobile-navigation", MobileNavigation);

// js/custom-element/section/header/store-header.js
var StoreHeader = class extends CustomHTMLElement {
  connectedCallback() {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this._updateCustomProperties.bind(this));
      this.resizeObserver.observe(this);
      this.resizeObserver.observe(this.querySelector(".header__wrapper"));
    }
    if (this.isTransparent) {
      this.isTransparencyDetectionLocked = false;
      this.delegate.on("desktop-nav:dropdown:open", () => this.lockTransparency = true);
      this.delegate.on("desktop-nav:dropdown:close", () => this.lockTransparency = false);
      this.rootDelegate.on("mobile-nav:open", () => this.lockTransparency = true);
      this.rootDelegate.on("mobile-nav:close", () => this.lockTransparency = false);
      this.delegate.on("mouseenter", this._checkTransparentHeader.bind(this), true);
      this.delegate.on("mouseleave", this._checkTransparentHeader.bind(this));
      if (this.isSticky) {
        this._checkTransparentHeader();
        this._onWindowScrollListener = throttle(this._checkTransparentHeader.bind(this), 100);
        window.addEventListener("scroll", this._onWindowScrollListener);
      }
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (window.ResizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.isTransparent && this.isSticky) {
      window.removeEventListener("scroll", this._onWindowScrollListener);
    }
  }
  get isSticky() {
    return this.hasAttribute("sticky");
  }
  get isTransparent() {
    return this.hasAttribute("transparent");
  }
  get transparentHeaderThreshold() {
    return 25;
  }
  set lockTransparency(value) {
    this.isTransparencyDetectionLocked = value;
    this._checkTransparentHeader();
  }
  /**
   * This method allows to keep in sync various CSS variables that are used to size various elements
   */
  _updateCustomProperties(entries) {
    entries.forEach((entry) => {
      if (entry.target === this) {
        const height = entry.borderBoxSize ? entry.borderBoxSize.length > 0 ? entry.borderBoxSize[0].blockSize : entry.borderBoxSize.blockSize : entry.target.clientHeight;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
      if (entry.target.classList.contains("header__wrapper")) {
        const heightWithoutNav = entry.borderBoxSize ? entry.borderBoxSize.length > 0 ? entry.borderBoxSize[0].blockSize : entry.borderBoxSize.blockSize : entry.target.clientHeight;
        document.documentElement.style.setProperty("--header-height-without-bottom-nav", `${heightWithoutNav}px`);
      }
    });
  }
  _checkTransparentHeader(event) {
    if (this.isTransparencyDetectionLocked || window.scrollY > this.transparentHeaderThreshold || event && event.type === "mouseenter") {
      this.classList.remove("header--transparent");
    } else {
      this.classList.add("header--transparent");
    }
  }
};
window.customElements.define("store-header", StoreHeader);

// js/custom-element/section/product/gift-card-recipient.js
var GiftCardRecipient = class extends HTMLElement {
  connectedCallback() {
    const properties = Array.from(this.querySelectorAll('[name*="properties"]')), checkboxPropertyName = "properties[__shopify_send_gift_card_to_recipient]";
    this.recipientCheckbox = properties.find((input) => input.name === checkboxPropertyName);
    this.recipientOtherProperties = properties.filter((input) => input.name !== checkboxPropertyName);
    this.recipientFieldsContainer = this.querySelector(".gift-card-recipient__fields");
    this.recipientCheckbox?.addEventListener("change", this._synchronizeProperties.bind(this));
    this.offsetProperty = this.querySelector('[name="properties[__shopify_offset]"]');
    if (this.offsetProperty) {
      this.offsetProperty.value = (/* @__PURE__ */ new Date()).getTimezoneOffset().toString();
    }
    this.recipientSendOnProperty = this.querySelector('[name="properties[Send on]"]');
    const minDate = /* @__PURE__ */ new Date();
    const maxDate = /* @__PURE__ */ new Date();
    maxDate.setDate(minDate.getDate() + 90);
    this.recipientSendOnProperty?.setAttribute("min", this._formatDate(minDate));
    this.recipientSendOnProperty?.setAttribute("max", this._formatDate(maxDate));
    this._synchronizeProperties();
  }
  _synchronizeProperties() {
    this.recipientOtherProperties.forEach((property) => property.disabled = !this.recipientCheckbox.checked);
    this.recipientFieldsContainer.classList.toggle("js:hidden", !this.recipientCheckbox.checked);
  }
  _formatDate(date) {
    const offset = date.getTimezoneOffset();
    const offsetDate = new Date(date.getTime() - offset * 60 * 1e3);
    return offsetDate.toISOString().split("T")[0];
  }
};
if (!window.customElements.get("gift-card-recipient")) {
  window.customElements.define("gift-card-recipient", GiftCardRecipient);
}

// js/custom-element/section/product/image-zoom.js
var PhotoSwipeUi = class {
  constructor(pswp) {
    this.photoSwipeInstance = pswp;
    this.delegate = new main_default(this.photoSwipeInstance.scrollWrap);
    this.maxSpreadZoom = window.themeVariables.settings.mobileZoomFactor || 2;
    this.pswpUi = this.photoSwipeInstance.scrollWrap.querySelector(".pswp__ui");
    this.delegate.on("click", '[data-action="pswp-close"]', this._close.bind(this));
    this.delegate.on("click", '[data-action="pswp-prev"]', this._goToPrev.bind(this));
    this.delegate.on("click", '[data-action="pswp-next"]', this._goToNext.bind(this));
    this.delegate.on("click", '[data-action="pswp-move-to"]', this._moveTo.bind(this));
    this.photoSwipeInstance.listen("close", this._onPswpClosed.bind(this));
    this.photoSwipeInstance.listen("doubleTap", this._onPswpDoubleTap.bind(this));
    this.photoSwipeInstance.listen("beforeChange", this._onPswpBeforeChange.bind(this));
    this.photoSwipeInstance.listen("initialZoomInEnd", this._onPswpInitialZoomInEnd.bind(this));
    this.photoSwipeInstance.listen("initialZoomOut", this._onPswpInitialZoomOut.bind(this));
    this.photoSwipeInstance.listen("parseVerticalMargin", this._onPswpParseVerticalMargin.bind(this));
    this.delegate.on("pswpTap", ".pswp__img", this._onPswpTap.bind(this));
  }
  init() {
    const prevNextButtons = this.pswpUi.querySelector(".pswp__prev-next-buttons"), dotsNavWrapper = this.pswpUi.querySelector(".pswp__dots-nav-wrapper");
    if (this.photoSwipeInstance.items.length <= 1) {
      prevNextButtons.style.display = "none";
      dotsNavWrapper.style.display = "none";
      return;
    }
    prevNextButtons.style.display = "";
    dotsNavWrapper.style.display = "";
    let dotsNavHtml = "";
    this.photoSwipeInstance.items.forEach((item, index) => {
      dotsNavHtml += `
        <button class="dots-nav__item tap-area" ${index === 0 ? 'aria-current="true"' : ""} data-action="pswp-move-to">
          <span class="visually-hidden">Go to slide ${index}</span>
        </button>
      `;
    });
    dotsNavWrapper.querySelector(".pswp__dots-nav-wrapper .dots-nav").innerHTML = dotsNavHtml;
  }
  _close() {
    this.photoSwipeInstance.close();
  }
  _goToPrev() {
    this.photoSwipeInstance.prev();
  }
  _goToNext() {
    this.photoSwipeInstance.next();
  }
  _moveTo(event, target) {
    this.photoSwipeInstance.goTo([...target.parentNode.children].indexOf(target));
  }
  _onPswpClosed() {
    this.delegate.off("pswpTap");
  }
  _onPswpDoubleTap(point) {
    const initialZoomLevel = this.photoSwipeInstance.currItem.initialZoomLevel;
    if (this.photoSwipeInstance.getZoomLevel() !== initialZoomLevel) {
      this.photoSwipeInstance.zoomTo(initialZoomLevel, point, 333);
    } else {
      this.photoSwipeInstance.zoomTo(initialZoomLevel < 0.7 ? 1 : this.maxSpreadZoom, point, 333);
    }
  }
  _onPswpTap(event) {
    if (event.detail.pointerType === "mouse") {
      this.photoSwipeInstance.toggleDesktopZoom(event.detail.releasePoint);
    }
  }
  _onPswpBeforeChange() {
    if (this.photoSwipeInstance.items.length <= 1) {
      return;
    }
    const activeDot = this.photoSwipeInstance.scrollWrap.querySelector(`.dots-nav__item:nth-child(${this.photoSwipeInstance.getCurrentIndex() + 1})`);
    activeDot.setAttribute("aria-current", "true");
    getSiblings(activeDot).forEach((item) => item.removeAttribute("aria-current"));
  }
  _onPswpInitialZoomInEnd() {
    this.pswpUi?.classList.remove("pswp__ui--hidden");
  }
  _onPswpInitialZoomOut() {
    this.pswpUi?.classList.add("pswp__ui--hidden");
  }
  _onPswpParseVerticalMargin(item) {
    item.vGap.bottom = this.photoSwipeInstance.items.length <= 1 || window.matchMedia(window.themeVariables.breakpoints.lapAndUp).matches ? 0 : 60;
  }
};
var ProductImageZoom = class extends OpenableElement {
  connectedCallback() {
    super.connectedCallback();
    this.mediaElement = this.closest(".product__media");
    this.maxSpreadZoom = window.themeVariables.settings.mobileZoomFactor || 2;
    LibraryLoader.load("photoswipe");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.photoSwipeInstance?.destroy();
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        if (this.open) {
          await LibraryLoader.load("photoswipe");
          this._openPhotoSwipe();
        }
    }
  }
  async _openPhotoSwipe() {
    const items = await this._buildItems();
    this.photoSwipeInstance = new window.ThemePhotoSwipe(this, PhotoSwipeUi, items, {
      index: items.findIndex((item) => item.selected),
      maxSpreadZoom: this.maxSpreadZoom,
      loop: false,
      allowPanToNext: false,
      closeOnScroll: false,
      closeOnVerticalDrag: MediaFeatures.supportsHover(),
      showHideOpacity: true,
      arrowKeys: true,
      history: false,
      getThumbBoundsFn: () => {
        const thumbnail = this.mediaElement.querySelector(".product__media-item.is-selected"), pageYScroll = window.pageYOffset || document.documentElement.scrollTop, rect = thumbnail.getBoundingClientRect();
        return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
      },
      getDoubleTapZoom: (isMouseClick, item) => {
        if (isMouseClick) {
          return item.w > item.h ? 1.6 : 1;
        } else {
          return item.initialZoomLevel < 0.7 ? 1 : 1.33;
        }
      }
    });
    let lastWidth = null;
    this.photoSwipeInstance.updateSize = new Proxy(this.photoSwipeInstance.updateSize, {
      apply: (target, thisArg, argArray) => {
        if (lastWidth !== window.innerWidth) {
          target(arguments);
          lastWidth = window.innerWidth;
        }
      }
    });
    this.photoSwipeInstance.listen("close", () => {
      this.open = false;
    });
    this.photoSwipeInstance.init();
  }
  async _buildItems() {
    const activeImages = Array.from(this.mediaElement.querySelectorAll('.product__media-item[data-media-type="image"]:not(.is-filtered)')), product = await ProductLoader.load(this.getAttribute("product-handle"));
    return Promise.resolve(activeImages.map((item) => {
      const matchedMedia = product["media"].find((media) => media.id === parseInt(item.getAttribute("data-media-id"))), supportedSizes = getSupportedSizes(matchedMedia, [200, 300, 400, 500, 600, 700, 800, 1e3, 1200, 1400, 1600, 1800, 2e3, 2200, 2400, 2600, 2800, 3e3]), desiredWidth = Math.min(supportedSizes[supportedSizes.length - 1], window.innerWidth);
      return {
        selected: item.classList.contains("is-selected"),
        src: getSizedMediaUrl(matchedMedia, `${Math.ceil(Math.min(desiredWidth * window.devicePixelRatio * this.maxSpreadZoom, 3e3))}x`),
        msrc: item.firstElementChild.currentSrc,
        originalMedia: matchedMedia,
        w: desiredWidth,
        h: parseInt(desiredWidth / matchedMedia["aspect_ratio"])
      };
    }));
  }
};
window.customElements.define("product-image-zoom", ProductImageZoom);

// js/custom-element/section/product/inventory.js
var ProductInventory = class extends HTMLElement {
  connectedCallback() {
    const scriptTag = this.querySelector("script");
    if (!scriptTag) {
      return;
    }
    this.inventories = JSON.parse(scriptTag.innerHTML);
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
  }
  _onVariantChanged(event) {
    this.querySelector("span")?.remove();
    if (event.detail.variant && this.inventories[event.detail.variant["id"]] !== "") {
      this.hidden = false;
      this.insertAdjacentHTML("afterbegin", this.inventories[event.detail.variant["id"]]);
    } else {
      this.hidden = true;
    }
  }
};
window.customElements.define("product-inventory", ProductInventory);

// js/custom-element/section/product/payment-container.js
var PaymentContainer = class extends HTMLElement {
  connectedCallback() {
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
    if (Shopify.designMode && Shopify.PaymentButton) {
      Shopify.PaymentButton.init();
    }
  }
  _onVariantChanged(event) {
    this._updateAddToCartButton(event.detail.variant);
    this._updateDynamicCheckoutButton(event.detail.variant);
  }
  _updateAddToCartButton(variant) {
    let addToCartButtonElement = this.querySelector("[data-product-add-to-cart-button]");
    if (!addToCartButtonElement) {
      return;
    }
    let addToCartButtonText = "";
    addToCartButtonElement.classList.remove("button--primary", "button--secondary", "button--ternary");
    if (!variant) {
      addToCartButtonElement.setAttribute("disabled", "disabled");
      addToCartButtonElement.classList.add("button--ternary");
      addToCartButtonText = window.themeVariables.strings.productFormUnavailable;
    } else {
      if (variant["available"]) {
        addToCartButtonElement.removeAttribute("disabled");
        addToCartButtonElement.classList.add(addToCartButtonElement.hasAttribute("data-use-primary") ? "button--primary" : "button--secondary");
        addToCartButtonText = addToCartButtonElement.getAttribute("data-button-content");
      } else {
        addToCartButtonElement.setAttribute("disabled", "disabled");
        addToCartButtonElement.classList.add("button--ternary");
        addToCartButtonText = window.themeVariables.strings.productFormSoldOut;
      }
    }
    if (addToCartButtonElement.getAttribute("is") === "loader-button") {
      addToCartButtonElement.firstElementChild.innerHTML = addToCartButtonText;
    } else {
      addToCartButtonElement.innerHTML = addToCartButtonText;
    }
  }
  _updateDynamicCheckoutButton(variant) {
    let paymentButtonElement = this.querySelector(".shopify-payment-button");
    if (!paymentButtonElement) {
      return;
    }
    paymentButtonElement.style.display = !variant || !variant["available"] ? "none" : "block";
  }
};
window.customElements.define("product-payment-container", PaymentContainer);

// js/custom-element/section/product/payment-terms.js
var PaymentTerms = class extends CustomHTMLElement {
  connectedCallback() {
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
  }
  _onVariantChanged(event) {
    const variant = event.detail.variant;
    if (variant) {
      const idElement = this.querySelector('[name="id"]');
      idElement.value = variant["id"];
      idElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
};
window.customElements.define("product-payment-terms", PaymentTerms);

// js/custom-element/section/product/product-form.js
var ProductForm = class extends HTMLFormElement {
  connectedCallback() {
    this.id.disabled = false;
    this.addEventListener("submit", this._onSubmit.bind(this));
  }
  async _onSubmit(event) {
    event.preventDefault();
    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }
    const submitButtons = Array.from(this.elements).filter((button) => button.type === "submit");
    submitButtons.forEach((submitButton) => {
      submitButton.setAttribute("disabled", "disabled");
      submitButton.setAttribute("aria-busy", "true");
    });
    const productForm = new FormData(this);
    productForm.append("sections", ["mini-cart"]);
    productForm.delete("option1");
    productForm.delete("option2");
    productForm.delete("option3");
    const response = await fetch(`${window.themeVariables.routes.cartAddUrl}.js`, {
      body: productForm,
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
        // This is needed for the endpoint to properly return 422
      }
    });
    submitButtons.forEach((submitButton) => {
      submitButton.removeAttribute("disabled");
      submitButton.removeAttribute("aria-busy");
    });
    const responseJson = await response.json();
    if (response.ok) {
      if (window.themeVariables.settings.cartType === "page" || window.themeVariables.settings.pageType === "cart") {
        return window.location.href = `${Shopify.routes.root}cart`;
      }
      this.dispatchEvent(new CustomEvent("variant:added", {
        bubbles: true,
        detail: {
          variant: responseJson.hasOwnProperty("items") ? responseJson["items"][0] : responseJson
        }
      }));
      fetch(`${window.themeVariables.routes.cartUrl}.js`).then(async (response2) => {
        const cartContent = await response2.json();
        document.documentElement.dispatchEvent(new CustomEvent("cart:updated", {
          bubbles: true,
          detail: {
            cart: cartContent
          }
        }));
        cartContent["sections"] = responseJson["sections"];
        document.documentElement.dispatchEvent(new CustomEvent("cart:refresh", {
          bubbles: true,
          detail: {
            cart: cartContent,
            openMiniCart: window.themeVariables.settings.cartType === "drawer" && this.closest(".drawer") === null
          }
        }));
      });
    }
    this.dispatchEvent(new CustomEvent("cart-notification:show", {
      bubbles: true,
      cancelable: true,
      detail: {
        status: response.ok ? "success" : "error",
        error: responseJson["description"] || ""
      }
    }));
  }
};
window.customElements.define("product-form", ProductForm, { extends: "form" });

// js/custom-element/section/product/product-media.js
var ProductMedia = class extends CustomHTMLElement {
  async connectedCallback() {
    this.mainCarousel = this.querySelector("flickity-carousel");
    if (this.hasAttribute("reveal-on-scroll")) {
      this._setupVisibility();
    }
    if (this.mainCarousel.childElementCount === 1) {
      return;
    }
    this.selectedVariantMediaId = null;
    this.viewInSpaceElement = this.querySelector("[data-shopify-model3d-id]");
    this.zoomButton = this.querySelector(".product__zoom-button");
    this.product = await ProductLoader.load(this.getAttribute("product-handle"));
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
    this.mainCarousel.addEventListener("model:played", () => this.mainCarousel.setDraggable(false));
    this.mainCarousel.addEventListener("model:paused", () => this.mainCarousel.setDraggable(true));
    this.mainCarousel.addEventListener("video:played", () => this.mainCarousel.setDraggable(false));
    this.mainCarousel.addEventListener("video:paused", () => this.mainCarousel.setDraggable(true));
    this.mainCarousel.addEventListener("flickity:ready", this._onFlickityReady.bind(this));
    this.mainCarousel.addEventListener("flickity:slide-changed", this._onFlickityChanged.bind(this));
    this.mainCarousel.addEventListener("flickity:slide-settled", this._onFlickitySettled.bind(this));
    this._onFlickityReady();
  }
  get thumbnailsPosition() {
    return window.matchMedia(window.themeVariables.breakpoints.pocket).matches ? "bottom" : this.getAttribute("thumbnails-position");
  }
  async _setupVisibility() {
    await this.untilVisible();
    const flickityInstance = await this.mainCarousel.flickityInstance, image = flickityInstance ? flickityInstance.selectedElement.querySelector("img") : this.querySelector(".product__media-image-wrapper img"), prefersReducedMotion = MediaFeatures.prefersReducedMotion();
    await imageLoaded(image);
    const animation = new CustomAnimation(new ParallelEffect([
      new CustomKeyframeEffect(image, { opacity: [0, 1], transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"] }, { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }),
      new ParallelEffect(Array.from(this.querySelectorAll(".product__thumbnail-item:not(.is-filtered)")).map((item, index) => {
        return new CustomKeyframeEffect(item, {
          opacity: [0, 1],
          transform: this.thumbnailsPosition === "left" ? [`translateY(${prefersReducedMotion ? 0 : "40px"})`, "translateY(0)"] : [`translateX(${prefersReducedMotion ? 0 : "50px"})`, "translateX(0)"]
        }, {
          duration: 250,
          delay: prefersReducedMotion ? 0 : 100 * index,
          easing: "cubic-bezier(0.75, 0, 0.175, 1)"
        });
      }))
    ]));
    this._hasSectionReloaded ? animation.finish() : animation.play();
  }
  async _onVariantChanged(event) {
    const variant = event.detail.variant;
    const filteredMediaIds = [];
    let shouldReload = false;
    this.product["media"].forEach((media) => {
      let matchMedia2 = variant["featured_media"] && media["id"] === variant["featured_media"]["id"];
      if (media["alt"]?.includes("#")) {
        shouldReload = true;
        if (!matchMedia2) {
          const altParts = media["alt"].split("#"), mediaGroupParts = altParts.pop().split("_");
          this.product["options"].forEach((option) => {
            if (option["name"].toLowerCase() === mediaGroupParts[0].toLowerCase()) {
              if (variant["options"][option["position"] - 1].toLowerCase() !== mediaGroupParts[1].trim().toLowerCase()) {
                filteredMediaIds.push(media["id"]);
              }
            }
          });
        }
      }
    });
    const currentlyFilteredIds = [...new Set(Array.from(this.querySelectorAll(".is-filtered[data-media-id]")).map((item) => parseInt(item.getAttribute("data-media-id"))))];
    if (currentlyFilteredIds.some((value) => !filteredMediaIds.includes(value))) {
      const selectedMediaId = variant["featured_media"] ? variant["featured_media"]["id"] : this.product["media"].map((item) => item.id).filter((item) => !filteredMediaIds.includes(item))[0];
      Array.from(this.querySelectorAll("[data-media-id]")).forEach((item) => {
        item.classList.toggle("is-filtered", filteredMediaIds.includes(parseInt(item.getAttribute("data-media-id"))));
        item.classList.toggle("is-selected", selectedMediaId === parseInt(item.getAttribute("data-media-id")));
        item.classList.toggle("is-initial-selected", selectedMediaId === parseInt(item.getAttribute("data-media-id")));
      });
      this.mainCarousel.reload();
    } else {
      if (!event.detail.variant["featured_media"] || this.selectedVariantMediaId === event.detail.variant["featured_media"]["id"]) {
        return;
      }
      this.mainCarousel.select(`[data-media-id="${event.detail.variant["featured_media"]["id"]}"]`);
    }
    this.selectedVariantMediaId = event.detail.variant["featured_media"] ? event.detail.variant["featured_media"]["id"] : null;
  }
  async _onFlickityReady() {
    const flickityInstance = await this.mainCarousel.flickityInstance;
    if (["video", "external_video"].includes(flickityInstance.selectedElement.getAttribute("data-media-type")) && this.hasAttribute("autoplay-video")) {
      flickityInstance.selectedElement.firstElementChild.play();
    }
  }
  async _onFlickityChanged() {
    const flickityInstance = await this.mainCarousel.flickityInstance;
    flickityInstance.cells.forEach((item) => {
      if (["external_video", "video", "model"].includes(item.element.getAttribute("data-media-type"))) {
        item.element.firstElementChild.pause();
      }
    });
  }
  async _onFlickitySettled() {
    const flickityInstance = await this.mainCarousel.flickityInstance, selectedSlide = flickityInstance.selectedElement;
    if (this.zoomButton) {
      this.zoomButton.hidden = selectedSlide.getAttribute("data-media-type") !== "image";
    }
    if (this.viewInSpaceElement) {
      this.viewInSpaceElement.setAttribute("data-shopify-model3d-id", this.viewInSpaceElement.getAttribute("data-shopify-model3d-default-id"));
    }
    switch (selectedSlide.getAttribute("data-media-type")) {
      case "model":
        this.viewInSpaceElement.setAttribute("data-shopify-model3d-id", selectedSlide.getAttribute("data-media-id"));
        selectedSlide.firstElementChild.play();
        break;
      case "external_video":
      case "video":
        if (this.hasAttribute("autoplay-video")) {
          selectedSlide.firstElementChild.play();
        }
        break;
    }
  }
};
window.customElements.define("product-media", ProductMedia);

// js/helper/currency.js
function formatMoney(cents, format = "") {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/, formatString = format || window.themeVariables.settings.moneyFormat;
  function defaultTo(value2, defaultValue) {
    return value2 == null || value2 !== value2 ? defaultValue : value2;
  }
  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2);
    thousands = defaultTo(thousands, ",");
    decimal = defaultTo(decimal, ".");
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100).toFixed(precision);
    let parts = number.split("."), dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands), centsAmount = parts[1] ? decimal + parts[1] : "";
    return dollarsAmount + centsAmount;
  }
  let value = "";
  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_space_separator":
      value = formatWithDelimiters(cents, 2, " ", ".");
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 2, "'", ".");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
    case "amount_no_decimals_with_space_separator":
      value = formatWithDelimiters(cents, 0, " ");
      break;
    case "amount_no_decimals_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 0, "'");
      break;
  }
  if (formatString.indexOf("with_comma_separator") !== -1) {
    return formatString.replace(placeholderRegex, value);
  } else {
    return formatString.replace(placeholderRegex, value);
  }
}

// js/custom-element/section/product/product-meta.js
var ProductMeta = class extends HTMLElement {
  connectedCallback() {
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
  }
  get priceClass() {
    return this.getAttribute("price-class") || "";
  }
  get unitPriceClass() {
    return this.getAttribute("unit-price-class") || "";
  }
  _onVariantChanged(event) {
    this._updateLabels(event.detail.variant);
    this._updatePrices(event.detail.variant);
    this._updateSku(event.detail.variant);
  }
  _updateLabels(variant) {
    let productLabelList = this.querySelector("[data-product-label-list]");
    if (!productLabelList) {
      return;
    }
    if (!variant) {
      productLabelList.innerHTML = "";
    } else {
      productLabelList.innerHTML = "";
      if (!variant["available"]) {
        productLabelList.innerHTML = `<span class="label label--subdued">${window.themeVariables.strings.collectionSoldOut}</span>`;
      } else if (variant["compare_at_price"] > variant["price"]) {
        let savings = "";
        if (window.themeVariables.settings.discountMode === "percentage") {
          savings = `${Math.round((variant["compare_at_price"] - variant["price"]) * 100 / variant["compare_at_price"])}%`;
        } else {
          savings = formatMoney(variant["compare_at_price"] - variant["price"]);
        }
        productLabelList.innerHTML = `<span class="label label--highlight">${window.themeVariables.strings.collectionDiscount.replace("@savings@", savings)}</span>`;
      }
    }
  }
  _updatePrices(variant) {
    let productPrices = this.querySelector("[data-product-price-list]"), currencyFormat = window.themeVariables.settings.currencyCodeEnabled ? window.themeVariables.settings.moneyWithCurrencyFormat : window.themeVariables.settings.moneyFormat;
    if (!productPrices) {
      return;
    }
    if (!variant) {
      productPrices.style.display = "none";
    } else {
      productPrices.innerHTML = "";
      if (variant["compare_at_price"] > variant["price"]) {
        productPrices.innerHTML += `<span class="price price--highlight ${this.priceClass}"><span class="visually-hidden">${window.themeVariables.strings.productSalePrice}</span>${formatMoney(variant["price"], currencyFormat)}</span>`;
        productPrices.innerHTML += `<span class="price price--compare"><span class="visually-hidden">${window.themeVariables.strings.productRegularPrice}</span>${formatMoney(variant["compare_at_price"], currencyFormat)}</span>`;
      } else {
        productPrices.innerHTML += `<span class="price ${this.priceClass}"><span class="visually-hidden">${window.themeVariables.strings.productSalePrice}</span>${formatMoney(variant["price"], currencyFormat)}</span>`;
      }
      if (variant["unit_price_measurement"]) {
        let referenceValue = "";
        if (variant["unit_price_measurement"]["reference_value"] !== 1) {
          referenceValue = `<span class="unit-price-measurement__reference-value">${variant["unit_price_measurement"]["reference_value"]}</span>`;
        }
        productPrices.innerHTML += `
          <div class="price text--subdued ${this.unitPriceClass}">
            <div class="unit-price-measurement">
              <span class="unit-price-measurement__price">${formatMoney(variant["unit_price"])}</span>
              <span class="unit-price-measurement__separator">/</span>
              ${referenceValue}
              <span class="unit-price-measurement__reference-unit">${variant["unit_price_measurement"]["reference_unit"]}</span>
            </div>
          </div>
        `;
      }
      productPrices.style.display = "";
    }
  }
  _updateSku(variant) {
    let productSku = this.querySelector("[data-product-sku-container]");
    if (!productSku) {
      return;
    }
    let productSkuNumber = productSku.querySelector("[data-product-sku-number]");
    if (!variant || !variant["sku"]) {
      productSku.style.display = "none";
    } else {
      productSkuNumber.innerHTML = variant["sku"];
      productSku.style.display = "";
    }
  }
};
window.customElements.define("product-meta", ProductMeta);

// js/custom-element/section/product-list/quick-buy-drawer.js
var QuickBuyDrawer = class extends DrawerContent {
  connectedCallback() {
    super.connectedCallback();
    this.delegate.on("variant:changed", this._onVariantChanged.bind(this));
  }
  async _load() {
    await super._load();
    this.imageElement = this.querySelector(".quick-buy-product__image");
    if (window.Shopify && window.Shopify.PaymentButton) {
      window.Shopify.PaymentButton.init();
    }
  }
  _onVariantChanged(event) {
    const variant = event.detail.variant;
    if (variant) {
      Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
        const url = new URL(link.href);
        url.searchParams.set("variant", variant["id"]);
        link.setAttribute("href", url.toString());
      });
    }
    if (!this.imageElement || !variant || !variant["featured_media"]) {
      return;
    }
    const featuredMedia = variant["featured_media"];
    if (featuredMedia["alt"]) {
      this.imageElement.setAttribute("alt", featuredMedia["alt"]);
    }
    this.imageElement.setAttribute("width", featuredMedia["preview_image"]["width"]);
    this.imageElement.setAttribute("height", featuredMedia["preview_image"]["height"]);
    this.imageElement.setAttribute("src", getSizedMediaUrl(featuredMedia, "342x"));
    this.imageElement.setAttribute("srcset", getMediaSrcset(featuredMedia, [114, 228, 342]));
  }
};
window.customElements.define("quick-buy-drawer", QuickBuyDrawer);

// js/custom-element/section/product-list/quick-buy-popover.js
var QuickBuyPopover = class extends PopoverContent {
  connectedCallback() {
    super.connectedCallback();
    this.delegate.on("variant:changed", this._onVariantChanged.bind(this));
    this.delegate.on("variant:added", () => this.open = false);
  }
  async _load() {
    await super._load();
    this.imageElement = this.querySelector(".quick-buy-product__image");
  }
  _onVariantChanged(event) {
    const variant = event.detail.variant;
    if (variant) {
      Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
        const url = new URL(link.href);
        url.searchParams.set("variant", variant["id"]);
        link.setAttribute("href", url.toString());
      });
    }
    if (!this.imageElement || !variant || !variant["featured_media"]) {
      return;
    }
    const featuredMedia = variant["featured_media"];
    if (featuredMedia["alt"]) {
      this.imageElement.setAttribute("alt", featuredMedia["alt"]);
    }
    this.imageElement.setAttribute("width", featuredMedia["preview_image"]["width"]);
    this.imageElement.setAttribute("height", featuredMedia["preview_image"]["height"]);
    this.imageElement.setAttribute("src", getSizedMediaUrl(featuredMedia, "195x"));
    this.imageElement.setAttribute("srcset", getMediaSrcset(featuredMedia, [65, 130, 195]));
  }
};
window.customElements.define("quick-buy-popover", QuickBuyPopover);

// js/custom-element/section/product/store-pickup.js
var StorePickup = class extends HTMLElement {
  connectedCallback() {
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
  }
  _onVariantChanged(event) {
    if (!event.detail.variant) {
      this.innerHTML = "";
    } else {
      this._renderForVariant(event.detail.variant["id"]);
    }
  }
  async _renderForVariant(id) {
    const response = await fetch(`${window.themeVariables.routes.rootUrlWithoutSlash}/variants/${id}?section_id=store-availability`), div = document.createElement("div");
    div.innerHTML = await response.text();
    this.innerHTML = div.firstElementChild.innerHTML.trim();
  }
};
window.customElements.define("store-pickup", StorePickup);

// js/custom-element/section/product/variants.js
var ProductVariants = class extends CustomHTMLElement {
  async connectedCallback() {
    this.masterSelector = document.getElementById(this.getAttribute("form-id")).id;
    this.optionSelectors = Array.from(this.querySelectorAll("[data-selector-type]"));
    if (!this.masterSelector) {
      console.warn(`The variant selector for product with handle ${this.productHandle} is not linked to any product form.`);
      return;
    }
    this.product = await ProductLoader.load(this.productHandle);
    this.delegate.on("change", '[name^="option"]', this._onOptionChanged.bind(this));
    this.masterSelector.addEventListener("change", this._onMasterSelectorChanged.bind(this));
    this._updateDisableSelectors();
    this.selectVariant(this.selectedVariant["id"]);
  }
  get selectedVariant() {
    return this._getVariantById(parseInt(this.masterSelector.value));
  }
  get productHandle() {
    return this.getAttribute("handle");
  }
  get hideSoldOutVariants() {
    return this.hasAttribute("hide-sold-out-variants");
  }
  get updateUrl() {
    return this.hasAttribute("update-url");
  }
  /**
   * Select a new variant by its ID
   */
  selectVariant(id) {
    if (!this._isVariantSelectable(this._getVariantById(id))) {
      id = this._getFirstMatchingAvailableOrSelectableVariant()["id"];
    }
    if (this.selectedVariant?.id === id) {
      return;
    }
    this.masterSelector.value = id;
    this.masterSelector.dispatchEvent(new Event("change", { bubbles: true }));
    if (this.updateUrl && history.replaceState) {
      const newUrl = new URL(window.location.href);
      if (id) {
        newUrl.searchParams.set("variant", id);
      } else {
        newUrl.searchParams.delete("variant");
      }
      window.history.replaceState({ path: newUrl.toString() }, "", newUrl.toString());
    }
    this._updateDisableSelectors();
    triggerEvent(this.masterSelector.form, "variant:changed", { variant: this.selectedVariant });
  }
  _onOptionChanged() {
    this.selectVariant(this._getVariantFromOptions()?.id);
  }
  _onMasterSelectorChanged() {
    const options = this.selectedVariant?.options || [];
    options.forEach((value, index) => {
      let input = this.querySelector(`input[name="option${index + 1}"][value="${CSS.escape(value)}"], select[name="option${index + 1}"]`), triggerChangeEvent = false;
      if (input.tagName === "SELECT") {
        triggerChangeEvent = input.value !== value;
        input.value = value;
      } else if (input.tagName === "INPUT") {
        triggerChangeEvent = !input.checked && input.value === value;
        input.checked = input.value === value;
      }
      if (triggerChangeEvent) {
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }
  /**
   * Get the product variant by its ID
   */
  _getVariantById(id) {
    return this.product["variants"].find((variant) => variant["id"] === id);
  }
  /**
   * Get the variant based on the options
   */
  _getVariantFromOptions() {
    const options = this._getSelectedOptionValues();
    return this.product["variants"].find((variant) => {
      return variant["options"].every((value, index) => value === options[index]);
    });
  }
  /**
   * Detect if a specific variant is selectable. This is used when the "hide sold out variant" option is enabled, to allow
   * to return true only if the variant is actually available
   */
  _isVariantSelectable(variant) {
    if (!variant) {
      return false;
    } else {
      return variant["available"] || !this.hideSoldOutVariants && !variant["available"];
    }
  }
  /**
   * This method is used internally to select an available or selectable variant, when the current choice does not
   * match the requirements. For instance, if sold out variants are configured to be hidden, but that the choices end
   * up being a non-valid variant, the theme automatically changes the variant to match the requirements. In the case
   * the customer end up on variant combinations that do not exist, it also switches to a valid combination.
   *
   * The algorithm is as follows: if we have for instance three options "Color", "Size" and "Material", we pop the last
   * option (Material) and try to find the first available variant for the given Color and Size. If none is found we
   * remove the second option (Size) and try to find the first available variant for the selected color. Finally, if none
   * is found we return the first available variant independently of any choice.
   */
  _getFirstMatchingAvailableOrSelectableVariant() {
    let options = this._getSelectedOptionValues(), matchedVariant = null, slicedCount = 0;
    do {
      options.pop();
      slicedCount += 1;
      matchedVariant = this.product["variants"].find((variant) => {
        if (this.hideSoldOutVariants) {
          return variant["available"] && variant["options"].slice(0, variant["options"].length - slicedCount).every((value, index) => value === options[index]);
        } else {
          return variant["options"].slice(0, variant["options"].length - slicedCount).every((value, index) => value === options[index]);
        }
      });
    } while (!matchedVariant && options.length > 0);
    return matchedVariant;
  }
  _getSelectedOptionValues() {
    const options = [];
    Array.from(this.querySelectorAll('input[name^="option"]:checked, select[name^="option"]')).forEach((option) => options.push(option.value));
    return options;
  }
  /**
   * We add specific class to sold out variants based on the selectors
   */
  _updateDisableSelectors() {
    const selectedVariant = this.selectedVariant;
    if (!selectedVariant) {
      return;
    }
    this._updateDisableSelectorsForOptionLevel(0, selectedVariant);
  }
  _updateDisableSelectorsForOptionLevel(level, selectedVariant) {
    if (!this.optionSelectors[level]) {
      return;
    }
    const applyClassToSelector = (selector, valueIndex, available, hasAtLeastOneCombination) => {
      let selectorType = selector.getAttribute("data-selector-type"), cssSelector = "";
      switch (selectorType) {
        case "swatch":
          cssSelector = `.color-swatch:nth-child(${valueIndex + 1})`;
          break;
        case "variant-image":
          cssSelector = `.variant-swatch:nth-child(${valueIndex + 1})`;
          break;
        case "block":
          cssSelector = `.block-swatch:nth-child(${valueIndex + 1})`;
          break;
        case "dropdown":
          cssSelector = `.combo-box__option-item:nth-child(${valueIndex + 1})`;
          break;
      }
      selector.querySelector(cssSelector).toggleAttribute("hidden", !hasAtLeastOneCombination);
      if (this.hideSoldOutVariants) {
        selector.querySelector(cssSelector).toggleAttribute("hidden", !available);
      } else {
        selector.querySelector(cssSelector).classList.toggle("is-disabled", !available);
      }
    };
    const hasCombination = (variant, level2, value, selectedVariant2) => {
      return Array.from({ length: level2 + 1 }, (_, i) => {
        if (i === level2) {
          return variant[`option${level2 + 1}`] === value;
        } else {
          return variant[`option${i + 1}`] === selectedVariant2[`option${i + 1}`];
        }
      }).every((condition) => condition);
    };
    this.product["options"][level]["values"].forEach((value, valueIndex) => {
      const hasAtLeastOneCombination = this.product["variants"].some(
        (variant) => hasCombination(variant, level, value, selectedVariant) && variant
      );
      const hasAvailableVariant = this.product["variants"].some(
        (variant) => hasCombination(variant, level, value, selectedVariant) && variant["available"]
      );
      applyClassToSelector(this.optionSelectors[level], valueIndex, hasAvailableVariant, hasAtLeastOneCombination);
      this._updateDisableSelectorsForOptionLevel(level + 1, selectedVariant);
    });
  }
};
window.customElements.define("product-variants", ProductVariants);

// js/custom-element/section/product-list/product-item.js
var ProductItem = class extends CustomHTMLElement {
  connectedCallback() {
    this.primaryImageList = Array.from(this.querySelectorAll(".product-item__primary-image"));
    this.delegate.on("change", ".product-item-meta__swatch-list .color-swatch__radio", this._onColorSwatchChanged.bind(this));
    this.delegate.on("mouseenter", ".product-item-meta__swatch-list .color-swatch__item", this._onColorSwatchHovered.bind(this), true);
  }
  async _onColorSwatchChanged(event, target) {
    Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
      let url;
      if (link.tagName === "A") {
        url = new URL(link.href);
      } else {
        url = new URL(link.getAttribute("href"), `https://${window.themeVariables.routes.host}`);
      }
      url.searchParams.set("variant", target.getAttribute("data-variant-id"));
      link.setAttribute("href", url.toString());
    });
    if (target.hasAttribute("data-variant-featured-media")) {
      const newImage = this.primaryImageList.find((image) => image.getAttribute("data-media-id") === target.getAttribute("data-variant-featured-media"));
      newImage.setAttribute("loading", "eager");
      const onImageLoaded = newImage.complete ? Promise.resolve() : new Promise((resolve) => newImage.onload = resolve);
      await onImageLoaded;
      newImage.removeAttribute("hidden");
      let properties = {};
      if (Array.from(newImage.parentElement.classList).some((item) => ["aspect-ratio--short", "aspect-ratio--tall", "aspect-ratio--square"].includes(item))) {
        properties = [
          { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)", transform: "translate(calc(-50% - 20px), -50%)", zIndex: 1, offset: 0 },
          { clipPath: "polygon(0 0, 20% 0, 5% 100%, 0 100%)", transform: "translate(calc(-50% - 20px), -50%)", zIndex: 1, offset: 0.3 },
          { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", transform: "translate(-50%, -50%)", zIndex: 1, offset: 1 }
        ];
      } else {
        properties = [
          { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)", transform: "translateX(-20px)", zIndex: 1, offset: 0 },
          { clipPath: "polygon(0 0, 20% 0, 5% 100%, 0 100%)", transform: "translateX(-20px)", zIndex: 1, offset: 0.3 },
          { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", transform: "translateX(0px)", zIndex: 1, offset: 1 }
        ];
      }
      await newImage.animate(properties, {
        duration: 500,
        easing: "ease-in-out"
      }).finished;
      this.primaryImageList.filter((image) => image.classList.contains("product-item__primary-image") && image !== newImage).forEach((image) => image.setAttribute("hidden", ""));
    }
  }
  _onColorSwatchHovered(event, target) {
    const input = target.previousElementSibling;
    if (input.hasAttribute("data-variant-featured-media")) {
      const newImage = this.primaryImageList.find((image) => image.getAttribute("data-media-id") === input.getAttribute("data-variant-featured-media"));
      newImage.setAttribute("loading", "eager");
    }
  }
};
window.customElements.define("product-item", ProductItem);

// js/custom-element/section/product-facet/product-facet.js
var ProductFacet = class extends CustomHTMLElement {
  connectedCallback() {
    this.delegate.on("pagination:page-changed", this._rerender.bind(this));
    this.delegate.on("facet:criteria-changed", this._rerender.bind(this));
    this.delegate.on("facet:abort-loading", this._abort.bind(this));
  }
  async _rerender(event) {
    history.replaceState({}, "", event.detail.url);
    this._abort();
    this.showLoadingBar();
    const url = new URL(window.location);
    url.searchParams.set("section_id", this.getAttribute("section-id"));
    try {
      this.abortController = new AbortController();
      const response = await fetch(url.toString(), { signal: this.abortController.signal });
      const responseAsText = await response.text();
      const fakeDiv = document.createElement("div");
      fakeDiv.innerHTML = responseAsText;
      this.querySelector("#facet-main").innerHTML = fakeDiv.querySelector("#facet-main").innerHTML;
      const activeFilterList = Array.from(fakeDiv.querySelectorAll(".product-facet__active-list")), toolbarItem = document.querySelector(".mobile-toolbar__item--filters");
      if (toolbarItem) {
        toolbarItem.classList.toggle("has-filters", activeFilterList.length > 0);
      }
      const filtersTempDiv = fakeDiv.querySelector("#facet-filters");
      if (filtersTempDiv) {
        const previousScrollTop = this.querySelector("#facet-filters .drawer__content").scrollTop;
        Array.from(this.querySelectorAll("#facet-filters-form .collapsible-toggle[aria-controls]")).forEach((filterToggle) => {
          const filtersTempDivToggle = filtersTempDiv.querySelector(`[aria-controls="${filterToggle.getAttribute("aria-controls")}"]`), isExpanded = filterToggle.getAttribute("aria-expanded") === "true";
          if (filtersTempDivToggle) {
            filtersTempDivToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
            filtersTempDivToggle.nextElementSibling.toggleAttribute("open", isExpanded);
            filtersTempDivToggle.nextElementSibling.style.overflow = isExpanded ? "visible" : "";
          }
        });
        this.querySelector("#facet-filters").innerHTML = filtersTempDiv.innerHTML;
        this.querySelector("#facet-filters .drawer__content").scrollTop = previousScrollTop;
      }
      const scrollTo = this.querySelector(".product-facet__meta-bar") || this.querySelector(".product-facet__product-list") || this.querySelector(".product-facet__main");
      requestAnimationFrame(() => {
        scrollTo.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      this.hideLoadingBar();
    } catch (e) {
      if (e.name === "AbortError") {
        return;
      }
    }
  }
  _abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
};
window.customElements.define("product-facet", ProductFacet);

// js/custom-element/section/facet/facet-filters.js
var FacetFilters = class extends DrawerContent {
  connectedCallback() {
    super.connectedCallback();
    this.delegate.on("change", '[name^="filter."]', this._onFilterChanged.bind(this));
    this.rootDelegate.on("click", '[data-action="clear-filters"]', this._onFiltersCleared.bind(this));
    if (this.alwaysVisible) {
      this.matchMedia = window.matchMedia(window.themeVariables.breakpoints.pocket);
      this.matchMedia.addListener(this._adjustDrawer.bind(this));
      this._adjustDrawer(this.matchMedia);
    }
  }
  get alwaysVisible() {
    return this.hasAttribute("always-visible");
  }
  _onFiltersCleared(event, target) {
    event.preventDefault();
    triggerEvent(this, "facet:criteria-changed", { url: target.href });
  }
  _onFilterChanged() {
    const formData = new FormData(this.querySelector("#facet-filters-form"));
    const searchParamsAsString = new URLSearchParams(formData).toString();
    triggerEvent(this, "facet:criteria-changed", { url: `${window.location.pathname}?${searchParamsAsString}` });
  }
  _adjustDrawer(match) {
    this.classList.toggle("drawer", match.matches);
    this.classList.toggle("drawer--from-left", match.matches);
  }
};
window.customElements.define("facet-filters", FacetFilters);

// js/custom-element/section/facet/sort-by-popover.js
var SortByPopover = class extends PopoverContent {
  connectedCallback() {
    super.connectedCallback();
    this.delegate.on("change", '[name="sort_by"]', this._onSortChanged.bind(this));
  }
  _onSortChanged(event, target) {
    const currentUrl = new URL(location.href);
    currentUrl.searchParams.set("sort_by", target.value);
    currentUrl.searchParams.delete("page");
    this.open = false;
    this.dispatchEvent(new CustomEvent("facet:criteria-changed", {
      bubbles: true,
      detail: {
        url: currentUrl.toString()
      }
    }));
  }
};
window.customElements.define("sort-by-popover", SortByPopover);

// js/custom-element/section/cart/cart-count.js
var CartCount = class extends CustomHTMLElement {
  connectedCallback() {
    this.rootDelegate.on("cart:updated", (event) => this.innerText = event.detail.cart["item_count"]);
    this.rootDelegate.on("cart:refresh", this._updateCartCount.bind(this));
  }
  _updateCartCount(event) {
    if (event?.detail?.cart) {
      this.innerText = event.detail.cart["item_count"];
    } else {
      fetch(Shopify.routes.root + "cart.js").then((response) => {
        response.json().then((responseAsJson) => {
          this.innerText = responseAsJson["item_count"];
        });
      });
    }
  }
};
window.customElements.define("cart-count", CartCount);

// js/custom-element/section/cart/cart-drawer.js
var CartDrawer = class extends DrawerContent {
  connectedCallback() {
    super.connectedCallback();
    this.nextReplacementDelay = 0;
    this.rootDelegate.on("cart:refresh", this._rerenderCart.bind(this));
    this.addEventListener("variant:added", () => this.nextReplacementDelay = 600);
  }
  async _rerenderCart(event) {
    let cartContent = null, html = "";
    if (event.detail && event.detail["cart"] && event.detail["cart"]["sections"]) {
      cartContent = event.detail["cart"];
      html = event.detail["cart"]["sections"]["mini-cart"];
    } else {
      const response = await fetch(`${window.themeVariables.routes.cartUrl}?section_id=${this.getAttribute("section")}`);
      html = await response.text();
    }
    const fakeDiv = document.createElement("div");
    fakeDiv.innerHTML = html;
    setTimeout(async () => {
      const previousPosition = this.querySelector(".drawer__content").scrollTop;
      if (cartContent && cartContent["item_count"] === 0) {
        const animation = new CustomAnimation(new ParallelEffect(Array.from(this.querySelectorAll(".drawer__content, .drawer__footer")).map((item) => {
          return new CustomKeyframeEffect(item, { opacity: [1, 0] }, { duration: 250, easing: "ease-in" });
        })));
        animation.play();
        await animation.finished;
      }
      this.innerHTML = fakeDiv.querySelector("cart-drawer").innerHTML;
      if (cartContent && cartContent["item_count"] === 0) {
        this.querySelector(".drawer__content").animate({ opacity: [0, 1], transform: ["translateY(40px)", "translateY(0)"] }, { duration: 450, easing: "cubic-bezier(0.33, 1, 0.68, 1)" });
      } else {
        this.querySelector(".drawer__content").scrollTop = previousPosition;
      }
      if (event?.detail?.openMiniCart) {
        this.clientWidth;
        this.open = true;
      }
    }, event?.detail?.replacementDelay || this.nextReplacementDelay);
    this.nextReplacementDelay = 0;
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "open":
        if (this.open) {
          this.querySelector(".drawer__content").scrollTop = 0;
          if (!MediaFeatures.prefersReducedMotion()) {
            const lineItems = Array.from(this.querySelectorAll(".line-item")), recommendationsInner = this.querySelector(".mini-cart__recommendations-inner"), bottomBar = this.querySelector(".drawer__footer"), effects = [];
            if (recommendationsInner && window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
              lineItems.push(recommendationsInner);
            }
            lineItems.forEach((item) => item.style.opacity = 0);
            recommendationsInner ? recommendationsInner.style.opacity = 0 : null;
            bottomBar ? bottomBar.style.opacity = 0 : null;
            effects.push(new ParallelEffect(lineItems.map((item, index) => {
              return new CustomKeyframeEffect(item, {
                opacity: [0, 1],
                transform: ["translateX(40px)", "translateX(0)"]
              }, {
                duration: 400,
                delay: 400 + 120 * index - Math.min(2 * index * index, 120 * index),
                easing: "cubic-bezier(0.25, 1, 0.5, 1)"
              });
            })));
            if (bottomBar) {
              effects.push(new CustomKeyframeEffect(bottomBar, {
                opacity: [0, 1],
                transform: ["translateY(100%)", "translateY(0)"]
              }, {
                duration: 300,
                delay: 400,
                easing: "cubic-bezier(0.25, 1, 0.5, 1)"
              }));
            }
            if (recommendationsInner && !window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
              effects.push(new CustomKeyframeEffect(recommendationsInner, {
                opacity: [0, 1],
                transform: ["translateX(100%)", "translateX(0)"]
              }, {
                duration: 250,
                delay: 400 + Math.max(120 * lineItems.length - 25 * lineItems.length, 25),
                easing: "cubic-bezier(0.25, 1, 0.5, 1)"
              }));
            }
            let animation = new CustomAnimation(new ParallelEffect(effects));
            animation.play();
          }
        }
    }
  }
};
window.customElements.define("cart-drawer", CartDrawer);

// js/custom-element/section/cart/cart-drawer-recommendations.js
var _CartDrawerRecommendations = class _CartDrawerRecommendations extends HTMLElement {
  async connectedCallback() {
    if (!_CartDrawerRecommendations.recommendationsCache[this.productId]) {
      _CartDrawerRecommendations.recommendationsCache[this.productId] = fetch(`${window.themeVariables.routes.productRecommendationsUrl}?product_id=${this.productId}&limit=10&section_id=${this.sectionId}`);
    }
    const response = await _CartDrawerRecommendations.recommendationsCache[this.productId];
    const div = document.createElement("div");
    div.innerHTML = await response.clone().text();
    const productRecommendationsElement = div.querySelector("cart-drawer-recommendations");
    if (productRecommendationsElement && productRecommendationsElement.hasChildNodes()) {
      this.innerHTML = productRecommendationsElement.innerHTML;
    } else {
      this.hidden = true;
    }
  }
  get productId() {
    return this.getAttribute("product-id");
  }
  get sectionId() {
    return this.getAttribute("section-id");
  }
};
__publicField(_CartDrawerRecommendations, "recommendationsCache", {});
var CartDrawerRecommendations = _CartDrawerRecommendations;
window.customElements.define("cart-drawer-recommendations", CartDrawerRecommendations);

// js/custom-element/section/cart/cart-note.js
var CartNote = class extends HTMLTextAreaElement {
  connectedCallback() {
    this.addEventListener("change", this._onNoteChanged.bind(this));
  }
  get ownedToggle() {
    return this.hasAttribute("aria-owns") ? document.getElementById(this.getAttribute("aria-owns")) : null;
  }
  async _onNoteChanged() {
    if (this.ownedToggle) {
      this.ownedToggle.innerHTML = this.value === "" ? window.themeVariables.strings.cartAddOrderNote : window.themeVariables.strings.cartEditOrderNote;
    }
    const response = await fetch(`${window.themeVariables.routes.cartUrl}/update.js`, {
      body: JSON.stringify({ note: this.value }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const cartContent = await response.json();
    document.documentElement.dispatchEvent(new CustomEvent("cart:updated", {
      bubbles: true,
      detail: {
        cart: cartContent
      }
    }));
  }
};
window.customElements.define("cart-note", CartNote, { extends: "textarea" });

// js/custom-element/section/cart/free-shipping-bar.js
var FreeShippingBar = class extends HTMLElement {
  connectedCallback() {
    document.documentElement.addEventListener("cart:updated", this._onCartUpdated.bind(this));
  }
  get threshold() {
    return parseFloat(this.getAttribute("threshold"));
  }
  _onCartUpdated(event) {
    const totalPrice = event.detail["cart"]["items"].filter((item) => item["requires_shipping"]).reduce((sum, item) => sum + item["final_line_price"], 0);
    this.style.setProperty("--progress", Math.min(totalPrice / this.threshold, 1));
  }
};
window.customElements.define("free-shipping-bar", FreeShippingBar);

// js/custom-element/section/cart/item-quantity.js
var LineItemQuantity = class extends CustomHTMLElement {
  connectedCallback() {
    this.delegate.on("click", "a", this._onQuantityLinkClicked.bind(this));
    this.delegate.on("change", "input", this._onQuantityChanged.bind(this));
  }
  _onQuantityLinkClicked(event, target) {
    event.preventDefault();
    this._updateFromLink(target.href);
  }
  _onQuantityChanged(event, target) {
    this._updateFromLink(`${window.themeVariables.routes.cartChangeUrl}?quantity=${target.value}&line=${target.getAttribute("data-line")}`);
  }
  async _updateFromLink(link) {
    if (window.themeVariables.settings.pageType === "cart") {
      window.location.href = link;
      return;
    }
    const changeUrl = new URL(link, `https://${window.themeVariables.routes.host}`), searchParams = changeUrl.searchParams, line = searchParams.get("line"), id = searchParams.get("id"), quantity = parseInt(searchParams.get("quantity"));
    this.dispatchEvent(new CustomEvent("line-item-quantity:change:start", { bubbles: true, detail: { newLineQuantity: quantity } }));
    const response = await fetch(`${window.themeVariables.routes.cartChangeUrl}.js`, {
      body: JSON.stringify({ line, id, quantity, sections: ["mini-cart"] }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      const cartContent = await response.json();
      this.dispatchEvent(new CustomEvent("line-item-quantity:change:end", { bubbles: true, detail: { cart: cartContent, newLineQuantity: quantity } }));
      document.documentElement.dispatchEvent(new CustomEvent("cart:updated", {
        bubbles: true,
        detail: {
          cart: cartContent
        }
      }));
      document.documentElement.dispatchEvent(new CustomEvent("cart:refresh", {
        bubbles: true,
        detail: {
          cart: cartContent,
          replacementDelay: quantity === 0 ? 600 : 750
        }
      }));
    } else {
      this.dispatchEvent(new CustomEvent("line-item-quantity:change:end", { bubbles: true }));
    }
  }
};
window.customElements.define("line-item-quantity", LineItemQuantity);

// js/custom-element/section/cart/line-item.js
var LineItem = class extends HTMLElement {
  connectedCallback() {
    this.lineItemLoader = this.querySelector(".line-item__loader");
    this.addEventListener("line-item-quantity:change:start", this._onQuantityStart.bind(this));
    this.addEventListener("line-item-quantity:change:end", this._onQuantityEnd.bind(this));
  }
  _onQuantityStart() {
    if (!this.lineItemLoader) {
      return;
    }
    this.lineItemLoader.hidden = false;
    this.lineItemLoader.firstElementChild.hidden = false;
    this.lineItemLoader.lastElementChild.hidden = true;
  }
  async _onQuantityEnd(event) {
    if (event?.detail?.cart["item_count"] === 0) {
      return;
    }
    if (this.lineItemLoader) {
      await this.lineItemLoader.firstElementChild.animate({ opacity: [1, 0], transform: ["translateY(0)", "translateY(-10px)"] }, 75).finished;
      this.lineItemLoader.firstElementChild.hidden = true;
      if (event?.detail?.newLineQuantity === 0) {
        await this.animate({ opacity: [1, 0], height: [`${this.clientHeight}px`, 0] }, { duration: 300, easing: "ease" }).finished;
        this.remove();
      } else {
        this.lineItemLoader.lastElementChild.hidden = false;
        await this.lineItemLoader.lastElementChild.animate({ opacity: [0, 1], transform: ["translateY(10px)", "translateY(0)"] }, { duration: 75, endDelay: 300 }).finished;
        this.lineItemLoader.hidden = true;
      }
    }
  }
};
window.customElements.define("line-item", LineItem);

// js/custom-element/section/cart/notification.js
var CartNotification = class extends CustomHTMLElement {
  connectedCallback() {
    this.rootDelegate.on("cart-notification:show", this._onShow.bind(this), !this.hasAttribute("global"));
    this.delegate.on("click", '[data-action="close"]', (event) => {
      event.stopPropagation();
      this.hidden = true;
    });
    this.addEventListener("mouseenter", this.stopTimer.bind(this));
    this.addEventListener("mouseleave", this.startTimer.bind(this));
    window.addEventListener("pagehide", () => this.hidden = true);
  }
  set hidden(value) {
    if (!value) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
    this.toggleAttribute("hidden", value);
  }
  get isInsideDrawer() {
    return this.classList.contains("cart-notification--drawer");
  }
  stopTimer() {
    clearTimeout(this._timeout);
  }
  startTimer() {
    this._timeout = setTimeout(() => this.hidden = true, 3e3);
  }
  _onShow(event) {
    if (this.isInsideDrawer && !this.closest(".drawer").open) {
      return;
    }
    if (this.hasAttribute("global") && event.detail.status === "success" && window.themeVariables.settings.cartType === "drawer") {
      return;
    }
    event.stopPropagation();
    let closeButtonHtml = "";
    if (!this.isInsideDrawer) {
      closeButtonHtml = `
        <button class="cart-notification__close tap-area hidden-phone" data-action="close">
          <span class="visually-hidden">${window.themeVariables.strings.accessibilityClose}</span>
          <svg focusable="false" width="14" height="14" class="icon icon--close icon--inline" viewBox="0 0 14 14">
            <path d="M13 13L1 1M13 1L1 13" stroke="currentColor" stroke-width="2" fill="none"></path>
          </svg>
        </button>
      `;
    }
    if (event.detail.status === "success") {
      this.classList.remove("cart-notification--error");
      this.innerHTML = `
        <div class="cart-notification__overflow">
          <div class="container">
            <div class="cart-notification__wrapper">
              <svg focusable="false" width="20" height="20" class="icon icon--cart-notification" viewBox="0 0 20 20">
                <rect width="20" height="20" rx="10" fill="currentColor"></rect>
                <path d="M6 10L9 13L14 7" fill="none" stroke="rgb(var(--success-color))" stroke-width="2"></path>
              </svg>
              
              <div class="cart-notification__text-wrapper">
                <span class="cart-notification__heading heading hidden-phone">${window.themeVariables.strings.cartItemAdded}</span>
                <span class="cart-notification__heading heading hidden-tablet-and-up">${window.themeVariables.strings.cartItemAddedShort}</span>
                <a href="${window.themeVariables.routes.cartUrl}" class="cart-notification__view-cart link">${window.themeVariables.strings.cartViewCart}</a>
              </div>
              
              ${closeButtonHtml}
            </div>
          </div>
        </div>
      `;
    } else {
      this.classList.add("cart-notification--error");
      this.innerHTML = `
        <div class="cart-notification__overflow">
          <div class="container">
            <div class="cart-notification__wrapper">
              <svg focusable="false" width="20" height="20" class="icon icon--cart-notification" viewBox="0 0 20 20">
                <rect width="20" height="20" rx="10" fill="currentColor"></rect>
                <path d="M9.6748 13.2798C9.90332 13.0555 10.1763 12.9434 10.4937 12.9434C10.811 12.9434 11.0819 13.0555 11.3062 13.2798C11.5347 13.5041 11.6489 13.7749 11.6489 14.0923C11.6489 14.4097 11.5347 14.6847 11.3062 14.9175C11.0819 15.146 10.811 15.2603 10.4937 15.2603C10.1763 15.2603 9.90332 15.146 9.6748 14.9175C9.45052 14.6847 9.33838 14.4097 9.33838 14.0923C9.33838 13.7749 9.45052 13.5041 9.6748 13.2798ZM9.56689 12.1816V5.19922H11.4141V12.1816H9.56689Z" fill="rgb(var(--error-color))"></path>
              </svg>
              
              <div class="cart-notification__text-wrapper">
                <span class="cart-notification__heading heading">${event.detail.error}</span>
              </div>
              
              ${closeButtonHtml}
            </div>
          </div>
        </div>
      `;
    }
    this.clientHeight;
    this.hidden = false;
  }
};
window.customElements.define("cart-notification", CartNotification);

// js/custom-element/section/cart/shipping-estimator.js
var ShippingEstimator = class extends HTMLElement {
  connectedCallback() {
    this.submitButton = this.querySelector('[type="button"]');
    this.submitButton.addEventListener("click", this._estimateShipping.bind(this));
  }
  /**
   * @doc https://shopify.dev/docs/themes/ajax-api/reference/cart#generate-shipping-rates
   */
  async _estimateShipping() {
    const zip = this.querySelector('[name="shipping-estimator[zip]"]').value, country = this.querySelector('[name="shipping-estimator[country]"]').value, province = this.querySelector('[name="shipping-estimator[province]"]').value;
    this.submitButton.setAttribute("aria-busy", "true");
    const prepareResponse = await fetch(`${window.themeVariables.routes.cartUrl}/prepare_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`, { method: "POST" });
    if (prepareResponse.ok) {
      const shippingRates = await this._getAsyncShippingRates(zip, country, province);
      this._formatShippingRates(shippingRates);
    } else {
      const jsonError = await prepareResponse.json();
      this._formatError(jsonError);
    }
    this.submitButton.removeAttribute("aria-busy");
  }
  async _getAsyncShippingRates(zip, country, province) {
    const response = await fetch(`${window.themeVariables.routes.cartUrl}/async_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`);
    const responseAsText = await response.text();
    if (responseAsText === "null") {
      return this._getAsyncShippingRates(zip, country, province);
    } else {
      return JSON.parse(responseAsText)["shipping_rates"];
    }
  }
  _formatShippingRates(shippingRates) {
    this.querySelector(".shipping-estimator__results")?.remove();
    let formattedShippingRates = "";
    shippingRates.forEach((shippingRate) => {
      formattedShippingRates += `<li>${shippingRate["presentment_name"]}: ${formatMoney(parseFloat(shippingRate["price"]) * 100)}</li>`;
    });
    const html = `
      <div class="shipping-estimator__results">
        <p>${shippingRates.length === 0 ? window.themeVariables.strings.shippingEstimatorNoResults : shippingRates.length === 1 ? window.themeVariables.strings.shippingEstimatorOneResult : window.themeVariables.strings.shippingEstimatorMultipleResults}</p>
        ${formattedShippingRates === "" ? "" : `<ul class="unordered-list">${formattedShippingRates}</ul>`}
      </div>
    `;
    this.insertAdjacentHTML("beforeend", html);
  }
  _formatError(errors) {
    this.querySelector(".shipping-estimator__results")?.remove();
    let formattedShippingRates = "";
    Object.keys(errors).forEach((errorKey) => {
      formattedShippingRates += `<li>${errorKey} ${errors[errorKey]}</li>`;
    });
    const html = `
      <div class="shipping-estimator__results">
        <p>${window.themeVariables.strings.shippingEstimatorError}</p>
        <ul class="unordered-list">${formattedShippingRates}</ul>
      </div>
    `;
    this.insertAdjacentHTML("beforeend", html);
  }
};
window.customElements.define("shipping-estimator", ShippingEstimator);

// js/custom-element/section/product/review-link.js
var ReviewLink = class extends HTMLAnchorElement {
  constructor() {
    super();
    this.addEventListener("click", this._onClick.bind(this));
  }
  _onClick() {
    const shopifyReviewsElement = document.getElementById("shopify-product-reviews");
    if (!shopifyReviewsElement) {
      return;
    }
    if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
      shopifyReviewsElement.closest("collapsible-content").open = true;
    } else {
      document.querySelector(`[aria-controls="${shopifyReviewsElement.closest(".product-tabs__tab-item-wrapper").id}"]`).click();
    }
  }
};
window.customElements.define("review-link", ReviewLink, { extends: "a" });

// js/custom-element/section/product/sticky-form.js
var ProductStickyForm = class extends HTMLElement {
  connectedCallback() {
    document.getElementById(this.getAttribute("form-id"))?.addEventListener("variant:changed", this._onVariantChanged.bind(this));
    this.imageElement = this.querySelector(".product-sticky-form__image");
    this.priceElement = this.querySelector(".product-sticky-form__price");
    this.unitPriceElement = this.querySelector(".product-sticky-form__unit-price");
    this._setupVisibilityObservers();
  }
  disconnectedCallback() {
    this.intersectionObserver.disconnect();
  }
  set hidden(value) {
    this.toggleAttribute("hidden", value);
    if (value) {
      document.documentElement.style.removeProperty("--cart-notification-offset");
    } else {
      document.documentElement.style.setProperty("--cart-notification-offset", `${this.clientHeight}px`);
    }
  }
  _onVariantChanged(event) {
    const variant = event.detail.variant, currencyFormat = window.themeVariables.settings.currencyCodeEnabled ? window.themeVariables.settings.moneyWithCurrencyFormat : window.themeVariables.settings.moneyFormat;
    if (!variant) {
      return;
    }
    if (this.priceElement) {
      this.priceElement.innerHTML = formatMoney(variant["price"], currencyFormat);
    }
    if (this.unitPriceElement) {
      this.unitPriceElement.style.display = variant["unit_price_measurement"] ? "block" : "none";
      if (variant["unit_price_measurement"]) {
        let referenceValue = "";
        if (variant["unit_price_measurement"]["reference_value"] !== 1) {
          referenceValue = `<span class="unit-price-measurement__reference-value">${variant["unit_price_measurement"]["reference_value"]}</span>`;
        }
        this.unitPriceElement.innerHTML = `
          <div class="unit-price-measurement">
            <span class="unit-price-measurement__price">${formatMoney(variant["unit_price"])}</span>
            <span class="unit-price-measurement__separator">/</span>
            ${referenceValue}
            <span class="unit-price-measurement__reference-unit">${variant["unit_price_measurement"]["reference_unit"]}</span>
          </div>
        `;
      }
    }
    if (!this.imageElement || !variant || !variant["featured_media"]) {
      return;
    }
    const featuredMedia = variant["featured_media"];
    if (featuredMedia["alt"]) {
      this.imageElement.setAttribute("alt", featuredMedia["alt"]);
    }
    this.imageElement.setAttribute("width", featuredMedia["preview_image"]["width"]);
    this.imageElement.setAttribute("height", featuredMedia["preview_image"]["height"]);
    this.imageElement.setAttribute("src", getSizedMediaUrl(featuredMedia, "165x"));
    this.imageElement.setAttribute("srcset", getMediaSrcset(featuredMedia, [55, 110, 165]));
  }
  _setupVisibilityObservers() {
    const paymentContainerElement = document.getElementById("MainPaymentContainer"), footerElement = document.querySelector(".shopify-section--footer"), stickyHeaderOffset = getStickyHeaderOffset();
    this._isFooterVisible = this._isPaymentContainerPassed = false;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === footerElement) {
          this._isFooterVisible = entry.intersectionRatio > 0;
        }
        if (entry.target === paymentContainerElement) {
          const boundingRect = paymentContainerElement.getBoundingClientRect();
          this._isPaymentContainerPassed = entry.intersectionRatio === 0 && boundingRect.top + boundingRect.height <= stickyHeaderOffset;
        }
      });
      if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
        this.hidden = !this._isPaymentContainerPassed || this._isFooterVisible;
      } else {
        this.hidden = !this._isPaymentContainerPassed;
      }
    }, { rootMargin: `-${stickyHeaderOffset}px 0px 0px 0px` });
    this.intersectionObserver.observe(paymentContainerElement);
    this.intersectionObserver.observe(footerElement);
  }
};
window.customElements.define("product-sticky-form", ProductStickyForm);

// js/theme.js
(() => {
  new InputBindingManager();
})();
(() => {
  if (Shopify.designMode) {
    document.addEventListener("shopify:section:load", () => {
      if (window.SPR) {
        window.SPR.initDomEls();
        window.SPR.loadProducts();
      }
    });
  }
  window.SPRCallbacks = {
    onFormSuccess: (event, info) => {
      document.getElementById(`form_${info.id}`).classList.add("spr-form--success");
    }
  };
})();
(() => {
  let previousClientWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth;
  let setViewportProperty = () => {
    const clientWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth, clientHeight = window.visualViewport ? window.visualViewport.height : document.documentElement.clientHeight;
    if (clientWidth === previousClientWidth) {
      return;
    }
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--window-height", clientHeight + "px");
      previousClientWidth = clientWidth;
    });
  };
  setViewportProperty();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportProperty);
  } else {
    window.addEventListener("resize", setViewportProperty);
  }
})();
(() => {
  let documentDelegate = new main_default(document.body);
  documentDelegate.on("change", 'input:not([type="checkbox"]):not([type="radio"]), textarea', (event, target) => {
    target.classList.toggle("is-filled", target.value !== "");
  });
  documentDelegate.on("change", "select", (event, target) => {
    target.parentNode.classList.toggle("is-filled", target.value !== "");
  });
})();
(() => {
  document.querySelectorAll(".rte table").forEach((table) => {
    table.outerHTML = '<div class="table-wrapper">' + table.outerHTML + "</div>";
  });
  document.querySelectorAll(".rte iframe").forEach((iframe) => {
    if (iframe.src.indexOf("youtube") !== -1 || iframe.src.indexOf("youtu.be") !== -1 || iframe.src.indexOf("vimeo") !== -1) {
      iframe.outerHTML = '<div class="video-wrapper">' + iframe.outerHTML + "</div>";
    }
  });
})();
(() => {
  let documentDelegate = new main_default(document.documentElement);
  documentDelegate.on("click", "[data-smooth-scroll]", (event, target) => {
    const elementToScroll = document.querySelector(target.getAttribute("href"));
    if (elementToScroll) {
      event.preventDefault();
      elementToScroll.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();
(() => {
  document.addEventListener("keyup", function(event) {
    if (event.key === "Tab") {
      document.body.classList.remove("no-focus-outline");
      document.body.classList.add("focus-outline");
    }
  });
})();
/*! Bundled license information:

tabbable/dist/index.esm.js:
  (*!
  * tabbable 6.2.0
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  *)

focus-trap/dist/focus-trap.esm.js:
  (*!
  * focus-trap 7.5.4
  * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
  *)
*/


// Vendor js

(() => {
  // node_modules/@ungap/custom-elements/index.js
  (function() {
    "use strict";
    var attributesObserver = function(whenDefined2, MutationObserver2) {
      var attributeChanged = function attributeChanged2(records) {
        for (var i = 0, length = records.length; i < length; i++)
          dispatch(records[i]);
      };
      var dispatch = function dispatch2(_ref2) {
        var target = _ref2.target, attributeName = _ref2.attributeName, oldValue = _ref2.oldValue;
        target.attributeChangedCallback(attributeName, oldValue, target.getAttribute(attributeName));
      };
      return function(target, is2) {
        var attributeFilter = target.constructor.observedAttributes;
        if (attributeFilter) {
          whenDefined2(is2).then(function() {
            new MutationObserver2(attributeChanged).observe(target, {
              attributes: true,
              attributeOldValue: true,
              attributeFilter
            });
            for (var i = 0, length = attributeFilter.length; i < length; i++) {
              if (target.hasAttribute(attributeFilter[i]))
                dispatch({
                  target,
                  attributeName: attributeFilter[i],
                  oldValue: null
                });
            }
          });
        }
        return target;
      };
    };
    function _unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++)
        arr2[i] = arr[i];
      return arr2;
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
      if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
          if (it)
            o = it;
          var i = 0;
          var F = function() {
          };
          return {
            s: F,
            n: function() {
              if (i >= o.length)
                return {
                  done: true
                };
              return {
                done: false,
                value: o[i++]
              };
            },
            e: function(e) {
              throw e;
            },
            f: F
          };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var normalCompletion = true, didErr = false, err;
      return {
        s: function() {
          it = it.call(o);
        },
        n: function() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function(e) {
          didErr = true;
          err = e;
        },
        f: function() {
          try {
            if (!normalCompletion && it.return != null)
              it.return();
          } finally {
            if (didErr)
              throw err;
          }
        }
      };
    }
    var TRUE = true, FALSE = false, QSA$1 = "querySelectorAll";
    var notify = function notify2(callback) {
      var root = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : document;
      var MO = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : MutationObserver;
      var query2 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ["*"];
      var loop = function loop2(nodes, selectors, added, removed, connected, pass) {
        var _iterator = _createForOfIteratorHelper(nodes), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var node = _step.value;
            if (pass || QSA$1 in node) {
              if (connected) {
                if (!added.has(node)) {
                  added.add(node);
                  removed["delete"](node);
                  callback(node, connected);
                }
              } else if (!removed.has(node)) {
                removed.add(node);
                added["delete"](node);
                callback(node, connected);
              }
              if (!pass)
                loop2(node[QSA$1](selectors), selectors, added, removed, connected, TRUE);
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      };
      var mo = new MO(function(records) {
        if (query2.length) {
          var selectors = query2.join(",");
          var added = new Set(), removed = new Set();
          var _iterator2 = _createForOfIteratorHelper(records), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var _step2$value = _step2.value, addedNodes = _step2$value.addedNodes, removedNodes = _step2$value.removedNodes;
              loop(removedNodes, selectors, added, removed, FALSE, FALSE);
              loop(addedNodes, selectors, added, removed, TRUE, FALSE);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      });
      var observe = mo.observe;
      (mo.observe = function(node) {
        return observe.call(mo, node, {
          subtree: TRUE,
          childList: TRUE
        });
      })(root);
      return mo;
    };
    var QSA = "querySelectorAll";
    var _self$1 = self, document$2 = _self$1.document, Element$1 = _self$1.Element, MutationObserver$2 = _self$1.MutationObserver, Set$2 = _self$1.Set, WeakMap$1 = _self$1.WeakMap;
    var elements = function elements2(element) {
      return QSA in element;
    };
    var filter = [].filter;
    var qsaObserver = function(options) {
      var live = new WeakMap$1();
      var drop = function drop2(elements2) {
        for (var i = 0, length = elements2.length; i < length; i++)
          live["delete"](elements2[i]);
      };
      var flush = function flush2() {
        var records = observer.takeRecords();
        for (var i = 0, length = records.length; i < length; i++) {
          parse2(filter.call(records[i].removedNodes, elements), false);
          parse2(filter.call(records[i].addedNodes, elements), true);
        }
      };
      var matches = function matches2(element) {
        return element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
      };
      var notifier = function notifier2(element, connected) {
        var selectors;
        if (connected) {
          for (var q, m = matches(element), i = 0, length = query2.length; i < length; i++) {
            if (m.call(element, q = query2[i])) {
              if (!live.has(element))
                live.set(element, new Set$2());
              selectors = live.get(element);
              if (!selectors.has(q)) {
                selectors.add(q);
                options.handle(element, connected, q);
              }
            }
          }
        } else if (live.has(element)) {
          selectors = live.get(element);
          live["delete"](element);
          selectors.forEach(function(q2) {
            options.handle(element, connected, q2);
          });
        }
      };
      var parse2 = function parse3(elements2) {
        var connected = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        for (var i = 0, length = elements2.length; i < length; i++)
          notifier(elements2[i], connected);
      };
      var query2 = options.query;
      var root = options.root || document$2;
      var observer = notify(notifier, root, MutationObserver$2, query2);
      var attachShadow2 = Element$1.prototype.attachShadow;
      if (attachShadow2)
        Element$1.prototype.attachShadow = function(init2) {
          var shadowRoot = attachShadow2.call(this, init2);
          observer.observe(shadowRoot);
          return shadowRoot;
        };
      if (query2.length)
        parse2(root[QSA](query2));
      return {
        drop,
        flush,
        observer,
        parse: parse2
      };
    };
    var _self = self, document$1 = _self.document, Map = _self.Map, MutationObserver$1 = _self.MutationObserver, Object$1 = _self.Object, Set$1 = _self.Set, WeakMap = _self.WeakMap, Element = _self.Element, HTMLElement = _self.HTMLElement, Node = _self.Node, Error2 = _self.Error, TypeError$1 = _self.TypeError, Reflect = _self.Reflect;
    var defineProperty = Object$1.defineProperty, keys = Object$1.keys, getOwnPropertyNames = Object$1.getOwnPropertyNames, setPrototypeOf = Object$1.setPrototypeOf;
    var legacy = !self.customElements;
    var expando = function expando2(element) {
      var key = keys(element);
      var value = [];
      var ignore = new Set$1();
      var length = key.length;
      for (var i = 0; i < length; i++) {
        value[i] = element[key[i]];
        try {
          delete element[key[i]];
        } catch (SafariTP) {
          ignore.add(i);
        }
      }
      return function() {
        for (var _i = 0; _i < length; _i++)
          ignore.has(_i) || (element[key[_i]] = value[_i]);
      };
    };
    if (legacy) {
      var HTMLBuiltIn = function HTMLBuiltIn2() {
        var constructor = this.constructor;
        if (!classes.has(constructor))
          throw new TypeError$1("Illegal constructor");
        var is2 = classes.get(constructor);
        if (override)
          return augment(override, is2);
        var element = createElement.call(document$1, is2);
        return augment(setPrototypeOf(element, constructor.prototype), is2);
      };
      var createElement = document$1.createElement;
      var classes = new Map();
      var defined = new Map();
      var prototypes = new Map();
      var registry = new Map();
      var query = [];
      var handle = function handle2(element, connected, selector) {
        var proto = prototypes.get(selector);
        if (connected && !proto.isPrototypeOf(element)) {
          var redefine = expando(element);
          override = setPrototypeOf(element, proto);
          try {
            new proto.constructor();
          } finally {
            override = null;
            redefine();
          }
        }
        var method = "".concat(connected ? "" : "dis", "connectedCallback");
        if (method in proto)
          element[method]();
      };
      var _qsaObserver = qsaObserver({
        query,
        handle
      }), parse = _qsaObserver.parse;
      var override = null;
      var whenDefined = function whenDefined2(name) {
        if (!defined.has(name)) {
          var _, $ = new Promise(function($2) {
            _ = $2;
          });
          defined.set(name, {
            $,
            _
          });
        }
        return defined.get(name).$;
      };
      var augment = attributesObserver(whenDefined, MutationObserver$1);
      self.customElements = {
        define: function define2(is2, Class) {
          if (registry.has(is2))
            throw new Error2('the name "'.concat(is2, '" has already been used with this registry'));
          classes.set(Class, is2);
          prototypes.set(is2, Class.prototype);
          registry.set(is2, Class);
          query.push(is2);
          whenDefined(is2).then(function() {
            parse(document$1.querySelectorAll(is2));
          });
          defined.get(is2)._(Class);
        },
        get: function get2(is2) {
          return registry.get(is2);
        },
        whenDefined
      };
      defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, "constructor", {
        value: HTMLBuiltIn
      });
      self.HTMLElement = HTMLBuiltIn;
      document$1.createElement = function(name, options) {
        var is2 = options && options.is;
        var Class = is2 ? registry.get(is2) : registry.get(name);
        return Class ? new Class() : createElement.call(document$1, name);
      };
      if (!("isConnected" in Node.prototype))
        defineProperty(Node.prototype, "isConnected", {
          configurable: true,
          get: function get2() {
            return !(this.ownerDocument.compareDocumentPosition(this) & this.DOCUMENT_POSITION_DISCONNECTED);
          }
        });
    } else {
      legacy = !self.customElements.get("extends-br");
      if (legacy) {
        try {
          var BR = function BR2() {
            return self.Reflect.construct(HTMLBRElement, [], BR2);
          };
          BR.prototype = HTMLLIElement.prototype;
          var is = "extends-br";
          self.customElements.define("extends-br", BR, {
            "extends": "br"
          });
          legacy = document$1.createElement("br", {
            is
          }).outerHTML.indexOf(is) < 0;
          var _self$customElements = self.customElements, get = _self$customElements.get, _whenDefined = _self$customElements.whenDefined;
          self.customElements.whenDefined = function(is2) {
            var _this = this;
            return _whenDefined.call(this, is2).then(function(Class) {
              return Class || get.call(_this, is2);
            });
          };
        } catch (o_O) {
        }
      }
    }
    if (legacy) {
      var _parseShadow = function _parseShadow2(element) {
        var root = shadowRoots.get(element);
        _parse(root.querySelectorAll(this), element.isConnected);
      };
      var customElements = self.customElements;
      var _createElement = document$1.createElement;
      var define = customElements.define, _get = customElements.get, upgrade = customElements.upgrade;
      var _ref = Reflect || {
        construct: function construct2(HTMLElement2) {
          return HTMLElement2.call(this);
        }
      }, construct = _ref.construct;
      var shadowRoots = new WeakMap();
      var shadows = new Set$1();
      var _classes = new Map();
      var _defined = new Map();
      var _prototypes = new Map();
      var _registry = new Map();
      var shadowed = [];
      var _query = [];
      var getCE = function getCE2(is2) {
        return _registry.get(is2) || _get.call(customElements, is2);
      };
      var _handle = function _handle2(element, connected, selector) {
        var proto = _prototypes.get(selector);
        if (connected && !proto.isPrototypeOf(element)) {
          var redefine = expando(element);
          _override = setPrototypeOf(element, proto);
          try {
            new proto.constructor();
          } finally {
            _override = null;
            redefine();
          }
        }
        var method = "".concat(connected ? "" : "dis", "connectedCallback");
        if (method in proto)
          element[method]();
      };
      var _qsaObserver2 = qsaObserver({
        query: _query,
        handle: _handle
      }), _parse = _qsaObserver2.parse;
      var _qsaObserver3 = qsaObserver({
        query: shadowed,
        handle: function handle2(element, connected) {
          if (shadowRoots.has(element)) {
            if (connected)
              shadows.add(element);
            else
              shadows["delete"](element);
            if (_query.length)
              _parseShadow.call(_query, element);
          }
        }
      }), parseShadowed = _qsaObserver3.parse;
      var attachShadow = Element.prototype.attachShadow;
      if (attachShadow)
        Element.prototype.attachShadow = function(init2) {
          var root = attachShadow.call(this, init2);
          shadowRoots.set(this, root);
          return root;
        };
      var _whenDefined2 = function _whenDefined22(name) {
        if (!_defined.has(name)) {
          var _, $ = new Promise(function($2) {
            _ = $2;
          });
          _defined.set(name, {
            $,
            _
          });
        }
        return _defined.get(name).$;
      };
      var _augment = attributesObserver(_whenDefined2, MutationObserver$1);
      var _override = null;
      getOwnPropertyNames(self).filter(function(k) {
        return /^HTML.*Element$/.test(k);
      }).forEach(function(k) {
        var HTMLElement2 = self[k];
        function HTMLBuiltIn2() {
          var constructor = this.constructor;
          if (!_classes.has(constructor))
            throw new TypeError$1("Illegal constructor");
          var _classes$get = _classes.get(constructor), is2 = _classes$get.is, tag = _classes$get.tag;
          if (is2) {
            if (_override)
              return _augment(_override, is2);
            var element = _createElement.call(document$1, tag);
            element.setAttribute("is", is2);
            return _augment(setPrototypeOf(element, constructor.prototype), is2);
          } else
            return construct.call(this, HTMLElement2, [], constructor);
        }
        defineProperty(HTMLBuiltIn2.prototype = HTMLElement2.prototype, "constructor", {
          value: HTMLBuiltIn2
        });
        defineProperty(self, k, {
          value: HTMLBuiltIn2
        });
      });
      document$1.createElement = function(name, options) {
        var is2 = options && options.is;
        if (is2) {
          var Class = _registry.get(is2);
          if (Class && _classes.get(Class).tag === name)
            return new Class();
        }
        var element = _createElement.call(document$1, name);
        if (is2)
          element.setAttribute("is", is2);
        return element;
      };
      customElements.get = getCE;
      customElements.whenDefined = _whenDefined2;
      customElements.upgrade = function(element) {
        var is2 = element.getAttribute("is");
        if (is2) {
          var _constructor = _registry.get(is2);
          if (_constructor) {
            _augment(setPrototypeOf(element, _constructor.prototype), is2);
            return;
          }
        }
        upgrade.call(customElements, element);
      };
      customElements.define = function(is2, Class, options) {
        if (getCE(is2))
          throw new Error2("'".concat(is2, "' has already been defined as a custom element"));
        var selector;
        var tag = options && options["extends"];
        _classes.set(Class, tag ? {
          is: is2,
          tag
        } : {
          is: "",
          tag: is2
        });
        if (tag) {
          selector = "".concat(tag, '[is="').concat(is2, '"]');
          _prototypes.set(selector, Class.prototype);
          _registry.set(is2, Class);
          _query.push(selector);
        } else {
          define.apply(customElements, arguments);
          shadowed.push(selector = is2);
        }
        _whenDefined2(is2).then(function() {
          if (tag) {
            _parse(document$1.querySelectorAll(selector));
            shadows.forEach(_parseShadow, [selector]);
          } else
            parseShadowed(document$1.querySelectorAll(selector));
        });
        _defined.get(is2)._(Class);
      };
    }
  })();

  // node_modules/web-animations-js/web-animations.min.js
  !function() {
    var a = {}, b = {};
    !function(a2, b2) {
      function c(a3) {
        if (typeof a3 == "number")
          return a3;
        var b3 = {};
        for (var c2 in a3)
          b3[c2] = a3[c2];
        return b3;
      }
      function d() {
        this._delay = 0, this._endDelay = 0, this._fill = "none", this._iterationStart = 0, this._iterations = 1, this._duration = 0, this._playbackRate = 1, this._direction = "normal", this._easing = "linear", this._easingFunction = x;
      }
      function e() {
        return a2.isDeprecated("Invalid timing inputs", "2016-03-02", "TypeError exceptions will be thrown instead.", true);
      }
      function f(b3, c2, e2) {
        var f2 = new d();
        return c2 && (f2.fill = "both", f2.duration = "auto"), typeof b3 != "number" || isNaN(b3) ? b3 !== void 0 && Object.getOwnPropertyNames(b3).forEach(function(c3) {
          if (b3[c3] != "auto") {
            if ((typeof f2[c3] == "number" || c3 == "duration") && (typeof b3[c3] != "number" || isNaN(b3[c3])))
              return;
            if (c3 == "fill" && v.indexOf(b3[c3]) == -1)
              return;
            if (c3 == "direction" && w.indexOf(b3[c3]) == -1)
              return;
            if (c3 == "playbackRate" && b3[c3] !== 1 && a2.isDeprecated("AnimationEffectTiming.playbackRate", "2014-11-28", "Use Animation.playbackRate instead."))
              return;
            f2[c3] = b3[c3];
          }
        }) : f2.duration = b3, f2;
      }
      function g(a3) {
        return typeof a3 == "number" && (a3 = isNaN(a3) ? { duration: 0 } : { duration: a3 }), a3;
      }
      function h(b3, c2) {
        return b3 = a2.numericTimingToObject(b3), f(b3, c2);
      }
      function i(a3, b3, c2, d2) {
        return a3 < 0 || a3 > 1 || c2 < 0 || c2 > 1 ? x : function(e2) {
          function f2(a4, b4, c3) {
            return 3 * a4 * (1 - c3) * (1 - c3) * c3 + 3 * b4 * (1 - c3) * c3 * c3 + c3 * c3 * c3;
          }
          if (e2 <= 0) {
            var g2 = 0;
            return a3 > 0 ? g2 = b3 / a3 : !b3 && c2 > 0 && (g2 = d2 / c2), g2 * e2;
          }
          if (e2 >= 1) {
            var h2 = 0;
            return c2 < 1 ? h2 = (d2 - 1) / (c2 - 1) : c2 == 1 && a3 < 1 && (h2 = (b3 - 1) / (a3 - 1)), 1 + h2 * (e2 - 1);
          }
          for (var i2 = 0, j2 = 1; i2 < j2; ) {
            var k2 = (i2 + j2) / 2, l2 = f2(a3, c2, k2);
            if (Math.abs(e2 - l2) < 1e-5)
              return f2(b3, d2, k2);
            l2 < e2 ? i2 = k2 : j2 = k2;
          }
          return f2(b3, d2, k2);
        };
      }
      function j(a3, b3) {
        return function(c2) {
          if (c2 >= 1)
            return 1;
          var d2 = 1 / a3;
          return (c2 += b3 * d2) - c2 % d2;
        };
      }
      function k(a3) {
        C || (C = document.createElement("div").style), C.animationTimingFunction = "", C.animationTimingFunction = a3;
        var b3 = C.animationTimingFunction;
        if (b3 == "" && e())
          throw new TypeError(a3 + " is not a valid value for easing");
        return b3;
      }
      function l(a3) {
        if (a3 == "linear")
          return x;
        var b3 = E.exec(a3);
        if (b3)
          return i.apply(this, b3.slice(1).map(Number));
        var c2 = F.exec(a3);
        if (c2)
          return j(Number(c2[1]), A);
        var d2 = G.exec(a3);
        return d2 ? j(Number(d2[1]), { start: y, middle: z, end: A }[d2[2]]) : B[a3] || x;
      }
      function m(a3) {
        return Math.abs(n(a3) / a3.playbackRate);
      }
      function n(a3) {
        return a3.duration === 0 || a3.iterations === 0 ? 0 : a3.duration * a3.iterations;
      }
      function o(a3, b3, c2) {
        if (b3 == null)
          return H;
        var d2 = c2.delay + a3 + c2.endDelay;
        return b3 < Math.min(c2.delay, d2) ? I : b3 >= Math.min(c2.delay + a3, d2) ? J : K;
      }
      function p(a3, b3, c2, d2, e2) {
        switch (d2) {
          case I:
            return b3 == "backwards" || b3 == "both" ? 0 : null;
          case K:
            return c2 - e2;
          case J:
            return b3 == "forwards" || b3 == "both" ? a3 : null;
          case H:
            return null;
        }
      }
      function q(a3, b3, c2, d2, e2) {
        var f2 = e2;
        return a3 === 0 ? b3 !== I && (f2 += c2) : f2 += d2 / a3, f2;
      }
      function r(a3, b3, c2, d2, e2, f2) {
        var g2 = a3 === 1 / 0 ? b3 % 1 : a3 % 1;
        return g2 !== 0 || c2 !== J || d2 === 0 || e2 === 0 && f2 !== 0 || (g2 = 1), g2;
      }
      function s(a3, b3, c2, d2) {
        return a3 === J && b3 === 1 / 0 ? 1 / 0 : c2 === 1 ? Math.floor(d2) - 1 : Math.floor(d2);
      }
      function t(a3, b3, c2) {
        var d2 = a3;
        if (a3 !== "normal" && a3 !== "reverse") {
          var e2 = b3;
          a3 === "alternate-reverse" && (e2 += 1), d2 = "normal", e2 !== 1 / 0 && e2 % 2 != 0 && (d2 = "reverse");
        }
        return d2 === "normal" ? c2 : 1 - c2;
      }
      function u(a3, b3, c2) {
        var d2 = o(a3, b3, c2), e2 = p(a3, c2.fill, b3, d2, c2.delay);
        if (e2 === null)
          return null;
        var f2 = q(c2.duration, d2, c2.iterations, e2, c2.iterationStart), g2 = r(f2, c2.iterationStart, d2, c2.iterations, e2, c2.duration), h2 = s(d2, c2.iterations, g2, f2), i2 = t(c2.direction, h2, g2);
        return c2._easingFunction(i2);
      }
      var v = "backwards|forwards|both|none".split("|"), w = "reverse|alternate|alternate-reverse".split("|"), x = function(a3) {
        return a3;
      };
      d.prototype = { _setMember: function(b3, c2) {
        this["_" + b3] = c2, this._effect && (this._effect._timingInput[b3] = c2, this._effect._timing = a2.normalizeTimingInput(this._effect._timingInput), this._effect.activeDuration = a2.calculateActiveDuration(this._effect._timing), this._effect._animation && this._effect._animation._rebuildUnderlyingAnimation());
      }, get playbackRate() {
        return this._playbackRate;
      }, set delay(a3) {
        this._setMember("delay", a3);
      }, get delay() {
        return this._delay;
      }, set endDelay(a3) {
        this._setMember("endDelay", a3);
      }, get endDelay() {
        return this._endDelay;
      }, set fill(a3) {
        this._setMember("fill", a3);
      }, get fill() {
        return this._fill;
      }, set iterationStart(a3) {
        if ((isNaN(a3) || a3 < 0) && e())
          throw new TypeError("iterationStart must be a non-negative number, received: " + a3);
        this._setMember("iterationStart", a3);
      }, get iterationStart() {
        return this._iterationStart;
      }, set duration(a3) {
        if (a3 != "auto" && (isNaN(a3) || a3 < 0) && e())
          throw new TypeError("duration must be non-negative or auto, received: " + a3);
        this._setMember("duration", a3);
      }, get duration() {
        return this._duration;
      }, set direction(a3) {
        this._setMember("direction", a3);
      }, get direction() {
        return this._direction;
      }, set easing(a3) {
        this._easingFunction = l(k(a3)), this._setMember("easing", a3);
      }, get easing() {
        return this._easing;
      }, set iterations(a3) {
        if ((isNaN(a3) || a3 < 0) && e())
          throw new TypeError("iterations must be non-negative, received: " + a3);
        this._setMember("iterations", a3);
      }, get iterations() {
        return this._iterations;
      } };
      var y = 1, z = 0.5, A = 0, B = { ease: i(0.25, 0.1, 0.25, 1), "ease-in": i(0.42, 0, 1, 1), "ease-out": i(0, 0, 0.58, 1), "ease-in-out": i(0.42, 0, 0.58, 1), "step-start": j(1, y), "step-middle": j(1, z), "step-end": j(1, A) }, C = null, D = "\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*", E = new RegExp("cubic-bezier\\(" + D + "," + D + "," + D + "," + D + "\\)"), F = /steps\(\s*(\d+)\s*\)/, G = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/, H = 0, I = 1, J = 2, K = 3;
      a2.cloneTimingInput = c, a2.makeTiming = f, a2.numericTimingToObject = g, a2.normalizeTimingInput = h, a2.calculateActiveDuration = m, a2.calculateIterationProgress = u, a2.calculatePhase = o, a2.normalizeEasing = k, a2.parseEasingFunction = l;
    }(a), function(a2, b2) {
      function c(a3, b3) {
        return a3 in k ? k[a3][b3] || b3 : b3;
      }
      function d(a3) {
        return a3 === "display" || a3.lastIndexOf("animation", 0) === 0 || a3.lastIndexOf("transition", 0) === 0;
      }
      function e(a3, b3, e2) {
        if (!d(a3)) {
          var f2 = h[a3];
          if (f2) {
            i.style[a3] = b3;
            for (var g2 in f2) {
              var j2 = f2[g2], k2 = i.style[j2];
              e2[j2] = c(j2, k2);
            }
          } else
            e2[a3] = c(a3, b3);
        }
      }
      function f(a3) {
        var b3 = [];
        for (var c2 in a3)
          if (!(c2 in ["easing", "offset", "composite"])) {
            var d2 = a3[c2];
            Array.isArray(d2) || (d2 = [d2]);
            for (var e2, f2 = d2.length, g2 = 0; g2 < f2; g2++)
              e2 = {}, e2.offset = "offset" in a3 ? a3.offset : f2 == 1 ? 1 : g2 / (f2 - 1), "easing" in a3 && (e2.easing = a3.easing), "composite" in a3 && (e2.composite = a3.composite), e2[c2] = d2[g2], b3.push(e2);
          }
        return b3.sort(function(a4, b4) {
          return a4.offset - b4.offset;
        }), b3;
      }
      function g(b3) {
        function c2() {
          var a3 = d2.length;
          d2[a3 - 1].offset == null && (d2[a3 - 1].offset = 1), a3 > 1 && d2[0].offset == null && (d2[0].offset = 0);
          for (var b4 = 0, c3 = d2[0].offset, e2 = 1; e2 < a3; e2++) {
            var f2 = d2[e2].offset;
            if (f2 != null) {
              for (var g3 = 1; g3 < e2 - b4; g3++)
                d2[b4 + g3].offset = c3 + (f2 - c3) * g3 / (e2 - b4);
              b4 = e2, c3 = f2;
            }
          }
        }
        if (b3 == null)
          return [];
        window.Symbol && Symbol.iterator && Array.prototype.from && b3[Symbol.iterator] && (b3 = Array.from(b3)), Array.isArray(b3) || (b3 = f(b3));
        for (var d2 = b3.map(function(b4) {
          var c3 = {};
          for (var d3 in b4) {
            var f2 = b4[d3];
            if (d3 == "offset") {
              if (f2 != null) {
                if (f2 = Number(f2), !isFinite(f2))
                  throw new TypeError("Keyframe offsets must be numbers.");
                if (f2 < 0 || f2 > 1)
                  throw new TypeError("Keyframe offsets must be between 0 and 1.");
              }
            } else if (d3 == "composite") {
              if (f2 == "add" || f2 == "accumulate")
                throw { type: DOMException.NOT_SUPPORTED_ERR, name: "NotSupportedError", message: "add compositing is not supported" };
              if (f2 != "replace")
                throw new TypeError("Invalid composite mode " + f2 + ".");
            } else
              f2 = d3 == "easing" ? a2.normalizeEasing(f2) : "" + f2;
            e(d3, f2, c3);
          }
          return c3.offset == void 0 && (c3.offset = null), c3.easing == void 0 && (c3.easing = "linear"), c3;
        }), g2 = true, h2 = -1 / 0, i2 = 0; i2 < d2.length; i2++) {
          var j2 = d2[i2].offset;
          if (j2 != null) {
            if (j2 < h2)
              throw new TypeError("Keyframes are not loosely sorted by offset. Sort or specify offsets.");
            h2 = j2;
          } else
            g2 = false;
        }
        return d2 = d2.filter(function(a3) {
          return a3.offset >= 0 && a3.offset <= 1;
        }), g2 || c2(), d2;
      }
      var h = { background: ["backgroundImage", "backgroundPosition", "backgroundSize", "backgroundRepeat", "backgroundAttachment", "backgroundOrigin", "backgroundClip", "backgroundColor"], border: ["borderTopColor", "borderTopStyle", "borderTopWidth", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderBottomColor", "borderBottomStyle", "borderBottomWidth", "borderLeftColor", "borderLeftStyle", "borderLeftWidth"], borderBottom: ["borderBottomWidth", "borderBottomStyle", "borderBottomColor"], borderColor: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"], borderLeft: ["borderLeftWidth", "borderLeftStyle", "borderLeftColor"], borderRadius: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"], borderRight: ["borderRightWidth", "borderRightStyle", "borderRightColor"], borderTop: ["borderTopWidth", "borderTopStyle", "borderTopColor"], borderWidth: ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"], flex: ["flexGrow", "flexShrink", "flexBasis"], font: ["fontFamily", "fontSize", "fontStyle", "fontVariant", "fontWeight", "lineHeight"], margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"], outline: ["outlineColor", "outlineStyle", "outlineWidth"], padding: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] }, i = document.createElementNS("http://www.w3.org/1999/xhtml", "div"), j = { thin: "1px", medium: "3px", thick: "5px" }, k = { borderBottomWidth: j, borderLeftWidth: j, borderRightWidth: j, borderTopWidth: j, fontSize: { "xx-small": "60%", "x-small": "75%", small: "89%", medium: "100%", large: "120%", "x-large": "150%", "xx-large": "200%" }, fontWeight: { normal: "400", bold: "700" }, outlineWidth: j, textShadow: { none: "0px 0px 0px transparent" }, boxShadow: { none: "0px 0px 0px 0px transparent" } };
      a2.convertToArrayForm = f, a2.normalizeKeyframes = g;
    }(a), function(a2) {
      var b2 = {};
      a2.isDeprecated = function(a3, c, d, e) {
        var f = e ? "are" : "is", g = new Date(), h = new Date(c);
        return h.setMonth(h.getMonth() + 3), !(g < h && (a3 in b2 || console.warn("Web Animations: " + a3 + " " + f + " deprecated and will stop working on " + h.toDateString() + ". " + d), b2[a3] = true, 1));
      }, a2.deprecated = function(b3, c, d, e) {
        var f = e ? "are" : "is";
        if (a2.isDeprecated(b3, c, d, e))
          throw new Error(b3 + " " + f + " no longer supported. " + d);
      };
    }(a), function() {
      if (document.documentElement.animate) {
        var c = document.documentElement.animate([], 0), d = true;
        if (c && (d = false, "play|currentTime|pause|reverse|playbackRate|cancel|finish|startTime|playState".split("|").forEach(function(a2) {
          c[a2] === void 0 && (d = true);
        })), !d)
          return;
      }
      !function(a2, b2, c2) {
        function d2(a3) {
          for (var b3 = {}, c3 = 0; c3 < a3.length; c3++)
            for (var d3 in a3[c3])
              if (d3 != "offset" && d3 != "easing" && d3 != "composite") {
                var e2 = { offset: a3[c3].offset, easing: a3[c3].easing, value: a3[c3][d3] };
                b3[d3] = b3[d3] || [], b3[d3].push(e2);
              }
          for (var f in b3) {
            var g = b3[f];
            if (g[0].offset != 0 || g[g.length - 1].offset != 1)
              throw { type: DOMException.NOT_SUPPORTED_ERR, name: "NotSupportedError", message: "Partial keyframes are not supported" };
          }
          return b3;
        }
        function e(c3) {
          var d3 = [];
          for (var e2 in c3)
            for (var f = c3[e2], g = 0; g < f.length - 1; g++) {
              var h = g, i = g + 1, j = f[h].offset, k = f[i].offset, l = j, m = k;
              g == 0 && (l = -1 / 0, k == 0 && (i = h)), g == f.length - 2 && (m = 1 / 0, j == 1 && (h = i)), d3.push({ applyFrom: l, applyTo: m, startOffset: f[h].offset, endOffset: f[i].offset, easingFunction: a2.parseEasingFunction(f[h].easing), property: e2, interpolation: b2.propertyInterpolation(e2, f[h].value, f[i].value) });
            }
          return d3.sort(function(a3, b3) {
            return a3.startOffset - b3.startOffset;
          }), d3;
        }
        b2.convertEffectInput = function(c3) {
          var f = a2.normalizeKeyframes(c3), g = d2(f), h = e(g);
          return function(a3, c4) {
            if (c4 != null)
              h.filter(function(a4) {
                return c4 >= a4.applyFrom && c4 < a4.applyTo;
              }).forEach(function(d4) {
                var e2 = c4 - d4.startOffset, f2 = d4.endOffset - d4.startOffset, g2 = f2 == 0 ? 0 : d4.easingFunction(e2 / f2);
                b2.apply(a3, d4.property, d4.interpolation(g2));
              });
            else
              for (var d3 in g)
                d3 != "offset" && d3 != "easing" && d3 != "composite" && b2.clear(a3, d3);
          };
        };
      }(a, b), function(a2, b2, c2) {
        function d2(a3) {
          return a3.replace(/-(.)/g, function(a4, b3) {
            return b3.toUpperCase();
          });
        }
        function e(a3, b3, c3) {
          h[c3] = h[c3] || [], h[c3].push([a3, b3]);
        }
        function f(a3, b3, c3) {
          for (var f2 = 0; f2 < c3.length; f2++) {
            e(a3, b3, d2(c3[f2]));
          }
        }
        function g(c3, e2, f2) {
          var g2 = c3;
          /-/.test(c3) && !a2.isDeprecated("Hyphenated property names", "2016-03-22", "Use camelCase instead.", true) && (g2 = d2(c3)), e2 != "initial" && f2 != "initial" || (e2 == "initial" && (e2 = i[g2]), f2 == "initial" && (f2 = i[g2]));
          for (var j = e2 == f2 ? [] : h[g2], k = 0; j && k < j.length; k++) {
            var l = j[k][0](e2), m = j[k][0](f2);
            if (l !== void 0 && m !== void 0) {
              var n = j[k][1](l, m);
              if (n) {
                var o = b2.Interpolation.apply(null, n);
                return function(a3) {
                  return a3 == 0 ? e2 : a3 == 1 ? f2 : o(a3);
                };
              }
            }
          }
          return b2.Interpolation(false, true, function(a3) {
            return a3 ? f2 : e2;
          });
        }
        var h = {};
        b2.addPropertiesHandler = f;
        var i = { backgroundColor: "transparent", backgroundPosition: "0% 0%", borderBottomColor: "currentColor", borderBottomLeftRadius: "0px", borderBottomRightRadius: "0px", borderBottomWidth: "3px", borderLeftColor: "currentColor", borderLeftWidth: "3px", borderRightColor: "currentColor", borderRightWidth: "3px", borderSpacing: "2px", borderTopColor: "currentColor", borderTopLeftRadius: "0px", borderTopRightRadius: "0px", borderTopWidth: "3px", bottom: "auto", clip: "rect(0px, 0px, 0px, 0px)", color: "black", fontSize: "100%", fontWeight: "400", height: "auto", left: "auto", letterSpacing: "normal", lineHeight: "120%", marginBottom: "0px", marginLeft: "0px", marginRight: "0px", marginTop: "0px", maxHeight: "none", maxWidth: "none", minHeight: "0px", minWidth: "0px", opacity: "1.0", outlineColor: "invert", outlineOffset: "0px", outlineWidth: "3px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", right: "auto", strokeDasharray: "none", strokeDashoffset: "0px", textIndent: "0px", textShadow: "0px 0px 0px transparent", top: "auto", transform: "", verticalAlign: "0px", visibility: "visible", width: "auto", wordSpacing: "normal", zIndex: "auto" };
        b2.propertyInterpolation = g;
      }(a, b), function(a2, b2, c2) {
        function d2(b3) {
          var c3 = a2.calculateActiveDuration(b3), d3 = function(d4) {
            return a2.calculateIterationProgress(c3, d4, b3);
          };
          return d3._totalDuration = b3.delay + c3 + b3.endDelay, d3;
        }
        b2.KeyframeEffect = function(c3, e, f, g) {
          var h, i = d2(a2.normalizeTimingInput(f)), j = b2.convertEffectInput(e), k = function() {
            j(c3, h);
          };
          return k._update = function(a3) {
            return (h = i(a3)) !== null;
          }, k._clear = function() {
            j(c3, null);
          }, k._hasSameTarget = function(a3) {
            return c3 === a3;
          }, k._target = c3, k._totalDuration = i._totalDuration, k._id = g, k;
        };
      }(a, b), function(a2, b2) {
        function c2(a3, b3) {
          return !(!b3.namespaceURI || b3.namespaceURI.indexOf("/svg") == -1) && (g in a3 || (a3[g] = /Trident|MSIE|IEMobile|Edge|Android 4/i.test(a3.navigator.userAgent)), a3[g]);
        }
        function d2(a3, b3, c3) {
          c3.enumerable = true, c3.configurable = true, Object.defineProperty(a3, b3, c3);
        }
        function e(a3) {
          this._element = a3, this._surrogateStyle = document.createElementNS("http://www.w3.org/1999/xhtml", "div").style, this._style = a3.style, this._length = 0, this._isAnimatedProperty = {}, this._updateSvgTransformAttr = c2(window, a3), this._savedTransformAttr = null;
          for (var b3 = 0; b3 < this._style.length; b3++) {
            var d3 = this._style[b3];
            this._surrogateStyle[d3] = this._style[d3];
          }
          this._updateIndices();
        }
        function f(a3) {
          if (!a3._webAnimationsPatchedStyle) {
            var b3 = new e(a3);
            try {
              d2(a3, "style", { get: function() {
                return b3;
              } });
            } catch (b4) {
              a3.style._set = function(b5, c3) {
                a3.style[b5] = c3;
              }, a3.style._clear = function(b5) {
                a3.style[b5] = "";
              };
            }
            a3._webAnimationsPatchedStyle = a3.style;
          }
        }
        var g = "_webAnimationsUpdateSvgTransformAttr", h = { cssText: 1, length: 1, parentRule: 1 }, i = { getPropertyCSSValue: 1, getPropertyPriority: 1, getPropertyValue: 1, item: 1, removeProperty: 1, setProperty: 1 }, j = { removeProperty: 1, setProperty: 1 };
        e.prototype = { get cssText() {
          return this._surrogateStyle.cssText;
        }, set cssText(a3) {
          for (var b3 = {}, c3 = 0; c3 < this._surrogateStyle.length; c3++)
            b3[this._surrogateStyle[c3]] = true;
          this._surrogateStyle.cssText = a3, this._updateIndices();
          for (var c3 = 0; c3 < this._surrogateStyle.length; c3++)
            b3[this._surrogateStyle[c3]] = true;
          for (var d3 in b3)
            this._isAnimatedProperty[d3] || this._style.setProperty(d3, this._surrogateStyle.getPropertyValue(d3));
        }, get length() {
          return this._surrogateStyle.length;
        }, get parentRule() {
          return this._style.parentRule;
        }, _updateIndices: function() {
          for (; this._length < this._surrogateStyle.length; )
            Object.defineProperty(this, this._length, { configurable: true, enumerable: false, get: function(a3) {
              return function() {
                return this._surrogateStyle[a3];
              };
            }(this._length) }), this._length++;
          for (; this._length > this._surrogateStyle.length; )
            this._length--, Object.defineProperty(this, this._length, { configurable: true, enumerable: false, value: void 0 });
        }, _set: function(b3, c3) {
          this._style[b3] = c3, this._isAnimatedProperty[b3] = true, this._updateSvgTransformAttr && a2.unprefixedPropertyName(b3) == "transform" && (this._savedTransformAttr == null && (this._savedTransformAttr = this._element.getAttribute("transform")), this._element.setAttribute("transform", a2.transformToSvgMatrix(c3)));
        }, _clear: function(b3) {
          this._style[b3] = this._surrogateStyle[b3], this._updateSvgTransformAttr && a2.unprefixedPropertyName(b3) == "transform" && (this._savedTransformAttr ? this._element.setAttribute("transform", this._savedTransformAttr) : this._element.removeAttribute("transform"), this._savedTransformAttr = null), delete this._isAnimatedProperty[b3];
        } };
        for (var k in i)
          e.prototype[k] = function(a3, b3) {
            return function() {
              var c3 = this._surrogateStyle[a3].apply(this._surrogateStyle, arguments);
              return b3 && (this._isAnimatedProperty[arguments[0]] || this._style[a3].apply(this._style, arguments), this._updateIndices()), c3;
            };
          }(k, k in j);
        for (var l in document.documentElement.style)
          l in h || l in i || function(a3) {
            d2(e.prototype, a3, { get: function() {
              return this._surrogateStyle[a3];
            }, set: function(b3) {
              this._surrogateStyle[a3] = b3, this._updateIndices(), this._isAnimatedProperty[a3] || (this._style[a3] = b3);
            } });
          }(l);
        a2.apply = function(b3, c3, d3) {
          f(b3), b3.style._set(a2.propertyName(c3), d3);
        }, a2.clear = function(b3, c3) {
          b3._webAnimationsPatchedStyle && b3.style._clear(a2.propertyName(c3));
        };
      }(b), function(a2) {
        window.Element.prototype.animate = function(b2, c2) {
          var d2 = "";
          return c2 && c2.id && (d2 = c2.id), a2.timeline._play(a2.KeyframeEffect(this, b2, c2, d2));
        };
      }(b), function(a2, b2) {
        function c2(a3, b3, d2) {
          if (typeof a3 == "number" && typeof b3 == "number")
            return a3 * (1 - d2) + b3 * d2;
          if (typeof a3 == "boolean" && typeof b3 == "boolean")
            return d2 < 0.5 ? a3 : b3;
          if (a3.length == b3.length) {
            for (var e = [], f = 0; f < a3.length; f++)
              e.push(c2(a3[f], b3[f], d2));
            return e;
          }
          throw "Mismatched interpolation arguments " + a3 + ":" + b3;
        }
        a2.Interpolation = function(a3, b3, d2) {
          return function(e) {
            return d2(c2(a3, b3, e));
          };
        };
      }(b), function(a2, b2) {
        function c2(a3, b3, c3) {
          return Math.max(Math.min(a3, c3), b3);
        }
        function d2(b3, d3, e2) {
          var f = a2.dot(b3, d3);
          f = c2(f, -1, 1);
          var g = [];
          if (f === 1)
            g = b3;
          else
            for (var h = Math.acos(f), i = 1 * Math.sin(e2 * h) / Math.sqrt(1 - f * f), j = 0; j < 4; j++)
              g.push(b3[j] * (Math.cos(e2 * h) - f * i) + d3[j] * i);
          return g;
        }
        var e = function() {
          function a3(a4, b4) {
            for (var c4 = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], d3 = 0; d3 < 4; d3++)
              for (var e2 = 0; e2 < 4; e2++)
                for (var f = 0; f < 4; f++)
                  c4[d3][e2] += b4[d3][f] * a4[f][e2];
            return c4;
          }
          function b3(a4) {
            return a4[0][2] == 0 && a4[0][3] == 0 && a4[1][2] == 0 && a4[1][3] == 0 && a4[2][0] == 0 && a4[2][1] == 0 && a4[2][2] == 1 && a4[2][3] == 0 && a4[3][2] == 0 && a4[3][3] == 1;
          }
          function c3(c4, d3, e2, f, g) {
            for (var h = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], i = 0; i < 4; i++)
              h[i][3] = g[i];
            for (var i = 0; i < 3; i++)
              for (var j = 0; j < 3; j++)
                h[3][i] += c4[j] * h[j][i];
            var k = f[0], l = f[1], m = f[2], n = f[3], o = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
            o[0][0] = 1 - 2 * (l * l + m * m), o[0][1] = 2 * (k * l - m * n), o[0][2] = 2 * (k * m + l * n), o[1][0] = 2 * (k * l + m * n), o[1][1] = 1 - 2 * (k * k + m * m), o[1][2] = 2 * (l * m - k * n), o[2][0] = 2 * (k * m - l * n), o[2][1] = 2 * (l * m + k * n), o[2][2] = 1 - 2 * (k * k + l * l), h = a3(h, o);
            var p = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
            e2[2] && (p[2][1] = e2[2], h = a3(h, p)), e2[1] && (p[2][1] = 0, p[2][0] = e2[0], h = a3(h, p)), e2[0] && (p[2][0] = 0, p[1][0] = e2[0], h = a3(h, p));
            for (var i = 0; i < 3; i++)
              for (var j = 0; j < 3; j++)
                h[i][j] *= d3[i];
            return b3(h) ? [h[0][0], h[0][1], h[1][0], h[1][1], h[3][0], h[3][1]] : h[0].concat(h[1], h[2], h[3]);
          }
          return c3;
        }();
        a2.composeMatrix = e, a2.quat = d2;
      }(b), function(a2, b2, c2) {
        a2.sequenceNumber = 0;
        var d2 = function(a3, b3, c3) {
          this.target = a3, this.currentTime = b3, this.timelineTime = c3, this.type = "finish", this.bubbles = false, this.cancelable = false, this.currentTarget = a3, this.defaultPrevented = false, this.eventPhase = Event.AT_TARGET, this.timeStamp = Date.now();
        };
        b2.Animation = function(b3) {
          this.id = "", b3 && b3._id && (this.id = b3._id), this._sequenceNumber = a2.sequenceNumber++, this._currentTime = 0, this._startTime = null, this._paused = false, this._playbackRate = 1, this._inTimeline = true, this._finishedFlag = true, this.onfinish = null, this._finishHandlers = [], this._effect = b3, this._inEffect = this._effect._update(0), this._idle = true, this._currentTimePending = false;
        }, b2.Animation.prototype = { _ensureAlive: function() {
          this.playbackRate < 0 && this.currentTime === 0 ? this._inEffect = this._effect._update(-1) : this._inEffect = this._effect._update(this.currentTime), this._inTimeline || !this._inEffect && this._finishedFlag || (this._inTimeline = true, b2.timeline._animations.push(this));
        }, _tickCurrentTime: function(a3, b3) {
          a3 != this._currentTime && (this._currentTime = a3, this._isFinished && !b3 && (this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0), this._ensureAlive());
        }, get currentTime() {
          return this._idle || this._currentTimePending ? null : this._currentTime;
        }, set currentTime(a3) {
          a3 = +a3, isNaN(a3) || (b2.restart(), this._paused || this._startTime == null || (this._startTime = this._timeline.currentTime - a3 / this._playbackRate), this._currentTimePending = false, this._currentTime != a3 && (this._idle && (this._idle = false, this._paused = true), this._tickCurrentTime(a3, true), b2.applyDirtiedAnimation(this)));
        }, get startTime() {
          return this._startTime;
        }, set startTime(a3) {
          a3 = +a3, isNaN(a3) || this._paused || this._idle || (this._startTime = a3, this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate), b2.applyDirtiedAnimation(this));
        }, get playbackRate() {
          return this._playbackRate;
        }, set playbackRate(a3) {
          if (a3 != this._playbackRate) {
            var c3 = this.currentTime;
            this._playbackRate = a3, this._startTime = null, this.playState != "paused" && this.playState != "idle" && (this._finishedFlag = false, this._idle = false, this._ensureAlive(), b2.applyDirtiedAnimation(this)), c3 != null && (this.currentTime = c3);
          }
        }, get _isFinished() {
          return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration || this._playbackRate < 0 && this._currentTime <= 0);
        }, get _totalDuration() {
          return this._effect._totalDuration;
        }, get playState() {
          return this._idle ? "idle" : this._startTime == null && !this._paused && this.playbackRate != 0 || this._currentTimePending ? "pending" : this._paused ? "paused" : this._isFinished ? "finished" : "running";
        }, _rewind: function() {
          if (this._playbackRate >= 0)
            this._currentTime = 0;
          else {
            if (!(this._totalDuration < 1 / 0))
              throw new DOMException("Unable to rewind negative playback rate animation with infinite duration", "InvalidStateError");
            this._currentTime = this._totalDuration;
          }
        }, play: function() {
          this._paused = false, (this._isFinished || this._idle) && (this._rewind(), this._startTime = null), this._finishedFlag = false, this._idle = false, this._ensureAlive(), b2.applyDirtiedAnimation(this);
        }, pause: function() {
          this._isFinished || this._paused || this._idle ? this._idle && (this._rewind(), this._idle = false) : this._currentTimePending = true, this._startTime = null, this._paused = true;
        }, finish: function() {
          this._idle || (this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0, this._startTime = this._totalDuration - this.currentTime, this._currentTimePending = false, b2.applyDirtiedAnimation(this));
        }, cancel: function() {
          this._inEffect && (this._inEffect = false, this._idle = true, this._paused = false, this._finishedFlag = true, this._currentTime = 0, this._startTime = null, this._effect._update(null), b2.applyDirtiedAnimation(this));
        }, reverse: function() {
          this.playbackRate *= -1, this.play();
        }, addEventListener: function(a3, b3) {
          typeof b3 == "function" && a3 == "finish" && this._finishHandlers.push(b3);
        }, removeEventListener: function(a3, b3) {
          if (a3 == "finish") {
            var c3 = this._finishHandlers.indexOf(b3);
            c3 >= 0 && this._finishHandlers.splice(c3, 1);
          }
        }, _fireEvents: function(a3) {
          if (this._isFinished) {
            if (!this._finishedFlag) {
              var b3 = new d2(this, this._currentTime, a3), c3 = this._finishHandlers.concat(this.onfinish ? [this.onfinish] : []);
              setTimeout(function() {
                c3.forEach(function(a4) {
                  a4.call(b3.target, b3);
                });
              }, 0), this._finishedFlag = true;
            }
          } else
            this._finishedFlag = false;
        }, _tick: function(a3, b3) {
          this._idle || this._paused || (this._startTime == null ? b3 && (this.startTime = a3 - this._currentTime / this.playbackRate) : this._isFinished || this._tickCurrentTime((a3 - this._startTime) * this.playbackRate)), b3 && (this._currentTimePending = false, this._fireEvents(a3));
        }, get _needsTick() {
          return this.playState in { pending: 1, running: 1 } || !this._finishedFlag;
        }, _targetAnimations: function() {
          var a3 = this._effect._target;
          return a3._activeAnimations || (a3._activeAnimations = []), a3._activeAnimations;
        }, _markTarget: function() {
          var a3 = this._targetAnimations();
          a3.indexOf(this) === -1 && a3.push(this);
        }, _unmarkTarget: function() {
          var a3 = this._targetAnimations(), b3 = a3.indexOf(this);
          b3 !== -1 && a3.splice(b3, 1);
        } };
      }(a, b), function(a2, b2, c2) {
        function d2(a3) {
          var b3 = j;
          j = [], a3 < q.currentTime && (a3 = q.currentTime), q._animations.sort(e), q._animations = h(a3, true, q._animations)[0], b3.forEach(function(b4) {
            b4[1](a3);
          }), g(), l = void 0;
        }
        function e(a3, b3) {
          return a3._sequenceNumber - b3._sequenceNumber;
        }
        function f() {
          this._animations = [], this.currentTime = window.performance && performance.now ? performance.now() : 0;
        }
        function g() {
          o.forEach(function(a3) {
            a3();
          }), o.length = 0;
        }
        function h(a3, c3, d3) {
          p = true, n = false, b2.timeline.currentTime = a3, m = false;
          var e2 = [], f2 = [], g2 = [], h2 = [];
          return d3.forEach(function(b3) {
            b3._tick(a3, c3), b3._inEffect ? (f2.push(b3._effect), b3._markTarget()) : (e2.push(b3._effect), b3._unmarkTarget()), b3._needsTick && (m = true);
            var d4 = b3._inEffect || b3._needsTick;
            b3._inTimeline = d4, d4 ? g2.push(b3) : h2.push(b3);
          }), o.push.apply(o, e2), o.push.apply(o, f2), m && requestAnimationFrame(function() {
          }), p = false, [g2, h2];
        }
        var i = window.requestAnimationFrame, j = [], k = 0;
        window.requestAnimationFrame = function(a3) {
          var b3 = k++;
          return j.length == 0 && i(d2), j.push([b3, a3]), b3;
        }, window.cancelAnimationFrame = function(a3) {
          j.forEach(function(b3) {
            b3[0] == a3 && (b3[1] = function() {
            });
          });
        }, f.prototype = { _play: function(c3) {
          c3._timing = a2.normalizeTimingInput(c3.timing);
          var d3 = new b2.Animation(c3);
          return d3._idle = false, d3._timeline = this, this._animations.push(d3), b2.restart(), b2.applyDirtiedAnimation(d3), d3;
        } };
        var l = void 0, m = false, n = false;
        b2.restart = function() {
          return m || (m = true, requestAnimationFrame(function() {
          }), n = true), n;
        }, b2.applyDirtiedAnimation = function(a3) {
          if (!p) {
            a3._markTarget();
            var c3 = a3._targetAnimations();
            c3.sort(e), h(b2.timeline.currentTime, false, c3.slice())[1].forEach(function(a4) {
              var b3 = q._animations.indexOf(a4);
              b3 !== -1 && q._animations.splice(b3, 1);
            }), g();
          }
        };
        var o = [], p = false, q = new f();
        b2.timeline = q;
      }(a, b), function(a2, b2) {
        function c2(a3, b3) {
          for (var c3 = 0, d3 = 0; d3 < a3.length; d3++)
            c3 += a3[d3] * b3[d3];
          return c3;
        }
        function d2(a3, b3) {
          return [a3[0] * b3[0] + a3[4] * b3[1] + a3[8] * b3[2] + a3[12] * b3[3], a3[1] * b3[0] + a3[5] * b3[1] + a3[9] * b3[2] + a3[13] * b3[3], a3[2] * b3[0] + a3[6] * b3[1] + a3[10] * b3[2] + a3[14] * b3[3], a3[3] * b3[0] + a3[7] * b3[1] + a3[11] * b3[2] + a3[15] * b3[3], a3[0] * b3[4] + a3[4] * b3[5] + a3[8] * b3[6] + a3[12] * b3[7], a3[1] * b3[4] + a3[5] * b3[5] + a3[9] * b3[6] + a3[13] * b3[7], a3[2] * b3[4] + a3[6] * b3[5] + a3[10] * b3[6] + a3[14] * b3[7], a3[3] * b3[4] + a3[7] * b3[5] + a3[11] * b3[6] + a3[15] * b3[7], a3[0] * b3[8] + a3[4] * b3[9] + a3[8] * b3[10] + a3[12] * b3[11], a3[1] * b3[8] + a3[5] * b3[9] + a3[9] * b3[10] + a3[13] * b3[11], a3[2] * b3[8] + a3[6] * b3[9] + a3[10] * b3[10] + a3[14] * b3[11], a3[3] * b3[8] + a3[7] * b3[9] + a3[11] * b3[10] + a3[15] * b3[11], a3[0] * b3[12] + a3[4] * b3[13] + a3[8] * b3[14] + a3[12] * b3[15], a3[1] * b3[12] + a3[5] * b3[13] + a3[9] * b3[14] + a3[13] * b3[15], a3[2] * b3[12] + a3[6] * b3[13] + a3[10] * b3[14] + a3[14] * b3[15], a3[3] * b3[12] + a3[7] * b3[13] + a3[11] * b3[14] + a3[15] * b3[15]];
        }
        function e(a3) {
          var b3 = a3.rad || 0;
          return ((a3.deg || 0) / 360 + (a3.grad || 0) / 400 + (a3.turn || 0)) * (2 * Math.PI) + b3;
        }
        function f(a3) {
          switch (a3.t) {
            case "rotatex":
              var b3 = e(a3.d[0]);
              return [1, 0, 0, 0, 0, Math.cos(b3), Math.sin(b3), 0, 0, -Math.sin(b3), Math.cos(b3), 0, 0, 0, 0, 1];
            case "rotatey":
              var b3 = e(a3.d[0]);
              return [Math.cos(b3), 0, -Math.sin(b3), 0, 0, 1, 0, 0, Math.sin(b3), 0, Math.cos(b3), 0, 0, 0, 0, 1];
            case "rotate":
            case "rotatez":
              var b3 = e(a3.d[0]);
              return [Math.cos(b3), Math.sin(b3), 0, 0, -Math.sin(b3), Math.cos(b3), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "rotate3d":
              var c3 = a3.d[0], d3 = a3.d[1], f2 = a3.d[2], b3 = e(a3.d[3]), g2 = c3 * c3 + d3 * d3 + f2 * f2;
              if (g2 === 0)
                c3 = 1, d3 = 0, f2 = 0;
              else if (g2 !== 1) {
                var h2 = Math.sqrt(g2);
                c3 /= h2, d3 /= h2, f2 /= h2;
              }
              var i2 = Math.sin(b3 / 2), j = i2 * Math.cos(b3 / 2), k = i2 * i2;
              return [1 - 2 * (d3 * d3 + f2 * f2) * k, 2 * (c3 * d3 * k + f2 * j), 2 * (c3 * f2 * k - d3 * j), 0, 2 * (c3 * d3 * k - f2 * j), 1 - 2 * (c3 * c3 + f2 * f2) * k, 2 * (d3 * f2 * k + c3 * j), 0, 2 * (c3 * f2 * k + d3 * j), 2 * (d3 * f2 * k - c3 * j), 1 - 2 * (c3 * c3 + d3 * d3) * k, 0, 0, 0, 0, 1];
            case "scale":
              return [a3.d[0], 0, 0, 0, 0, a3.d[1], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "scalex":
              return [a3.d[0], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "scaley":
              return [1, 0, 0, 0, 0, a3.d[0], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "scalez":
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, a3.d[0], 0, 0, 0, 0, 1];
            case "scale3d":
              return [a3.d[0], 0, 0, 0, 0, a3.d[1], 0, 0, 0, 0, a3.d[2], 0, 0, 0, 0, 1];
            case "skew":
              var l = e(a3.d[0]), m = e(a3.d[1]);
              return [1, Math.tan(m), 0, 0, Math.tan(l), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "skewx":
              var b3 = e(a3.d[0]);
              return [1, 0, 0, 0, Math.tan(b3), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "skewy":
              var b3 = e(a3.d[0]);
              return [1, Math.tan(b3), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            case "translate":
              var c3 = a3.d[0].px || 0, d3 = a3.d[1].px || 0;
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c3, d3, 0, 1];
            case "translatex":
              var c3 = a3.d[0].px || 0;
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c3, 0, 0, 1];
            case "translatey":
              var d3 = a3.d[0].px || 0;
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, d3, 0, 1];
            case "translatez":
              var f2 = a3.d[0].px || 0;
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, f2, 1];
            case "translate3d":
              var c3 = a3.d[0].px || 0, d3 = a3.d[1].px || 0, f2 = a3.d[2].px || 0;
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c3, d3, f2, 1];
            case "perspective":
              return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, a3.d[0].px ? -1 / a3.d[0].px : 0, 0, 0, 0, 1];
            case "matrix":
              return [a3.d[0], a3.d[1], 0, 0, a3.d[2], a3.d[3], 0, 0, 0, 0, 1, 0, a3.d[4], a3.d[5], 0, 1];
            case "matrix3d":
              return a3.d;
          }
        }
        function g(a3) {
          return a3.length === 0 ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] : a3.map(f).reduce(d2);
        }
        function h(a3) {
          return [i(g(a3))];
        }
        var i = function() {
          function a3(a4) {
            return a4[0][0] * a4[1][1] * a4[2][2] + a4[1][0] * a4[2][1] * a4[0][2] + a4[2][0] * a4[0][1] * a4[1][2] - a4[0][2] * a4[1][1] * a4[2][0] - a4[1][2] * a4[2][1] * a4[0][0] - a4[2][2] * a4[0][1] * a4[1][0];
          }
          function b3(b4) {
            for (var c3 = 1 / a3(b4), d4 = b4[0][0], e3 = b4[0][1], f3 = b4[0][2], g3 = b4[1][0], h3 = b4[1][1], i3 = b4[1][2], j2 = b4[2][0], k = b4[2][1], l = b4[2][2], m = [[(h3 * l - i3 * k) * c3, (f3 * k - e3 * l) * c3, (e3 * i3 - f3 * h3) * c3, 0], [(i3 * j2 - g3 * l) * c3, (d4 * l - f3 * j2) * c3, (f3 * g3 - d4 * i3) * c3, 0], [(g3 * k - h3 * j2) * c3, (j2 * e3 - d4 * k) * c3, (d4 * h3 - e3 * g3) * c3, 0]], n = [], o = 0; o < 3; o++) {
              for (var p = 0, q = 0; q < 3; q++)
                p += b4[3][q] * m[q][o];
              n.push(p);
            }
            return n.push(1), m.push(n), m;
          }
          function d3(a4) {
            return [[a4[0][0], a4[1][0], a4[2][0], a4[3][0]], [a4[0][1], a4[1][1], a4[2][1], a4[3][1]], [a4[0][2], a4[1][2], a4[2][2], a4[3][2]], [a4[0][3], a4[1][3], a4[2][3], a4[3][3]]];
          }
          function e2(a4, b4) {
            for (var c3 = [], d4 = 0; d4 < 4; d4++) {
              for (var e3 = 0, f3 = 0; f3 < 4; f3++)
                e3 += a4[f3] * b4[f3][d4];
              c3.push(e3);
            }
            return c3;
          }
          function f2(a4) {
            var b4 = g2(a4);
            return [a4[0] / b4, a4[1] / b4, a4[2] / b4];
          }
          function g2(a4) {
            return Math.sqrt(a4[0] * a4[0] + a4[1] * a4[1] + a4[2] * a4[2]);
          }
          function h2(a4, b4, c3, d4) {
            return [c3 * a4[0] + d4 * b4[0], c3 * a4[1] + d4 * b4[1], c3 * a4[2] + d4 * b4[2]];
          }
          function i2(a4, b4) {
            return [a4[1] * b4[2] - a4[2] * b4[1], a4[2] * b4[0] - a4[0] * b4[2], a4[0] * b4[1] - a4[1] * b4[0]];
          }
          function j(j2) {
            var k = [j2.slice(0, 4), j2.slice(4, 8), j2.slice(8, 12), j2.slice(12, 16)];
            if (k[3][3] !== 1)
              return null;
            for (var l = [], m = 0; m < 4; m++)
              l.push(k[m].slice());
            for (var m = 0; m < 3; m++)
              l[m][3] = 0;
            if (a3(l) === 0)
              return null;
            var n, o = [];
            k[0][3] || k[1][3] || k[2][3] ? (o.push(k[0][3]), o.push(k[1][3]), o.push(k[2][3]), o.push(k[3][3]), n = e2(o, d3(b3(l)))) : n = [0, 0, 0, 1];
            var p = k[3].slice(0, 3), q = [];
            q.push(k[0].slice(0, 3));
            var r = [];
            r.push(g2(q[0])), q[0] = f2(q[0]);
            var s = [];
            q.push(k[1].slice(0, 3)), s.push(c2(q[0], q[1])), q[1] = h2(q[1], q[0], 1, -s[0]), r.push(g2(q[1])), q[1] = f2(q[1]), s[0] /= r[1], q.push(k[2].slice(0, 3)), s.push(c2(q[0], q[2])), q[2] = h2(q[2], q[0], 1, -s[1]), s.push(c2(q[1], q[2])), q[2] = h2(q[2], q[1], 1, -s[2]), r.push(g2(q[2])), q[2] = f2(q[2]), s[1] /= r[2], s[2] /= r[2];
            var t = i2(q[1], q[2]);
            if (c2(q[0], t) < 0)
              for (var m = 0; m < 3; m++)
                r[m] *= -1, q[m][0] *= -1, q[m][1] *= -1, q[m][2] *= -1;
            var u, v, w = q[0][0] + q[1][1] + q[2][2] + 1;
            return w > 1e-4 ? (u = 0.5 / Math.sqrt(w), v = [(q[2][1] - q[1][2]) * u, (q[0][2] - q[2][0]) * u, (q[1][0] - q[0][1]) * u, 0.25 / u]) : q[0][0] > q[1][1] && q[0][0] > q[2][2] ? (u = 2 * Math.sqrt(1 + q[0][0] - q[1][1] - q[2][2]), v = [0.25 * u, (q[0][1] + q[1][0]) / u, (q[0][2] + q[2][0]) / u, (q[2][1] - q[1][2]) / u]) : q[1][1] > q[2][2] ? (u = 2 * Math.sqrt(1 + q[1][1] - q[0][0] - q[2][2]), v = [(q[0][1] + q[1][0]) / u, 0.25 * u, (q[1][2] + q[2][1]) / u, (q[0][2] - q[2][0]) / u]) : (u = 2 * Math.sqrt(1 + q[2][2] - q[0][0] - q[1][1]), v = [(q[0][2] + q[2][0]) / u, (q[1][2] + q[2][1]) / u, 0.25 * u, (q[1][0] - q[0][1]) / u]), [p, r, s, v, n];
          }
          return j;
        }();
        a2.dot = c2, a2.makeMatrixDecomposition = h, a2.transformListToMatrix = g;
      }(b), function(a2) {
        function b2(a3, b3) {
          var c3 = a3.exec(b3);
          if (c3)
            return c3 = a3.ignoreCase ? c3[0].toLowerCase() : c3[0], [c3, b3.substr(c3.length)];
        }
        function c2(a3, b3) {
          b3 = b3.replace(/^\s*/, "");
          var c3 = a3(b3);
          if (c3)
            return [c3[0], c3[1].replace(/^\s*/, "")];
        }
        function d2(a3, d3, e2) {
          a3 = c2.bind(null, a3);
          for (var f2 = []; ; ) {
            var g2 = a3(e2);
            if (!g2)
              return [f2, e2];
            if (f2.push(g2[0]), e2 = g2[1], !(g2 = b2(d3, e2)) || g2[1] == "")
              return [f2, e2];
            e2 = g2[1];
          }
        }
        function e(a3, b3) {
          for (var c3 = 0, d3 = 0; d3 < b3.length && (!/\s|,/.test(b3[d3]) || c3 != 0); d3++)
            if (b3[d3] == "(")
              c3++;
            else if (b3[d3] == ")" && (c3--, c3 == 0 && d3++, c3 <= 0))
              break;
          var e2 = a3(b3.substr(0, d3));
          return e2 == void 0 ? void 0 : [e2, b3.substr(d3)];
        }
        function f(a3, b3) {
          for (var c3 = a3, d3 = b3; c3 && d3; )
            c3 > d3 ? c3 %= d3 : d3 %= c3;
          return c3 = a3 * b3 / (c3 + d3);
        }
        function g(a3) {
          return function(b3) {
            var c3 = a3(b3);
            return c3 && (c3[0] = void 0), c3;
          };
        }
        function h(a3, b3) {
          return function(c3) {
            return a3(c3) || [b3, c3];
          };
        }
        function i(b3, c3) {
          for (var d3 = [], e2 = 0; e2 < b3.length; e2++) {
            var f2 = a2.consumeTrimmed(b3[e2], c3);
            if (!f2 || f2[0] == "")
              return;
            f2[0] !== void 0 && d3.push(f2[0]), c3 = f2[1];
          }
          if (c3 == "")
            return d3;
        }
        function j(a3, b3, c3, d3, e2) {
          for (var g2 = [], h2 = [], i2 = [], j2 = f(d3.length, e2.length), k2 = 0; k2 < j2; k2++) {
            var l = b3(d3[k2 % d3.length], e2[k2 % e2.length]);
            if (!l)
              return;
            g2.push(l[0]), h2.push(l[1]), i2.push(l[2]);
          }
          return [g2, h2, function(b4) {
            var d4 = b4.map(function(a4, b5) {
              return i2[b5](a4);
            }).join(c3);
            return a3 ? a3(d4) : d4;
          }];
        }
        function k(a3, b3, c3) {
          for (var d3 = [], e2 = [], f2 = [], g2 = 0, h2 = 0; h2 < c3.length; h2++)
            if (typeof c3[h2] == "function") {
              var i2 = c3[h2](a3[g2], b3[g2++]);
              d3.push(i2[0]), e2.push(i2[1]), f2.push(i2[2]);
            } else
              !function(a4) {
                d3.push(false), e2.push(false), f2.push(function() {
                  return c3[a4];
                });
              }(h2);
          return [d3, e2, function(a4) {
            for (var b4 = "", c4 = 0; c4 < a4.length; c4++)
              b4 += f2[c4](a4[c4]);
            return b4;
          }];
        }
        a2.consumeToken = b2, a2.consumeTrimmed = c2, a2.consumeRepeated = d2, a2.consumeParenthesised = e, a2.ignore = g, a2.optional = h, a2.consumeList = i, a2.mergeNestedRepeated = j.bind(null, null), a2.mergeWrappedNestedRepeated = j, a2.mergeList = k;
      }(b), function(a2) {
        function b2(b3) {
          function c3(b4) {
            var c4 = a2.consumeToken(/^inset/i, b4);
            return c4 ? (d3.inset = true, c4) : (c4 = a2.consumeLengthOrPercent(b4)) ? (d3.lengths.push(c4[0]), c4) : (c4 = a2.consumeColor(b4), c4 ? (d3.color = c4[0], c4) : void 0);
          }
          var d3 = { inset: false, lengths: [], color: null }, e2 = a2.consumeRepeated(c3, /^/, b3);
          if (e2 && e2[0].length)
            return [d3, e2[1]];
        }
        function c2(c3) {
          var d3 = a2.consumeRepeated(b2, /^,/, c3);
          if (d3 && d3[1] == "")
            return d3[0];
        }
        function d2(b3, c3) {
          for (; b3.lengths.length < Math.max(b3.lengths.length, c3.lengths.length); )
            b3.lengths.push({ px: 0 });
          for (; c3.lengths.length < Math.max(b3.lengths.length, c3.lengths.length); )
            c3.lengths.push({ px: 0 });
          if (b3.inset == c3.inset && !!b3.color == !!c3.color) {
            for (var d3, e2 = [], f2 = [[], 0], g = [[], 0], h = 0; h < b3.lengths.length; h++) {
              var i = a2.mergeDimensions(b3.lengths[h], c3.lengths[h], h == 2);
              f2[0].push(i[0]), g[0].push(i[1]), e2.push(i[2]);
            }
            if (b3.color && c3.color) {
              var j = a2.mergeColors(b3.color, c3.color);
              f2[1] = j[0], g[1] = j[1], d3 = j[2];
            }
            return [f2, g, function(a3) {
              for (var c4 = b3.inset ? "inset " : " ", f3 = 0; f3 < e2.length; f3++)
                c4 += e2[f3](a3[0][f3]) + " ";
              return d3 && (c4 += d3(a3[1])), c4;
            }];
          }
        }
        function e(b3, c3, d3, e2) {
          function f2(a3) {
            return { inset: a3, color: [0, 0, 0, 0], lengths: [{ px: 0 }, { px: 0 }, { px: 0 }, { px: 0 }] };
          }
          for (var g = [], h = [], i = 0; i < d3.length || i < e2.length; i++) {
            var j = d3[i] || f2(e2[i].inset), k = e2[i] || f2(d3[i].inset);
            g.push(j), h.push(k);
          }
          return a2.mergeNestedRepeated(b3, c3, g, h);
        }
        var f = e.bind(null, d2, ", ");
        a2.addPropertiesHandler(c2, f, ["box-shadow", "text-shadow"]);
      }(b), function(a2, b2) {
        function c2(a3) {
          return a3.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
        }
        function d2(a3, b3, c3) {
          return Math.min(b3, Math.max(a3, c3));
        }
        function e(a3) {
          if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(a3))
            return Number(a3);
        }
        function f(a3, b3) {
          return [a3, b3, c2];
        }
        function g(a3, b3) {
          if (a3 != 0)
            return i(0, 1 / 0)(a3, b3);
        }
        function h(a3, b3) {
          return [a3, b3, function(a4) {
            return Math.round(d2(1, 1 / 0, a4));
          }];
        }
        function i(a3, b3) {
          return function(e2, f2) {
            return [e2, f2, function(e3) {
              return c2(d2(a3, b3, e3));
            }];
          };
        }
        function j(a3) {
          var b3 = a3.trim().split(/\s*[\s,]\s*/);
          if (b3.length !== 0) {
            for (var c3 = [], d3 = 0; d3 < b3.length; d3++) {
              var f2 = e(b3[d3]);
              if (f2 === void 0)
                return;
              c3.push(f2);
            }
            return c3;
          }
        }
        function k(a3, b3) {
          if (a3.length == b3.length)
            return [a3, b3, function(a4) {
              return a4.map(c2).join(" ");
            }];
        }
        function l(a3, b3) {
          return [a3, b3, Math.round];
        }
        a2.clamp = d2, a2.addPropertiesHandler(j, k, ["stroke-dasharray"]), a2.addPropertiesHandler(e, i(0, 1 / 0), ["border-image-width", "line-height"]), a2.addPropertiesHandler(e, i(0, 1), ["opacity", "shape-image-threshold"]), a2.addPropertiesHandler(e, g, ["flex-grow", "flex-shrink"]), a2.addPropertiesHandler(e, h, ["orphans", "widows"]), a2.addPropertiesHandler(e, l, ["z-index"]), a2.parseNumber = e, a2.parseNumberList = j, a2.mergeNumbers = f, a2.numberToString = c2;
      }(b), function(a2, b2) {
        function c2(a3, b3) {
          if (a3 == "visible" || b3 == "visible")
            return [0, 1, function(c3) {
              return c3 <= 0 ? a3 : c3 >= 1 ? b3 : "visible";
            }];
        }
        a2.addPropertiesHandler(String, c2, ["visibility"]);
      }(b), function(a2, b2) {
        function c2(a3) {
          a3 = a3.trim(), f.fillStyle = "#000", f.fillStyle = a3;
          var b3 = f.fillStyle;
          if (f.fillStyle = "#fff", f.fillStyle = a3, b3 == f.fillStyle) {
            f.fillRect(0, 0, 1, 1);
            var c3 = f.getImageData(0, 0, 1, 1).data;
            f.clearRect(0, 0, 1, 1);
            var d3 = c3[3] / 255;
            return [c3[0] * d3, c3[1] * d3, c3[2] * d3, d3];
          }
        }
        function d2(b3, c3) {
          return [b3, c3, function(b4) {
            function c4(a3) {
              return Math.max(0, Math.min(255, a3));
            }
            if (b4[3])
              for (var d3 = 0; d3 < 3; d3++)
                b4[d3] = Math.round(c4(b4[d3] / b4[3]));
            return b4[3] = a2.numberToString(a2.clamp(0, 1, b4[3])), "rgba(" + b4.join(",") + ")";
          }];
        }
        var e = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        e.width = e.height = 1;
        var f = e.getContext("2d");
        a2.addPropertiesHandler(c2, d2, ["background-color", "border-bottom-color", "border-left-color", "border-right-color", "border-top-color", "color", "fill", "flood-color", "lighting-color", "outline-color", "stop-color", "stroke", "text-decoration-color"]), a2.consumeColor = a2.consumeParenthesised.bind(null, c2), a2.mergeColors = d2;
      }(b), function(a2, b2) {
        function c2(a3) {
          function b3() {
            var b4 = h2.exec(a3);
            g2 = b4 ? b4[0] : void 0;
          }
          function c3() {
            var a4 = Number(g2);
            return b3(), a4;
          }
          function d3() {
            if (g2 !== "(")
              return c3();
            b3();
            var a4 = f2();
            return g2 !== ")" ? NaN : (b3(), a4);
          }
          function e2() {
            for (var a4 = d3(); g2 === "*" || g2 === "/"; ) {
              var c4 = g2;
              b3();
              var e3 = d3();
              c4 === "*" ? a4 *= e3 : a4 /= e3;
            }
            return a4;
          }
          function f2() {
            for (var a4 = e2(); g2 === "+" || g2 === "-"; ) {
              var c4 = g2;
              b3();
              var d4 = e2();
              c4 === "+" ? a4 += d4 : a4 -= d4;
            }
            return a4;
          }
          var g2, h2 = /([\+\-\w\.]+|[\(\)\*\/])/g;
          return b3(), f2();
        }
        function d2(a3, b3) {
          if ((b3 = b3.trim().toLowerCase()) == "0" && "px".search(a3) >= 0)
            return { px: 0 };
          if (/^[^(]*$|^calc/.test(b3)) {
            b3 = b3.replace(/calc\(/g, "(");
            var d3 = {};
            b3 = b3.replace(a3, function(a4) {
              return d3[a4] = null, "U" + a4;
            });
            for (var e2 = "U(" + a3.source + ")", f2 = b3.replace(/[-+]?(\d*\.)?\d+([Ee][-+]?\d+)?/g, "N").replace(new RegExp("N" + e2, "g"), "D").replace(/\s[+-]\s/g, "O").replace(/\s/g, ""), g2 = [/N\*(D)/g, /(N|D)[*\/]N/g, /(N|D)O\1/g, /\((N|D)\)/g], h2 = 0; h2 < g2.length; )
              g2[h2].test(f2) ? (f2 = f2.replace(g2[h2], "$1"), h2 = 0) : h2++;
            if (f2 == "D") {
              for (var i2 in d3) {
                var j2 = c2(b3.replace(new RegExp("U" + i2, "g"), "").replace(new RegExp(e2, "g"), "*0"));
                if (!isFinite(j2))
                  return;
                d3[i2] = j2;
              }
              return d3;
            }
          }
        }
        function e(a3, b3) {
          return f(a3, b3, true);
        }
        function f(b3, c3, d3) {
          var e2, f2 = [];
          for (e2 in b3)
            f2.push(e2);
          for (e2 in c3)
            f2.indexOf(e2) < 0 && f2.push(e2);
          return b3 = f2.map(function(a3) {
            return b3[a3] || 0;
          }), c3 = f2.map(function(a3) {
            return c3[a3] || 0;
          }), [b3, c3, function(b4) {
            var c4 = b4.map(function(c5, e3) {
              return b4.length == 1 && d3 && (c5 = Math.max(c5, 0)), a2.numberToString(c5) + f2[e3];
            }).join(" + ");
            return b4.length > 1 ? "calc(" + c4 + ")" : c4;
          }];
        }
        var g = "px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc", h = d2.bind(null, new RegExp(g, "g")), i = d2.bind(null, new RegExp(g + "|%", "g")), j = d2.bind(null, /deg|rad|grad|turn/g);
        a2.parseLength = h, a2.parseLengthOrPercent = i, a2.consumeLengthOrPercent = a2.consumeParenthesised.bind(null, i), a2.parseAngle = j, a2.mergeDimensions = f;
        var k = a2.consumeParenthesised.bind(null, h), l = a2.consumeRepeated.bind(void 0, k, /^/), m = a2.consumeRepeated.bind(void 0, l, /^,/);
        a2.consumeSizePairList = m;
        var n = function(a3) {
          var b3 = m(a3);
          if (b3 && b3[1] == "")
            return b3[0];
        }, o = a2.mergeNestedRepeated.bind(void 0, e, " "), p = a2.mergeNestedRepeated.bind(void 0, o, ",");
        a2.mergeNonNegativeSizePair = o, a2.addPropertiesHandler(n, p, ["background-size"]), a2.addPropertiesHandler(i, e, ["border-bottom-width", "border-image-width", "border-left-width", "border-right-width", "border-top-width", "flex-basis", "font-size", "height", "line-height", "max-height", "max-width", "outline-width", "width"]), a2.addPropertiesHandler(i, f, ["border-bottom-left-radius", "border-bottom-right-radius", "border-top-left-radius", "border-top-right-radius", "bottom", "left", "letter-spacing", "margin-bottom", "margin-left", "margin-right", "margin-top", "min-height", "min-width", "outline-offset", "padding-bottom", "padding-left", "padding-right", "padding-top", "perspective", "right", "shape-margin", "stroke-dashoffset", "text-indent", "top", "vertical-align", "word-spacing"]);
      }(b), function(a2, b2) {
        function c2(b3) {
          return a2.consumeLengthOrPercent(b3) || a2.consumeToken(/^auto/, b3);
        }
        function d2(b3) {
          var d3 = a2.consumeList([a2.ignore(a2.consumeToken.bind(null, /^rect/)), a2.ignore(a2.consumeToken.bind(null, /^\(/)), a2.consumeRepeated.bind(null, c2, /^,/), a2.ignore(a2.consumeToken.bind(null, /^\)/))], b3);
          if (d3 && d3[0].length == 4)
            return d3[0];
        }
        function e(b3, c3) {
          return b3 == "auto" || c3 == "auto" ? [true, false, function(d3) {
            var e2 = d3 ? b3 : c3;
            if (e2 == "auto")
              return "auto";
            var f2 = a2.mergeDimensions(e2, e2);
            return f2[2](f2[0]);
          }] : a2.mergeDimensions(b3, c3);
        }
        function f(a3) {
          return "rect(" + a3 + ")";
        }
        var g = a2.mergeWrappedNestedRepeated.bind(null, f, e, ", ");
        a2.parseBox = d2, a2.mergeBoxes = g, a2.addPropertiesHandler(d2, g, ["clip"]);
      }(b), function(a2, b2) {
        function c2(a3) {
          return function(b3) {
            var c3 = 0;
            return a3.map(function(a4) {
              return a4 === k ? b3[c3++] : a4;
            });
          };
        }
        function d2(a3) {
          return a3;
        }
        function e(b3) {
          if ((b3 = b3.toLowerCase().trim()) == "none")
            return [];
          for (var c3, d3 = /\s*(\w+)\(([^)]*)\)/g, e2 = [], f2 = 0; c3 = d3.exec(b3); ) {
            if (c3.index != f2)
              return;
            f2 = c3.index + c3[0].length;
            var g2 = c3[1], h2 = n[g2];
            if (!h2)
              return;
            var i2 = c3[2].split(","), j2 = h2[0];
            if (j2.length < i2.length)
              return;
            for (var k2 = [], o = 0; o < j2.length; o++) {
              var p, q = i2[o], r = j2[o];
              if ((p = q ? { A: function(b4) {
                return b4.trim() == "0" ? m : a2.parseAngle(b4);
              }, N: a2.parseNumber, T: a2.parseLengthOrPercent, L: a2.parseLength }[r.toUpperCase()](q) : { a: m, n: k2[0], t: l }[r]) === void 0)
                return;
              k2.push(p);
            }
            if (e2.push({ t: g2, d: k2 }), d3.lastIndex == b3.length)
              return e2;
          }
        }
        function f(a3) {
          return a3.toFixed(6).replace(".000000", "");
        }
        function g(b3, c3) {
          if (b3.decompositionPair !== c3) {
            b3.decompositionPair = c3;
            var d3 = a2.makeMatrixDecomposition(b3);
          }
          if (c3.decompositionPair !== b3) {
            c3.decompositionPair = b3;
            var e2 = a2.makeMatrixDecomposition(c3);
          }
          return d3[0] == null || e2[0] == null ? [[false], [true], function(a3) {
            return a3 ? c3[0].d : b3[0].d;
          }] : (d3[0].push(0), e2[0].push(1), [d3, e2, function(b4) {
            var c4 = a2.quat(d3[0][3], e2[0][3], b4[5]);
            return a2.composeMatrix(b4[0], b4[1], b4[2], c4, b4[4]).map(f).join(",");
          }]);
        }
        function h(a3) {
          return a3.replace(/[xy]/, "");
        }
        function i(a3) {
          return a3.replace(/(x|y|z|3d)?$/, "3d");
        }
        function j(b3, c3) {
          var d3 = a2.makeMatrixDecomposition && true, e2 = false;
          if (!b3.length || !c3.length) {
            b3.length || (e2 = true, b3 = c3, c3 = []);
            for (var f2 = 0; f2 < b3.length; f2++) {
              var j2 = b3[f2].t, k2 = b3[f2].d, l2 = j2.substr(0, 5) == "scale" ? 1 : 0;
              c3.push({ t: j2, d: k2.map(function(a3) {
                if (typeof a3 == "number")
                  return l2;
                var b4 = {};
                for (var c4 in a3)
                  b4[c4] = l2;
                return b4;
              }) });
            }
          }
          var m2 = function(a3, b4) {
            return a3 == "perspective" && b4 == "perspective" || (a3 == "matrix" || a3 == "matrix3d") && (b4 == "matrix" || b4 == "matrix3d");
          }, o = [], p = [], q = [];
          if (b3.length != c3.length) {
            if (!d3)
              return;
            var r = g(b3, c3);
            o = [r[0]], p = [r[1]], q = [["matrix", [r[2]]]];
          } else
            for (var f2 = 0; f2 < b3.length; f2++) {
              var j2, s = b3[f2].t, t = c3[f2].t, u = b3[f2].d, v = c3[f2].d, w = n[s], x = n[t];
              if (m2(s, t)) {
                if (!d3)
                  return;
                var r = g([b3[f2]], [c3[f2]]);
                o.push(r[0]), p.push(r[1]), q.push(["matrix", [r[2]]]);
              } else {
                if (s == t)
                  j2 = s;
                else if (w[2] && x[2] && h(s) == h(t))
                  j2 = h(s), u = w[2](u), v = x[2](v);
                else {
                  if (!w[1] || !x[1] || i(s) != i(t)) {
                    if (!d3)
                      return;
                    var r = g(b3, c3);
                    o = [r[0]], p = [r[1]], q = [["matrix", [r[2]]]];
                    break;
                  }
                  j2 = i(s), u = w[1](u), v = x[1](v);
                }
                for (var y = [], z = [], A = [], B = 0; B < u.length; B++) {
                  var C = typeof u[B] == "number" ? a2.mergeNumbers : a2.mergeDimensions, r = C(u[B], v[B]);
                  y[B] = r[0], z[B] = r[1], A.push(r[2]);
                }
                o.push(y), p.push(z), q.push([j2, A]);
              }
            }
          if (e2) {
            var D = o;
            o = p, p = D;
          }
          return [o, p, function(a3) {
            return a3.map(function(a4, b4) {
              var c4 = a4.map(function(a5, c5) {
                return q[b4][1][c5](a5);
              }).join(",");
              return q[b4][0] == "matrix" && c4.split(",").length == 16 && (q[b4][0] = "matrix3d"), q[b4][0] + "(" + c4 + ")";
            }).join(" ");
          }];
        }
        var k = null, l = { px: 0 }, m = { deg: 0 }, n = { matrix: ["NNNNNN", [k, k, 0, 0, k, k, 0, 0, 0, 0, 1, 0, k, k, 0, 1], d2], matrix3d: ["NNNNNNNNNNNNNNNN", d2], rotate: ["A"], rotatex: ["A"], rotatey: ["A"], rotatez: ["A"], rotate3d: ["NNNA"], perspective: ["L"], scale: ["Nn", c2([k, k, 1]), d2], scalex: ["N", c2([k, 1, 1]), c2([k, 1])], scaley: ["N", c2([1, k, 1]), c2([1, k])], scalez: ["N", c2([1, 1, k])], scale3d: ["NNN", d2], skew: ["Aa", null, d2], skewx: ["A", null, c2([k, m])], skewy: ["A", null, c2([m, k])], translate: ["Tt", c2([k, k, l]), d2], translatex: ["T", c2([k, l, l]), c2([k, l])], translatey: ["T", c2([l, k, l]), c2([l, k])], translatez: ["L", c2([l, l, k])], translate3d: ["TTL", d2] };
        a2.addPropertiesHandler(e, j, ["transform"]), a2.transformToSvgMatrix = function(b3) {
          var c3 = a2.transformListToMatrix(e(b3));
          return "matrix(" + f(c3[0]) + " " + f(c3[1]) + " " + f(c3[4]) + " " + f(c3[5]) + " " + f(c3[12]) + " " + f(c3[13]) + ")";
        };
      }(b), function(a2) {
        function b2(a3) {
          var b3 = Number(a3);
          if (!(isNaN(b3) || b3 < 100 || b3 > 900 || b3 % 100 != 0))
            return b3;
        }
        function c2(b3) {
          return b3 = 100 * Math.round(b3 / 100), b3 = a2.clamp(100, 900, b3), b3 === 400 ? "normal" : b3 === 700 ? "bold" : String(b3);
        }
        function d2(a3, b3) {
          return [a3, b3, c2];
        }
        a2.addPropertiesHandler(b2, d2, ["font-weight"]);
      }(b), function(a2) {
        function b2(a3) {
          var b3 = {};
          for (var c3 in a3)
            b3[c3] = -a3[c3];
          return b3;
        }
        function c2(b3) {
          return a2.consumeToken(/^(left|center|right|top|bottom)\b/i, b3) || a2.consumeLengthOrPercent(b3);
        }
        function d2(b3, d3) {
          var e2 = a2.consumeRepeated(c2, /^/, d3);
          if (e2 && e2[1] == "") {
            var f2 = e2[0];
            if (f2[0] = f2[0] || "center", f2[1] = f2[1] || "center", b3 == 3 && (f2[2] = f2[2] || { px: 0 }), f2.length == b3) {
              if (/top|bottom/.test(f2[0]) || /left|right/.test(f2[1])) {
                var h2 = f2[0];
                f2[0] = f2[1], f2[1] = h2;
              }
              if (/left|right|center|Object/.test(f2[0]) && /top|bottom|center|Object/.test(f2[1]))
                return f2.map(function(a3) {
                  return typeof a3 == "object" ? a3 : g[a3];
                });
            }
          }
        }
        function e(d3) {
          var e2 = a2.consumeRepeated(c2, /^/, d3);
          if (e2) {
            for (var f2 = e2[0], h2 = [{ "%": 50 }, { "%": 50 }], i2 = 0, j = false, k = 0; k < f2.length; k++) {
              var l = f2[k];
              typeof l == "string" ? (j = /bottom|right/.test(l), i2 = { left: 0, right: 0, center: i2, top: 1, bottom: 1 }[l], h2[i2] = g[l], l == "center" && i2++) : (j && (l = b2(l), l["%"] = (l["%"] || 0) + 100), h2[i2] = l, i2++, j = false);
            }
            return [h2, e2[1]];
          }
        }
        function f(b3) {
          var c3 = a2.consumeRepeated(e, /^,/, b3);
          if (c3 && c3[1] == "")
            return c3[0];
        }
        var g = { left: { "%": 0 }, center: { "%": 50 }, right: { "%": 100 }, top: { "%": 0 }, bottom: { "%": 100 } }, h = a2.mergeNestedRepeated.bind(null, a2.mergeDimensions, " ");
        a2.addPropertiesHandler(d2.bind(null, 3), h, ["transform-origin"]), a2.addPropertiesHandler(d2.bind(null, 2), h, ["perspective-origin"]), a2.consumePosition = e, a2.mergeOffsetList = h;
        var i = a2.mergeNestedRepeated.bind(null, h, ", ");
        a2.addPropertiesHandler(f, i, ["background-position", "object-position"]);
      }(b), function(a2) {
        function b2(b3) {
          var c3 = a2.consumeToken(/^circle/, b3);
          if (c3 && c3[0])
            return ["circle"].concat(a2.consumeList([a2.ignore(a2.consumeToken.bind(void 0, /^\(/)), d2, a2.ignore(a2.consumeToken.bind(void 0, /^at/)), a2.consumePosition, a2.ignore(a2.consumeToken.bind(void 0, /^\)/))], c3[1]));
          var f2 = a2.consumeToken(/^ellipse/, b3);
          if (f2 && f2[0])
            return ["ellipse"].concat(a2.consumeList([a2.ignore(a2.consumeToken.bind(void 0, /^\(/)), e, a2.ignore(a2.consumeToken.bind(void 0, /^at/)), a2.consumePosition, a2.ignore(a2.consumeToken.bind(void 0, /^\)/))], f2[1]));
          var g2 = a2.consumeToken(/^polygon/, b3);
          return g2 && g2[0] ? ["polygon"].concat(a2.consumeList([a2.ignore(a2.consumeToken.bind(void 0, /^\(/)), a2.optional(a2.consumeToken.bind(void 0, /^nonzero\s*,|^evenodd\s*,/), "nonzero,"), a2.consumeSizePairList, a2.ignore(a2.consumeToken.bind(void 0, /^\)/))], g2[1])) : void 0;
        }
        function c2(b3, c3) {
          if (b3[0] === c3[0])
            return b3[0] == "circle" ? a2.mergeList(b3.slice(1), c3.slice(1), ["circle(", a2.mergeDimensions, " at ", a2.mergeOffsetList, ")"]) : b3[0] == "ellipse" ? a2.mergeList(b3.slice(1), c3.slice(1), ["ellipse(", a2.mergeNonNegativeSizePair, " at ", a2.mergeOffsetList, ")"]) : b3[0] == "polygon" && b3[1] == c3[1] ? a2.mergeList(b3.slice(2), c3.slice(2), ["polygon(", b3[1], g, ")"]) : void 0;
        }
        var d2 = a2.consumeParenthesised.bind(null, a2.parseLengthOrPercent), e = a2.consumeRepeated.bind(void 0, d2, /^/), f = a2.mergeNestedRepeated.bind(void 0, a2.mergeDimensions, " "), g = a2.mergeNestedRepeated.bind(void 0, f, ",");
        a2.addPropertiesHandler(b2, c2, ["shape-outside"]);
      }(b), function(a2, b2) {
        function c2(a3, b3) {
          b3.concat([a3]).forEach(function(b4) {
            b4 in document.documentElement.style && (d2[a3] = b4), e[b4] = a3;
          });
        }
        var d2 = {}, e = {};
        c2("transform", ["webkitTransform", "msTransform"]), c2("transformOrigin", ["webkitTransformOrigin"]), c2("perspective", ["webkitPerspective"]), c2("perspectiveOrigin", ["webkitPerspectiveOrigin"]), a2.propertyName = function(a3) {
          return d2[a3] || a3;
        }, a2.unprefixedPropertyName = function(a3) {
          return e[a3] || a3;
        };
      }(b);
    }(), function() {
      if (document.createElement("div").animate([]).oncancel === void 0) {
        var a2;
        if (window.performance && performance.now)
          var a2 = function() {
            return performance.now();
          };
        else
          var a2 = function() {
            return Date.now();
          };
        var b2 = function(a3, b3, c2) {
          this.target = a3, this.currentTime = b3, this.timelineTime = c2, this.type = "cancel", this.bubbles = false, this.cancelable = false, this.currentTarget = a3, this.defaultPrevented = false, this.eventPhase = Event.AT_TARGET, this.timeStamp = Date.now();
        }, c = window.Element.prototype.animate;
        window.Element.prototype.animate = function(d, e) {
          var f = c.call(this, d, e);
          f._cancelHandlers = [], f.oncancel = null;
          var g = f.cancel;
          f.cancel = function() {
            g.call(this);
            var c2 = new b2(this, null, a2()), d2 = this._cancelHandlers.concat(this.oncancel ? [this.oncancel] : []);
            setTimeout(function() {
              d2.forEach(function(a3) {
                a3.call(c2.target, c2);
              });
            }, 0);
          };
          var h = f.addEventListener;
          f.addEventListener = function(a3, b3) {
            typeof b3 == "function" && a3 == "cancel" ? this._cancelHandlers.push(b3) : h.call(this, a3, b3);
          };
          var i = f.removeEventListener;
          return f.removeEventListener = function(a3, b3) {
            if (a3 == "cancel") {
              var c2 = this._cancelHandlers.indexOf(b3);
              c2 >= 0 && this._cancelHandlers.splice(c2, 1);
            } else
              i.call(this, a3, b3);
          }, f;
        };
      }
    }(), function(a2) {
      var b2 = document.documentElement, c = null, d = false;
      try {
        var e = getComputedStyle(b2).getPropertyValue("opacity"), f = e == "0" ? "1" : "0";
        c = b2.animate({ opacity: [f, f] }, { duration: 1 }), c.currentTime = 0, d = getComputedStyle(b2).getPropertyValue("opacity") == f;
      } catch (a3) {
      } finally {
        c && c.cancel();
      }
      if (!d) {
        var g = window.Element.prototype.animate;
        window.Element.prototype.animate = function(b3, c2) {
          return window.Symbol && Symbol.iterator && Array.prototype.from && b3[Symbol.iterator] && (b3 = Array.from(b3)), Array.isArray(b3) || b3 === null || (b3 = a2.convertToArrayForm(b3)), g.call(this, b3, c2);
        };
      }
    }(a);
  }();

  // node_modules/tocca/Tocca.js
  (function(doc, win) {
    if (typeof doc.createEvent !== "function")
      return false;
    var pointerEvent = function(type) {
      var lo = type.toLowerCase(), ms = "MS" + type;
      return navigator.msPointerEnabled ? ms : window.PointerEvent ? lo : false;
    }, touchEvent = function(name) {
      return "on" + name in window ? name : false;
    }, defaults = {
      useJquery: !win.IGNORE_JQUERY && typeof jQuery !== "undefined",
      swipeThreshold: win.SWIPE_THRESHOLD || 100,
      tapThreshold: win.TAP_THRESHOLD || 150,
      dbltapThreshold: win.DBL_TAP_THRESHOLD || 200,
      longtapThreshold: win.LONG_TAP_THRESHOLD || 1e3,
      tapPrecision: win.TAP_PRECISION / 2 || 60 / 2,
      justTouchEvents: win.JUST_ON_TOUCH_DEVICES
    }, wasTouch = false, touchevents = {
      touchstart: touchEvent("touchstart") || pointerEvent("PointerDown"),
      touchend: touchEvent("touchend") || pointerEvent("PointerUp"),
      touchmove: touchEvent("touchmove") || pointerEvent("PointerMove")
    }, isTheSameFingerId = function(e) {
      return !e.pointerId || typeof pointerId === "undefined" || e.pointerId === pointerId;
    }, setListener = function(elm, events, callback) {
      var eventsArray = events.split(" "), i = eventsArray.length;
      while (i--) {
        elm.addEventListener(eventsArray[i], callback, false);
      }
    }, getPointerEvent = function(event) {
      var hasTargetTouches = Boolean(event.targetTouches && event.targetTouches.length);
      switch (true) {
        case Boolean(event.target.touches):
          return event.target.touches[0];
        case (hasTargetTouches && typeof event.targetTouches[0].pageX !== "undefined"):
          return event.targetTouches[0];
        case (hasTargetTouches && Boolean(event.targetTouches[0].touches)):
          return event.targetTouches[0].touches[0];
        default:
          return event;
      }
    }, isMultipleTouches = function(event) {
      return (event.targetTouches || event.target.touches || []).length > 1;
    }, getTimestamp = function() {
      return new Date().getTime();
    }, sendEvent = function(elm, eventName, originalEvent, data) {
      var customEvent = doc.createEvent("Event");
      customEvent.originalEvent = originalEvent;
      data = data || {};
      data.x = currX;
      data.y = currY;
      if (defaults.useJquery) {
        customEvent = jQuery.Event(eventName, { originalEvent });
        jQuery(elm).trigger(customEvent, data);
      }
      if (customEvent.initEvent) {
        for (var key in data) {
          customEvent[key] = data[key];
        }
        customEvent.initEvent(eventName, true, true);
        elm.dispatchEvent(customEvent);
      }
      while (elm) {
        if (elm["on" + eventName])
          elm["on" + eventName](customEvent);
        elm = elm.parentNode;
      }
    }, onTouchStart = function(e) {
      if (!isTheSameFingerId(e) || isMultipleTouches(e))
        return;
      pointerId = e.pointerId;
      if (e.type !== "mousedown")
        wasTouch = true;
      if (e.type === "mousedown" && wasTouch)
        return;
      var pointer = getPointerEvent(e);
      cachedX = currX = pointer.pageX;
      cachedY = currY = pointer.pageY;
      longtapTimer = setTimeout(function() {
        sendEvent(e.target, "longtap", e);
        target = e.target;
      }, defaults.longtapThreshold);
      timestamp = getTimestamp();
      tapNum++;
    }, onTouchEnd = function(e) {
      if (!isTheSameFingerId(e) || isMultipleTouches(e))
        return;
      pointerId = void 0;
      if (e.type === "mouseup" && wasTouch) {
        wasTouch = false;
        return;
      }
      var eventsArr = [], now = getTimestamp(), deltaY = cachedY - currY, deltaX = cachedX - currX;
      clearTimeout(dblTapTimer);
      clearTimeout(longtapTimer);
      if (deltaX <= -defaults.swipeThreshold)
        eventsArr.push("swiperight");
      if (deltaX >= defaults.swipeThreshold)
        eventsArr.push("swipeleft");
      if (deltaY <= -defaults.swipeThreshold)
        eventsArr.push("swipedown");
      if (deltaY >= defaults.swipeThreshold)
        eventsArr.push("swipeup");
      if (eventsArr.length) {
        for (var i = 0; i < eventsArr.length; i++) {
          var eventName = eventsArr[i];
          sendEvent(e.target, eventName, e, {
            distance: {
              x: Math.abs(deltaX),
              y: Math.abs(deltaY)
            }
          });
        }
        tapNum = 0;
      } else {
        if (cachedX >= currX - defaults.tapPrecision && cachedX <= currX + defaults.tapPrecision && cachedY >= currY - defaults.tapPrecision && cachedY <= currY + defaults.tapPrecision) {
          if (timestamp + defaults.tapThreshold - now >= 0) {
            sendEvent(e.target, tapNum >= 2 && target === e.target ? "dbltap" : "tap", e);
            target = e.target;
          }
        }
        dblTapTimer = setTimeout(function() {
          tapNum = 0;
        }, defaults.dbltapThreshold);
      }
    }, onTouchMove = function(e) {
      if (!isTheSameFingerId(e))
        return;
      if (e.type === "mousemove" && wasTouch)
        return;
      var pointer = getPointerEvent(e);
      currX = pointer.pageX;
      currY = pointer.pageY;
    }, tapNum = 0, pointerId, currX, currY, cachedX, cachedY, timestamp, target, dblTapTimer, longtapTimer;
    setListener(doc, touchevents.touchstart + (defaults.justTouchEvents ? "" : " mousedown"), onTouchStart);
    setListener(doc, touchevents.touchend + (defaults.justTouchEvents ? "" : " mouseup"), onTouchEnd);
    setListener(doc, touchevents.touchmove + (defaults.justTouchEvents ? "" : " mousemove"), onTouchMove);
    win.tocca = function(options) {
      for (var opt in options) {
        defaults[opt] = options[opt];
      }
      return defaults;
    };
  })(document, window);

  // node_modules/instant.page/instantpage.js
  var _chromiumMajorVersionInUserAgent = null;
  var _allowQueryString;
  var _allowExternalLinks;
  var _useWhitelist;
  var _delayOnHover = 65;
  var _lastTouchTimestamp;
  var _mouseoverTimer;
  var _preloadedList = new Set();
  var DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION = 1111;
  init();
  function init() {
    const isSupported = document.createElement("link").relList.supports("prefetch");
    if (!isSupported) {
      return;
    }
    const handleVaryAcceptHeader = "instantVaryAccept" in document.body.dataset || "Shopify" in window;
    const chromiumUserAgentIndex = navigator.userAgent.indexOf("Chrome/");
    if (chromiumUserAgentIndex > -1) {
      _chromiumMajorVersionInUserAgent = parseInt(navigator.userAgent.substring(chromiumUserAgentIndex + "Chrome/".length));
    }
    if (handleVaryAcceptHeader && _chromiumMajorVersionInUserAgent && _chromiumMajorVersionInUserAgent < 110) {
      return;
    }
    const mousedownShortcut = "instantMousedownShortcut" in document.body.dataset;
    _allowQueryString = "instantAllowQueryString" in document.body.dataset;
    _allowExternalLinks = "instantAllowExternalLinks" in document.body.dataset;
    _useWhitelist = "instantWhitelist" in document.body.dataset;
    const eventListenersOptions = {
      capture: true,
      passive: true
    };
    let useMousedown = false;
    let useMousedownOnly = false;
    let useViewport = false;
    if ("instantIntensity" in document.body.dataset) {
      const intensity = document.body.dataset.instantIntensity;
      if (intensity.startsWith("mousedown")) {
        useMousedown = true;
        if (intensity == "mousedown-only") {
          useMousedownOnly = true;
        }
      } else if (intensity.startsWith("viewport")) {
        const isNavigatorConnectionSaveDataEnabled = navigator.connection && navigator.connection.saveData;
        const isNavigatorConnectionLike2g = navigator.connection && navigator.connection.effectiveType && navigator.connection.effectiveType.includes("2g");
        if (!isNavigatorConnectionSaveDataEnabled && !isNavigatorConnectionLike2g) {
          if (intensity == "viewport") {
            if (document.documentElement.clientWidth * document.documentElement.clientHeight < 45e4) {
              useViewport = true;
            }
          } else if (intensity == "viewport-all") {
            useViewport = true;
          }
        }
      } else {
        const milliseconds = parseInt(intensity);
        if (!isNaN(milliseconds)) {
          _delayOnHover = milliseconds;
        }
      }
    }
    if (!useMousedownOnly) {
      document.addEventListener("touchstart", touchstartListener, eventListenersOptions);
    }
    if (!useMousedown) {
      document.addEventListener("mouseover", mouseoverListener, eventListenersOptions);
    } else if (!mousedownShortcut) {
      document.addEventListener("mousedown", mousedownListener, eventListenersOptions);
    }
    if (mousedownShortcut) {
      document.addEventListener("mousedown", mousedownShortcutListener, eventListenersOptions);
    }
    if (useViewport) {
      let requestIdleCallbackOrFallback = window.requestIdleCallback;
      if (!requestIdleCallbackOrFallback) {
        requestIdleCallbackOrFallback = (callback) => {
          callback();
        };
      }
      requestIdleCallbackOrFallback(function observeIntersection() {
        const intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const anchorElement = entry.target;
              intersectionObserver.unobserve(anchorElement);
              preload(anchorElement.href);
            }
          });
        });
        document.querySelectorAll("a").forEach((anchorElement) => {
          if (isPreloadable(anchorElement)) {
            intersectionObserver.observe(anchorElement);
          }
        });
      }, {
        timeout: 1500
      });
    }
  }
  function touchstartListener(event) {
    _lastTouchTimestamp = performance.now();
    const anchorElement = event.target.closest("a");
    if (!isPreloadable(anchorElement)) {
      return;
    }
    preload(anchorElement.href, "high");
  }
  function mouseoverListener(event) {
    if (performance.now() - _lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
      return;
    }
    if (!("closest" in event.target)) {
      return;
    }
    const anchorElement = event.target.closest("a");
    if (!isPreloadable(anchorElement)) {
      return;
    }
    anchorElement.addEventListener("mouseout", mouseoutListener, { passive: true });
    _mouseoverTimer = setTimeout(() => {
      preload(anchorElement.href, "high");
      _mouseoverTimer = void 0;
    }, _delayOnHover);
  }
  function mousedownListener(event) {
    const anchorElement = event.target.closest("a");
    if (!isPreloadable(anchorElement)) {
      return;
    }
    preload(anchorElement.href, "high");
  }
  function mouseoutListener(event) {
    if (event.relatedTarget && event.target.closest("a") == event.relatedTarget.closest("a")) {
      return;
    }
    if (_mouseoverTimer) {
      clearTimeout(_mouseoverTimer);
      _mouseoverTimer = void 0;
    }
  }
  function mousedownShortcutListener(event) {
    if (performance.now() - _lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
      return;
    }
    const anchorElement = event.target.closest("a");
    if (event.which > 1 || event.metaKey || event.ctrlKey) {
      return;
    }
    if (!anchorElement) {
      return;
    }
    anchorElement.addEventListener("click", function(event2) {
      if (event2.detail == 1337) {
        return;
      }
      event2.preventDefault();
    }, { capture: true, passive: false, once: true });
    const customEvent = new MouseEvent("click", { view: window, bubbles: true, cancelable: false, detail: 1337 });
    anchorElement.dispatchEvent(customEvent);
  }
  function isPreloadable(anchorElement) {
    if (!anchorElement || !anchorElement.href) {
      return;
    }
    if (_useWhitelist && !("instant" in anchorElement.dataset)) {
      return;
    }
    if (anchorElement.origin != location.origin) {
      let allowed = _allowExternalLinks || "instant" in anchorElement.dataset;
      if (!allowed || !_chromiumMajorVersionInUserAgent) {
        return;
      }
    }
    if (!["http:", "https:"].includes(anchorElement.protocol)) {
      return;
    }
    if (anchorElement.protocol == "http:" && location.protocol == "https:") {
      return;
    }
    if (!_allowQueryString && anchorElement.search && !("instant" in anchorElement.dataset)) {
      return;
    }
    if (anchorElement.hash && anchorElement.pathname + anchorElement.search == location.pathname + location.search) {
      return;
    }
    if ("noInstant" in anchorElement.dataset) {
      return;
    }
    return true;
  }
  function preload(url, fetchPriority = "auto") {
    if (_preloadedList.has(url)) {
      return;
    }
    const linkElement = document.createElement("link");
    linkElement.rel = "prefetch";
    linkElement.href = url;
    linkElement.fetchPriority = fetchPriority;
    linkElement.as = "document";
    document.head.appendChild(linkElement);
    _preloadedList.add(url);
  }
})();
/*! (c) Andrea Giammarchi - ISC */
/*! (c) Andrea Giammarchi @webreflection ISC */
/*! instant.page v5.2.0 - (C) 2019-2023 Alexandre Dieulot - https://instant.page/license */



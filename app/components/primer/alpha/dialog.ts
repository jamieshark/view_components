// import '@primer/behaviors'
// import { focusTrap } from '@primer/behaviors';

/**
 * Options to the focusable elements iterator
 */
 export interface IterateFocusableElements {
  /**
   * (Default: false) Iterate through focusable elements in reverse-order
   */
  reverse?: boolean

  /**
   * (Default: false) Perform additional checks to determine tabbability
   * which may adversely affect app performance.
   */
  strict?: boolean

  /**
   * (Default: false) Only iterate tabbable elements, which is the subset
   * of focusable elements that are part of the page's tab sequence.
   */
  onlyTabbable?: boolean
}

/**
 * Returns an iterator over all of the focusable elements within `container`.
 * Note: If `container` is itself focusable it will be included in the results.
 * @param container The container over which to find focusable elements.
 * @param reverse If true, iterate backwards through focusable elements.
 */
 export function* iterateFocusableElements(
  container: HTMLElement,
  options: IterateFocusableElements = {}
): Generator<HTMLElement, undefined, undefined> {
  const strict = options.strict ?? false
  const acceptFn = options.onlyTabbable ?? false ? isTabbable : isFocusable
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: node =>
      node instanceof HTMLElement && acceptFn(node, strict) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  })
  let nextNode: Node | null = null

  // Allow the container to participate
  if (!options.reverse && acceptFn(container, strict)) {
    yield container
  }

  // If iterating in reverse, continue traversing down into the last child until we reach
  // a leaf DOM node
  if (options.reverse) {
    let lastChild = walker.lastChild()
    while (lastChild) {
      nextNode = lastChild
      lastChild = walker.lastChild()
    }
  } else {
    nextNode = walker.firstChild()
  }
  while (nextNode instanceof HTMLElement) {
    yield nextNode
    nextNode = options.reverse ? walker.previousNode() : walker.nextNode()
  }

  // Allow the container to participate (in reverse)
  if (options.reverse && acceptFn(container, strict)) {
    yield container
  }

  return undefined
}

/**
 * Returns the first focusable child of `container`. If `lastChild` is true,
 * returns the last focusable child of `container`.
 * @param container
 * @param lastChild
 */
 function getFocusableChild(container: HTMLElement, lastChild = false) {
  return iterateFocusableElements(container, {reverse: lastChild, strict: true, onlyTabbable: true}).next().value
}

/**
 * Determines whether the given element is focusable. If `strict` is true, we may
 * perform additional checks that require a reflow (less performant).
 * @param elem
 * @param strict
 */
 export function isFocusable(elem: HTMLElement, strict = false): boolean {
  // Certain conditions cause an element to never be focusable, even if they have tabindex="0"
  const disabledAttrInert =
    ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTGROUP', 'OPTION', 'FIELDSET'].includes(elem.tagName) &&
    (elem as HTMLElement & {disabled: boolean}).disabled
  const hiddenInert = elem.hidden
  const hiddenInputInert = elem instanceof HTMLInputElement && elem.type === 'hidden'
  if (disabledAttrInert || hiddenInert || hiddenInputInert) {
    return false
  }

  // Each of the conditions checked below require a reflow, thus are gated by the `strict`
  // argument. If any are true, the element is not focusable, even if tabindex is set.
  if (strict) {
    const sizeInert = elem.offsetWidth === 0 || elem.offsetHeight === 0
    const visibilityInert = ['hidden', 'collapse'].includes(getComputedStyle(elem).visibility)
    const clientRectsInert = elem.getClientRects().length === 0
    if (sizeInert || visibilityInert || clientRectsInert) {
      return false
    }
  }

  // Any element with `tabindex` explicitly set can be focusable, even if it's set to "-1"
  if (elem.getAttribute('tabindex') != null) {
    return true
  }

  // One last way `elem.tabIndex` can be wrong.
  if (elem instanceof HTMLAnchorElement && elem.getAttribute('href') == null) {
    return false
  }

  return elem.tabIndex !== -1
}


/**
 * Determines whether the given element is tabbable. If `strict` is true, we may
 * perform additional checks that require a reflow (less performant). This check
 * ensures that the element is focusable and that its tabindex is not explicitly
 * set to "-1" (which makes it focusable, but removes it from the tab order).
 * @param elem
 * @param strict
 */
 export function isTabbable(elem: HTMLElement, strict = false): boolean {
  return isFocusable(elem, strict) && elem.getAttribute('tabindex') !== '-1'
}

/**
 * Traps focus within the given container.
 * @param container The container in which to trap focus
 * @returns AbortController - call `.abort()` to disable the focus trap
 */
export function focusTrap2(container: HTMLElement, initialFocus?: HTMLElement) {
  const firstFocusableChild = getFocusableChild(container)
  const sentinelStart = document.createElement('span')
  sentinelStart.setAttribute('class', 'focus-trap sentinel-start')
  sentinelStart.setAttribute('tabindex', '0')
  sentinelStart.setAttribute('aria-hidden', 'true')
  sentinelStart.onfocus = () => {
    firstFocusableChild?.focus()
  }

  const sentinelEnd = document.createElement('span')
  sentinelEnd.setAttribute('class', 'focus-trap sentinel-end')
  sentinelEnd.setAttribute('tabindex', '0')
  sentinelEnd.setAttribute('aria-hidden', 'true')
  sentinelEnd.onfocus = () => {
    // If the end sentinel was focused, move focus to the start sentinel
    sentinelStart.focus()
  }
  container.prepend(sentinelStart)
  container.append(sentinelEnd)

  if (initialFocus) {
    initialFocus.focus()
  } else {
    firstFocusableChild?.focus()
  }
}

/* Testing a theory: can we include in progress TypeScript code here? */

class ModalDialogElement extends HTMLElement {
  private abortController: AbortController | undefined

  constructor(){
    super();

    console.log(this.querySelector('.close-button'));
    this.querySelector('.close-button')?.addEventListener('click', (e:Event) => this.close());
  }

  connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'dialog')

    // Find the associated button?

    const subscriptions = [
      fromEvent(this, 'compositionstart', e => trackComposition(this, e)),
      fromEvent(this, 'compositionend', e => trackComposition(this, e)),
      fromEvent(this, 'keydown', e => keydown(this, e))
    ]

    states.set(this, {subscriptions, loaded: false, isComposing: false})
  }

  disconnectedCallback(): void {
    const state = states.get(this)
    if (!state) return
    states.delete(this)
    for (const sub of state.subscriptions) {
      sub.unsubscribe()
    }
  }

  open() {
    //TODO: Is an `open` attribute a good idea?
    const wasOpen = this.hasAttribute('open')
    if (wasOpen) return
    this.setAttribute('open', '')
    // this.abortController = focusTrap(this)
    focusTrap2(this)
    //TODO: handle focus here?
  }

  close() {
    const wasOpen = this.hasAttribute('open')
    if (!wasOpen) return
    this.removeAttribute('open')
    this.abortController?.abort()
    //TODO: handle focus here?
  }
}

const states = new WeakMap()

type Subscription = {unsubscribe(): void}
const NullSubscription = {
  unsubscribe() {
    /* Do nothing */
  }
}

function fromEvent(
  target: EventTarget,
  eventName: string,
  onNext: EventListenerOrEventListenerObject,
  options: boolean | AddEventListenerOptions = false
): Subscription {
  target.addEventListener(eventName, onNext, options)
  return {
    unsubscribe: () => {
      target.removeEventListener(eventName, onNext, options)
    }
  }
}

function keydown(dialog: ModalDialogElement, event: Event) {
  if (!(event instanceof KeyboardEvent)) return
  const state = states.get(dialog)
  if (!state || state.isComposing) return

  switch (event.key) {
    case 'Escape':
      if (dialog.hasAttribute('open')) {
        dialog.close()
        event.preventDefault()
        event.stopPropagation()
      }
      break
  }
}

function trackComposition(dialog: Element, event: Event) {
  const state = states.get(dialog)
  if (!state) return
  state.isComposing = event.type === 'compositionstart'
}

declare global {
  interface Window {
    ModalDialogElement: typeof ModalDialogElement
  }
  interface HTMLElementTagNameMap {
    'modal-dialog': ModalDialogElement
  }
}

export default ModalDialogElement

if (!window.customElements.get('modal-dialog')) {
  window.ModalDialogElement = ModalDialogElement
  window.customElements.define('modal-dialog', ModalDialogElement)
}
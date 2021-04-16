import './caret.css';

interface CaretStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  animation?: string;
}

type CaretStyleKey = keyof CaretStyle;

export default class Caret {
  private container: Element | null;

  private caretEl: Element | undefined;

  private caretStyle: CaretStyle;

  private isFocus = false;

  constructor(private selector: string) {
    this.initContainer(selector);
    this.bindEvents();
    this.caretStyle = {
      left: 0,
      top: 0,
      height: 0,
      width: 1,
      opacity: 0,
    };
  }

  initContainer(selector: string) {
    const container = document.querySelector(selector);
    if (!container) {
      throw new Error('container is null, check selector is right');
    }
    this.container = container;
    this.container.classList.add('inline-input-caret-container');
  }

  isStyleEqual(style: CaretStyle, other: CaretStyle) {
    return Object.keys(style).every(
      (key) => style[key as CaretStyleKey] === other[key as CaretStyleKey]
    );
  }

  setCaretStyle(style: Partial<CaretStyle>) {
    const newStyle: CaretStyle = {
      ...this.caretStyle,
      ...style,
    };

    if (!this.isStyleEqual(newStyle, this.caretStyle)) {
      this.caretStyle = newStyle;
      this.renderCaret();
    }
  }

  getCaretStyle() {
    const { left, top, height, width, opacity, animation } = this.caretStyle;
    const animationStyle = animation ? `animation: ${animation};` : '';
    return `left: ${left}px; top: ${top}px; height: ${height}px; width: ${width}px;opacity: ${opacity};${animationStyle}`;
  }

  mountCaret() {
    this.caretEl = document.createElement('div');
    this.caretEl.classList.add('inline-input-caret');
    this.container.appendChild(this.caretEl);
  }

  renderCaret() {
    if (!this.caretEl) {
      this.mountCaret();
    }

    this.caretEl.setAttribute('style', this.getCaretStyle());
  }

  getCaretRect(clientX: number, clientY: number) {
    if (document.caretPositionFromPoint) {
      return document.caretPositionFromPoint(clientX, clientY).getClientRect();
    }

    if (document.caretRangeFromPoint) {
      return document
        .caretRangeFromPoint(clientX, clientY)!
        .getClientRects()[0];
    }

    throw new Error('Not Support Browser');
  }

  hideCaret() {
    this.setCaretStyle({
      opacity: 0,
    });
  }

  showCaret() {
    this.setCaretStyle({
      opacity: 1,
    });
  }

  stopBlink() {
    this.setCaretStyle({
      animation: 'none',
    });
  }

  startBlink() {
    this.setCaretStyle({
      animation: undefined,
    });
  }

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
      //@ts-ignore
    } else if (document.selection) {
      // IE
      //@ts-ignore
      document.selection.empty();
    }
  }

  isPointInContainer(clientX: number, clientY: number) {
    const containerRect = this.container.getBoundingClientRect();

    return (
      containerRect.top <= clientY &&
      containerRect.bottom >= clientY &&
      containerRect.left <= clientX &&
      containerRect.right >= clientX
    );
  }

  isSelectThings() {
    const selection = window.getSelection();
    if (selection.rangeCount < 1) {
      return false;
    }

    const range = selection.getRangeAt(0);
    return !range.collapsed;
  }

  isPointInSelect(clientX: number, clientY: number) {
    const selection = window.getSelection();
    if (selection.rangeCount < 1) {
      return false;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      return false;
    }

    const rangeRect = range.getBoundingClientRect();
    return (
      rangeRect.top <= clientY &&
      rangeRect.bottom >= clientY &&
      rangeRect.left <= clientX &&
      rangeRect.right >= clientX
    );
  }

  handleMouseDown = (e: MouseEvent) => {
    this.isFocus = false;

    this.clearSelection();
    if (!this.isPointInContainer(e.clientX, e.clientY)) {
      this.hideCaret();
    }

    this.isFocus = true;

    const rangeRect = this.getCaretRect(e.clientX, e.clientY);
    if (!rangeRect) {
      this.hideCaret();
      return;
    }

    const containerRect = this.container.getBoundingClientRect();
    this.setCaretStyle({
      left: rangeRect.left - containerRect.left,
      top: rangeRect.top - containerRect.top,
      height: rangeRect.height,
      opacity: 1,
      animation: 'none',
    });
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.isFocus) {
      return;
    }

    if (!this.isPointInContainer(e.clientX, e.clientY)) {
      return;
    }

    if (this.isSelectThings()) {
      this.hideCaret();
    } else {
      this.showCaret();
    }
  };

  handleMouseUp = (e: MouseEvent) => {
    if (!this.isFocus) {
      return;
    }

    if (!this.isPointInContainer(e.clientX, e.clientY)) {
      return;
    }

    if (!this.isSelectThings()) {
      this.startBlink();
    }
  };

  bindEvents() {
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  unbindEvents() {
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  destroy() {
    this.unbindEvents();
  }
}

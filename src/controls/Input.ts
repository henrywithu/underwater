/**
 * Collects raw input from the canvas and window into a frame-friendly state object.
 * Controllers read deltas each frame and call `consume()`; nothing here knows about
 * cameras, which keeps the controllers easy to test and swap.
 */
export interface Joystick {
  active: boolean;
  id: number;
  originX: number;
  originY: number;
  x: number; // -1..1
  y: number; // -1..1
}

export class Input {
  readonly keys = new Set<string>();
  /** normalised pointer position, 0..1 (used for parallax and the mouse lens) */
  mouse = { x: 0.5, y: 0.5, inside: false };
  /** accumulated per frame */
  wheel = 0;
  dragX = 0;
  dragY = 0;
  dragging = false;
  joystick: Joystick = { active: false, id: -1, originX: 0, originY: 0, x: 0, y: 0 };
  /** true while the virtual joystick zone should be offered (touch + free mode) */
  joystickEnabled = false;
  /** emitted on a click that wasn't a drag */
  onTap: ((x: number, y: number) => void) | null = null;

  private pointers = new Map<number, { x: number; y: number; startX: number; startY: number; moved: number }>();
  private disposers: (() => void)[] = [];

  constructor(el: HTMLElement) {
    this.listen(window, 'keydown', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea')) return;
      this.keys.add(e.code);
    });
    this.listen(window, 'keyup', (e: KeyboardEvent) => this.keys.delete(e.code));
    this.listen(window, 'blur', () => this.keys.clear());
    this.listen(el, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      // normalise line/page deltas to pixels
      const k = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? window.innerHeight : 1;
      this.wheel += e.deltaY * k;
    }, { passive: false });
    this.listen(window, 'pointermove', (e: PointerEvent) => {
      this.mouse.x = e.clientX / window.innerWidth;
      this.mouse.y = e.clientY / window.innerHeight;
      this.mouse.inside = true;
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      p.moved += Math.abs(dx) + Math.abs(dy);
      if (this.joystick.active && e.pointerId === this.joystick.id) {
        const r = 56;
        const jx = (e.clientX - this.joystick.originX) / r;
        const jy = (e.clientY - this.joystick.originY) / r;
        const len = Math.hypot(jx, jy);
        const k = len > 1 ? 1 / len : 1;
        this.joystick.x = jx * k;
        this.joystick.y = jy * k;
        return;
      }
      this.dragX += dx;
      this.dragY += dy;
    });
    this.listen(el, 'pointerdown', (e: PointerEvent) => {
      el.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: 0 });
      if (this.joystickEnabled && e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45 && !this.joystick.active) {
        Object.assign(this.joystick, { active: true, id: e.pointerId, originX: e.clientX, originY: e.clientY, x: 0, y: 0 });
        return;
      }
      this.dragging = true;
    });
    const up = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (this.joystick.active && e.pointerId === this.joystick.id) {
        Object.assign(this.joystick, { active: false, id: -1, x: 0, y: 0 });
        return;
      }
      if (p && p.moved < 6 && e.type === 'pointerup') this.onTap?.(e.clientX, e.clientY);
      this.dragging = this.pointers.size > (this.joystick.active ? 1 : 0);
    };
    this.listen(window, 'pointerup', up);
    this.listen(window, 'pointercancel', up);
    this.listen(document, 'mouseleave', () => (this.mouse.inside = false));
  }

  private listen<E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: AddEventListenerOptions) {
    target.addEventListener(type, fn as EventListener, opts);
    this.disposers.push(() => target.removeEventListener(type, fn as EventListener, opts));
  }

  isDown(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }

  /** Reset per-frame accumulators. */
  consume() {
    this.wheel = 0;
    this.dragX = 0;
    this.dragY = 0;
  }

  dispose() {
    this.disposers.forEach((d) => d());
  }
}

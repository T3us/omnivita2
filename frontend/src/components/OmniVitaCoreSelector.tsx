import clsx from 'clsx';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform
} from 'framer-motion';
import type { PanInfo, Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

export interface OmniVitaSelectorForm {
  id: string;
  name: string;
  image: string;
  bg?: string;
}

export interface OmniVitaCoreSelectorHandle {
  step(direction: -1 | 1, options?: { force?: boolean; speedMultiplier?: number }): boolean;
}

interface OmniVitaCoreSelectorProps {
  forms: OmniVitaSelectorForm[];
  selectedIndex: number;
  onSelectIndex(index: number): void;
  onStep?(direction: -1 | 1): void;
  onActivate?(): void;
  actionLabel?: string;
  className?: string;
  disabled?: boolean;
  locked?: boolean;
  status?: 'closed' | 'open' | 'transformed' | 'discharging' | 'cooldown';
}

type SelectorPhase = 'idle' | 'preparing' | 'closing' | 'switching' | 'opening' | 'settling';

const DRAG_DISTANCE_THRESHOLD = 44;
const DRAG_VELOCITY_THRESHOLD = 520;

const irisVariants: Variants = {
  idle: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    scaleY: 1,
    filter: 'brightness(1) saturate(1)'
  },
  preparing: {
    opacity: 1,
    rotate: 0,
    scale: 1.02,
    scaleY: 0.88,
    filter: 'brightness(1.24) saturate(1.18)'
  },
  closing: {
    opacity: 0.96,
    rotate: 18,
    scale: 0.18,
    scaleY: 0.34,
    filter: 'brightness(1.45) saturate(1.28)'
  },
  switching: {
    opacity: 0.74,
    rotate: 28,
    scale: 0.12,
    scaleY: 0.22,
    filter: 'brightness(1.35) saturate(1.15)'
  },
  opening: {
    opacity: 1,
    rotate: -5,
    scale: 1.05,
    scaleY: 1.03,
    filter: 'brightness(1.18) saturate(1.12)'
  },
  settling: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    scaleY: 1,
    filter: 'brightness(1) saturate(1)'
  }
};

const alienVariants: Variants = {
  enter: (direction: -1 | 1) => ({
    opacity: 0,
    y: direction > 0 ? 32 : -32,
    scale: 0.74,
    filter: 'blur(6px) brightness(.72)'
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px) brightness(1)'
  },
  exit: {
    opacity: 0,
    y: 0,
    scale: 0.42,
    filter: 'blur(8px) brightness(.55)'
  }
};

function wrapIndex(index: number, total: number) {
  if (!total) return 0;
  return (index + total) % total;
}

export const OmniVitaCoreSelector = forwardRef<OmniVitaCoreSelectorHandle, OmniVitaCoreSelectorProps>(
  function OmniVitaCoreSelector({
    forms,
    selectedIndex,
    onSelectIndex,
    onStep,
    onActivate,
    actionLabel = 'Selecionar forma',
    className,
    disabled = false,
    locked = false,
    status = 'open'
  }, ref) {
    const prefersReducedMotion = useReducedMotion();
    const dragY = useMotionValue(0);
    const dragCompression = useTransform(dragY, [-90, 0, 90], [0.88, 1, 0.88]);
    const ringDragRotate = useTransform(dragY, [-120, 120], [10, -10]);
    const coreDragRotate = useTransform(dragY, [-120, 120], [-7, 7]);
    const [displayIndex, setDisplayIndex] = useState(selectedIndex);
    const [phase, setPhase] = useState<SelectorPhase>('idle');
    const [direction, setDirection] = useState<-1 | 1>(1);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const isTransitioningRef = useRef(false);
    const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const currentForm = forms[wrapIndex(displayIndex, forms.length)] || null;
    const canMove = forms.length > 1 && !disabled && !locked && !isTransitioningRef.current;

    useEffect(() => {
      if (!isTransitioningRef.current) {
        setDisplayIndex(wrapIndex(selectedIndex, forms.length));
      }
    }, [forms.length, selectedIndex]);

    useEffect(() => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    }, []);

    const wait = useCallback((ms: number) => new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timersRef.current = timersRef.current.filter((entry) => entry !== timer);
        resolve();
      }, ms);
      timersRef.current.push(timer);
    }), []);

    const resetFailedDrag = useCallback(async () => {
      if (disabled || locked || isTransitioningRef.current) return;
      setPhase('settling');
      await wait(prefersReducedMotion ? 40 : 120);
      setPhase('idle');
    }, [disabled, locked, prefersReducedMotion, wait]);

    const runStep = useCallback((nextDirection: -1 | 1, options?: { force?: boolean; speedMultiplier?: number }) => {
      const force = Boolean(options?.force);
      const speedMultiplier = Math.max(0.25, Number(options?.speedMultiplier) || 1);
      if (!forms.length || forms.length < 2 || (!force && disabled) || (!force && locked) || isTransitioningRef.current) {
        return false;
      }

      const currentIndex = wrapIndex(displayIndex, forms.length);
      const nextIndex = wrapIndex(currentIndex + nextDirection, forms.length);
      setDirection(nextDirection);
      isTransitioningRef.current = true;

      void (async () => {
        if (prefersReducedMotion) {
          setPhase('closing');
          await wait(Math.max(20, Math.round(60 / speedMultiplier)));
          setDisplayIndex(nextIndex);
          onSelectIndex(nextIndex);
          onStep?.(nextDirection);
          setPhase('opening');
          await wait(Math.max(30, Math.round(90 / speedMultiplier)));
          setPhase('idle');
          isTransitioningRef.current = false;
          return;
        }

        setPhase('preparing');
        await wait(Math.max(30, Math.round(95 / speedMultiplier)));
        setPhase('closing');
        await wait(Math.max(50, Math.round(190 / speedMultiplier)));
        setPhase('switching');
        setDisplayIndex(nextIndex);
        onSelectIndex(nextIndex);
        onStep?.(nextDirection);
        await wait(Math.max(20, Math.round(60 / speedMultiplier)));
        setPhase('opening');
        await wait(Math.max(70, Math.round(270 / speedMultiplier)));
        setPhase('settling');
        await wait(Math.max(40, Math.round(120 / speedMultiplier)));
        setPhase('idle');
        isTransitioningRef.current = false;
      })();

      return true;
    }, [disabled, displayIndex, forms.length, locked, onSelectIndex, onStep, prefersReducedMotion, wait]);

    useImperativeHandle(ref, () => ({
      step: runStep
    }), [runStep]);

    useEffect(() => {
      const element = rootRef.current;
      if (!element) return undefined;

      function handleNativeWheel(event: WheelEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (Math.abs(event.deltaY) < 8) return;
        runStep(event.deltaY > 0 ? 1 : -1);
      }

      element.addEventListener('wheel', handleNativeWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleNativeWheel);
    }, [runStep]);

    function handleDragStart() {
      if (!canMove) return;
      setPhase('preparing');
    }

    function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
      dragY.set(0);
      if (!canMove) {
        void resetFailedDrag();
        return;
      }

      const offset = info.offset.y;
      const velocity = info.velocity.y;
      const confirmed = Math.abs(offset) >= DRAG_DISTANCE_THRESHOLD || Math.abs(velocity) >= DRAG_VELOCITY_THRESHOLD;
      if (!confirmed) {
        void resetFailedDrag();
        return;
      }

      runStep(offset < 0 || velocity < -DRAG_VELOCITY_THRESHOLD ? 1 : -1);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        runStep(-1);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        runStep(1);
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled && !isTransitioningRef.current) onActivate?.();
      }
    }

    const phaseForAnimation = phase === 'idle' ? 'center' : phase === 'settling' ? 'center' : phase;
    const imageAnimate = phase === 'closing' || phase === 'switching'
      ? {
        opacity: 0,
        y: 0,
        scale: 0.42,
        filter: 'blur(8px) brightness(.55)'
      }
      : phase === 'preparing'
        ? {
          opacity: 0.88,
          y: 0,
          scale: 0.9,
          filter: 'blur(1px) brightness(.9)'
        }
        : {
          opacity: 1,
          y: 0,
          scale: phase === 'opening' ? 1.03 : 1,
          filter: 'blur(0px) brightness(1)'
        };

    return (
      <motion.div
        ref={rootRef}
        className={clsx(
          'omnivita-combat-vortex omnivita-core-selector',
          `is-${status}`,
          `phase-${phase}`,
          locked && 'is-locked',
          disabled && 'is-disabled',
          className
        )}
        role="application"
        tabIndex={0}
        aria-label={currentForm ? `OmniVita: ${currentForm.name} selecionado` : 'OmniVita'}
        aria-busy={phase !== 'idle'}
        drag={canMove ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragDirectionLock
        dragElastic={0.12}
        style={{ y: dragY, rotate: coreDragRotate, scaleY: dragCompression }}
        onClick={() => {
          if (!disabled && !isTransitioningRef.current) onActivate?.();
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onKeyDown={handleKeyDown}
      >
        <motion.span className="omnivita-core-stars" aria-hidden="true" />
        <motion.span
          className="omnivita-motion-ring ring-outer"
          aria-hidden="true"
          style={{ rotate: ringDragRotate }}
          animate={prefersReducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="omnivita-motion-ring ring-middle"
          aria-hidden="true"
          animate={phaseForAnimation === 'preparing' || phaseForAnimation === 'closing'
            ? { rotate: -24, scale: 0.96, opacity: 0.9 }
            : prefersReducedMotion
              ? { opacity: 0.76 }
              : { rotate: [0, -6, 0], scale: [1, 1.015, 1], opacity: [0.72, 0.9, 0.72] }}
          transition={phaseForAnimation === 'preparing' || phaseForAnimation === 'closing'
            ? { duration: 0.18, ease: 'easeOut' }
            : { duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="omnivita-motion-ring ring-inner"
          aria-hidden="true"
          animate={phaseForAnimation === 'closing'
            ? { rotate: 32, scale: 0.74 }
            : prefersReducedMotion
              ? { scale: 1 }
              : { rotate: [0, 5, 0], scale: [1, 0.985, 1] }}
          transition={phaseForAnimation === 'closing'
            ? { duration: 0.2, ease: 'easeIn' }
            : { duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span className="omnivita-core-glass" aria-hidden="true" />

        <motion.button
          className="omnivita-selected-projection"
          type="button"
          disabled={disabled}
          aria-label={actionLabel}
          onClick={(event) => {
            event.stopPropagation();
            if (!disabled && !isTransitioningRef.current) onActivate?.();
          }}
        >
          <motion.span
            className="omnivita-motion-iris"
            aria-hidden="true"
            variants={irisVariants}
            animate={phase}
            transition={{
              duration: phase === 'closing' ? 0.18 : phase === 'opening' ? 0.28 : 0.14,
              ease: phase === 'closing' ? 'easeIn' : 'easeOut'
            }}
          >
            <span className="omnivita-selected-orbit" />
            <span className="omnivita-iris-blades" />
            <span className="omnivita-singularity" />
            <AnimatePresence mode="wait" custom={direction}>
              {currentForm ? (
                <motion.span
                  className="omnivita-selected-image"
                  key={currentForm.id}
                  custom={direction}
                  variants={alienVariants}
                  initial="enter"
                  animate={imageAnimate}
                  exit="exit"
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : phase === 'opening' ? 0.28 : 0.18,
                    ease: 'easeOut'
                  }}
                  style={{ '--omnivita-form-bg': currentForm.bg || '' } as CSSProperties}
                >
                  {currentForm.image ? <img src={currentForm.image} alt="" draggable={false} /> : <span>{currentForm.name.slice(0, 2).toUpperCase()}</span>}
                </motion.span>
              ) : null}
            </AnimatePresence>
            <motion.span
              className="omnivita-confirm-sweep"
              aria-hidden="true"
              animate={phase === 'opening' ? { opacity: [0, 0.78, 0], x: ['-80%', '95%', '150%'] } : { opacity: 0, x: '-80%' }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
            />
          </motion.span>
          <span className="omnivita-selected-name">{currentForm?.name || 'Forma'}</span>
        </motion.button>

        <div className="omnivita-combat-forms" aria-hidden="true" />
      </motion.div>
    );
  }
);

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { OmniVitaCoreSelector } from '../components/OmniVitaCoreSelector';
import type { OmniVitaCoreSelectorHandle } from '../components/OmniVitaCoreSelector';
import { Badge, Button, Card } from '../components/Ui';

type PrototypeVisualState = 'closed' | 'open' | 'transformed' | 'discharging' | 'cooldown';

interface PrototypeForm {
  id: string;
  name: string;
  image: string;
  bg: string;
}

const prototypeForms: PrototypeForm[] = [
  {
    id: 'armoguana',
    name: 'Armoguana',
    image: '/legacy/assets/armoguana%20silhueta.png',
    bg: 'linear-gradient(135deg, #4fbfff, #8a31ff 58%, #08020d)'
  },
  {
    id: 'pelagornis',
    name: 'Pelagornis',
    image: '/legacy/assets/pelagornis%20silhueta.png',
    bg: 'linear-gradient(135deg, #4768ff, #bc46ff 56%, #050108)'
  },
  {
    id: 'geck',
    name: 'Geck',
    image: '/legacy/assets/geck%20silhueta.png',
    bg: 'linear-gradient(135deg, #b85dff, #38105a 58%, #050108)'
  },
  {
    id: 'eciton',
    name: 'Eciton',
    image: '/legacy/assets/eciton%20silhueta.png',
    bg: 'linear-gradient(135deg, #e64cff, #5b173a 56%, #080105)'
  },
  {
    id: 'sidarta',
    name: 'Sidarta',
    image: '/legacy/assets/sidarta%20silhueta.png',
    bg: 'linear-gradient(135deg, #f4d7ff, #8f37ff 52%, #0b0310)'
  },
  {
    id: 'cinetico',
    name: 'Cinetico',
    image: '/legacy/assets/cinetico%20silhueta.png',
    bg: 'linear-gradient(135deg, #754bff, #d348ff 52%, #090111)'
  },
  {
    id: 'desmodus',
    name: 'Desmodus',
    image: '/legacy/assets/desmodus%20silhueta.png',
    bg: 'linear-gradient(135deg, #b13cff, #220936 58%, #040105)'
  },
  {
    id: 'landslide',
    name: 'Landslide',
    image: '/legacy/assets/landslide%20silhueta.png',
    bg: 'linear-gradient(135deg, #6e33ff, #5f1c91 58%, #050108)'
  }
];

export function OmnitrixPage() {
  return (
    <AppLayout title="OmniVita" eyebrow="PROTOTIPO">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
        <OmniVitaPrototypeCard />

        <Card className="self-start">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Pulso do Cael</h2>
              <p className="mt-2 text-sm text-textMuted">
                Prototipo React do OmniVita para testar o buraco central, a abertura em wormhole, a selecao travada e a descarga.
              </p>
            </div>
            <Badge tone="accent">React</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            <PrototypeStep label="Abrir" text="O toque no centro abre o buraco e revela as silhuetas." />
            <PrototypeStep label="Transformar" text="A forma selecionada trava no centro e nao pode ser trocada direto por outra." />
            <PrototypeStep label="Descarregar" text="Um novo toque descarrega; ele pisca entre roxo e sem energia antes do cooldown." />
          </div>

          <div className="mt-5 rounded-lg border border-line bg-white/5 p-3 text-sm text-textMuted">
            No painel do personagem, essa mesma ideia entra compacta na aba Combate apenas para o Cael/OmniVita.
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function PrototypeStep({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/5 p-3">
      <strong>{label}</strong>
      <p className="mt-1 text-sm text-textMuted">{text}</p>
    </div>
  );
}

function OmniVitaPrototypeCard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormId, setActiveFormId] = useState('');
  const [isDischarging, setIsDischarging] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const selectorRef = useRef<OmniVitaCoreSelectorHandle | null>(null);
  const dischargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedForm = prototypeForms[selectedIndex] || prototypeForms[0];
  const activeForm = useMemo(
    () => prototypeForms.find((form) => form.id === activeFormId) || null,
    [activeFormId]
  );
  const visualState: PrototypeVisualState = isDischarging
    ? 'discharging'
    : isCooldown
      ? 'cooldown'
      : activeFormId
        ? 'transformed'
        : isOpen
          ? 'open'
          : 'closed';
  const statusLabel = getPrototypeStatusLabel(visualState, activeForm || selectedForm);
  const mainActionLabel = visualState === 'closed'
    ? 'Abrir'
    : visualState === 'cooldown'
      ? 'Recarregar'
      : visualState === 'transformed'
        ? 'Descarregar'
        : visualState === 'discharging'
          ? 'Descarregando'
          : 'Transformar';

  useEffect(() => () => {
    if (dischargeTimerRef.current) clearTimeout(dischargeTimerRef.current);
  }, []);

  function moveSelection(direction: number) {
    if (isDischarging || isCooldown || activeFormId) return;
    if (!isOpen && !activeFormId) setIsOpen(true);
    setSelectedIndex((current) => (current + direction + prototypeForms.length) % prototypeForms.length);
  }

  function stepSelection(direction: -1 | 1) {
    if (!selectorRef.current?.step(direction)) moveSelection(direction);
  }

  function toggleOpen() {
    if (isDischarging) return;
    if (isCooldown) {
      recharge();
      return;
    }
    if (activeFormId) {
      discharge();
      return;
    }
    setIsOpen((current) => !current);
  }

  function transform(index = selectedIndex) {
    if (isDischarging || isCooldown) return;
    const nextIndex = Math.max(0, Math.min(prototypeForms.length - 1, index));
    setSelectedIndex(nextIndex);
    setActiveFormId(prototypeForms[nextIndex]?.id || '');
    setIsOpen(true);
  }

  function discharge() {
    if (!activeFormId || isDischarging || isCooldown) return;
    setIsDischarging(true);
    setIsOpen(true);

    dischargeTimerRef.current = setTimeout(() => {
      dischargeTimerRef.current = null;
      setActiveFormId('');
      setIsDischarging(false);
      setIsCooldown(true);
      setIsOpen(false);
    }, 2400);
  }

  function recharge() {
    if (isDischarging) return;
    setIsCooldown(false);
    setActiveFormId('');
    setIsOpen(false);
  }

  function mainAction() {
    if (isDischarging) return;
    if (isCooldown) {
      recharge();
      return;
    }
    if (activeFormId) {
      discharge();
      return;
    }
    if (isOpen) transform();
    else setIsOpen(true);
  }

  return (
    <div className="omnivita-prototype-shell">
      <article
        className={[
          'player-omnivita-combat-card',
          'omnivita-prototype-card',
          `is-${visualState}`,
          activeFormId ? 'is-transformed' : '',
          isDischarging ? 'is-discharging' : '',
          isCooldown ? 'is-cooldown' : ''
        ].filter(Boolean).join(' ')}
      >
        <div className="omnivita-combat-head">
          <div>
            <strong>OmniVita</strong>
            <p>{statusLabel}</p>
          </div>
          <Badge tone={activeFormId ? 'accent' : 'neutral'}>{visualState === 'closed' ? 'Em espera' : visualState}</Badge>
        </div>

        <div className="omnivita-combat-stage" aria-label="Prototipo visual do OmniVita">
          <button
            className="omnivita-combat-device"
            type="button"
            disabled={isDischarging}
            onClick={toggleOpen}
            aria-label={isOpen ? 'Fechar OmniVita' : 'Abrir OmniVita'}
          >
            <span className="omnivita-combat-cylinder">
              <span className="omnivita-combat-cap top" />
              <span className="omnivita-combat-cap bottom" />
              <span className="omnivita-combat-core" />
            </span>
          </button>

          <OmniVitaCoreSelector
            ref={selectorRef}
            forms={prototypeForms}
            selectedIndex={selectedIndex}
            status={visualState}
            actionLabel={mainActionLabel}
            disabled={isDischarging}
            locked={Boolean(activeFormId) || isCooldown || isDischarging}
            onActivate={mainAction}
            onSelectIndex={(index) => {
              setSelectedIndex(index);
              setIsOpen(true);
            }}
          />
        </div>

        <div className="omnivita-combat-controls">
          <Button type="button" disabled={isDischarging || isCooldown || Boolean(activeFormId)} onClick={() => stepSelection(-1)}>Subir</Button>
          <Button tone="primary" type="button" disabled={isDischarging} onClick={mainAction}>{mainActionLabel}</Button>
          <Button type="button" disabled={isDischarging || isCooldown || Boolean(activeFormId)} onClick={() => stepSelection(1)}>Descer</Button>
        </div>

        <div className="omnivita-combat-footer">
          <Badge>{activeForm?.name || selectedForm.name}</Badge>
          <Badge>{isOpen || activeFormId ? 'Aberto' : 'Fechado'}</Badge>
          <Button type="button" disabled={isDischarging} onClick={() => {
            setActiveFormId('');
            setIsDischarging(false);
            setIsCooldown(false);
            setIsOpen(false);
          }}>
            Resetar
          </Button>
        </div>
      </article>
    </div>
  );
}

function getPrototypeStatusLabel(state: PrototypeVisualState, form: PrototypeForm) {
  if (state === 'closed') return 'OmniVita em espera';
  if (state === 'open') return `${form.name} selecionado`;
  if (state === 'transformed') return `${form.name} ativo`;
  if (state === 'discharging') return 'Descarregando';
  return 'Descarregado';
}

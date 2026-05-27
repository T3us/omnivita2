import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CharacterSheet } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { AppLayout } from '../components/AppLayout';
import { CharacterSheetEditor } from '../components/CharacterSheetEditor';
import { Badge, Button, Card } from '../components/Ui';
import { calculateDerived, hydrateCharacter } from '../domain/system';
import { useBootstrap } from '../hooks/useBootstrap';

export function PlayerPage() {
  const query = useBootstrap();
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const character = query.data?.characters?.[0] ? hydrateCharacter(query.data.characters[0]) : null;
  const derived = character ? calculateDerived(character) : null;
  const updateMutation = useMutation({
    mutationFn: (nextCharacter: CharacterSheet) => api.updateCharacter(nextCharacter.id, nextCharacter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  });
  const combatControlMutation = useMutation({
    mutationFn: (control: Record<string, unknown>) => api.sendCombatControl(control),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  });

  return (
    <AppLayout
      title="Painel do personagem"
      eyebrow="JOGADOR"
      hideHeader
      sidebar={character && derived ? (
        <PlayerSidebar
          character={character}
          derived={derived}
          username={session?.user.username || '-'}
          onLogout={() => void logout()}
        />
      ) : (
        <FallbackSidebar username={session?.user.username || '-'} onLogout={() => void logout()} />
      )}
    >
      {query.isLoading ? <Card>Carregando ficha...</Card> : null}
      {query.error ? <Card className="border-coral/40 text-coral">{query.error instanceof Error ? query.error.message : 'Erro ao carregar.'}</Card> : null}
      {!query.isLoading && !character ? <Card>Nenhuma ficha encontrada para esta conta.</Card> : null}
      {character && derived ? (
        <CharacterSheetEditor
          character={character}
          combatState={query.data?.combatState}
          saving={updateMutation.isPending}
          combatControlPending={combatControlMutation.isPending}
          onSave={(nextCharacter) => updateMutation.mutate(nextCharacter)}
          onCombatControl={(control) => combatControlMutation.mutateAsync(control)}
        />
      ) : null}
    </AppLayout>
  );
}

function PlayerSidebar({
  character,
  derived,
  username,
  onLogout
}: {
  character: CharacterSheet;
  derived: ReturnType<typeof calculateDerived>;
  username: string;
  onLogout(): void;
}) {
  const image = character.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl">
      <div className="text-center">
        <span className="inline-flex min-h-6 items-center rounded-full border border-vita/20 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
          Jogador
        </span>
        <img className="mx-auto mt-5 h-16 w-16 rounded-full border border-line object-cover" src={image} alt="" />
        <h1 className="mx-auto mt-3 max-w-[170px] text-2xl font-black leading-tight">{character.identity.name}</h1>
        <p className="mt-2 text-sm font-bold text-textMuted">{character.identity.className} - Nivel {character.identity.level}</p>
      </div>

      <section className="grid gap-2 rounded-lg border border-line bg-panelSoft/75 p-3">
        <p className="text-sm"><strong>Usuario:</strong> <span className="text-textMuted">{username}</span></p>
        <p className="text-sm"><strong>Papel:</strong> <span className="text-textMuted">Jogador</span></p>
        <p className="text-sm"><strong>PeV livres:</strong> <span className="text-textMuted">{derived.peVAvailable}</span></p>
        <p className="text-sm"><strong>Instabilidade:</strong> <span className="text-textMuted">{character.resources.instability}/6</span></p>
      </section>

      <ReferenceCard
        title="Escala de skill"
        rows={[
          ['Impulso', '0-1 PE - Rank 1'],
          ['Menor', '2-3 PE - Rank 1'],
          ['Padrao', '4-5 PE - Rank 2'],
          ['Forte', '6-8 PE - Rank 4'],
          ['Pesada', '9-11 PE - Rank 6'],
          ['Extrema', '12-15 PE - Rank 8'],
          ['Alem', '16+ PE - Rank 10+']
        ]}
      />

      <ReferenceCard
        title="Dano"
        rows={[
          ['Impulso', '1d6 + Nexo/2'],
          ['Menor', '1d12 + Nexo/2 ou 2d6+Nexo'],
          ['Padrao', '2d8 ou 3d6 + Nexo/2'],
          ['Forte', '4d6 + Nexo/2 ou 3d10 + Nexo'],
          ['Pesada', '5d6 + Nexo/2 ou 4d10 + Nexo'],
          ['Extrema', '6d8 + Nexo ou 5d10 + Nexo']
        ]}
      />

      <div className="grid gap-2">
        <Button type="button" onClick={() => window.open('/tabletop/player', '_blank', 'noopener,noreferrer')}>Abrir Grid/Tabletop</Button>
        <Button type="button" onClick={onLogout}>Sair</Button>
      </div>
    </div>
  );
}

function FallbackSidebar({ username, onLogout }: { username: string; onLogout(): void }) {
  return (
    <div className="grid gap-3 rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl">
      <Badge>Jogador</Badge>
      <h1 className="text-2xl font-black">Painel do personagem</h1>
      <p className="text-sm text-textMuted">Usuario: {username}</p>
      <Button type="button" onClick={() => window.open('/tabletop/player', '_blank', 'noopener,noreferrer')}>Abrir Grid/Tabletop</Button>
      <Button type="button" onClick={onLogout}>Sair</Button>
    </div>
  );
}

function ReferenceCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="grid gap-2 rounded-lg border border-line bg-panelSoft/75 p-3">
      <h2 className="text-sm font-black">{title}</h2>
      <div className="grid gap-1">
        {rows.map(([label, value]) => (
          <div className="flex justify-between gap-3 text-xs leading-5" key={label}>
            <strong>{label}</strong>
            <span className="text-right text-textMuted">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

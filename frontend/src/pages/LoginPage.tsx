import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/auth-context';
import { Button, Card } from '../components/Ui';

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Informe o usuario.'),
  password: z.string().min(1, 'Informe a senha.')
});

type LoginForm = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' }
  });

  async function onSubmit(values: LoginForm) {
    try {
      const session = await login(values.identifier, values.password);
      navigate(session.user.role === 'master' ? '/mestre' : '/personagem', { replace: true });
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Erro inesperado ao entrar.' });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-8 text-textMain">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_16%,rgba(139,92,246,0.23),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(183,148,255,0.12),transparent_24%),linear-gradient(135deg,#07030f_0%,#0b0613_44%,#12091e_70%,#06030b_100%)]" />
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-4">
          <img src="/Gemini_Generated_Image_rvnvryrvnvryrvnv.png" alt="" className="h-16 w-16 rounded-lg object-cover" />
          <div>
            <span className="text-sm font-bold text-vita">OMNIVITA</span>
            <h1 className="mt-1 text-3xl font-black">Entrar na mesa</h1>
          </div>
        </div>
        <form className="mt-8 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Usuario</span>
            <input className="rounded-lg border border-line bg-white/5 px-4 py-3 outline-none focus:border-vita" placeholder="usuario israelita" {...form.register('identifier')} />
            {form.formState.errors.identifier ? <small className="text-coral">{form.formState.errors.identifier.message}</small> : null}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Senha</span>
            <input className="rounded-lg border border-line bg-white/5 px-4 py-3 outline-none focus:border-vita" type="password" placeholder="Digite a senha" {...form.register('password')} />
            {form.formState.errors.password ? <small className="text-coral">{form.formState.errors.password.message}</small> : null}
          </label>
          {form.formState.errors.root ? <p className="rounded-lg border border-coral/40 bg-coral/10 p-3 text-sm text-coral">{form.formState.errors.root.message}</p> : null}
          <Button tone="primary" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

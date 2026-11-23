import { useRef, useState, type FormEvent } from 'react';
import { joinDemoRoom, DEMO_PIN } from '../services/demoRoom';

export function JoinPage() {
  const pinFromUrl = new URLSearchParams(window.location.search).get('pin') ?? '';
  const [pin, setPin] = useState(/^\d{6}$/.test(pinFromUrl) ? pinFromUrl : '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<{ field: 'pin' | 'nickname' | 'form'; message: string }>();
  const pinInput = useRef<HTMLInputElement>(null);
  const nicknameInput = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = joinDemoRoom(pin, nickname);

    if (!result.ok) {
      setError(result);
      if (result.field === 'pin') pinInput.current?.focus();
      if (result.field === 'nickname') nicknameInput.current?.focus();
      return;
    }

    window.location.assign('/lobby');
  }

  return (
    <main className="entry" aria-labelledby="join-title">
      <div className="entry-intro">
        <div className="arena-grid" aria-hidden="true" />
        <h1 id="join-title">Únete a la <span>partida</span></h1>
        <p>Ingresa el PIN que ves en la pantalla del anfitrión y elige tu apodo.</p>
      </div>

      <form className="panel entry-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="pin">PIN de la partida</label>
          <input
            id="pin" ref={pinInput} value={pin} inputMode="numeric" maxLength={6}
            autoComplete="off" placeholder="000000" required className="pin-input"
            aria-invalid={error?.field === 'pin'}
            aria-describedby={error?.field === 'pin' ? 'join-error' : undefined}
            onChange={event => {
              setPin(event.target.value.replace(/\D/g, ''));
              if (error?.field === 'pin') setError(undefined);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="nickname">Apodo</label>
          <input
            id="nickname" ref={nicknameInput} value={nickname} maxLength={20}
            placeholder="Tu apodo" autoComplete="nickname" required
            aria-invalid={error?.field === 'nickname'}
            aria-describedby={error?.field === 'nickname' ? 'join-error' : undefined}
            onChange={event => {
              setNickname(event.target.value);
              if (error?.field === 'nickname') setError(undefined);
            }}
          />
        </div>
        {error && <p className="form-error" id="join-error" role="alert">{error.message}</p>}
        <button className="button button-primary" type="submit">Entrar a la partida <span aria-hidden="true">→</span></button>
        <button
          className="button button-text" type="button"
          onClick={() => {
            setPin(DEMO_PIN);
            setError(undefined);
            nicknameInput.current?.focus();
          }}
        >
          Usar PIN de prueba <span>{DEMO_PIN}</span>
        </button>
      </form>
    </main>
  );
}

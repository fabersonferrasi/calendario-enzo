import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Info, LogIn, LogOut, Shield, Star, User, X } from 'lucide-react';
import { api } from './api';

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const colorMap = {
  blue: { card: 'bg-blue-50 border-blue-200', stripe: 'bg-blue-500', icon: 'text-blue-500' },
  rose: { card: 'bg-rose-50 border-rose-200', stripe: 'bg-rose-500', icon: 'text-rose-500' },
  slate: { card: 'bg-slate-50 border-slate-200', stripe: 'bg-slate-500', icon: 'text-slate-500' },
  amber: { card: 'bg-amber-50 border-amber-200', stripe: 'bg-amber-500', icon: 'text-amber-500' },
};

const stripeMap = {
  solid: 'bg-slate-500',
  'gradient-blue-rose': 'bg-gradient-to-r from-blue-500 to-rose-500',
  'gradient-rose-blue': 'bg-gradient-to-r from-rose-500 to-blue-500',
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getNthWeekdayDate = (year, month, weekday, occurrence) => {
  let count = 0;
  for (let day = 1; day <= 31; day += 1) {
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() !== month) return null;
    if (candidate.getDay() === Number(weekday)) {
      count += 1;
      if (count === Number(occurrence)) return candidate;
    }
  }
  return null;
};

const isSpecialWeekendDate = (date, weekendConfig) => {
  if (!weekendConfig) return false;
  const startDate = getNthWeekdayDate(date.getFullYear(), date.getMonth(), weekendConfig.startWeekday, weekendConfig.occurrence);
  if (!startDate) return false;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = start + (Number(weekendConfig.durationDays) - 1) * 24 * 60 * 60 * 1000;
  return current >= start && current <= end;
};

const getDisplayRule = (date, calendarData) => {
  if (!calendarData) return null;
  const baseRule = calendarData.weeklyRules.find((rule) => rule.weekday === date.getDay());
  if (!baseRule) return null;
  if (!isSpecialWeekendDate(date, calendarData.weekendConfig)) return { ...baseRule, specialWeekend: false };
  return {
    ...baseRule,
    label: calendarData.weekendConfig.label,
    pickupText: date.getDay() === Number(calendarData.weekendConfig.startWeekday) ? calendarData.weekendConfig.pickupText : '',
    primaryParentId: calendarData.weekendConfig.parentId,
    highlightColor: calendarData.weekendConfig.highlightColor,
    stripeMode: 'solid',
    specialWeekend: true,
  };
};

const App = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [adminState, setAdminState] = useState({ loading: false, error: '', message: '' });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  const loadCalendar = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getCalendar();
      setCalendarData(payload);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmin = async () => {
    setAdminState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const payload = await api.getAdminBootstrap();
      setSession(payload.user);
      setCalendarData(payload);
      setAdminState((current) => ({ ...current, loading: false, message: 'Painel autenticado com sucesso.' }));
    } catch (loadError) {
      window.localStorage.removeItem('agenda_enzo_token');
      setSession(null);
      setAdminState({ loading: false, error: loadError.message, message: '' });
    }
  };

  useEffect(() => {
    loadCalendar();
    if (window.localStorage.getItem('agenda_enzo_token')) loadAdmin();
  }, []);

  const parentById = useMemo(() => Object.fromEntries((calendarData?.parents || []).map((parent) => [parent.id, parent])), [calendarData]);
  const selectedRule = useMemo(() => getDisplayRule(selectedDate, calendarData), [selectedDate, calendarData]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAdminState({ loading: true, error: '', message: '' });
    try {
      const payload = await api.login(loginForm);
      window.localStorage.setItem('agenda_enzo_token', payload.token);
      await loadAdmin();
    } catch (loginError) {
      setAdminState({ loading: false, error: loginError.message, message: '' });
    }
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch (_error) {}
    window.localStorage.removeItem('agenda_enzo_token');
    setSession(null);
    setAdminState({ loading: false, error: '', message: '' });
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const emptyCells = Array.from({ length: firstDay }, (_, index) => <div key={`empty-${index}`} className="h-14 md:h-24 bg-gray-50/20 rounded-lg" />);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24 md:pb-10">
      <div className="max-w-6xl mx-auto md:p-4 space-y-4">
        <header className="bg-slate-900 text-white p-4 md:rounded-3xl shadow-xl sticky top-0 z-40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20"><CalendarIcon size={24} /></div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">Agenda Enzo</h1>
                <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-[0.3em] mt-1">Painel administrativo com autenticacao</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setAdminOpen((current) => !current)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-bold">
                <Shield size={16} />
                {adminOpen ? 'Fechar painel' : 'Abrir painel admin'}
              </button>
              {session ? (
                <button onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 hover:bg-rose-500/30 transition-colors text-sm font-bold">
                  <LogOut size={16} />
                  Sair
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">Acesso inicial: admin / admin123</div>
              )}
            </div>
          </div>
          <nav className="flex items-center justify-between bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90"><ChevronLeft size={20} /></button>
            <div className="px-4 text-center font-bold text-xs uppercase min-w-[140px]">{months[viewDate.getMonth()]} <span className="opacity-50">{viewDate.getFullYear()}</span></div>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90"><ChevronRight size={20} /></button>
          </nav>
        </header>

        {error && <div className="mx-2 md:mx-0 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">{error}</div>}

        <div className={`grid gap-4 px-2 md:px-0 ${adminOpen ? 'xl:grid-cols-[1.6fr_1fr]' : 'lg:grid-cols-3'}`}>
          <div className={`${adminOpen ? '' : 'lg:col-span-2'} space-y-4`}>
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-2 md:p-4">
              {loading ? (
                <div className="p-8 text-center text-slate-500 font-semibold">Carregando agenda...</div>
              ) : (
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {daysOfWeek.map((day) => <div key={day} className="text-center font-black text-slate-400 py-2 uppercase text-[9px] tracking-widest">{day}</div>)}
                  {emptyCells}
                  {Array.from({ length: daysInMonth }, (_, index) => {
                    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1);
                    const details = getDisplayRule(date, calendarData);
                    if (!details) return null;
                    const colors = colorMap[details.highlightColor] || colorMap.slate;
                    const stripe = stripeMap[details.stripeMode] || colors.stripe;
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <button key={date.toISOString()} onClick={() => setSelectedDate(date)} className={`relative h-14 md:h-24 flex flex-col border-2 rounded-xl transition-all overflow-hidden ${colors.card} ${isSelected ? 'border-indigo-500 shadow-lg scale-105 z-10' : 'border-transparent'} ${isToday ? 'bg-white shadow-sm ring-1 ring-indigo-500/20' : ''}`}>
                        <div className={`h-1 w-full ${stripe}`} />
                        <div className="p-1 flex-1 flex flex-col items-center justify-center">
                          <span className={`text-xs md:text-sm font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md' : 'text-slate-700'}`}>{date.getDate()}</span>
                          <div className="flex gap-1 mt-1 items-center">
                            {details.activities.length > 0 && <div className="w-1 h-1 rounded-full bg-slate-400 opacity-50" />}
                            {details.specialWeekend && <Star size={8} className="text-amber-500 fill-amber-500" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-sm flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Detalhes</h2>
                <div className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1 rounded-full shadow-sm">{selectedDate.getDate()} {months[selectedDate.getMonth()]}</div>
              </div>
              <div className="p-4 space-y-3">
                {selectedRule ? (
                  <>
                    <div className={`p-3 rounded-2xl flex items-center justify-between border-2 ${(colorMap[selectedRule.highlightColor] || colorMap.slate).card}`}>
                      <div className="flex items-center gap-2">
                        <User size={18} className={(colorMap[parentById[selectedRule.primaryParentId]?.colorKey] || colorMap.slate).icon} />
                        <span className="font-black text-xs uppercase tracking-tight">{selectedRule.label}</span>
                      </div>
                      {selectedRule.specialWeekend && <Star size={16} className="text-amber-500 fill-amber-500" />}
                    </div>
                    {selectedRule.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm"><Clock size={14} /></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{activity.timeLabel}</p>
                          <p className="text-xs font-bold text-slate-700 leading-tight">{activity.title}</p>
                        </div>
                      </div>
                    ))}
                    {selectedRule.pickupText && <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2"><Info size={14} className="text-indigo-500" /><p className="text-[10px] font-bold text-indigo-700">{selectedRule.pickupText}</p></div>}
                  </>
                ) : <div className="text-sm font-semibold text-slate-500">Nenhum detalhe disponivel para esta data.</div>}
              </div>
            </aside>
          </div>

          {adminOpen && (
            <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-fit xl:sticky xl:top-24">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-sm flex items-center gap-2"><Shield size={16} className="text-indigo-500" /> Painel admin</h2>
                <button onClick={() => setAdminOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-4 space-y-4">
                {adminState.error && <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">{adminState.error}</div>}
                {adminState.message && <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">{adminState.message}</div>}
                {!session ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Usuario</span>
                      <input value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Senha</span>
                      <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </label>
                    <button type="submit" disabled={adminState.loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-black disabled:opacity-60">
                      <LogIn size={16} />
                      {adminState.loading ? 'Entrando...' : 'Entrar no painel'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-3xl bg-slate-900 text-white">
                      <p className="text-sm font-black">{session.displayName}</p>
                      <p className="text-xs text-slate-300">Autenticado. O backend admin esta liberado para a manipulacao dos dados.</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
                      O botao de acionamento do painel e a autenticacao ja estao conectados. Na proxima etapa podemos ampliar esta mesma area com os formularios completos de CRUD.
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

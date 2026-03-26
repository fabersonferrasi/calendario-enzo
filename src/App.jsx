
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Heart,
  Info,
  LogIn,
  LogOut,
  Menu,
  Pencil,
  Save,
  Shield,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { api } from './api';

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const colors = {
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

const iconMap = {
  graduation: GraduationCap,
  user: User,
  book: BookOpen,
  activity: Activity,
  heart: Heart,
  info: Info,
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const getStartOfWeek = (date) => addDays(date, -date.getDay());
const toSelectValue = (value) => (value === null || value === undefined ? '' : String(value));
const parseNullableInt = (value) => (value === '' ? null : Number(value));
const isSameDay = (left, right) => left.toDateString() === right.toDateString();
const getFullDateLabel = (date) => `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const getShortDateLabel = (date) => capitalize(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
  reader.readAsDataURL(file);
});
const loadImageElement = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Nao foi possivel processar a imagem.'));
  image.src = src;
});
const convertImageFileToDataUrl = async (file) => {
  const source = await readFileAsDataUrl(file);
  if (typeof document === 'undefined') return source;

  try {
    const image = await loadImageElement(source);
    const maxDimension = 320;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return source;

    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const qualities = [0.82, 0.72, 0.64, 0.56];
    const maxDataUrlLength = 180000;

    for (const quality of qualities) {
      const output = canvas.toDataURL('image/jpeg', quality);
      if (output.length <= maxDataUrlLength) {
        return output;
      }
    }

    return canvas.toDataURL('image/jpeg', 0.5);
  } catch (_error) {
    return source;
  }
};

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

const emptyParentForm = { name: '', roleKey: '', colorKey: 'slate' };
const emptyRuleForm = {
  weekday: 1,
  custodyType: 'exchange',
  label: '',
  primaryParentId: '',
  secondaryParentId: '',
  schoolParentId: '',
  pickupText: '',
  stripeMode: 'solid',
  highlightColor: 'slate',
};
const emptyActivityForm = { weeklyRuleId: '', timeLabel: '', title: '', iconKey: 'heart', sortOrder: 1 };
const getStoredAdminIntent = () => window.localStorage.getItem('agenda_enzo_page') === 'admin';
const setAdminIntent = (value) => {
  if (value) {
    window.localStorage.setItem('agenda_enzo_page', 'admin');
    window.location.hash = 'admin';
    return;
  }
  window.localStorage.removeItem('agenda_enzo_page');
  if (window.location.hash === '#admin') {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
};

const App = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalDate, setModalDate] = useState(null);
  const [calendarView, setCalendarView] = useState('day');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState(() => (window.location.hash === '#admin' || getStoredAdminIntent() ? 'admin' : 'calendar'));

  const [calendarData, setCalendarData] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [calendarError, setCalendarError] = useState('');

  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminState, setAdminState] = useState({ loading: false, error: '', message: '' });

  const [parentForm, setParentForm] = useState(emptyParentForm);
  const [editingParentId, setEditingParentId] = useState(null);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [weekendForm, setWeekendForm] = useState({ occurrence: 2, startWeekday: 5, durationDays: 3, parentId: '', label: '', pickupText: '', highlightColor: 'rose' });
  const [childForm, setChildForm] = useState({ displayName: '', photoUrl: '' });
  const [childPhotoState, setChildPhotoState] = useState({ loading: false, error: '', fileName: '' });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
    }
  }, []);

  const syncWeekendForm = (payload) => {
    if (!payload?.weekendConfig) return;
    setWeekendForm({
      occurrence: payload.weekendConfig.occurrence,
      startWeekday: payload.weekendConfig.startWeekday,
      durationDays: payload.weekendConfig.durationDays,
      parentId: toSelectValue(payload.weekendConfig.parentId),
      label: payload.weekendConfig.label,
      pickupText: payload.weekendConfig.pickupText || '',
      highlightColor: payload.weekendConfig.highlightColor,
    });
  };

  const syncChildForm = (payload) => {
    if (!payload?.childProfile) return;
    setChildForm({
      displayName: payload.childProfile.displayName || '',
      photoUrl: payload.childProfile.photoUrl || '',
    });
    setChildPhotoState({ loading: false, error: '', fileName: '' });
  };

  const loadCalendar = async () => {
    setLoadingCalendar(true);
    setCalendarError('');
    try {
      const payload = await api.getCalendar();
      setCalendarData(payload);
      syncWeekendForm(payload);
      syncChildForm(payload);
    } catch (error) {
      setCalendarError(error.message);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const loadAdminBootstrap = async () => {
    setAdminState((state) => ({ ...state, loading: true, error: '' }));
    try {
      const payload = await api.getAdminBootstrap();
      setSession(payload.user);
      setCalendarData(payload);
      syncWeekendForm(payload);
      syncChildForm(payload);
      setAdminState((state) => ({ ...state, loading: false }));
      return true;
    } catch (error) {
      window.localStorage.removeItem('agenda_enzo_token');
      setSession(null);
      setAdminState({ loading: false, error: error.message, message: '' });
      return false;
    }
  };

  useEffect(() => {
    loadCalendar();
    if (window.localStorage.getItem('agenda_enzo_token')) {
      loadAdminBootstrap();
    }
  }, []);

  useEffect(() => {
    const syncPageFromHash = () => {
      if (window.location.hash === '#admin') {
        setPage('admin');
        setAdminIntent(true);
        return;
      }
      setPage('calendar');
      setAdminIntent(false);
    };

    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [page]);

  const selectedRule = useMemo(() => getDisplayRule(selectedDate, calendarData), [selectedDate, calendarData]);
  const modalRule = useMemo(() => (modalDate ? getDisplayRule(modalDate, calendarData) : null), [modalDate, calendarData]);
  const parentById = useMemo(() => Object.fromEntries((calendarData?.parents || []).map((parent) => [parent.id, parent])), [calendarData]);
  const parents = calendarData?.parents || [];
  const weeklyRules = calendarData?.weeklyRules || [];
  const allActivities = weeklyRules.flatMap((rule) => rule.activities.map((activity) => ({ ...activity, weekday: rule.weekday, ruleLabel: rule.label })));
  const childProfile = calendarData?.childProfile || null;

  const refreshAll = async () => {
    if (session || window.localStorage.getItem('agenda_enzo_token')) {
      const ok = await loadAdminBootstrap();
      if (!ok) await loadCalendar();
    } else {
      await loadCalendar();
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) {
      setAdminState({ loading: false, error: 'Informe usuario e senha.', message: '' });
      return;
    }

    setAdminState({ loading: true, error: '', message: '' });
    try {
      const payload = await api.login(loginForm);
      window.localStorage.setItem('agenda_enzo_token', payload.token);
      setSession(payload.user);
      setAdminIntent(true);
      setPage('admin');
      const ok = await loadAdminBootstrap();
      if (ok) {
        setAdminState({ loading: false, error: '', message: 'Autenticacao realizada. CRUD liberado.' });
        return;
      }
      setAdminState({ loading: false, error: 'Login autenticado, mas o painel nao conseguiu carregar os dados.', message: '' });
    } catch (error) {
      setSession(null);
      setAdminState({ loading: false, error: error.message, message: '' });
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (_error) {}
    window.localStorage.removeItem('agenda_enzo_token');
    setAdminIntent(false);
    setMobileMenuOpen(false);
    setSession(null);
    setAdminState({ loading: false, error: '', message: '' });
    setPage('calendar');
    await loadCalendar();
  };

  const openAdminPage = async () => {
    setAdminIntent(true);
    setMobileMenuOpen(false);
    setPage('admin');
    setAdminState((state) => ({ ...state, message: '', error: '' }));
    if (!session && window.localStorage.getItem('agenda_enzo_token')) {
      await loadAdminBootstrap();
    }
  };

  const resetParentForm = () => {
    setEditingParentId(null);
    setParentForm(emptyParentForm);
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleForm(emptyRuleForm);
  };

  const resetActivityForm = () => {
    setEditingActivityId(null);
    setActivityForm(emptyActivityForm);
  };

  const saveParent = async (event) => {
    event.preventDefault();
    setAdminState((state) => ({ ...state, error: '', message: '' }));
    try {
      if (editingParentId) {
        await api.updateParent(editingParentId, parentForm);
        setAdminState((state) => ({ ...state, message: 'Responsavel atualizado.' }));
      } else {
        await api.createParent(parentForm);
        setAdminState((state) => ({ ...state, message: 'Responsavel criado.' }));
      }
      resetParentForm();
      await refreshAll();
    } catch (error) {
      setAdminState((state) => ({ ...state, error: error.message }));
    }
  };

  const saveRule = async (event) => {
    event.preventDefault();
    setAdminState((state) => ({ ...state, error: '', message: '' }));
    const payload = {
      ...ruleForm,
      primaryParentId: parseNullableInt(ruleForm.primaryParentId),
      secondaryParentId: parseNullableInt(ruleForm.secondaryParentId),
      schoolParentId: parseNullableInt(ruleForm.schoolParentId),
    };
    try {
      if (editingRuleId) {
        await api.updateRule(editingRuleId, payload);
        setAdminState((state) => ({ ...state, message: 'Regra semanal atualizada.' }));
      } else {
        await api.createRule(payload);
        setAdminState((state) => ({ ...state, message: 'Regra semanal criada.' }));
      }
      resetRuleForm();
      await refreshAll();
    } catch (error) {
      setAdminState((state) => ({ ...state, error: error.message }));
    }
  };

  const saveActivity = async (event) => {
    event.preventDefault();
    setAdminState((state) => ({ ...state, error: '', message: '' }));
    const payload = {
      ...activityForm,
      weeklyRuleId: Number(activityForm.weeklyRuleId),
      sortOrder: Number(activityForm.sortOrder),
    };
    try {
      if (editingActivityId) {
        await api.updateActivity(editingActivityId, payload);
        setAdminState((state) => ({ ...state, message: 'Compromisso atualizado.' }));
      } else {
        await api.createActivity(payload);
        setAdminState((state) => ({ ...state, message: 'Compromisso criado.' }));
      }
      resetActivityForm();
      await refreshAll();
    } catch (error) {
      setAdminState((state) => ({ ...state, error: error.message }));
    }
  };

  const saveWeekend = async (event) => {
    event.preventDefault();
    setAdminState((state) => ({ ...state, error: '', message: '' }));
    const payload = {
      occurrence: Number(weekendForm.occurrence),
      startWeekday: Number(weekendForm.startWeekday),
      durationDays: Number(weekendForm.durationDays),
      parentId: Number(weekendForm.parentId),
      label: weekendForm.label,
      pickupText: weekendForm.pickupText,
      highlightColor: weekendForm.highlightColor,
    };
    try {
      await api.updateWeekendConfig(payload);
      setAdminState((state) => ({ ...state, message: 'Fim de semana especial atualizado.' }));
      await refreshAll();
    } catch (error) {
      setAdminState((state) => ({ ...state, error: error.message }));
    }
  };

  const saveChildProfile = async (event) => {
    event.preventDefault();
    setAdminState((state) => ({ ...state, error: '', message: '' }));
    try {
      await api.updateChildProfile(childForm);
      setAdminState((state) => ({ ...state, message: 'Perfil do jovem atualizado.' }));
      await refreshAll();
    } catch (error) {
      setAdminState((state) => ({ ...state, error: error.message }));
    }
  };

  const handleChildPhotoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setChildPhotoState({ loading: false, error: 'Selecione um arquivo de imagem valido.', fileName: '' });
      event.target.value = '';
      return;
    }

    setChildPhotoState({ loading: true, error: '', fileName: file.name });

    try {
      const photoUrl = await convertImageFileToDataUrl(file);
      setChildForm((state) => ({ ...state, photoUrl }));
      setChildPhotoState({ loading: false, error: '', fileName: file.name });
      setAdminState((state) => ({ ...state, error: '', message: 'Foto pronta. Clique em Salvar perfil para aplicar.' }));
    } catch (error) {
      setChildPhotoState({ loading: false, error: error.message || 'Nao foi possivel preparar a foto.', fileName: '' });
    } finally {
      event.target.value = '';
    }
  };

  const openDayModal = (date) => {
    setSelectedDate(date);
    setModalDate(date);
  };

  const renderRuleDetails = (date, rule, options = {}) => {
    const {
      compact = false,
      showDateHeader = false,
      todayLabel = false,
    } = options;

    if (!rule) {
      return <div className="text-sm font-semibold text-slate-500">Nenhum detalhe disponivel para esta data.</div>;
    }

    const dateIsToday = isSameDay(date, new Date());
    const palette = colors[rule.highlightColor] || colors.slate;
    const guardName = rule.primaryParentId ? parentById[rule.primaryParentId]?.name : '';
    const activities = rule.activities || [];

    return (
      <>
        {showDateHeader ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Detalhes</p>
              <p className="text-base font-black text-slate-800">{getFullDateLabel(date)}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1 rounded-full shadow-sm">
                {date.getDate()} {daysOfWeek[date.getDay()]}
              </div>
              {todayLabel && dateIsToday ? <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">Ref. a hoje</p> : null}
            </div>
          </div>
        ) : null}
        <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 border-2 ${palette.card}`}>
          <div className="flex items-center gap-2 min-w-0">
            <User size={18} className={(colors[parentById[rule.primaryParentId]?.colorKey] || colors.slate).icon} />
            <div className="min-w-0">
              <p className="font-black text-xs uppercase tracking-tight truncate">{rule.label}</p>
              <p className="text-[11px] font-bold text-slate-600 truncate">{guardName || 'Responsavel nao definido'}</p>
            </div>
          </div>
          {rule.specialWeekend && <Star size={16} className="text-amber-500 fill-amber-500" />}
        </div>
        <div className={`space-y-2 ${compact ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
          {activities.length ? activities.map((activity) => {
            const Icon = iconMap[activity.iconKey] || Clock;
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm"><Icon size={14} /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{activity.timeLabel}</p>
                  <p className="text-xs font-bold text-slate-700 leading-tight">{activity.title}</p>
                </div>
              </div>
            );
          }) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-600">Sem compromisso fixo para este dia.</p>
            </div>
          )}
        </div>
        {rule.pickupText ? (
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
            <Info size={14} className="text-indigo-500" />
            <p className="text-[10px] font-bold text-indigo-700">{rule.pickupText}</p>
          </div>
        ) : null}
      </>
    );
  };

  const renderCalendar = () => {
    const hasWeeklyRules = (calendarData?.weeklyRules || []).length > 0;

    const periodLabel = (() => {
      if (calendarView === 'day') {
        return `${daysOfWeek[selectedDate.getDay()]} ${selectedDate.getDate()} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
      }
      if (calendarView === 'week') {
        const start = getStartOfWeek(selectedDate);
        const end = addDays(start, 6);
        if (start.getMonth() === end.getMonth()) {
          return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
        }
        return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
      }
      return `${capitalize(viewDate.toLocaleDateString('pt-BR', { month: 'long' }))} ${viewDate.getFullYear()}`;
    })();

    const moveRange = (direction) => {
      if (calendarView === 'day') {
        const nextDate = addDays(selectedDate, direction);
        setSelectedDate(nextDate);
        setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        return;
      }

      if (calendarView === 'week') {
        const nextDate = addDays(selectedDate, direction * 7);
        setSelectedDate(nextDate);
        setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        return;
      }

      const nextViewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
      const nextDay = Math.min(selectedDate.getDate(), getDaysInMonth(nextViewDate.getFullYear(), nextViewDate.getMonth()));
      const nextSelectedDate = new Date(nextViewDate.getFullYear(), nextViewDate.getMonth(), nextDay);
      setViewDate(nextViewDate);
      setSelectedDate(nextSelectedDate);
    };

    const renderMonthCard = (date) => {
      const details = getDisplayRule(date, calendarData);
      const isToday = isSameDay(date, new Date());
      const isSelected = isSameDay(date, selectedDate);
      const palette = details ? (colors[details.highlightColor] || colors.slate) : colors.slate;
      const stripe = details ? (stripeMap[details.stripeMode] || palette.stripe) : 'bg-slate-300';
      const markerClass = details?.primaryParentId
        ? ((colors[parentById[details.primaryParentId]?.colorKey] || colors.slate).stripe)
        : 'bg-slate-400';

      return (
        <button
          key={date.toISOString()}
          type="button"
          onClick={() => openDayModal(date)}
          className={`relative h-20 md:h-24 lg:h-28 flex flex-col border-2 rounded-2xl transition-all overflow-hidden text-left ${palette.card} ${isSelected ? 'border-indigo-500 shadow-lg scale-[1.02] z-10' : 'border-transparent'} ${isToday ? 'ring-2 ring-indigo-500/25' : ''} hover:shadow-md`}
        >
          <div className={`h-2 w-full ${stripe}`} />
          <div className="p-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs md:text-sm font-black ${isToday ? 'bg-indigo-600 text-white w-7 h-7 rounded-full inline-flex items-center justify-center' : 'text-slate-700'}`}>{date.getDate()}</span>
              {details?.specialWeekend ? <Star size={12} className="text-amber-500 fill-amber-500" /> : null}
            </div>
            <div className="mt-auto flex items-end justify-start">
              <span className={`inline-flex w-3.5 h-3.5 rounded-full border border-white/80 ${markerClass}`} />
            </div>
          </div>
        </button>
      );
    };

    const renderWeekCard = (date, details = getDisplayRule(date, calendarData)) => {
      const isToday = isSameDay(date, new Date());
      const isSelected = isSameDay(date, selectedDate);
      const palette = details ? (colors[details.highlightColor] || colors.slate) : colors.slate;
      const stripe = details ? (stripeMap[details.stripeMode] || palette.stripe) : 'bg-slate-300';
      const guard = details?.primaryParentId ? parentById[details.primaryParentId] : null;
      const guardMarker = guard ? (colors[guard.colorKey] || colors.slate).stripe : 'bg-slate-300';
      const activities = details?.activities || [];
      const activityCount = activities.length;

      return (
        <button
          key={date.toISOString()}
          type="button"
          onClick={() => openDayModal(date)}
          className={`relative w-full overflow-hidden rounded-3xl border bg-white p-3 md:p-4 text-left transition-all ${isSelected ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/10' : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-lg'} ${isToday ? 'bg-gradient-to-r from-indigo-50 via-white to-white' : ''}`}
        >
          <div className={`absolute inset-y-0 left-0 w-1.5 ${stripe}`} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className={`shrink-0 rounded-2xl border px-3 py-3 ${palette.card} ${isSelected ? 'border-indigo-200 shadow-sm' : 'border-white/70'}`}>
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}>{daysOfWeek[date.getDay()]}</span>
                <div>
                  <p className="text-2xl leading-none font-black text-slate-900">{date.getDate()}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">{getShortDateLabel(date)}</p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <p className="text-base md:text-lg font-black text-slate-900">{details?.label || 'Sem regra cadastrada'}</p>
                {isToday ? <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700">Hoje</span> : null}
                {details?.specialWeekend ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700"><Star size={10} className="fill-amber-500" />Especial</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${guardMarker}`} />
                  {guard?.name || 'Sem guarda'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                  <Clock size={12} className="text-indigo-500" />
                  {activityCount} compromisso{activityCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        </button>
      );
    };

    const renderSelectedPanel = () => (
      <aside className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-fit xl:sticky xl:top-28">
        <div className="bg-slate-950 text-white p-4 border-b border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Foco do dia</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-sm md:text-base flex items-center gap-2"><Clock size={16} className="text-indigo-300" /> {getFullDateLabel(selectedDate)}</h2>
              {isSameDay(selectedDate, new Date()) ? <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Hoje na agenda</p> : null}
            </div>
            <div className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-full shadow-sm">{daysOfWeek[selectedDate.getDay()]}</div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {renderRuleDetails(selectedDate, selectedRule)}
        </div>
      </aside>
    );

    const renderDayView = () => (
      <div className="grid grid-cols-1 gap-4">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-4 md:p-7 shadow-xl border border-slate-700 min-h-[65vh]">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveRange(-1)} className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"><ChevronLeft size={18} /></button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-200 font-black">Visao do dia</p>
              <p className="text-lg md:text-xl font-black">{getFullDateLabel(selectedDate)}</p>
              {isSameDay(selectedDate, new Date()) ? <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200 font-black">Hoje</p> : null}
            </div>
            <button type="button" onClick={() => moveRange(1)} className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-5 bg-white text-slate-900 rounded-2xl p-4 md:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between rounded-2xl bg-slate-950 text-white px-4 py-3 md:px-5 md:py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-200">Com a guarda</p>
                <p className="text-xl md:text-2xl font-black">{selectedRule?.primaryParentId ? parentById[selectedRule.primaryParentId]?.name : 'Nao definido'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-100">{selectedRule?.label || 'Sem regra'}</p>
                {selectedRule?.specialWeekend ? <p className="text-[10px] font-black uppercase tracking-wide text-amber-300">Fim de semana especial</p> : null}
              </div>
            </div>
            {renderRuleDetails(selectedDate, selectedRule)}
          </div>
        </section>
      </div>
    );

    const renderWeekView = () => {
      const start = getStartOfWeek(selectedDate);
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      const weekEntries = weekDates.map((date) => ({ date, details: getDisplayRule(date, calendarData) }));
      const totalActivities = weekEntries.reduce((total, entry) => total + (entry.details?.activities?.length || 0), 0);
      const specialDays = weekEntries.filter((entry) => entry.details?.specialWeekend).length;

      return (
        <div className="grid grid-cols-1 gap-4">
          <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-3 md:p-5">
            <div className="border-b border-slate-100 pb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm md:text-base font-black text-slate-900">Semana</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">7 dias</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{totalActivities} compromissos</span>
                {specialDays ? <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">{specialDays} dia{specialDays === 1 ? '' : 's'} especial{specialDays === 1 ? '' : 'is'}</span> : null}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {weekEntries.map(({ date, details }) => renderWeekCard(date, details))}
            </div>
          </section>
        </div>
      );
    };

    const renderMonthView = () => {
      const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
      const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
      const emptyCells = Array.from({ length: firstDay }, (_, index) => <div key={`empty-${index}`} className="h-24 md:h-28 lg:h-32 bg-slate-50 rounded-2xl border border-slate-100" />);
      const dates = Array.from({ length: daysInMonth }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1));

      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-slate-200 p-3 md:p-4">
            <div className="mb-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Pai</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" /> Mae</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500" /> Troca</span>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {daysOfWeek.map((day) => <div key={day} className="text-center font-black text-slate-400 py-2 uppercase text-[9px] tracking-widest">{day}</div>)}
              {emptyCells}
              {dates.map((date) => renderMonthCard(date))}
            </div>
          </section>
          <section className="lg:col-span-2">
            {renderSelectedPanel()}
          </section>
        </div>
      );
    };

    return (
      <>
        {calendarError && <div className="mx-2 md:mx-0 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">{calendarError}</div>}
        <div className="px-2 md:px-0 space-y-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button onClick={() => setCalendarView('day')} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${calendarView === 'day' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Dia</button>
              <button onClick={() => setCalendarView('week')} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${calendarView === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Semana</button>
              <button onClick={() => setCalendarView('month')} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${calendarView === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Mês</button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => moveRange(-1)} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700"><ChevronLeft size={18} /></button>
              <div className="text-center px-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Período</p>
                <p className="text-sm md:text-base font-black text-slate-900">{periodLabel}</p>
              </div>
              <button onClick={() => moveRange(1)} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700"><ChevronRight size={18} /></button>
            </div>
          </div>

          {loadingCalendar ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center text-slate-500 font-semibold">Carregando agenda...</div>
          ) : calendarError ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">A agenda nao conseguiu carregar os dados do servidor.</p>
              <button onClick={loadCalendar} className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black">Tentar novamente</button>
            </div>
          ) : !hasWeeklyRules ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">Nenhuma regra semanal foi encontrada no banco de dados.</p>
              <p className="text-xs text-slate-500">Entre no painel para cadastrar ou ajustar os dados da agenda.</p>
            </div>
          ) : (
            <>
              {calendarView === 'day' ? renderDayView() : null}
              {calendarView === 'week' ? renderWeekView() : null}
              {calendarView === 'month' ? renderMonthView() : null}
            </>
          )}
        </div>

        {modalDate ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">Agenda do dia</p>
                  <p className="text-base font-black">{getFullDateLabel(modalDate)}</p>
                </div>
                <button type="button" onClick={() => setModalDate(null)} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                {renderRuleDetails(modalDate, modalRule, { compact: true })}
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  };

  const renderAdminLogin = () => (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-slate-900 text-white">
        <p className="text-sm font-black">Entrar</p>
      </div>
      {adminState.error && <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">{adminState.error}</div>}
      <form onSubmit={handleLogin} className="space-y-3">
        <label className="block space-y-1"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Usuario</span><input value={loginForm.username} onChange={(event) => setLoginForm((state) => ({ ...state, username: event.target.value }))} className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        <label className="block space-y-1"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Senha</span><input type="password" value={loginForm.password} onChange={(event) => setLoginForm((state) => ({ ...state, password: event.target.value }))} className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        <button type="submit" disabled={adminState.loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-black disabled:opacity-60"><LogIn size={16} /> {adminState.loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
  const renderAdminCrud = () => (
    <div className="space-y-4 px-2 md:px-0">
      {adminState.error && <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">{adminState.error}</div>}
      {adminState.message && <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">{adminState.message}</div>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="xl:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200 p-4 space-y-3">
          <p className="font-black text-sm">Perfil do jovem</p>
          <form onSubmit={saveChildProfile} className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto w-32 h-32 rounded-full p-[4px] bg-gradient-to-br from-sky-400 via-indigo-500 to-rose-400 shadow-lg">
                <div className="w-full h-full rounded-full overflow-hidden border border-white/80 bg-white">
                  {childForm.photoUrl ? <img src={childForm.photoUrl} alt={childForm.displayName || 'Jovem'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">Sem foto</div>}
                </div>
              </div>
              <label className={`mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed px-4 py-3 text-sm font-black transition-colors ${childPhotoState.loading ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleChildPhotoUpload} disabled={childPhotoState.loading} />
                {childPhotoState.loading ? 'Preparando foto...' : 'Enviar nova foto'}
              </label>
              <p className="mt-2 text-[11px] font-semibold text-slate-500">{childPhotoState.fileName || 'PNG, JPG ou WebP'}</p>
              {childForm.photoUrl ? <button type="button" onClick={() => { setChildForm((state) => ({ ...state, photoUrl: '' })); setChildPhotoState((state) => ({ ...state, error: '', fileName: '' })); }} className="mt-3 text-xs font-black uppercase tracking-wide text-rose-600">Remover foto</button> : null}
              {childPhotoState.error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{childPhotoState.error}</div> : null}
            </div>
            <div className="space-y-3">
              <input value={childForm.displayName} onChange={(event) => setChildForm((state) => ({ ...state, displayName: event.target.value }))} placeholder="Nome de exibicao" className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
              <input value={childForm.photoUrl} onChange={(event) => { setChildForm((state) => ({ ...state, photoUrl: event.target.value })); setChildPhotoState((state) => ({ ...state, error: '' })); }} placeholder="URL da foto (opcional)" className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
              <p className="text-xs font-semibold text-slate-500">Voce pode subir uma nova foto direto do dispositivo ou manter uma URL manual.</p>
              <button type="submit" disabled={childPhotoState.loading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black disabled:opacity-60"><Save size={16} /> Salvar perfil</button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="font-black text-sm">Responsaveis</p>{editingParentId && <button type="button" onClick={resetParentForm} className="text-xs font-bold text-slate-500">Cancelar</button>}</div>
          <form onSubmit={saveParent} className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={parentForm.name} onChange={(event) => setParentForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nome" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <input value={parentForm.roleKey} onChange={(event) => setParentForm((state) => ({ ...state, roleKey: event.target.value }))} placeholder="Identificador" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <select value={parentForm.colorKey} onChange={(event) => setParentForm((state) => ({ ...state, colorKey: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="blue">Azul</option><option value="rose">Rosa</option><option value="slate">Cinza</option><option value="amber">Ambar</option></select>
            <button type="submit" className="md:col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black"><Save size={16} /> {editingParentId ? 'Atualizar' : 'Criar'}</button>
          </form>
          <div className="space-y-2">
            {parents.map((parent) => (
              <div key={parent.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div><p className="text-sm font-black">{parent.name}</p><p className="text-xs text-slate-500">{parent.roleKey} - {parent.colorKey}</p></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setEditingParentId(parent.id); setParentForm({ name: parent.name, roleKey: parent.roleKey, colorKey: parent.colorKey }); }} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100"><Pencil size={14} /></button>
                  <button type="button" onClick={async () => { try { await api.deleteParent(parent.id); setAdminState((state) => ({ ...state, message: 'Responsavel removido.' })); await refreshAll(); } catch (error) { setAdminState((state) => ({ ...state, error: error.message })); } }} className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="font-black text-sm">Regras semanais</p>{editingRuleId && <button type="button" onClick={resetRuleForm} className="text-xs font-bold text-slate-500">Cancelar</button>}</div>
          <form onSubmit={saveRule} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select value={ruleForm.weekday} onChange={(event) => setRuleForm((state) => ({ ...state, weekday: Number(event.target.value) }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold">{daysOfWeek.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
            <select value={ruleForm.custodyType} onChange={(event) => setRuleForm((state) => ({ ...state, custodyType: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="exchange">Troca</option><option value="parent">Responsavel fixo</option></select>
            <input value={ruleForm.label} onChange={(event) => setRuleForm((state) => ({ ...state, label: event.target.value }))} placeholder="Rotulo" className="md:col-span-2 border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <select value={ruleForm.primaryParentId} onChange={(event) => setRuleForm((state) => ({ ...state, primaryParentId: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="">Responsavel principal</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select>
            <select value={ruleForm.secondaryParentId} onChange={(event) => setRuleForm((state) => ({ ...state, secondaryParentId: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="">Responsavel secundario</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select>
            <select value={ruleForm.highlightColor} onChange={(event) => setRuleForm((state) => ({ ...state, highlightColor: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="slate">Cinza</option><option value="blue">Azul</option><option value="rose">Rosa</option><option value="amber">Ambar</option></select>
            <select value={ruleForm.stripeMode} onChange={(event) => setRuleForm((state) => ({ ...state, stripeMode: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="solid">Faixa solida</option><option value="gradient-blue-rose">Gradiente azul-rosa</option><option value="gradient-rose-blue">Gradiente rosa-azul</option></select>
            <input value={ruleForm.pickupText} onChange={(event) => setRuleForm((state) => ({ ...state, pickupText: event.target.value }))} placeholder="Texto de troca" className="md:col-span-2 border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <button type="submit" className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black"><Save size={16} /> {editingRuleId ? 'Atualizar' : 'Criar'}</button>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {weeklyRules.map((rule) => (
              <div key={rule.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div><p className="text-sm font-black">{daysOfWeek[rule.weekday]} - {rule.label}</p><p className="text-xs text-slate-500">{rule.custodyType}</p></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingRuleId(rule.id); setRuleForm({ weekday: rule.weekday, custodyType: rule.custodyType, label: rule.label, primaryParentId: toSelectValue(rule.primaryParentId), secondaryParentId: toSelectValue(rule.secondaryParentId), schoolParentId: toSelectValue(rule.schoolParentId), pickupText: rule.pickupText || '', stripeMode: rule.stripeMode, highlightColor: rule.highlightColor }); }} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100"><Pencil size={14} /></button>
                  <button type="button" onClick={async () => { try { await api.deleteRule(rule.id); setAdminState((state) => ({ ...state, message: 'Regra removida.' })); await refreshAll(); } catch (error) { setAdminState((state) => ({ ...state, error: error.message })); } }} className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="font-black text-sm">Compromissos</p>{editingActivityId && <button type="button" onClick={resetActivityForm} className="text-xs font-bold text-slate-500">Cancelar</button>}</div>
          <form onSubmit={saveActivity} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select value={activityForm.weeklyRuleId} onChange={(event) => setActivityForm((state) => ({ ...state, weeklyRuleId: event.target.value }))} className="md:col-span-2 border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="">Selecione a regra</option>{weeklyRules.map((rule) => <option key={rule.id} value={rule.id}>{daysOfWeek[rule.weekday]} - {rule.label}</option>)}</select>
            <input value={activityForm.timeLabel} onChange={(event) => setActivityForm((state) => ({ ...state, timeLabel: event.target.value }))} placeholder="Horario" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <input value={activityForm.title} onChange={(event) => setActivityForm((state) => ({ ...state, title: event.target.value }))} placeholder="Titulo" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <select value={activityForm.iconKey} onChange={(event) => setActivityForm((state) => ({ ...state, iconKey: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="graduation">Escola</option><option value="user">Pessoa</option><option value="book">Livro</option><option value="activity">Atividade</option><option value="heart">Bem-estar</option><option value="info">Info</option></select>
            <input type="number" min="0" value={activityForm.sortOrder} onChange={(event) => setActivityForm((state) => ({ ...state, sortOrder: Number(event.target.value) }))} placeholder="Ordem" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <button type="submit" className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black"><Save size={16} /> {editingActivityId ? 'Atualizar' : 'Criar'}</button>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {allActivities.map((activity) => {
              const Icon = iconMap[activity.iconKey] || Clock;
              return (
                <div key={activity.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500"><Icon size={14} /></div>
                    <div>
                      <p className="text-sm font-black">{activity.timeLabel} - {activity.title}</p>
                      <p className="text-xs text-slate-500">{daysOfWeek[activity.weekday]} - {activity.ruleLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setEditingActivityId(activity.id); setActivityForm({ weeklyRuleId: toSelectValue(activity.weeklyRuleId), timeLabel: activity.timeLabel, title: activity.title, iconKey: activity.iconKey, sortOrder: activity.sortOrder }); }} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={async () => { try { await api.deleteActivity(activity.id); setAdminState((state) => ({ ...state, message: 'Compromisso removido.' })); await refreshAll(); } catch (error) { setAdminState((state) => ({ ...state, error: error.message })); } }} className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 space-y-3">
          <p className="font-black text-sm">Fim de semana especial</p>
          <form onSubmit={saveWeekend} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="number" min="1" max="5" value={weekendForm.occurrence} onChange={(event) => setWeekendForm((state) => ({ ...state, occurrence: Number(event.target.value) }))} placeholder="Ocorrencia" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <select value={weekendForm.startWeekday} onChange={(event) => setWeekendForm((state) => ({ ...state, startWeekday: Number(event.target.value) }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold">{daysOfWeek.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
            <input type="number" min="1" max="7" value={weekendForm.durationDays} onChange={(event) => setWeekendForm((state) => ({ ...state, durationDays: Number(event.target.value) }))} placeholder="Duracao" className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <select value={weekendForm.parentId} onChange={(event) => setWeekendForm((state) => ({ ...state, parentId: event.target.value }))} className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold"><option value="">Responsavel</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select>
            <input value={weekendForm.label} onChange={(event) => setWeekendForm((state) => ({ ...state, label: event.target.value }))} placeholder="Rotulo" className="md:col-span-2 border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <input value={weekendForm.pickupText} onChange={(event) => setWeekendForm((state) => ({ ...state, pickupText: event.target.value }))} placeholder="Texto de retirada" className="md:col-span-2 border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold" />
            <button type="submit" className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black"><Save size={16} /> Salvar</button>
          </form>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 font-sans text-slate-900 pb-24 md:pb-10">
      <div className="max-w-6xl mx-auto md:p-4 space-y-4">
        <header className="relative bg-white text-slate-900 p-3 md:p-4 md:rounded-3xl shadow-lg border border-slate-200 sticky top-0 z-40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-br from-sky-400 via-indigo-500 to-rose-400 shadow-lg">
                  <div className="w-full h-full rounded-full overflow-hidden border border-white/80 bg-slate-100">
                    {childProfile?.photoUrl ? (
                      <img src={childProfile.photoUrl} alt={childProfile.displayName || 'Jovem'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-black uppercase">Foto</div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow-md">
                  <CalendarIcon size={12} />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-black tracking-tight leading-none truncate">AGENDA</h1>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400 truncate">{childProfile?.displayName || 'Jovem'}</p>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center gap-2">
              {page === 'calendar' ? (
                <button onClick={openAdminPage} aria-label="Abrir admin" title="Admin" className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors text-sm font-bold"><Shield size={16} /></button>
              ) : (
                <button onClick={() => { setAdminIntent(false); setPage('calendar'); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors text-sm font-bold"><ArrowLeft size={16} /> Voltar para agenda</button>
              )}
              {session ? (
                <button onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-sm font-bold text-rose-700"><LogOut size={16} /> Sair</button>
              ) : null}
            </div>

            <button type="button" onClick={() => setMobileMenuOpen((value) => !value)} className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors text-slate-700">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="md:hidden mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-2">
              {page === 'calendar' ? (
                <button onClick={openAdminPage} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-sm font-black">
                  <Shield size={16} />
                  Admin
                </button>
              ) : (
                <button onClick={() => { setAdminIntent(false); setMobileMenuOpen(false); setPage('calendar'); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-sm font-black">
                  <ArrowLeft size={16} />
                  Voltar para agenda
                </button>
              )}
              {session ? (
                <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-sm font-black text-rose-700">
                  <LogOut size={16} />
                  Sair
                </button>
              ) : null}
            </div>
          ) : null}
        </header>

        {page === 'calendar' ? renderCalendar() : (session ? renderAdminCrud() : renderAdminLogin())}
      </div>
    </div>
  );
};

export default App;

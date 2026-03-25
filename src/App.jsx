import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, BookOpen, Heart, Activity, Star, Info, GraduationCap } from 'lucide-react';

const App = () => {
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 25));

  // Lógica de Registo do Service Worker para suporte PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('SW registration failed: ', err);
        });
      });
    }
  }, []);

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const isSecondWeekend = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    let fridayCount = 0;
    
    for (let d = 1; d <= 31; d++) {
      const tempDate = new Date(year, month, d);
      if (tempDate.getMonth() !== month) break;
      if (tempDate.getDay() === 5) {
        fridayCount++;
        if (fridayCount === 2) {
          const secondFriday = d;
          const currentDay = date.getDate();
          return currentDay >= secondFriday && currentDay <= secondFriday + 2;
        }
      }
    }
    return false;
  };

  const getDayDetails = (date) => {
    const day = date.getDay();
    const secondWE = isSecondWeekend(date);
    let parent = "";
    let colorClass = "";
    let stripeColor = "";
    let activities = [];
    let pickup = "";
    
    const schoolTask = { time: "07:30h", task: "Escola", icon: <GraduationCap size={14}/> };

    if (day === 1) { // Segunda
      parent = "Troca (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      activities.push({ ...schoolTask, task: "Escola (Pai leva)" });
      activities.push({ time: "16:00h", task: "Saída (Mãe busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Juliana busca às 16:00h";
    } 
    else if (day === 2) { // Terça
      parent = "Mãe (Juliana)";
      colorClass = "bg-rose-50 border-rose-200";
      stripeColor = "bg-rose-500";
      activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
      activities.push({ time: "13:00h", task: "Reforço Pedagógico", icon: <BookOpen size={14}/> });
    }
    else if (day === 3) { // Quarta
      parent = "Troca (Mãe ➔ Pai)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
      activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
      activities.push({ time: "13:00h", task: "Reforço", icon: <BookOpen size={14}/> });
      activities.push({ time: "14:00h", task: "Saída (Pai busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Faberson busca às 14:00h";
    }
    else if (day === 4) { // Quinta
      parent = "Troca (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      activities.push({ ...schoolTask, task: "Escola (Pai leva)" });
      activities.push({ time: "12:30h", task: "Saída (Mãe busca)", icon: <User size={14}/> });
      activities.push({ time: "16:00h", task: "Psicóloga", icon: <Heart size={14}/> });
      pickup = "Juliana busca às 12:30h";
    }
    else if (day === 5) { // Sexta
      if (secondWE) {
        parent = "Mãe (FDS Especial)";
        colorClass = "bg-rose-100 border-rose-300 ring-2 ring-amber-400 ring-inset";
        stripeColor = "bg-rose-600";
        activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
        activities.push({ time: "12:30h", task: "Saída (Mãe busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Mãe busca para o FDS";
      } else {
        parent = "Troca (Mãe ➔ Pai)";
        colorClass = "bg-slate-50 border-slate-200";
        stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
        activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
        activities.push({ time: "12:30h", task: "Saída (Pai busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Faberson busca às 12:30h";
      }
    }
    else if (day === 6 || day === 0) {
      if (secondWE) {
        parent = "Mãe (Juliana)";
        colorClass = "bg-rose-50 border-rose-200";
        stripeColor = "bg-rose-500";
      } else {
        parent = "Pai (Faberson)";
        colorClass = "bg-blue-50 border-blue-200";
        stripeColor = "bg-blue-500";
      }
      activities.push({ time: "Dia Todo", task: "Tempo Livre", icon: <Heart size={14}/> });
    }

    return { parent, colorClass, stripeColor, activities, pickup, secondWE };
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-14 md:h-24 bg-gray-50/20 rounded-lg"></div>);
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24 md:pb-10">
      <div className="max-w-5xl mx-auto md:p-4 space-y-4">
        
        {/* Header App Style */}
        <header className="bg-slate-900 text-white p-4 md:rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Agenda Enzo</h1>
              <p className="text-indigo-400 text-[9px] uppercase font-bold tracking-widest mt-1">Status de Guarda</p>
            </div>
          </div>
          
          <nav className="flex items-center justify-between w-full sm:w-auto bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90">
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-center font-bold text-xs uppercase min-w-[140px]">
              {months[viewDate.getMonth()]} <span className="opacity-50">{viewDate.getFullYear()}</span>
            </div>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90">
              <ChevronRight size={20} />
            </button>
          </nav>
        </header>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-2 md:px-0">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200 p-2 md:p-4">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center font-black text-slate-400 py-2 uppercase text-[9px] tracking-widest">{day}</div>
              ))}
              {calendarDays}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const details = getDayDetails(date);
                
                return (
                  <button 
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`relative h-14 md:h-24 flex flex-col border-2 rounded-xl transition-all overflow-hidden ${details.colorClass} 
                      ${isSelected ? 'border-indigo-500 shadow-lg scale-105 z-10' : 'border-transparent'}
                      ${isToday ? 'bg-white shadow-sm ring-1 ring-indigo-500/20' : ''}`}
                  >
                    <div className={`h-1 w-full ${details.stripeColor}`} />
                    <div className="p-1 flex-1 flex flex-col items-center justify-center">
                      <span className={`text-xs md:text-sm font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      <div className="flex gap-0.5 mt-1">
                        {details.activities.length > 0 && <div className="w-1 h-1 rounded-full bg-slate-400 opacity-50"></div>}
                        {details.secondWE && <Star size={8} className="text-amber-500 fill-amber-500" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Agenda Aside */}
          <aside className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-fit sticky top-24">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Detalhes
              </h2>
              <div className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1 rounded-full shadow-sm">
                {selectedDate.getDate()} {months[selectedDate.getMonth()]}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className={`p-3 rounded-2xl flex items-center justify-between border-2 ${getDayDetails(selectedDate).colorClass}`}>
                <div className="flex items-center gap-2">
                  <User size={18} className={getDayDetails(selectedDate).parent.includes('Mãe') ? 'text-rose-500' : 'text-blue-500'} />
                  <span className="font-black text-xs uppercase tracking-tight">{getDayDetails(selectedDate).parent}</span>
                </div>
                {getDayDetails(selectedDate).secondWE && <Star size={16} className="text-amber-500 fill-amber-500" />}
              </div>

              <div className="space-y-2">
                {getDayDetails(selectedDate).activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-transform active:scale-95">
                    <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm">{act.icon}</div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{act.time}</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{act.task}</p>
                    </div>
                  </div>
                ))}
              </div>

              {getDayDetails(selectedDate).pickup && (
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
                  <Info size={14} className="text-indigo-500" />
                  <p className="text-[10px] font-bold text-indigo-700">{getDayDetails(selectedDate).pickup}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Install Prompt Bar (Optional Info) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 md:hidden flex justify-center z-50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
          📱 Adicionar ao Ecrã Principal para usar como App
        </p>
      </footer>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, BookOpen, Heart, Activity, Star } from 'lucide-react';

const App = () => {
  // Setup for PWA-like behavior on mobile devices
  useEffect(() => {
    // Set theme color for mobile status bar
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = "#0f172a"; // slate-900
    document.head.appendChild(metaThemeColor);

    // iOS (Safari) specific configurations
    const metaAppleMobile = document.createElement('meta');
    metaAppleMobile.name = "apple-mobile-web-app-capable";
    metaAppleMobile.content = "yes";
    document.head.appendChild(metaAppleMobile);

    const metaAppleStatus = document.createElement('meta');
    metaAppleStatus.name = "apple-mobile-web-app-status-bar-style";
    metaAppleStatus.content = "black-translucent";
    document.head.appendChild(metaAppleStatus);
  }, []);

  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper to identify the 2nd weekend of the month (Mother's special weekend)
  const isSecondWeekend = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    let fridayCount = 0;
    
    for (let d = 1; d <= 31; d++) {
      const tempDate = new Date(year, month, d);
      if (tempDate.getMonth() !== month) break;
      if (tempDate.getDay() === 5) { // Friday
        fridayCount++;
        if (fridayCount === 2) {
          const secondFriday = d;
          const currentDay = date.getDate();
          // From Friday (pickup) to Sunday (overnight)
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
    let isTransition = false;

    // Routine logic based on the user's requirements
    if (day === 1) { // Monday
      parent = "Transição (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      isTransition = true;
      activities.push({ time: "07:30h", task: "Escola (Faberson leva)", icon: <BookOpen size={14}/> });
      activities.push({ time: "16:00h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Mãe busca às 16:00h";
    } 
    else if (day === 2) { // Tuesday
      parent = "Mãe (Juliana)";
      colorClass = "bg-rose-50 border-rose-200";
      stripeColor = "bg-rose-500";
      activities.push({ time: "07:30h", task: "Escola (Juliana leva)", icon: <BookOpen size={14}/> });
      activities.push({ time: "13:00h", task: "Reforço Pedagógico", icon: <BookOpen size={14}/> });
      activities.push({ time: "13:50h", task: "Saída do Reforço", icon: <Clock size={14}/> });
    }
    else if (day === 3) { // Wednesday
      parent = "Transição (Mãe ➔ Pai)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
      isTransition = true;
      activities.push({ time: "07:30h", task: "Escola (Juliana leva)", icon: <BookOpen size={14}/> });
      activities.push({ time: "13:00h", task: "Reforço", icon: <BookOpen size={14}/> });
      activities.push({ time: "14:00h", task: "Saída (Faberson busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Pai busca às 14:00h";
    }
    else if (day === 4) { // Thursday
      parent = "Transição (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      isTransition = true;
      activities.push({ time: "07:30h", task: "Escola (Faberson leva)", icon: <BookOpen size={14}/> });
      activities.push({ time: "12:30h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
      activities.push({ time: "16:00h", task: "Psicóloga", icon: <Heart size={14}/> });
      pickup = "Mãe busca às 12:30h";
    }
    else if (day === 5) { // Friday
      if (secondWE) {
        parent = "Mãe (FDS Especial)";
        colorClass = "bg-rose-100 border-rose-300 ring-2 ring-amber-400 ring-inset";
        stripeColor = "bg-rose-600";
        activities.push({ time: "07:30h", task: "Escola (Juliana leva)", icon: <BookOpen size={14}/> });
        activities.push({ time: "12:30h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Mãe busca (FDS Dela)";
      } else {
        parent = "Transição (Mãe ➔ Pai)";
        colorClass = "bg-slate-50 border-slate-200";
        stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
        isTransition = true;
        activities.push({ time: "07:30h", task: "Escola (Juliana leva)", icon: <BookOpen size={14}/> });
        activities.push({ time: "12:30h", task: "Saída (Faberson busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Pai busca às 12:30h";
      }
    }
    else if (day === 6 || day === 0) { // Saturday and Sunday
      if (secondWE) {
        parent = "Mãe (Juliana)";
        colorClass = "bg-rose-50 border-rose-200";
        stripeColor = "bg-rose-500";
      } else {
        parent = "Pai (Faberson)";
        colorClass = "bg-blue-50 border-blue-200";
        stripeColor = "bg-blue-500";
      }
      activities.push({ time: "Livre", task: "Tempo em Família", icon: <Heart size={14}/> });
    }

    return { parent, colorClass, stripeColor, activities, pickup, isTransition, secondWE };
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-28 bg-gray-50/50 border border-gray-100 rounded-xl"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === new Date().toDateString();
      const details = getDayDetails(date);

      calendarDays.push(
        <div 
          key={d} 
          className={`relative min-h-[140px] flex flex-col border-2 overflow-hidden transition-all shadow-sm rounded-xl ${details.colorClass} ${isToday ? 'ring-4 ring-indigo-500/30 border-indigo-500 z-10' : ''}`}
        >
          <div className={`h-1.5 w-full ${details.stripeColor}`} />
          
          <div className="p-1.5 flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-800'}`}>
                {d}
              </span>
              <div className="flex items-center gap-0.5">
                {details.secondWE && <Star size={10} className="text-amber-500 fill-amber-500" />}
                <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${details.isTransition ? 'bg-slate-200 text-slate-700' : (details.parent.includes('Mãe') ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white')}`}>
                  {details.parent.split(' ')[0]}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {details.activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-1 text-[9px] bg-white/60 p-1 rounded border border-black/5 leading-tight">
                  <span className="font-bold text-slate-700">{act.time}</span>
                  <span className="text-slate-600 flex items-center gap-0.5">{act.icon} {act.task}</span>
                </div>
              ))}
            </div>
          </div>

          {details.pickup && (
            <div className="bg-white/40 p-1 border-t border-black/5 text-[8px] font-bold text-slate-700 flex items-center gap-1">
              📍 <span className="truncate">{details.pickup}</span>
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Compact Header for Mobile */}
        <div className="bg-white md:rounded-3xl shadow-xl border-b md:border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-4 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-xl text-white">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black tracking-tight">Agenda do Enzo</h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium">Guarda Compartilhada</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90">
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 md:flex-none min-w-[140px] text-center font-bold text-sm md:text-lg tracking-wide uppercase">
                {months[viewDate.getMonth()]} <span className="text-indigo-400">{viewDate.getFullYear()}</span>
              </div>
              <button 
                onClick={nextMonth}
                disabled={viewDate.getFullYear() === 2026 && viewDate.getMonth() === 11}
                className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Optimized Legend for Mobile */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full shadow-sm">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="font-bold text-rose-700 text-[10px] md:text-sm">Mãe</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full shadow-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="font-bold text-blue-700 text-[10px] md:text-sm">Pai</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full shadow-sm">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700 text-[10px] md:text-sm">FDS Especial</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 md:p-6 bg-white overflow-x-auto">
            <div className="min-w-[700px] md:min-w-[1000px]">
              <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center font-black text-slate-400 py-1 uppercase text-[10px] tracking-widest">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 md:gap-3">
                {renderCalendar()}
              </div>
            </div>
          </div>

          {/* Routine Highlights Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <p className="font-black text-rose-600 text-[8px] uppercase">Turnos Juliana</p>
              <p className="text-[10px] font-medium leading-tight">Seg (16h), Ter (Dia), Qui (12:30h)</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <p className="font-black text-blue-600 text-[8px] uppercase">Turnos Faberson</p>
              <p className="text-[10px] font-medium leading-tight">Qua (14h), Sex (12:30h), FDS Padrão</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <p className="font-black text-indigo-600 text-[8px] uppercase">Fixo Enzo</p>
              <p className="text-[10px] font-medium leading-tight">Jiu-Jitsu: S/Q/S (19h) | Reforço: T/Q (13h)</p>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 shadow-sm">
              <p className="font-black text-amber-600 text-[8px] uppercase">Regra do 2º FDS</p>
              <p className="text-[9px] italic leading-tight">Mãe busca na sexta e fica até segunda.</p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-[10px] px-4">
          Para instalar: No iPhone use "Compartilhar {' > '} Adicionar à Tela de Início". No Android use os "Três pontos {' > '} Instalar".
        </p>
      </div>
    </div>
  );
};

export default App;
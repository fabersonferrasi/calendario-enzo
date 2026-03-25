import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, BookOpen, Heart, Activity, Star, Info, GraduationCap } from 'lucide-react';

const App = () => {
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 25));

  // Efeito para configurar meta-tags de dispositivo móvel (PWA)
  useEffect(() => {
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = "#0f172a";
    document.head.appendChild(metaThemeColor);
  }, []);

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Regra do Pai: No 2º fim de semana do mês, a mãe fica com o jovem
  const isSecondWeekend = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    let fridayCount = 0;
    
    for (let d = 1; d <= 31; d++) {
      const tempDate = new Date(year, month, d);
      if (tempDate.getMonth() !== month) break;
      if (tempDate.getDay() === 5) { // Sexta-feira
        fridayCount++;
        if (fridayCount === 2) {
          const secondFriday = d;
          const currentDay = date.getDate();
          // De sexta a domingo
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

    // Horários Base: Entrada 07:30, Saída 12:30
    const schoolTask = { time: "07:30h", task: "Entrada Escola", icon: <GraduationCap size={14}/> };

    if (day === 1) { // Segunda
      parent = "Troca (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      isTransition = true;
      activities.push({ ...schoolTask, task: "Escola (Pai leva)" });
      activities.push({ time: "16:00h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Mãe busca às 16:00h após Ed. Física";
    } 
    else if (day === 2) { // Terça
      parent = "Mãe (Juliana)";
      colorClass = "bg-rose-50 border-rose-200";
      stripeColor = "bg-rose-500";
      activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
      activities.push({ time: "13:00h", task: "Reforço Pedagógico", icon: <BookOpen size={14}/> });
      activities.push({ time: "13:50h", task: "Fim do Reforço", icon: <Clock size={14}/> });
    }
    else if (day === 3) { // Quarta
      parent = "Troca (Mãe ➔ Pai)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
      isTransition = true;
      activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
      activities.push({ time: "13:00h", task: "Reforço Pedagógico", icon: <BookOpen size={14}/> });
      activities.push({ time: "14:00h", task: "Saída (Faberson busca)", icon: <User size={14}/> });
      activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
      pickup = "Pai busca às 14:00h após Reforço";
    }
    else if (day === 4) { // Quinta
      parent = "Troca (Pai ➔ Mãe)";
      colorClass = "bg-slate-50 border-slate-200";
      stripeColor = "bg-gradient-to-r from-blue-500 to-rose-500";
      isTransition = true;
      activities.push({ ...schoolTask, task: "Escola (Pai leva)" });
      activities.push({ time: "12:30h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
      activities.push({ time: "16:00h", task: "Psicóloga", icon: <Heart size={14}/> });
      pickup = "Mãe busca às 12:30h";
    }
    else if (day === 5) { // Sexta
      if (secondWE) {
        parent = "Mãe (FDS Especial)";
        colorClass = "bg-rose-100 border-rose-300 ring-2 ring-amber-400 ring-inset";
        stripeColor = "bg-rose-600";
        activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
        activities.push({ time: "12:30h", task: "Saída (Juliana busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Mãe busca para o FDS";
      } else {
        parent = "Troca (Mãe ➔ Pai)";
        colorClass = "bg-slate-50 border-slate-200";
        stripeColor = "bg-gradient-to-r from-rose-500 to-blue-500";
        isTransition = true;
        activities.push({ ...schoolTask, task: "Escola (Mãe leva)" });
        activities.push({ time: "12:30h", task: "Saída (Faberson busca)", icon: <User size={14}/> });
        activities.push({ time: "19:00h", task: "Jiu-Jitsu", icon: <Activity size={14}/> });
        pickup = "Pai busca às 12:30h";
      }
    }
    else if (day === 6 || day === 0) { // Sábado e Domingo
      if (secondWE) {
        parent = "Mãe (Juliana)";
        colorClass = "bg-rose-50 border-rose-200";
        stripeColor = "bg-rose-500";
      } else {
        parent = "Pai (Faberson)";
        colorClass = "bg-blue-50 border-blue-200";
        stripeColor = "bg-blue-500";
      }
      activities.push({ time: "Dia Todo", task: "Tempo em Família", icon: <Heart size={14}/> });
    }

    return { parent, colorClass, stripeColor, activities, pickup, isTransition, secondWE };
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-14 md:h-24 bg-gray-50/30 rounded-lg"></div>);
  }

  const selectedDayDetails = getDayDetails(selectedDate);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10">
      <div className="max-w-5xl mx-auto md:p-4 space-y-4">
        
        {/* Cabeçalho */}
        <header className="bg-slate-900 text-white p-4 md:rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Agenda do Enzo</h1>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Controle de Guarda</p>
            </div>
          </div>
          
          <nav className="flex items-center justify-between w-full sm:w-auto bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-95">
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-center font-bold text-sm uppercase min-w-[140px]">
              {months[viewDate.getMonth()]} <span className="text-indigo-400">{viewDate.getFullYear()}</span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-all active:scale-95">
              <ChevronRight size={20} />
            </button>
          </nav>
        </header>

        {/* Legenda Flutuante */}
        <div className="px-4 md:px-0 flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full shadow-sm">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>
            <span className="font-bold text-rose-700 text-[10px]">Mãe (Juliana)</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full shadow-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="font-bold text-blue-700 text-[10px]">Pai (Faberson)</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full shadow-sm">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="font-bold text-amber-700 text-[10px]">FDS Especial</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-2 md:px-0">
          
          {/* Grelha do Calendário */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-200 p-2 md:p-4">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center font-black text-slate-400 py-1 uppercase text-[10px] tracking-tighter">
                  {day}
                </div>
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
                      ${isSelected ? 'border-indigo-500 shadow-md scale-105 z-10' : 'border-transparent'}
                      ${isToday ? 'ring-2 ring-indigo-200 ring-offset-1' : ''}`}
                  >
                    <div className={`h-1.5 w-full ${details.stripeColor}`} />
                    <div className="p-1 flex-1 flex flex-col items-center justify-center md:items-start md:justify-start">
                      <span className={`text-xs md:text-sm font-black ${isToday ? 'bg-indigo-600 text-white w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-sm' : 'text-slate-800'}`}>
                        {day}
                      </span>
                      {/* Dots para Mobile */}
                      <div className="flex md:hidden gap-0.5 mt-1">
                        {details.activities.length > 0 && <div className="w-1 h-1 rounded-full bg-slate-400"></div>}
                        {details.secondWE && <Star size={8} className="text-amber-500 fill-amber-500" />}
                      </div>
                      {/* Listagem para Desktop */}
                      <div className="hidden md:block mt-1 space-y-1 w-full overflow-hidden">
                        {details.activities.slice(0, 2).map((act, idx) => (
                          <div key={idx} className="text-[8px] bg-white/40 p-0.5 rounded truncate font-bold text-left text-slate-600">
                            {act.time} {act.task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Detalhada (Smartphone) */}
          <aside className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden h-fit">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                Detalhes do Dia
              </h2>
              <div className="text-[10px] font-bold bg-white border px-2 py-1 rounded-lg shadow-sm">
                {selectedDate.getDate()} {months[selectedDate.getMonth()]}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className={`p-3 rounded-2xl flex items-center justify-between border-2 ${selectedDayDetails.colorClass}`}>
                <div className="flex items-center gap-2">
                  <User size={20} className={selectedDayDetails.parent.includes('Mãe') ? 'text-rose-500' : 'text-blue-500'} />
                  <span className="font-black text-sm uppercase tracking-tight">{selectedDayDetails.parent}</span>
                </div>
                {selectedDayDetails.secondWE && <Star size={18} className="text-amber-500 fill-amber-500" />}
              </div>

              <div className="space-y-2">
                {selectedDayDetails.activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-white">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-500">
                      {act.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{act.time}</p>
                      <p className="text-sm font-bold text-slate-700">{act.task}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDayDetails.pickup && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                  <div className="bg-indigo-500 text-white p-2 rounded-xl">
                    <Info size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-indigo-700 italic">
                    Logística: {selectedDayDetails.pickup}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Rodapé Informativo */}
        <p className="text-center text-slate-400 text-[10px] px-8 py-4 leading-relaxed">
          Para uma melhor experiência no smartphone, clique no dia para ver a agenda detalhada.<br />
          No iPhone: Partilhar {' > '} Adicionar ao Ecrã Principal.
        </p>
      </div>
    </div>
  );
};

export default App;
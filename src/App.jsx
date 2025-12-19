import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  Users, Calendar, ChevronLeft, Plus, Check, X,
  Share2, Home, ArrowRight, Clock, Trash2, Edit2,
  Wallet, TrendingUp, CreditCard, FileText, BarChart2, XCircle, Archive, Loader2
} from 'lucide-react';

const API_BASE = '/api';

//<--------- end time calculation function ---------->
  const formatTime = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  //<-------------------- end --------------------------------->
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (endMinutes <= startMinutes) return 0;

    return (endMinutes - startMinutes) / 60;
  };


export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Data State
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // --- FETCH DATA (Database Sync) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, scheduleRes] = await Promise.all([
          fetch(`${API_BASE}/students`),
          fetch(`${API_BASE}/schedule`)
        ]);
        const sData = await studentsRes.json();
        const cData = await scheduleRes.json();
        setStudents(sData);
        setSchedule(cData);
        setLoading(false);
      } catch (err) { console.error("API Error", err); setLoading(false); }
    };
    fetchData();
  }, []);

  // --- DATABASE ACTIONS ---

  // 1. ADD STUDENT (DB)
  const addStudent = async (studentData) => {
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      const newStudent = await res.json();
      setStudents(prev => [...prev, newStudent]); // Update UI
      setShowStudentForm(false);
    } catch (err) { alert("Failed to add student to DB"); }
  };

  // 2. UPDATE STUDENT (DB) - FIX IS HERE
  const updateStudent = async (studentData) => {
    try {
      const res = await fetch(`${API_BASE}/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      const updated = await res.json();

      // Update the specific student in the list
      setStudents(prev => prev.map(s => s._id === updated._id ? updated : s));

      setEditingStudent(null);
      setShowStudentForm(false);
    } catch (err) { alert("Failed to update student in DB"); }
  };

  // 3. ARCHIVE STUDENT (DB)
  const deleteStudent = async (studentId) => {
    if (confirm("Remove this student? \n\nNOTE: History is kept for earnings, but they disappear from lists.")) {
      try {
        await fetch(`${API_BASE}/students/${studentId}/archive`, { method: 'PUT' });

        // Update UI
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, isArchived: true } : s));
        setSchedule(prev => prev.filter(c => !(c.studentId === studentId && c.status === 'PENDING')));

        if (selectedStudentId === studentId) {
          setView('students');
          setSelectedStudentId(null);
        }
      } catch (err) { alert("Error deleting student"); }
    }
  };

  // 4. ADD CLASS (DB)
  const addClass = async (clsData) => {
    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clsData)
      });
      const newClass = await res.json();
      setSchedule(prev => [...prev, newClass]);
      setView('dashboard');
    } catch (err) { alert("Error adding class"); }
  };

  // 5. UPDATE CLASS STATUS (DB)
  const handleClassAction = async (classId, action) => {
    if (action === 'DELETE_RECORD') {
      if (confirm("Delete this record permanently?")) {
        await fetch(`${API_BASE}/schedule/${classId}`, { method: 'DELETE' });
        setSchedule(prev => prev.filter(c => c._id !== classId));
      }
      return;
    }

    const newStatus = action === 'COMPLETE' ? 'COMPLETED' : 'CANCELLED';
    try {
      const res = await fetch(`${API_BASE}/schedule/${classId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updatedClass = await res.json();

      setSchedule(prev => prev.map(c => c._id === classId ? updatedClass : c));

      // Recalculate Balance Locally for Immediate Feedback
      if (action === 'COMPLETE') {
        const student = students.find(s => s._id === updatedClass.studentId);
        if (student) {
          let newBalance = student.balance;
          // if (student.type === 'UPFRONT') newBalance -= student.rate;
          // else newBalance += student.rate;
          const amount = student.rate * (updatedClass.hours || 1);
          if (student.type === 'UPFRONT') newBalance -= amount;
          else newBalance += amount;
          setStudents(prev => prev.map(s => s._id === student._id ? { ...s, balance: newBalance } : s));
        }
      }
    } catch (err) { alert("Error updating class"); }
  };

  const clearDues = async (studentId) => {
    if (confirm("Mark all outstanding dues as collected?")) {
      await fetch(`${API_BASE}/students/${studentId}/clear-dues`, { method: 'PUT' });
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, balance: 0 } : s));
    }
  };

  // --- HELPERS ---

  





  const generateStatement = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (!student) return;
    const history = schedule
      .filter(c => c.studentId === studentId && c.status === 'COMPLETED')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setCurrentInvoiceData({
      studentName: student.name,
      subject: student.subject,
      rate: student.rate,
      totalPending: student.balance,
      history: history.map(c => ({
        date: c.date,
        startTime: c.time,
        endTime: c.endTime,          // ✅ from DB
        hours: c.hours,              // ✅ already calculated
        rate: student.rate,
        total: student.rate * c.hours
      }))
    });

    setShowInvoiceModal(true);
  };



  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-blue-600"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-gray-50 text-slate-800 font-sans border-x border-gray-200 shadow-2xl relative">

      {/* HEADER */}
      <div className="bg-white px-6 py-5 border-b border-gray-100 sticky top-0 z-20 flex justify-between items-center">
        {view === 'dashboard' || view === 'students' || view === 'schedule' ? (
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">Tuition<span className="text-blue-600">Manager</span></h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        ) : (
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <ChevronLeft size={20} /> <span className="font-medium text-sm">Back</span>
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Users size={16} /></div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        {view === 'dashboard' && <Dashboard students={students} schedule={schedule} onAction={handleClassAction} onViewPending={() => setView('pending-list')} onOpenEarnings={() => setShowEarningsModal(true)} />}

        {view === 'students' && <StudentsManager students={students} onAdd={() => { setEditingStudent(null); setShowStudentForm(true); }} onEdit={(s) => { setEditingStudent(s); setShowStudentForm(true); }} onDelete={deleteStudent} onSelect={(id) => { setSelectedStudentId(id); setView('student-details'); }} />}

        {view === 'schedule' && <ScheduleManager students={students} schedule={schedule} onAdd={addClass} onAction={handleClassAction} />}

        {view === 'pending-list' && <PendingBreakdown students={students} onSelect={(id) => { setSelectedStudentId(id); setView('student-details'); }} />}

        {view === 'student-details' && <StudentDetailView student={students.find(s => s._id === selectedStudentId)} schedule={schedule} onGenerateReport={generateStatement} onClearDues={clearDues} onDelete={deleteStudent} onEdit={(s) => { setEditingStudent(s); setShowStudentForm(true); }} />}
      </div>

      {/* BOTTOM NAV */}
      {['dashboard', 'students', 'schedule'].includes(view) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 pb-safe z-30 max-w-md mx-auto">
          <NavBtn icon={<Home size={22} />} label="Home" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavBtn icon={<Calendar size={22} />} label="Schedule" active={view === 'schedule'} onClick={() => setView('schedule')} />
          <NavBtn icon={<Users size={22} />} label="Students" active={view === 'students'} onClick={() => setView('students')} />
        </div>
      )}

      {/* MODALS */}
      {showStudentForm && (
        <StudentForm
          onClose={() => setShowStudentForm(false)}
          onSave={editingStudent ? updateStudent : addStudent} // DECIDES WHETHER TO ADD OR UPDATE
          initialData={editingStudent}
        />
      )}
      {showInvoiceModal && currentInvoiceData && <InvoiceModal data={currentInvoiceData} onClose={() => setShowInvoiceModal(false)} />}
      {showEarningsModal && <EarningsChartModal students={students} schedule={schedule} onClose={() => setShowEarningsModal(false)} />}
    </div>
  );
}

// --- SUB COMPONENTS ---

const Dashboard = ({ students, schedule, onAction, onViewPending, onOpenEarnings }) => {
  const today = new Date().toISOString().split('T')[0];

  const upfrontCollected = students.filter(s => s.type === 'UPFRONT').reduce((acc, s) => acc + (parseFloat(s.initialBalance) || 0), 0);
  const postpaidEarned = schedule.filter(c => c.status === 'COMPLETED').reduce((acc, c) => {
    const s = students.find(st => st._id === c.studentId);
    if (s && s.type === 'POSTPAID') return acc + parseFloat(s.rate);
    return acc;
  }, 0);
  const totalEarnings = upfrontCollected + postpaidEarned;

  const pendingAmount = students.filter(s => !s.isArchived && s.type === 'POSTPAID' && s.balance > 0).reduce((acc, s) => acc + parseFloat(s.balance), 0);
  const pendingClasses = schedule.filter(c => c.status === 'PENDING').sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Financial Stats</h2>
        <div onClick={onOpenEarnings} className="bg-slate-900 rounded-xl p-5 text-white shadow-lg mb-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition active:scale-[0.98]">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Lifetime Earnings</p>
            <h2 className="text-3xl font-bold">₹{totalEarnings.toLocaleString()}</h2>
            <div className="flex items-center gap-1 text-[10px] text-blue-300 mt-2 font-medium bg-slate-800 py-1 px-2 rounded-lg w-fit"><BarChart2 size={12} /> View Monthly Chart</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400"><TrendingUp size={20} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center"><Wallet size={14} /></div><span className="text-[10px] font-bold text-slate-400 uppercase">Upfront</span></div>
            <div className="text-lg font-bold text-slate-800">₹{upfrontCollected.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded bg-green-50 text-green-600 flex items-center justify-center"><CreditCard size={14} /></div><span className="text-[10px] font-bold text-slate-400 uppercase">Postpaid</span></div>
            <div className="text-lg font-bold text-slate-800">₹{postpaidEarned.toLocaleString()}</div>
          </div>
          <div onClick={onViewPending} className="col-span-2 bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-orange-50/30 transition">
            <div><span className="text-[10px] font-bold text-slate-400 uppercase">Pending Collection (Active)</span><div className="text-xl font-bold text-orange-600 mt-1">₹{pendingAmount.toLocaleString()}</div></div>
            <div className="flex items-center text-orange-400 text-xs font-bold gap-1">View List <ArrowRight size={14} /></div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4"><h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Timeline</h2>{pendingClasses.length > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingClasses.length}</span>}</div>
        {pendingClasses.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center"><div className="inline-block p-3 rounded-full bg-gray-50 mb-3"><Check size={20} className="text-gray-400" /></div><p className="text-slate-500 text-sm font-medium">No pending classes.</p></div>
        ) : (
          <div className="space-y-3">
            {pendingClasses.map(c => {
              const s = students.find(st => st._id === c.studentId);
              if (!s) return null;
              const isToday = c.date === today;
              return (
                <div key={c._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group">
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-10 rounded-full mt-1 ${isToday ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                    <div>
                      <div className="font-bold text-slate-800">{s.name} {s.isArchived && <span className="text-[10px] text-red-400">(Archived)</span>}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1"><span className={isToday ? 'text-blue-600 font-semibold' : ''}>{isToday ? 'Today' : new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span>•</span><span>{c.time.includes('M') ? c.time : (parseInt(c.time.split(':')[0]) > 12 ? (parseInt(c.time.split(':')[0]) - 12) + ':' + c.time.split(':')[1] + ' PM' : c.time + ' AM')}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 transition-opacity">
                    <button onClick={() => onAction(c._id, 'CANCEL')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={18} /></button>
                    <button onClick={() => onAction(c._id, 'COMPLETE')} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Check size={18} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const EarningsChartModal = ({ students, schedule, onClose }) => {
  const monthlyData = {};
  schedule.forEach(c => {
    if (c.status === 'COMPLETED') {
      const s = students.find(st => st._id === c.studentId);
      if (s && s.type === 'POSTPAID') {
        const monthKey = c.date.substring(0, 7);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(s.rate);
      }
    }
  });
  students.forEach(s => {
    if (s.type === 'UPFRONT' && s.initialBalance > 0) {
      try {
        const date = new Date(s.createdAt || Date.now());
        const monthKey = date.toISOString().substring(0, 7);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(s.initialBalance);
      } catch (e) { }
    }
  });
  const chartData = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => {
    const [year, month] = key.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    return { label: `${monthName}`, value, fullKey: key };
  }).slice(-6);
  const maxVal = Math.max(...chartData.map(d => d.value), 100);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800">Monthly Earnings</h3><button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} className="text-slate-600" /></button></div>
        {chartData.length === 0 ? <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-gray-200"><BarChart2 size={32} className="mb-2 opacity-50" /><span className="text-sm">No earnings recorded.</span></div> : (
          <div className="h-64 flex items-end justify-between gap-3 pt-6">{chartData.map((d) => (<div key={d.fullKey} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"><div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute mb-8">₹{d.value}</div><div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all min-h-[4px]" style={{ height: `${(d.value / maxVal) * 100}%` }}></div><div className="text-[10px] font-bold text-slate-500 uppercase">{d.label}</div></div>))}</div>
        )}
        <div className="mt-6 text-center text-[10px] text-slate-400">Includes Upfront Deposits & Completed Postpaid Classes</div>
      </div>
    </div>
  );
};

const StudentsManager = ({ students, onAdd, onEdit, onDelete, onSelect }) => {
  const activeStudents = students.filter(s => !s.isArchived);
  const getInitials = (n) => n ? n.substring(0, 2).toUpperCase() : 'ST';
  return (
    <div>
      <div className="flex justify-between items-end mb-6"><div><h2 className="text-xl font-bold text-slate-900">Students</h2></div><button onClick={onAdd} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"><Plus size={16} /> Add New</button></div>
      <div className="space-y-3">
        {activeStudents.length === 0 ? <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-gray-200">No active students.</div> : activeStudents.map((s) => (
          <div key={s._id} onClick={() => onSelect(s._id)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-600">{getInitials(s.name)}</div>
              <div><h3 className="font-semibold text-slate-800 text-sm">{s.name}</h3><div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-slate-500">{s.subject}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.type === 'UPFRONT' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{s.type}</span></div></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onEdit(s); }} className="p-2 text-slate-300 hover:text-blue-500 rounded-lg"><Edit2 size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s._id); }} className="p-2 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-6 text-[10px] text-slate-400">* Deleted students are archived to preserve financial history.</div>
    </div>
  );
};

const StudentForm = ({ onClose, onSave, initialData }) => {
  const isEditMode = !!initialData;
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSave({
      name: formData.get('name'),
      subject: formData.get('subject'),
      rate: formData.get('rate'),
      type: formData.get('type'),
      initialBalance: formData.get('initialBalance')
    });
  };
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-lg text-slate-800 mb-6">{isEditMode ? 'Edit Student' : 'New Student'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" defaultValue={initialData?.name} placeholder="Full Name" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input name="subject" defaultValue={initialData?.subject} placeholder="Subject" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <div className="grid grid-cols-2 gap-4">
            <div className={isEditMode ? "col-span-2" : ""}><input name="rate" defaultValue={initialData?.rate} type="number" placeholder="Rate/Hr" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
            {!isEditMode && <input name="initialBalance" type="number" placeholder="Initial Deposit" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />}
          </div>
          {!isEditMode && (
            <select name="type" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500">
              <option value="UPFRONT">Prepaid (Upfront)</option>
              <option value="POSTPAID">Postpaid (Pay Later)</option>
            </select>
          )}
          <div className="flex gap-2 mt-4"><button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-semibold text-sm">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">{isEditMode ? 'Save' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
};

// const ScheduleManager = ({ students, schedule, onAdd, onAction }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const sortedSchedule = [...schedule].sort((a,b) => new Date(b.date) - new Date(a.date));
//   const activeStudents = students.filter(s => !s.isArchived);

//   const generateTimeSlots = () => {
//     const slots = [];
//     for (let i = 6; i <= 22; i++) {
//       const hour = i;
//       const period = hour >= 12 ? 'PM' : 'AM';
//       const displayHour = hour > 12 ? hour - 12 : (hour === 0 || hour === 12 ? 12 : hour);
//       const formattedDisplay = displayHour.toString().padStart(2, '0');
//       slots.push({ value: `${hour.toString().padStart(2, '0')}:00`, label: `${formattedDisplay}:00 ${period}` });
//       slots.push({ value: `${hour.toString().padStart(2, '0')}:30`, label: `${formattedDisplay}:30 ${period}` });
//     }
//     return slots;
//   };
//   const timeSlots = generateTimeSlots();

//   return (
//     <div>
//       <div className="flex justify-between items-end mb-6"><div><h2 className="text-xl font-bold text-slate-900">Schedule</h2></div><button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"><Plus size={16} /> Book Class</button></div>
//       {isOpen && (
//          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
//                <h3 className="font-bold text-lg text-slate-800 mb-6">Book Class</h3>
//                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); onAdd({ studentId: fd.get('studentId'), date: fd.get('date'), time: fd.get('time') }); setIsOpen(false); }} className="space-y-4">
//                   <select name="studentId" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"><option value="">Select Student</option>{activeStudents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
//                   <div className="grid grid-cols-2 gap-4">
//                      <input name="date" type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
//                      <select name="time" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500">
//                         <option value="">Select Time</option>{timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
//                      </select>
//                   </div>
//                   <div className="flex gap-2"><button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 text-slate-500 font-semibold text-sm">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">Schedule</button></div>
//                </form>
//             </div>
//          </div>
//       )}
//       <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
//         {sortedSchedule.map(c => {
//           const s = students.find(st => String(st._id) === String(c.studentId));
//           return (
//             <div key={c._id} className="relative pl-6">
//               <div className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-4 ring-gray-50 ${c.status === 'COMPLETED' ? 'bg-green-500' : c.status === 'CANCELLED' ? 'bg-red-400' : 'bg-blue-500'}`}></div>
//               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
//                 <div>
//                    <h3 className="font-semibold text-slate-800">{s?.name || <span className="text-red-500 italic">Deleted Student</span>} {s?.isArchived && <span className="text-[10px] text-red-400">(Archived)</span>}</h3>
//                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1"><span className="flex items-center gap-1"><Calendar size={12}/> {new Date(c.date).toLocaleDateString()}</span><span className="flex items-center gap-1"><Clock size={12}/> {c.time.includes('M') ? c.time : (parseInt(c.time.split(':')[0]) > 12 ? (parseInt(c.time.split(':')[0]) - 12) + ':' + c.time.split(':')[1] + ' PM' : c.time + ' AM')}</span></div>
//                 </div>
//                 {!s ? (<button onClick={() => onAction(c._id, 'DELETE_RECORD')} className="p-2 bg-red-50 text-red-500 rounded"><Trash2 size={16}/></button>) : (c.status === 'PENDING' ? <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">PENDING</span> : <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{c.status}</span>)}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

//<--------------- new modifiication adding hour feature-------------->
const ScheduleManager = ({ students, schedule, onAdd, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeStudents = students.filter(s => !s.isArchived);

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 6; i <= 22; i++) {
      const period = i >= 12 ? 'PM' : 'AM';
      const hour = i > 12 ? i - 12 : i;
      slots.push({
        value: `${i.toString().padStart(2, '0')}:00`,
        label: `${hour}:00 ${period}`
      });
      slots.push({
        value: `${i.toString().padStart(2, '0')}:30`,
        label: `${hour}:30 ${period}`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-bold text-slate-900">Schedule</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          Book Class
        </button>
      </div>

      {/* BOOK CLASS MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-6">Book Class</h3>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);

                const startTime = fd.get('time');
                const endTime = fd.get('endTime');
                const hours = calculateHours(startTime, endTime);

                if (hours <= 0) {
                  alert('End time must be after start time');
                  return;
                }

                onAdd({
                  studentId: fd.get('studentId'),
                  date: fd.get('date'),
                  time: startTime,
                  endTime,
                  hours
                });

                setIsOpen(false);
              }}

            >
              {/* Student */}
              <select
                name="studentId"
                required
                className="w-full p-2.5 border rounded-lg text-sm"
              >
                <option value="">Select Student</option>
                {activeStudents.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
                <select
                  name="time"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm"
                >
                  <option value="">Select Time</option>
                  {timeSlots.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* NO OF HOURS */}
              <select
                name="endTime"
                required
                className="w-full p-2.5 border rounded-lg text-sm">
                <option value="">End Time</option>
                {timeSlots.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXISTING SCHEDULE LIST (UNCHANGED) */}
      <div className="space-y-4">
        {schedule.map(c => {
          const s = students.find(st => st._id === c.studentId);
          return (
            <div key={c._id} className="bg-white p-4 rounded-lg border">
              <div className="font-semibold">{s?.name}</div>
              <div className="text-xs text-slate-500">
                {c.date} • {c.time} - {c.endTime} • {c.hours} hr(s)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

//<-------------- hour feature ending ------------------------->



const PendingBreakdown = ({ students, onSelect }) => {
  const pendingStudents = students.filter(s => !s.isArchived && s.type === 'POSTPAID' && s.balance > 0);
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Outstanding Dues</h2>
      {pendingStudents.length === 0 ? <div className="text-center text-slate-400 py-10">No pending dues.</div> : (
        <div className="space-y-3">
          {pendingStudents.map(s => (
            <div key={s._id} onClick={() => onSelect(s._id)} className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-orange-50/20 transition-colors">
              <div><div className="font-bold text-slate-800">{s.name}</div><div className="text-xs text-slate-500 mt-1">{s.subject}</div></div>
              <div className="text-right"><div className="font-bold text-orange-600 text-lg">₹{s.balance.toLocaleString()}</div><div className="text-[10px] text-orange-400 font-semibold bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">PENDING</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StudentDetailView = ({ student, schedule, onGenerateReport, onClearDues, onDelete, onEdit }) => {
  if (!student) return <div>Student not found</div>;
  const history = schedule.filter(c => String(c.studentId) === String(student._id) && c.status === 'COMPLETED').sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center relative">
        <button onClick={() => onEdit(student)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 rounded-lg"><Edit2 size={16} /></button>
        <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-slate-400 mb-4">{student.name.substring(0, 2).toUpperCase()}</div>
        <h2 className="text-2xl font-bold text-slate-900">{student.name} {student.isArchived && <span className="text-sm text-red-500">(Archived)</span>}</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">{student.subject} • ₹{student.rate}/hr</p>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</p>
          <p className={`text-3xl font-bold mt-1 ${student.balance > 0 ? 'text-orange-600' : 'text-slate-700'}`}>₹{Math.abs(student.balance).toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {student.type === 'POSTPAID' && student.balance > 0 && <button onClick={() => onClearDues(student._id)} className="py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition">Mark Paid</button>}
          <button onClick={() => onGenerateReport(student._id)} className="col-span-full py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"><Share2 size={16} /> Invoice</button>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4 px-1"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">History</h3><button onClick={() => onDelete(student._id)} className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"><Trash2 size={12} /> Remove</button></div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">{history.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No classes.</p> : history.map((c) => (<div key={c._id} className="flex justify-between items-center p-4"><div><div className="text-sm font-semibold text-slate-700">{new Date(c.date).toLocaleDateString()}</div><div className="text-xs text-slate-400">{c.time}</div></div><div className="font-semibold text-green-600 text-sm">+₹{student.rate}</div></div>))}</div>
      </div>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}<span className="text-[10px] font-medium">{label}</span>
  </button>
);

// const InvoiceModal = ({ data, onClose }) => {
//   const ref = useRef(null);
//   const downloadImage = () => { if (ref.current) toPng(ref.current, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: 2.5 }).then((dataUrl) => { const link = document.createElement('a'); link.download = `Invoice.png`; link.href = dataUrl; link.click(); }); };
//   return (
//     <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
//       <div ref={ref} className="bg-white p-10 w-full max-w-sm shadow-2xl relative">
//         <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6"><div className="text-xl font-bold text-slate-900 flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white"><FileText size={14}/></div>INVOICE</div><div className="text-right"><p className="text-xs font-bold text-slate-400 uppercase">Date</p><p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString()}</p></div></div>
//         <div className="mb-8"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p><h3 className="font-bold text-lg text-slate-800">{data.studentName}</h3><p className="text-sm text-slate-500">{data.subject}</p></div>
//         <div className="mb-6"><div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2"><div className="w-1/3 text-left">Date</div><div className="w-1/3 text-center">Time</div><div className="w-1/3 text-right">Amt</div></div><div className="space-y-2">{data.history.map((item, index) => (<div key={index} className="flex text-sm text-slate-600"><div className="w-1/3 font-medium">{item.date}</div><div className="w-1/3 text-center text-slate-400">{item.time}</div><div className="w-1/3 text-right">₹{data.rate}</div></div>))}</div></div>
//         <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-end"><div className="text-xs text-slate-400">Total: {data.history.length}</div><div className="text-right"><p className="text-xs font-bold text-slate-400 uppercase">Total Due</p><p className="text-3xl font-bold text-slate-900">₹{data.totalPending.toLocaleString()}</p></div></div>
//       </div>
//       <div className="mt-6 flex gap-3 w-full max-w-sm"><button onClick={onClose} className="flex-1 py-3 bg-white text-slate-700 font-semibold rounded-lg shadow-sm">Close</button><button onClick={downloadImage} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"><Share2 size={18} /> Download</button></div>
//     </div>
//   );
// };


//< --------- new billing invoice ------- >
const InvoiceModal = ({ data, onClose }) => {
  const ref = useRef(null);

  // const formatTime = (time24) => {
  //   if (!time24 || typeof time24 !== 'string') return '--';

  //   // If already AM/PM, return as-is
  //   if (time24.includes('AM') || time24.includes('PM')) {
  //     return time24;
  //   }

  //   const parts = time24.split(':');
  //   if (parts.length !== 2) return '--';

  //   const [h, m] = parts.map(Number);
  //   if (isNaN(h) || isNaN(m)) return '--';

  //   const period = h >= 12 ? 'PM' : 'AM';
  //   const hour = h % 12 === 0 ? 12 : h % 12;

  //   return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  // };


  // const getEndTime = (startTime, hours) => {
  //   if (!startTime) return '--';

  //   const safeHours = Number(hours) || 1;

  //   // If startTime is AM/PM, skip calculation
  //   if (startTime.includes('AM') || startTime.includes('PM')) {
  //     return '--';
  //   }

  //   const parts = startTime.split(':');
  //   if (parts.length !== 2) return '--';

  //   const [h, m] = parts.map(Number);
  //   if (isNaN(h) || isNaN(m)) return '--';

  //   const end = new Date(0, 0, 0, h, m + safeHours * 60);
  //   return formatTime(`${end.getHours()}:${end.getMinutes()}`);
  // };


  const invoiceTotal = data.history.reduce(
    (sum, i) => sum + data.rate * (i.hours || 1),
    0
  );

  const downloadImage = () => {
    if (ref.current) {
      toPng(ref.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Invoice.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div ref={ref} className="bg-white p-8 w-full max-w-md shadow-2xl">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">INVOICE</h2>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
            <p className="text-sm font-semibold">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* BILL TO */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase">Bill To</p>
          <p className="text-lg font-bold text-slate-800">
            {data.studentName}
          </p>
          <p className="text-sm text-slate-500">{data.subject}</p>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-6 text-[10px] font-bold text-slate-400 uppercase border-b pb-2 mb-2">
          <div>Date</div>
          <div className="text-center">Start</div>
          <div className="text-center">End</div>
          <div className="text-center">Hrs</div>
          <div className="text-right">Rate</div>
          <div className="text-right">Total</div>
        </div>

        {/* LINE ITEMS */}
        <div className="space-y-2">
          {data.history.map((item, i) => {
            const hours = Number(item.hours) || 0;
            const rate = Number(data.rate) || 0;
            const total = rate * hours;

            return (
              <div key={i} className="grid grid-cols-6 text-sm text-slate-700">
                <div>{item.date ? new Date(item.date).toLocaleDateString() : '--'}</div>
                <div className="text-center">{formatTime(item.time)}</div>
                <div className="text-center">{formatTime(item.endTime)}</div>
                <div className="text-center">{hours}</div>
                <div className="text-right">₹{rate}</div>
                <div className="text-right font-semibold">₹{total}</div>
              </div>
            );
          })}

        </div>

        {/* TOTAL */}
        <div className="border-t-2 border-slate-800 mt-4 pt-4 flex justify-between items-end">
          <p className="text-xs text-slate-400">
            Total Classes: {data.history.length}
          </p>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Total Amount
            </p>
            <p className="text-3xl font-bold text-slate-900">
              ₹{invoiceTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex gap-3 w-full max-w-md">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-white text-slate-700 font-semibold rounded-lg shadow-sm"
        >
          Close
        </button>
        <button
          onClick={downloadImage}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md"
        >
          Download
        </button>
      </div>
    </div>
  );
};

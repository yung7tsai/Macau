import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { ItineraryItem, Expense, QuickInfo, Trip, TabType } from './types';
import { cn } from './lib/utils';
import BottomNav from './components/BottomNav';
import TimelineItemComponent from './components/TimelineItem';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  User as UserIcon,
  CloudSun,
  Sun,
  CloudRain,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Weather for Macau
const WEATHER_MOCK = [
  { day: 0, temp: '26°C', condition: 'Sun', icon: Sun },
  { day: 1, temp: '24°C', condition: 'Cloudy', icon: Cloud },
  { day: 2, temp: '25°C', condition: 'Partly Cloudy', icon: CloudSun },
  { day: 3, temp: '23°C', condition: 'Showers', icon: CloudRain },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [currentDay, setCurrentDay] = useState(0);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [infos, setInfos] = useState<QuickInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch / Init Trip
  useEffect(() => {
    if (!user) return;

    const tripsQuery = query(collection(db, 'trips'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(tripsQuery, async (snapshot) => {
      if (snapshot.empty) {
        // Create initial trip for 5/8 - 5/11
        const newTripId = 'macau-2026';
        const initialTrip: Omit<Trip, 'id'> = {
          name: '澳門四天三夜之行',
          startDate: '2026-05-08',
          endDate: '2026-05-11',
          participants: ['Y7', 'Emily'], 
          ownerId: user.uid
        };
        await setDoc(doc(db, 'trips', newTripId), initialTrip);
        
        // Add initial flights and items
        const itineraryRef = collection(db, 'trips', newTripId, 'itinerary');
        
        // Day 0 (5/8)
        await addDoc(itineraryRef, {
          dayIndex: 0,
          startTime: '05:00',
          title: '搭乘機場接駁車',
          location: '第一航廈',
          type: 'transport',
          participants: ['全員'],
          isSplit: false,
          column: 0
        });
        await addDoc(itineraryRef, {
          dayIndex: 0,
          startTime: '07:50',
          endTime: '09:45',
          title: '星宇航空 JX201',
          location: '桃園機場 T1',
          type: 'flight',
          participants: ['全員'],
          isSplit: false,
          column: 0
        });
        await addDoc(itineraryRef, {
          dayIndex: 0,
          startTime: '12:00',
          title: '前往澳門半島',
          location: '澳門半島',
          type: 'transport',
          participants: ['全員'],
          isSplit: false,
          column: 0
        });

        // Day 1 (5/9)
        await addDoc(itineraryRef, {
          dayIndex: 1,
          startTime: '10:00',
          endTime: '14:00',
          title: '吃 乾免治牛肉飯',
          location: '澳門市區餐廳',
          type: 'restaurant',
          participants: ['全員'],
          isSplit: false,
          column: 0
        });
        await addDoc(itineraryRef, {
          dayIndex: 1,
          startTime: '15:00',
          endTime: '22:00',
          title: 'Day6 演唱會',
          location: '銀河綜藝館',
          type: 'attraction',
          participants: ['Y7'],
          isSplit: true,
          column: 1
        });
        await addDoc(itineraryRef, {
          dayIndex: 1,
          startTime: '17:00',
          endTime: '21:00',
          title: '跟大學同學見面',
          location: '官也街附近',
          type: 'restaurant',
          participants: ['Emily'],
          isSplit: true,
          column: 2
        });

        // Day 3 (5/11)
        await addDoc(itineraryRef, {
          dayIndex: 3,
          startTime: '10:55',
          endTime: '12:45',
          title: '星宇航空 JX202',
          location: '澳門機場',
          type: 'flight',
          participants: ['全員'],
          isSplit: false,
          column: 0
        });

        // Info
        const infoRef = collection(db, 'trips', newTripId, 'quickInfo');
        await addDoc(infoRef, {
          category: 'accommodation',
          title: '駿龍酒店 (Grand Dragon Hotel)',
          content: '地址：氹仔潮州街與大連街交界\n電話：+853 2883 9933'
        });
      } else {
        const tripData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Trip;
        setTrip(tripData);
      }
    });

    return unsubscribe;
  }, [user]);

  // Fetch Subcollections
  useEffect(() => {
    if (!trip) return;

    const itemsQuery = query(collection(db, 'trips', trip.id, 'itinerary'), orderBy('startTime'));
    const expensesQuery = query(collection(db, 'trips', trip.id, 'expenses'), orderBy('date', 'desc'));
    const infoQuery = query(collection(db, 'trips', trip.id, 'quickInfo'));

    const unsubItems = onSnapshot(itemsQuery, (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as ItineraryItem))));
    const unsubExpenses = onSnapshot(expensesQuery, (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() } as Expense))));
    const unsubInfo = onSnapshot(infoQuery, (s) => setInfos(s.docs.map(d => ({ id: d.id, ...d.data() } as QuickInfo))));

    return () => { unsubItems(); unsubExpenses(); unsubInfo(); };
  }, [trip]);

  const filteredItems = useMemo(() => items.filter(item => item.dayIndex === currentDay), [items, currentDay]);
  const weather = WEATHER_MOCK[currentDay] || WEATHER_MOCK[0];
  const WeatherIcon = weather.icon;

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-zen-muted uppercase tracking-widest animate-pulse">Loading...</div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-zen-bg overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--color-zen-ink)_1px,_transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <div className="w-20 h-20 bg-zen-accent rounded-full mx-auto mb-8 flex items-center justify-center text-white text-3xl font-bold">
            澳
          </div>
          <h1 className="text-3xl font-light tracking-[0.2em] mb-2">MACAU ZEN</h1>
          <p className="text-sm text-zen-muted mb-12 tracking-widest uppercase">Travel Planner</p>
          
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="zen-button w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-medium shadow-xl shadow-zen-ink/10"
          >
            <UserIcon size={20} />
            使用 Google 登入
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zen-bg pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-zen-bg/80 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center border-b border-zen-border">
        <div>
          <h1 className="text-lg font-medium tracking-tight">澳門小助手</h1>
          <p className="text-[10px] text-zen-muted uppercase tracking-[0.2em] font-bold">Macau Journey • {trip?.name}</p>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-zen-muted hover:text-zen-accent transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-6 py-6 font-sans">
        
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Day Selector */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <button 
                disabled={currentDay === 0}
                onClick={() => setCurrentDay(d => Math.max(0, d - 1))}
                className="p-2 border border-zen-border rounded-full disabled:opacity-20 translate-y-[-2px]"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center group">
                <span className="text-[10px] font-bold text-zen-muted uppercase tracking-widest mb-1 block">Day {currentDay + 1}</span>
                <h2 className="text-2xl font-light tracking-tight flex items-baseline gap-2">
                  5月{8 + currentDay}日
                  <span className="text-xs font-medium text-zen-muted">Fri</span>
                </h2>
              </div>

              <button 
                disabled={currentDay === 3}
                onClick={() => setCurrentDay(d => Math.min(3, d + 1))}
                className="p-2 border border-zen-border rounded-full disabled:opacity-20 translate-y-[-2px]"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weather Card */}
            <motion.div 
              key={`weather-${currentDay}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-white/50 border border-zen-border rounded-2xl mb-8"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white border border-zen-border rounded-xl shadow-sm">
                  <WeatherIcon className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-xs text-zen-muted font-bold uppercase tracking-wider">{weather.condition}</p>
                  <p className="text-lg font-medium">{weather.temp}</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-zen-muted font-bold leading-tight">
                MACAU<br/>FORECAST
              </div>
            </motion.div>

            {/* Timeline Items */}
            <div className="relative">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center text-zen-muted">
                  <div className="w-12 h-12 bg-zen-bg border border-dashed border-zen-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus size={20} />
                  </div>
                  <p className="text-xs font-medium tracking-wide">尚無安排項目</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex flex-wrap -mx-1">
                    {filteredItems.map((item, idx) => (
                      <div key={item.id} className={cn(
                        "transition-all duration-500 ease-in-out px-1",
                        item.column === 0 ? "w-full" : "w-1/2"
                      )}>
                        <TimelineItemComponent 
                          item={item} 
                          isSplit={item.column > 0}
                          showLine={item.column === 0 || item.column === 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="fixed right-6 bottom-28 w-12 h-12 bg-zen-ink text-white rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-all border-4 border-zen-bg">
              <Plus size={24} />
            </button>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-light tracking-tight mb-8">預算與記帳</h2>
            <div className="zen-card p-6 bg-zen-ink text-white mb-8 border-none overflow-hidden relative">
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] mb-2">Total Expenses</p>
              <h3 className="text-4xl font-light tracking-tighter">
                MOP {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </h3>
            </div>

            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="zen-card p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{expense.description}</p>
                    <p className="text-[10px] text-zen-muted uppercase font-bold">{expense.category} • {expense.payer}</p>
                  </div>
                  <p className="font-bold text-zen-accent">-${expense.amount}</p>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center p-12 text-zen-muted text-xs">尚無消費紀錄</div>
              )}
            </div>

            <button className="w-full zen-button py-4 flex items-center justify-center gap-2">
              <Plus size={18} /> 新增支出
            </button>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-8">
             <h2 className="text-2xl font-light tracking-tight">重要資訊</h2>
             
             <section className="space-y-4">
                <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest border-b border-zen-border pb-2">緊急聯絡</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="zen-card p-4">
                    <p className="text-[10px] text-zen-muted font-bold uppercase mb-1">Police/Ambulance</p>
                    <p className="font-bold text-lg">999</p>
                  </div>
                  <div className="zen-card p-4">
                    <p className="text-[10px] text-zen-muted font-bold uppercase mb-1">Tourist info</p>
                    <p className="font-bold text-lg">2833 3000</p>
                  </div>
                </div>
             </section>

             <section className="space-y-4">
                <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest border-b border-zen-border pb-2">住宿 & 航班</h3>
                {infos.length > 0 ? (
                  infos.map(info => (
                    <div key={info.id} className="zen-card p-4">
                      <p className="text-[10px] text-zen-muted font-bold uppercase mb-1">{info.category}</p>
                      <h4 className="font-medium mb-1">{info.title}</h4>
                      <div className="text-sm text-zen-muted whitespace-pre-line">{info.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-white border border-zen-border border-dashed rounded-2xl">
                    <button className="text-xs font-medium text-zen-muted">+ 新增筆記</button>
                  </div>
                )}
             </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-light tracking-tight">帳戶設定</h2>
            
            <div className="flex items-center gap-4 p-6 zen-card">
              <div className="w-16 h-16 rounded-full bg-zen-border flex items-center justify-center overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={32} className="text-zen-muted" />}
              </div>
              <div className="flex-1">
                <p className="text-xs text-zen-muted uppercase font-bold tracking-widest mb-1">Display Name</p>
                <input 
                  type="text" 
                  defaultValue={user.displayName || ''} 
                  onBlur={(e) => {
                    const name = e.target.value;
                    import('firebase/auth').then(({ updateProfile }) => {
                      if (auth.currentUser) updateProfile(auth.currentUser, { displayName: name });
                    });
                  }}
                  placeholder="輸入你的稱呼 (如: Y7)"
                  className="w-full text-lg font-medium bg-transparent border-b border-zen-border focus:border-zen-accent outline-none"
                />
                <p className="text-[10px] text-zen-muted mt-2">{user.email}</p>
              </div>
            </div>

            <div className="p-4 bg-zen-accent/[0.03] border border-zen-accent/10 rounded-xl">
              <p className="text-xs text-zen-ink font-medium mb-1">💡 提示</p>
              <p className="text-[11px] text-zen-muted leading-relaxed">
                設定使用者名稱後，你可以針對不同成員分配行程。當出現「同時間不同行程」時，系統會自動並排顯示並標記成員。
              </p>
            </div>

            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white rounded-xl transition-colors">
                <span className="text-sm font-medium">離線地圖下載</span>
                <ChevronRight size={16} className="text-zen-muted" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white rounded-xl transition-colors">
                <span className="text-sm font-medium">語言 (Language)</span>
                <span className="text-xs text-zen-muted italic">Traditional Chinese</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white rounded-xl transition-colors">
                <span className="text-sm font-medium">通知規則</span>
                <ChevronRight size={16} className="text-zen-muted" />
              </button>
            </div>
          </div>
        )}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
